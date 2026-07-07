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
import {
  analyzeDraft,
  getRecommendations,
  getUsedHeroIds,
} from '../services/draftEngine'

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

  const activePatch = ref<PatchInfo>({ version: '7.36c', label: 'Patch 7.36c' })
  const activeRank = ref<RankFilter>({ value: 'divine_plus', label: 'Divine+' })
  const isSteamConnected = ref(false)

  const matchupsCache = reactive<Record<number, Record<number, { wins: number; games: number }>>>({})

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

  const radiantHeroes = computed(() =>
    radiant.value.slots.map((s) => s.hero).filter((h): h is Hero => h !== null),
  )
  const direHeroes = computed(() =>
    dire.value.slots.map((s) => s.hero).filter((h): h is Hero => h !== null),
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

    return getRecommendations(
      availableHeroes.value,
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
      const [heroesRes, statsRes] = await Promise.all([
        fetch('https://api.opendota.com/api/heroes'),
        fetch('https://api.opendota.com/api/heroStats'),
      ])

      if (!heroesRes.ok) throw new Error('Failed to load heroes')
      const heroesData: HeroList[] = await heroesRes.json()
      heroes.value = mapHeroesFromApi(heroesData)

      if (statsRes.ok) {
        const statsData: any[] = await statsRes.json()
        const map = new Map<number, number>()
        for (const row of statsData) {
          // Calculate winrate based on Divine/Immortal pub keys or general pro/pub keys
          const win = (row['7_win'] || 0) + (row['8_win'] || 0) || row['pro_win'] || row['pub_win'] || 0
          const pick = (row['7_pick'] || 0) + (row['8_pick'] || 0) || row['pro_pick'] || row['pub_pick'] || 0
          map.set(row.id, pick > 0 ? (win / pick) * 100 : 50)
        }
        heroWinRates.value = map
      }
    } catch (e) {
      loadError.value = e instanceof Error ? e.message : 'Unknown error'
      console.error('Error fetching heroes:', e)
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
    fetchMatchupsForHero,
    fetchHeroes,
    openPicker,
    closePicker,
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
