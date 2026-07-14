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

function createEmptyDraft(side: TeamSide): TeamDraft {
  return {
    side,
    bans: [null, null, null, null, null],
    slots: ([1, 2, 3, 4, 5] as SlotPosition[]).map((position) => ({
      position,
      label: POSITION_LABELS[position],
      hero: null,
    })),
  }
}

export const useDraftsMainStore = defineStore('draftsMain', () => {
  const heroes = ref<Hero[]>([])
  const heroWinRates = ref<Map<number, number>>(new Map())
  const isLoading = ref(false)
  const loadError = ref<string | null>(null)

  const radiant = ref<TeamDraft>(createEmptyDraft('radiant'))
  const dire = ref<TeamDraft>(createEmptyDraft('dire'))

  const advisingTeam = ref<TeamSide>('radiant')
  const lastPick = ref<{ hero: Hero; team: TeamSide } | null>(null)

  const pickerOpen = ref(false)
  const pickerTarget = ref<PickerTarget | null>(null)
  const pickerSearch = ref('')
  const pickerRoleFilter = ref<HeroRole | 'All'>('All')

  const heroPoolFilter = ref<Set<number>>(new Set())
  const poolModalOpen = ref(false)

  const activePatch = ref<PatchInfo>({ version: '7.41', label: 'Patch 7.41' })
  const activeRank = ref<RankFilter>({ value: 'divine_plus', label: 'Divine+' })
  const isSteamConnected = ref(false)

  const matchupsCache = reactive<Record<number, Record<number, { wins: number; games: number }>>>({})
  const itemPopularityCache = reactive<Record<number, any>>({})

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
    if (heroDetailCache[heroId] || heroDetailLoading[heroId]) return
    heroDetailLoading[heroId] = true
    try {
      const [matchup, items, constants] = await Promise.all([
        fetchHeroMatchup(heroId),
        fetchHeroItems(heroId),
        fetchItemConstants(),
      ])
      heroDetailCache[heroId] = { matchup, items }
      if (Object.keys(itemConstants.value).length === 0) {
        itemConstants.value = constants
      }
    } catch (e) {
      console.warn(`[Store] fetchHeroDetailData failed for hero ${heroId}:`, e)
    } finally {
      heroDetailLoading[heroId] = false
    }
  }

  async function fetchItemPopularityForHero(heroId: number) {
    if (itemPopularityCache[heroId]) return
    try {
      const res = await fetch(`https://api.opendota.com/api/heroes/${heroId}/itemPopularity`)
      if (!res.ok) throw new Error(`Failed to load item popularity for hero ${heroId}`)
      const data = await res.json()
      itemPopularityCache[heroId] = data
    } catch (e) {
      console.error(`Error fetching item popularity for hero ${heroId}:`, e)
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

  const analysis = computed(() =>
    analyzeDraft(radiantHeroes.value, direHeroes.value, heroWinRates.value, lastPick.value, matchupsCache),
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

  const recommendations = computed(() => {
    const team = advisingTeam.value
    const teamHeroes = team === 'radiant' ? radiantHeroes.value : direHeroes.value
    const enemyHeroes = team === 'radiant' ? direHeroes.value : radiantHeroes.value
    const empty = emptySlotsFor(team)

    if (!empty.length) return []

    const pool = availableHeroes.value.filter(
      (h) => heroPoolFilter.value.size === 0 || heroPoolFilter.value.has(h.id)
    )

    return getRecommendations(
      pool,
      team,
      teamHeroes,
      enemyHeroes,
      empty,
      heroWinRates.value,
      matchupsCache,
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

  function selectHero(hero: Hero) {
    const target = pickerTarget.value
    if (!target) return

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
    openPicker({ mode: 'pick', side, position })
  }

  function openBanSlot(side: TeamSide, index: number) {
    openPicker({ mode: 'ban', side, index })
  }

  function removePick(side: TeamSide, position: SlotPosition) {
    const draft = side === 'radiant' ? radiant.value : dire.value
    const slot = draft.slots.find((s) => s.position === position)
    if (slot?.hero) {
      lastPick.value = null
      slot.hero = null
    }
  }

  function removeBan(side: TeamSide, index: number) {
    const draft = side === 'radiant' ? radiant.value : dire.value
    if (draft.bans[index]) {
      lastPick.value = null
      draft.bans[index] = null
    }
  }

  function applyRecommendation(rec: { hero: Hero; suggestedPosition?: number }) {
    const team = advisingTeam.value
    const empty = emptySlotsFor(team)
    if (!empty.length) return
    const position = (rec.suggestedPosition ?? orderPickPosition(empty)) as SlotPosition
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
    advisingTeam.value = team
  }

  function resetDraft() {
    radiant.value = createEmptyDraft('radiant')
    dire.value = createEmptyDraft('dire')
    lastPick.value = null
    advisingTeam.value = 'radiant'
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
    fetchMatchupsForHero,
    fetchHeroDetailData,
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
    resetDraft,
    connectSteam,
  }
})
