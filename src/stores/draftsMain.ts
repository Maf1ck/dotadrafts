import { defineStore } from 'pinia'
import { computed, ref, reactive, watch } from 'vue'
import type {
  Hero,
  HeroList,
  HeroRole,
  TeamDraft,
  TeamSide,
  SlotPosition,
  PatchInfo,
  RankFilter,
} from '../types/draft'
import { mapHeroesFromApi } from '../utils/heroMapper'
import { FALLBACK_HEROES } from '../data/heroesFallback'
import {
  analyzeDraft,
  getRecommendations,
  getUsedHeroIds,
} from '../services/draftEngine'
import {
  fetchHeroMatchup,
  fetchHeroItems,
  fetchItemConstants,
  type StratzHeroMatchup,
  type StratzHeroItems,
} from '../services/stratz'
import {
  fetchHeroItemPopularity,
  fetchItemConstantsMap,
  clearItemConstantsCache,
  resolvePopularItems,
  type ItemInfo,
  type HeroItemPopularity,
} from '../services/opendotaItems'
import {
  CM_SEQUENCE,
  banSlotsNeeded,
  sideForSeat,
} from '../data/cmSequence'
import { getBestPosition } from '../data/heroPositions'
import { teamBuildScore } from '../services/buildImpact'

export type DraftMode = 'manual' | 'simulator'
export type PickerMode = 'pick' | 'ban'
export type PickerTarget =
  | { mode: 'pick'; side: TeamSide; position: SlotPosition }
  | { mode: 'ban'; side: TeamSide; index: number }

const POSITION_LABELS: Record<SlotPosition, string> = {
  1: 'Select Carry (Pos 1)',
  2: 'Select Mid (Pos 2)',
  3: 'Select Offlane (Pos 3)',
  4: 'Select Support (Pos 4)',
  5: 'Select Hard Support (Pos 5)',
}

function createEmptyDraft(side: TeamSide, banCount = 5): TeamDraft {
  return {
    side,
    bans: Array.from({ length: banCount }, () => null),
    slots: ([1, 2, 3, 4, 5] as SlotPosition[]).map((position) => ({
      position,
      label: POSITION_LABELS[position],
      hero: null,
    })),
  }
}

function createCmDrafts(firstPickSide: TeamSide): { radiant: TeamDraft; dire: TeamDraft } {
  const needed = banSlotsNeeded(firstPickSide)
  return {
    radiant: createEmptyDraft('radiant', needed.radiant),
    dire: createEmptyDraft('dire', needed.dire),
  }
}

export const useDraftsMainStore = defineStore('draftsMain', () => {
  const heroes = ref<Hero[]>([])
  const heroWinRates = ref<Map<number, number>>(new Map())
  const isLoading = ref(false)
  const loadError = ref<string | null>(null)

  const draftMode = ref<DraftMode>('manual')
  /** Team that has first pick in CM simulator */
  const firstPickSide = ref<TeamSide>('radiant')
  const cmStepIndex = ref(0)

  const radiant = ref<TeamDraft>(createEmptyDraft('radiant'))
  const dire = ref<TeamDraft>(createEmptyDraft('dire'))

  const advisingTeam = ref<TeamSide>('radiant')
  /** Player's own team — hero pool applies only when advising this side */
  const myTeam = ref<TeamSide>('radiant')
  const lastPick = ref<{ hero: Hero; team: TeamSide } | null>(null)

  const pickerOpen = ref(false)
  const pickerTarget = ref<PickerTarget | null>(null)
  const pickerSearch = ref('')
  const pickerRoleFilter = ref<HeroRole | 'All'>('All')

  const heroPoolFilter = ref<Set<number>>(new Set())
  const poolModalOpen = ref(false)

  const activePatch = ref<PatchInfo>({ version: '7.41d', label: 'Patch 7.41d' })
  const activeRank = ref<RankFilter>({ value: 'divine_plus', label: 'Divine+' })
  const isSteamConnected = ref(false)

  const matchupsCache = reactive<Record<number, Record<number, { wins: number; games: number }>>>({})

  /** Stratz hero detail cache: heroId → { matchup, items } */
  const heroDetailCache = reactive<
    Record<number, { matchup: StratzHeroMatchup; items: StratzHeroItems }>
  >({})
  /** Whether Stratz data is loading for a given heroId */
  const heroDetailLoading = reactive<Record<number, boolean>>({})
  /** Resolved item constants map: itemId → { displayName, shortName } */
  const itemConstants = ref<Record<string, { displayName: string; shortName: string }>>({}) 

  async function fetchMatchupsForHero(heroId: number) {
    if (matchupsCache[heroId]) return
    try {
      const res = await fetch(`https://api.opendota.com/api/heroes/${heroId}/matchups`)
      if (!res.ok) throw new Error(`Failed to load matchups for hero ${heroId}`)
      const data: { hero_id: number; games_played: number; wins: number }[] = await res.json()
      
      const heroMap: Record<number, { wins: number; games: number }> = {}
      for (const row of data) {
        heroMap[row.hero_id] = {
          wins: row.wins,
          games: row.games_played
        }
      }
      matchupsCache[heroId] = heroMap
    } catch (e) {
      console.error(`Error fetching matchups for hero ${heroId}:`, e)
    }
  }

  /**
   * Fetch full Stratz detail for a hero: matchups (counters + synergies) and item builds.
   * Results are cached in heroDetailCache.
   */
  async function fetchHeroDetailData(heroId: number) {
    if (heroDetailCache[heroId] || heroDetailLoading[heroId]) {
      void fetchHeroItemsData(heroId)
      return
    }
    heroDetailLoading[heroId] = true
    try {
      const [matchup, items, constants] = await Promise.all([
        fetchHeroMatchup(heroId),
        fetchHeroItems(heroId),
        fetchItemConstants(),
      ])
      heroDetailCache[heroId] = { matchup, items }
      if (Object.keys(itemConstants.value).length === 0 && constants) {
        itemConstants.value = constants
      }
    } catch (e) {
      console.warn(`[Store] fetchHeroDetailData failed for hero ${heroId}:`, e)
    } finally {
      heroDetailLoading[heroId] = false
      void fetchHeroItemsData(heroId)
    }
  }

  /** OpenDota item popularity: heroId → buckets */
  const itemPopularityByHero = reactive<Record<number, HeroItemPopularity>>({})
  /** OpenDota item id → info */
  const openDotaItems = ref<Record<number, ItemInfo>>({})
  const itemsDataLoading = reactive<Record<number, boolean>>({})

  async function ensureItemConstants(force = false) {
    if (!force && Object.keys(openDotaItems.value).length) return
    if (force) clearItemConstantsCache()
    openDotaItems.value = await fetchItemConstantsMap()
    // Also keep string-keyed map for Stratz path compatibility
    if (force || Object.keys(itemConstants.value).length === 0) {
      const map: Record<string, { displayName: string; shortName: string }> = {}
      for (const info of Object.values(openDotaItems.value)) {
        map[String(info.id)] = { displayName: info.displayName, shortName: info.shortName }
      }
      itemConstants.value = map
    }
  }

  async function fetchHeroItemsData(heroId: number) {
    if (itemPopularityByHero[heroId] || itemsDataLoading[heroId]) return
    itemsDataLoading[heroId] = true
    try {
      await ensureItemConstants()
      itemPopularityByHero[heroId] = await fetchHeroItemPopularity(heroId)
    } finally {
      itemsDataLoading[heroId] = false
    }
  }

  function getResolvedItemsForHero(heroId: number) {
    const pop = itemPopularityByHero[heroId]
    const constants = openDotaItems.value
    if (!pop || !Object.keys(constants).length) {
      return { starting: [], early: [], core: [], luxury: [] }
    }
    return {
      starting: resolvePopularItems(pop.starting, constants),
      early: resolvePopularItems(pop.early, constants),
      core: resolvePopularItems(pop.mid, constants),
      luxury: resolvePopularItems(pop.late, constants),
    }
  }

  const radiantHeroes = computed(() =>
    radiant.value.slots.map((s) => s.hero).filter((h): h is Hero => h !== null),
  )
  const direHeroes = computed(() =>
    dire.value.slots.map((s) => s.hero).filter((h): h is Hero => h !== null),
  )

  // Automatically prefetch matchups for all heroes picked in the draft
  watch(
    () => [...radiantHeroes.value, ...direHeroes.value],
    (currentHeroes) => {
      for (const hero of currentHeroes) {
        void fetchMatchupsForHero(hero.id)
      }
    },
    { immediate: true }
  )

  const usedHeroIds = computed(() =>
    getUsedHeroIds(
      radiantHeroes.value,
      direHeroes.value,
      radiant.value.bans,
      dire.value.bans,
    ),
  )

  /** Per-hero sandbox builds */
  type HeroBuildState = {
    items: number[]
    neutrals: number[]
    talents: Record<number, 'left' | 'right'>
    skills: string[]
  }

  const heroBuilds = reactive<Record<number, HeroBuildState>>({})

  function emptyBuild(): HeroBuildState {
    return { items: [], neutrals: [], talents: {}, skills: [] }
  }

  function ensureHeroBuild(heroId: number): HeroBuildState {
    if (!heroBuilds[heroId]) heroBuilds[heroId] = emptyBuild()
    return heroBuilds[heroId]!
  }

  function toggleBuildItem(heroId: number, itemId: number, asNeutral = false) {
    const build = ensureHeroBuild(heroId)
    const list = asNeutral ? build.neutrals : build.items
    const max = asNeutral ? 1 : 6
    const idx = list.indexOf(itemId)
    if (idx >= 0) list.splice(idx, 1)
    else if (list.length < max) list.push(itemId)
  }

  function setBuildTalent(heroId: number, level: number, side: 'left' | 'right') {
    ensureHeroBuild(heroId).talents[level] = side
  }

  function setBuildSkills(heroId: number, skills: string[]) {
    ensureHeroBuild(heroId).skills = skills
  }

  function clearHeroBuild(heroId: number) {
    heroBuilds[heroId] = emptyBuild()
  }

  const radiantBuildScore = computed(() =>
    teamBuildScore(
      radiantHeroes.value.map((h) => h.id),
      heroBuilds,
      openDotaItems.value,
    ),
  )
  const direBuildScore = computed(() =>
    teamBuildScore(
      direHeroes.value.map((h) => h.id),
      heroBuilds,
      openDotaItems.value,
    ),
  )

  const analysis = computed(() =>
    analyzeDraft(
      radiantHeroes.value,
      direHeroes.value,
      heroWinRates.value,
      lastPick.value,
      matchupsCache,
      { radiant: radiantBuildScore.value, dire: direBuildScore.value },
    ),
  )

  const prediction = computed(() => analysis.value.prediction)
  const metaRows = computed(() => analysis.value.metaRows)
  const synergies = computed(() => analysis.value.synergies)
  const counters = computed(() => analysis.value.counters)

  const emptySlotsFor = (side: TeamSide) => {
    const draft = side === 'radiant' ? radiant.value : dire.value
    return draft.slots.filter((s) => !s.hero).map((s) => s.position)
  }

  const availableHeroes = computed(() =>
    heroes.value.filter((h) => !usedHeroIds.value.has(h.id)),
  )

  const filteredPickerHeroes = computed(() => {
    const q = pickerSearch.value.trim().toLowerCase()
    return availableHeroes.value.filter((hero) => {
      const matchesSearch =
        !q ||
        hero.localizedName.toLowerCase().includes(q) ||
        hero.name.includes(q)
      const matchesRole =
        pickerRoleFilter.value === 'All' || hero.roles.includes(pickerRoleFilter.value)
      return matchesSearch && matchesRole
    })
  })

  const cmCurrentStep = computed(() => {
    if (draftMode.value !== 'simulator') return null
    if (cmStepIndex.value >= CM_SEQUENCE.length) return null
    return CM_SEQUENCE[cmStepIndex.value] ?? null
  })

  const cmCurrentSide = computed<TeamSide | null>(() => {
    const step = cmCurrentStep.value
    if (!step) return null
    return sideForSeat(step.seat, firstPickSide.value)
  })

  const cmPhaseLabel = computed(() => {
    const step = cmCurrentStep.value
    if (!step) return 'complete'
    return step.type
  })

  const cmIsComplete = computed(
    () => draftMode.value === 'simulator' && cmStepIndex.value >= CM_SEQUENCE.length,
  )

  const adviceTeam = computed<TeamSide>(() => {
    if (draftMode.value === 'simulator' && cmCurrentSide.value) {
      return cmCurrentSide.value
    }
    return advisingTeam.value
  })

  const recommendations = computed(() => {
    const team = adviceTeam.value
    const teamHeroes = team === 'radiant' ? radiantHeroes.value : direHeroes.value
    const enemyHeroes = team === 'radiant' ? direHeroes.value : radiantHeroes.value
    const empty = emptySlotsFor(team)

    if (draftMode.value === 'simulator' && cmIsComplete.value) return []
    if (draftMode.value === 'manual' && !empty.length) return []
    if (
      draftMode.value === 'simulator' &&
      cmCurrentStep.value?.type === 'pick' &&
      !empty.length
    ) {
      return []
    }

    const positions = empty.length ? empty : ([1, 2, 3, 4, 5] as number[])

    const pool = availableHeroes.value.filter((h) => {
      // Hero pool is only for "my" team recommendations
      if (team !== myTeam.value) return true
      if (heroPoolFilter.value.size === 0) return true
      return heroPoolFilter.value.has(h.id)
    })

    return getRecommendations(
      pool,
      team,
      teamHeroes,
      enemyHeroes,
      positions,
      heroWinRates.value,
      matchupsCache,
      12,
    )
  })

  async function fetchHeroes() {
    if (heroes.value.length) return
    isLoading.value = true
    loadError.value = null
    try {
      // /heroStats returns ALL hero fields including base stats + win/pick data
      // Use it as the single source of truth
      const statsRes = await fetch('https://api.opendota.com/api/heroStats').catch(() => null)

      if (statsRes && statsRes.ok) {
        const statsData: any[] = await statsRes.json()

        // Map heroes with full stat data from /heroStats
        const heroList: HeroList[] = statsData.map((row) => ({
          id: row.id,
          name: row.name,
          localized_name: row.localized_name,
          primary_attr: row.primary_attr,
          attack_type: row.attack_type,
          roles: row.roles ?? [],
          // stat fields
          base_str: row.base_str,
          base_agi: row.base_agi,
          base_int: row.base_int,
          str_gain: row.str_gain,
          agi_gain: row.agi_gain,
          int_gain: row.int_gain,
          base_armor: row.base_armor,
          base_attack_min: row.base_attack_min,
          base_attack_max: row.base_attack_max,
          attack_range: row.attack_range,
          move_speed: row.move_speed,
          attack_rate: row.attack_rate,
        }))
        heroes.value = mapHeroesFromApi(heroList)

        // Build win rate map from pub data (rank 7 = Divine, rank 8 = Immortal)
        const winRateMap = new Map<number, number>()
        for (const row of statsData) {
          const win7 = row['7_win'] ?? 0
          const pick7 = row['7_pick'] ?? 0
          const win8 = row['8_win'] ?? 0
          const pick8 = row['8_pick'] ?? 0
          const totalWin = win7 + win8 || row.pub_win || 0
          const totalPick = pick7 + pick8 || row.pub_pick || 0
          winRateMap.set(row.id, totalPick > 0 ? (totalWin / totalPick) * 100 : 50)
        }
        heroWinRates.value = winRateMap
      } else {
        throw new Error('Failed to fetch heroStats from OpenDota API')
      }
    } catch (e) {
      console.warn('OpenDota API failed, using static fallback data:', e)
      heroes.value = mapHeroesFromApi(FALLBACK_HEROES)
      const map = new Map<number, number>()
      for (const h of FALLBACK_HEROES) {
        map.set(h.id, h.winRate)
      }
      heroWinRates.value = map
    } finally {
      isLoading.value = false
    }
  }

  function openPicker(target: PickerTarget) {
    pickerTarget.value = target
    pickerSearch.value = ''
    pickerRoleFilter.value = 'All'
    pickerOpen.value = true
  }

  function closePicker() {
    pickerOpen.value = false
    pickerTarget.value = null
  }

  function toggleHeroPool(heroId: number) {
    if (heroPoolFilter.value.has(heroId)) {
      heroPoolFilter.value.delete(heroId)
    } else {
      heroPoolFilter.value.add(heroId)
    }
  }

  function clearHeroPool() {
    heroPoolFilter.value.clear()
  }

  function nextEmptyBanIndex(side: TeamSide): number {
    const draft = side === 'radiant' ? radiant.value : dire.value
    return draft.bans.findIndex((b) => b === null)
  }

  function nextEmptyPickPosition(side: TeamSide, preferred?: number): SlotPosition | null {
    const draft = side === 'radiant' ? radiant.value : dire.value
    if (preferred) {
      const slot = draft.slots.find((s) => s.position === preferred && !s.hero)
      if (slot) return slot.position
    }
    const empty = draft.slots.filter((s) => !s.hero).map((s) => s.position)
    if (!empty.length) return null
    return orderPickPosition(empty)
  }

  function applyCmHero(hero: Hero) {
    const step = cmCurrentStep.value
    if (!step || !cmCurrentSide.value) return

    const side = cmCurrentSide.value
    if (step.type === 'ban') {
      const idx = nextEmptyBanIndex(side)
      if (idx < 0) return
      const draft = side === 'radiant' ? radiant.value : dire.value
      draft.bans[idx] = hero
      lastPick.value = { hero, team: side }
    } else {
      const preferred = getBestPosition(hero.name) ?? undefined
      const position = nextEmptyPickPosition(side, preferred ?? undefined)
      if (position == null) return
      const draft = side === 'radiant' ? radiant.value : dire.value
      const slot = draft.slots.find((s) => s.position === position)
      if (!slot || slot.hero) return
      slot.hero = hero
      lastPick.value = { hero, team: side }
    }
    cmStepIndex.value += 1
  }

  function selectHero(hero: Hero) {
    if (draftMode.value === 'simulator' && pickerTarget.value == null) {
      applyCmHero(hero)
      closePicker()
      return
    }

    const target = pickerTarget.value
    if (!target) return

    if (draftMode.value === 'simulator') {
      // Only allow selecting for the current CM step
      const step = cmCurrentStep.value
      const side = cmCurrentSide.value
      if (!step || !side || target.side !== side || target.mode !== step.type) {
        closePicker()
        return
      }
      applyCmHero(hero)
      closePicker()
      return
    }

    if (target.mode === 'pick') {
      const draft = target.side === 'radiant' ? radiant.value : dire.value
      const slot = draft.slots.find((s) => s.position === target.position)
      if (slot) slot.hero = hero
      lastPick.value = { hero, team: target.side }
      advisingTeam.value = target.side === 'radiant' ? 'dire' : 'radiant'
    } else {
      const draft = target.side === 'radiant' ? radiant.value : dire.value
      draft.bans[target.index] = hero
      lastPick.value = { hero, team: target.side }
    }

    closePicker()
  }

  function openPickSlot(side: TeamSide, position: SlotPosition) {
    if (draftMode.value === 'simulator') {
      const step = cmCurrentStep.value
      if (!step || step.type !== 'pick' || cmCurrentSide.value !== side) return
      openPicker({ mode: 'pick', side, position })
      return
    }
    openPicker({ mode: 'pick', side, position })
  }

  function openBanSlot(side: TeamSide, index: number) {
    if (draftMode.value === 'simulator') {
      const step = cmCurrentStep.value
      if (!step || step.type !== 'ban' || cmCurrentSide.value !== side) return
      const expected = nextEmptyBanIndex(side)
      if (expected !== index && expected >= 0) {
        openPicker({ mode: 'ban', side, index: expected })
        return
      }
      openPicker({ mode: 'ban', side, index })
      return
    }
    openPicker({ mode: 'ban', side, index })
  }

  function removePick(side: TeamSide, position: SlotPosition) {
    if (draftMode.value === 'simulator') return
    const draft = side === 'radiant' ? radiant.value : dire.value
    const slot = draft.slots.find((s) => s.position === position)
    if (slot?.hero) {
      lastPick.value = null
      slot.hero = null
    }
  }

  function removeBan(side: TeamSide, index: number) {
    if (draftMode.value === 'simulator') return
    const draft = side === 'radiant' ? radiant.value : dire.value
    if (draft.bans[index]) {
      lastPick.value = null
      draft.bans[index] = null
    }
  }

  function applyRecommendation(rec: { hero: Hero; suggestedPosition?: number }) {
    if (draftMode.value === 'simulator') {
      if (cmIsComplete.value) return
      applyCmHero(rec.hero)
      return
    }

    const team = advisingTeam.value
    const empty = emptySlotsFor(team)
    if (!empty.length) return
    const preferred =
      (rec.suggestedPosition as SlotPosition | undefined) ??
      getBestPosition(rec.hero.name) ??
      orderPickPosition(empty)
    const position = (empty.includes(preferred) ? preferred : orderPickPosition(empty)) as SlotPosition
    const draft = team === 'radiant' ? radiant.value : dire.value
    const slot = draft.slots.find((s) => s.position === position)
    if (!slot || slot.hero) return
    slot.hero = rec.hero
    lastPick.value = { hero: rec.hero, team }
    advisingTeam.value = team === 'radiant' ? 'dire' : 'radiant'
  }

  function orderPickPosition(empty: number[]): SlotPosition {
    const sorted = [...empty].sort((a, b) => a - b)
    return (sorted[0] ?? 1) as SlotPosition
  }

  function setAdvisingTeam(team: TeamSide) {
    if (draftMode.value === 'simulator') return
    advisingTeam.value = team
  }

  function setMyTeam(team: TeamSide) {
    myTeam.value = team
    // Advice defaults to "us" when choosing which side you play
    if (draftMode.value === 'manual') {
      advisingTeam.value = team
    }
  }

  function setDraftMode(mode: DraftMode) {
    draftMode.value = mode
    if (mode === 'simulator') {
      const drafts = createCmDrafts(firstPickSide.value)
      radiant.value = drafts.radiant
      dire.value = drafts.dire
      cmStepIndex.value = 0
      lastPick.value = null
      advisingTeam.value = firstPickSide.value
    } else {
      radiant.value = createEmptyDraft('radiant')
      dire.value = createEmptyDraft('dire')
      cmStepIndex.value = 0
      lastPick.value = null
      advisingTeam.value = 'radiant'
    }
  }

  function setFirstPickSide(side: TeamSide) {
    firstPickSide.value = side
    if (draftMode.value === 'simulator') {
      setDraftMode('simulator')
    }
  }

  function openCmPicker() {
    if (draftMode.value !== 'simulator' || !cmCurrentStep.value || !cmCurrentSide.value) return
    const side = cmCurrentSide.value
    if (cmCurrentStep.value.type === 'ban') {
      const idx = nextEmptyBanIndex(side)
      if (idx < 0) return
      openPicker({ mode: 'ban', side, index: idx })
    } else {
      const pos = nextEmptyPickPosition(side)
      if (pos == null) return
      openPicker({ mode: 'pick', side, position: pos })
    }
  }

  function resetDraft() {
    if (draftMode.value === 'simulator') {
      setDraftMode('simulator')
      return
    }
    radiant.value = createEmptyDraft('radiant')
    dire.value = createEmptyDraft('dire')
    lastPick.value = null
    advisingTeam.value = 'radiant'
    cmStepIndex.value = 0
  }

  function connectSteam() {
    isSteamConnected.value = true
    void fetchHeroes()
  }

  fetchHeroes()

  return {
    heroes,
    heroWinRates,
    isLoading,
    loadError,
    draftMode,
    firstPickSide,
    cmStepIndex,
    cmCurrentStep,
    cmCurrentSide,
    cmPhaseLabel,
    cmIsComplete,
    adviceTeam,
    myTeam,
    radiant,
    dire,
    advisingTeam,
    pickerOpen,
    pickerTarget,
    pickerSearch,
    pickerRoleFilter,
    heroPoolFilter,
    poolModalOpen,
    activePatch,
    activeRank,
    isSteamConnected,
    radiantHeroes,
    direHeroes,
    usedHeroIds,
    prediction,
    metaRows,
    synergies,
    counters,
    analysis,
    recommendations,
    availableHeroes,
    filteredPickerHeroes,
    matchupsCache,
    heroDetailCache,
    heroDetailLoading,
    itemConstants,
    itemPopularityByHero,
    openDotaItems,
    itemsDataLoading,
    heroBuilds,
    radiantBuildScore,
    direBuildScore,
    fetchMatchupsForHero,
    fetchHeroDetailData,
    fetchHeroItemsData,
    getResolvedItemsForHero,
    ensureItemConstants,
    ensureHeroBuild,
    toggleBuildItem,
    setBuildTalent,
    setBuildSkills,
    clearHeroBuild,
    fetchHeroes,
    openPicker,
    closePicker,
    toggleHeroPool,
    clearHeroPool,
    selectHero,
    openPickSlot,
    openBanSlot,
    removePick,
    removeBan,
    applyRecommendation,
    setAdvisingTeam,
    setMyTeam,
    setDraftMode,
    setFirstPickSide,
    openCmPicker,
    resetDraft,
    connectSteam,
  }
})
