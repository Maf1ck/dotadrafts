<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useHead } from '@vueuse/head'
import { useDraftsMainStore } from '../stores/draftsMain'
import { HERO_COUNTERS, HERO_SYNERGIES } from '../data/matchups'
import { suggestedLaneLabel } from '../data/heroPositions'
import { getCounterEntry, getSynergyEntry } from '../services/draftEngine'

const route = useRoute()
const router = useRouter()
const store = useDraftsMainStore()

const heroId = computed(() => Number(route.params.id))
const hero = computed(() => store.heroes.find((h) => h.id === heroId.value) ?? null)
const winRate = computed(() => store.heroWinRates.get(heroId.value) ?? 50)
const activePatch = computed(() => store.activePatch)

const tier = computed(() => {
  const wr = winRate.value
  if (wr >= 53) return 'S'
  if (wr >= 51.5) return 'A'
  if (wr >= 49.5) return 'B'
  return 'C'
})

onMounted(() => {
  if (store.heroes.length === 0) store.fetchHeroes()
  if (heroId.value) {
    store.fetchHeroDetailData(heroId.value)
    store.fetchHeroBenchmarksData(heroId.value)
    // Explicitly load item constants + popularity so item build shows real data
    store.ensureItemConstants()
    store.fetchHeroItemsData(heroId.value)
  }
})

watch(
  () => heroId.value,
  (id) => {
    if (id) {
      store.fetchHeroDetailData(id)
      store.fetchHeroBenchmarksData(id)
      store.fetchHeroItemsData(id)
    }
  },
)

function shortName(fullName: string) {
  return fullName.replace('npc_dota_hero_', '')
}

const stratzDetail = computed(() => store.heroDetailCache[heroId.value] ?? null)
const isStratzLoading = computed(() => store.heroDetailLoading[heroId.value] ?? false)

// --- Counters & Synergies ---
const heroCounters = computed(() => {
  if (!hero.value) return []
  const detail = stratzDetail.value
  if (detail?.matchup.counters.length) {
    return detail.matchup.counters.slice(0, 3).map((entry) => {
      const counterHero = store.heroes.find((h) => h.id === entry.heroId2)
      return {
        localizedName: counterHero?.localizedName ?? `Hero #${entry.heroId2}`,
        imageUrl: counterHero?.imageUrl ?? '',
      }
    })
  }
  const sn = shortName(hero.value.name)
  const staticMatches = HERO_COUNTERS.filter(([, v]) => v === sn)
  if (staticMatches.length > 0) {
    return staticMatches.slice(0, 3).map(([counterShortName]) => {
      const ally = store.heroes.find((h) => shortName(h.name) === counterShortName)
      return { localizedName: ally?.localizedName ?? counterShortName, imageUrl: ally?.imageUrl ?? '' }
    })
  }

  // Trait and curated fallback using draftEngine
  const fallbackList: { localizedName: string; imageUrl: string; severityVal: number }[] = []
  for (const h of store.heroes) {
    if (h.id === hero.value.id) continue
    const entry = getCounterEntry(h, hero.value)
    if (entry && entry.counter.id === h.id) {
      const severityVal = entry.severity === 'high' ? 3 : entry.severity === 'medium' ? 2 : 1
      fallbackList.push({
        localizedName: h.localizedName,
        imageUrl: h.imageUrl,
        severityVal
      })
    }
  }
  return fallbackList.sort((a, b) => b.severityVal - a.severityVal).slice(0, 3).map(x => ({
    localizedName: x.localizedName,
    imageUrl: x.imageUrl
  }))
})

const heroSynergies = computed(() => {
  if (!hero.value) return []
  const detail = stratzDetail.value
  if (detail?.matchup.synergies.length) {
    return detail.matchup.synergies.slice(0, 3).map((entry) => {
      const allyHero = store.heroes.find((h) => h.id === entry.heroId2)
      return {
        localizedName: allyHero?.localizedName ?? `Hero #${entry.heroId2}`,
        imageUrl: allyHero?.imageUrl ?? '',
      }
    })
  }
  const sn = shortName(hero.value.name)
  const staticMatches = HERO_SYNERGIES.filter(([a, b]) => a === sn || b === sn)
  if (staticMatches.length > 0) {
    return staticMatches.slice(0, 3).map(([a, b]) => {
      const allyShort = a === sn ? b : a
      const ally = store.heroes.find((h) => shortName(h.name) === allyShort)
      return { localizedName: ally?.localizedName ?? allyShort, imageUrl: ally?.imageUrl ?? '' }
    })
  }

  // Trait and curated fallback using draftEngine
  const fallbackList: { localizedName: string; imageUrl: string; score: number }[] = []
  for (const h of store.heroes) {
    if (h.id === hero.value.id) continue
    const entry = getSynergyEntry(hero.value, h)
    if (entry) {
      fallbackList.push({
        localizedName: h.localizedName,
        imageUrl: h.imageUrl,
        score: entry.synergyScore || 5
      })
    }
  }
  return fallbackList.sort((a, b) => b.score - a.score).slice(0, 3).map(x => ({
    localizedName: x.localizedName,
    imageUrl: x.imageUrl
  }))
})

// --- Items ---
interface ItemDisplay { name: string; imageUrl: string; winRate?: number; cost?: number; }

// Direct read from OpenDota popularity + constants — bypasses the aggressive shop filter
const recommendedItems = computed(() => {
  // 1. Try Stratz items (if API key is configured)
  const stratzItems = stratzDetail.value?.items
  if (stratzItems && (stratzItems.startingItems.length > 0 || stratzItems.coreItems.length > 0)) {
    const mapStratz = (arr: any[]) => arr.slice(0, 6).map(i => {
      const info = store.openDotaItems[i.itemId]
      if (!info) return null
      return { name: info.displayName, imageUrl: info.imageUrl, cost: info.cost, winRate: i.winRate as number }
    }).filter(Boolean) as ItemDisplay[]
    return {
      starting: mapStratz(stratzItems.startingItems),
      early: mapStratz(stratzItems.earlyItems),
      core: mapStratz(stratzItems.coreItems),
      luxury: mapStratz(stratzItems.lateItems),
    }
  }

  // 2. OpenDota item popularity (reactive — updates when data arrives)
  const pop = store.itemPopularityByHero[heroId.value]
  const constants = store.openDotaItems
  if (pop && Object.keys(constants).length > 0) {
    const mapPop = (buckets: { itemId: number; count: number }[], limit = 6) =>
      buckets
        .slice(0, limit)
        .map(b => {
          const info = constants[b.itemId]
          if (!info) return null
          return { name: info.displayName, imageUrl: info.imageUrl, cost: info.cost }
        })
        .filter(Boolean) as ItemDisplay[]

    const starting = mapPop(pop.starting, 6)
    const early    = mapPop(pop.early, 6)
    const core     = mapPop(pop.mid, 6)
    const luxury   = mapPop(pop.late, 5)

    if (starting.length + early.length + core.length + luxury.length > 0) {
      return { starting, early, core, luxury }
    }
  }

  // 3. Static role-based fallback while data is loading
  if (!hero.value) return { starting: [], early: [], core: [], luxury: [] }
  const roles = hero.value.roles
  const primaryAttr = hero.value.primaryAttr

  const CDN = (sn: string) =>
    `https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/items/${sn}.png`

  let starting: ItemDisplay[] = [
    { name: 'Tango', imageUrl: CDN('tango'), cost: 90 },
    { name: 'Iron Branch', imageUrl: CDN('branches'), cost: 50 },
    { name: 'Iron Branch', imageUrl: CDN('branches'), cost: 50 },
  ]
  let core: ItemDisplay[] = [
    { name: 'Power Treads', imageUrl: CDN('power_treads'), cost: 1400 },
    { name: 'Blink Dagger', imageUrl: CDN('blink'), cost: 2250 },
    { name: 'Black King Bar', imageUrl: CDN('black_king_bar'), cost: 4050 },
  ]
  let luxury: ItemDisplay[] = [
    { name: "Aghanim's Scepter", imageUrl: CDN('ultimate_scepter'), cost: 4200 },
  ]

  if (roles.includes('Carry')) {
    starting = [
      { name: 'Tango', imageUrl: CDN('tango'), cost: 90 },
      { name: 'Quelling Blade', imageUrl: CDN('quelling_blade'), cost: 200 },
      { name: primaryAttr === 'agi' ? 'Wraith Band' : 'Bracer', imageUrl: CDN(primaryAttr === 'agi' ? 'wraith_band' : 'bracer'), cost: 525 },
    ]
    core    = [
      { name: 'Power Treads', imageUrl: CDN('power_treads'), cost: 1400 },
      { name: 'Manta Style', imageUrl: CDN('manta'), cost: 4000 },
      { name: 'Black King Bar', imageUrl: CDN('black_king_bar'), cost: 4050 },
    ]
    luxury  = [
      { name: 'Butterfly', imageUrl: CDN('butterfly'), cost: 4975 },
      { name: 'Abyssal Blade', imageUrl: CDN('abyssal_blade'), cost: 6250 },
      { name: 'Satanic', imageUrl: CDN('satanic'), cost: 5050 },
    ]
  } else if (roles.includes('Support')) {
    starting = [
      { name: 'Tango', imageUrl: CDN('tango'), cost: 90 },
      { name: 'Healing Salve', imageUrl: CDN('flask'), cost: 100 },
      { name: 'Clarity', imageUrl: CDN('clarity'), cost: 50 },
    ]
    core    = [
      { name: 'Arcane Boots', imageUrl: CDN('arcane_boots'), cost: 1300 },
      { name: 'Glimmer Cape', imageUrl: CDN('glimmer_cape'), cost: 1950 },
      { name: 'Force Staff', imageUrl: CDN('force_staff'), cost: 2200 },
    ]
    luxury  = [
      { name: 'Scythe of Vyse', imageUrl: CDN('sheepstick'), cost: 5675 },
      { name: "Aghanim's Scepter", imageUrl: CDN('ultimate_scepter'), cost: 4200 },
    ]
  } else if (roles.includes('Initiator') || roles.includes('Durable')) {
    starting = [
      { name: 'Tango', imageUrl: CDN('tango'), cost: 90 },
      { name: 'Bracer', imageUrl: CDN('bracer'), cost: 525 },
    ]
    core    = [
      { name: 'Phase Boots', imageUrl: CDN('phase_boots'), cost: 1500 },
      { name: 'Blink Dagger', imageUrl: CDN('blink'), cost: 2250 },
      { name: 'Blade Mail', imageUrl: CDN('blade_mail'), cost: 2200 },
    ]
    luxury  = [
      { name: 'Black King Bar', imageUrl: CDN('black_king_bar'), cost: 4050 },
      { name: "Shiva's Guard", imageUrl: CDN('shivas_guard'), cost: 4750 },
    ]
  }

  return { starting, early: [], core, luxury }
})

// --- Stats & Benchmarks ---
const baseStats = computed(() => {
  if (!hero.value) return null
  const h = hero.value
  const hpBase = Math.round(120 + h.baseStr * 20)
  const manaBase = Math.round(75 + h.baseInt * 12)
  return {
    health: hpBase, mana: manaBase,
    baseStr: h.baseStr, gainStr: h.strGain.toFixed(1),
    baseAgi: h.baseAgi, gainAgi: h.agiGain.toFixed(1),
    baseInt: h.baseInt, gainInt: h.intGain.toFixed(1),
  }
})

const benchmarks = computed(() => store.heroBenchmarksCache[heroId.value])

const impactMetrics = computed(() => {
  if (!hero.value) return { survivability: 50, lane: 50, teamfight: 50, scaling: 50, burst: 50 }
  const roles = hero.value.roles
  const attr = hero.value.primaryAttr
  let survivability = roles.includes('Durable') ? 90 : (attr === 'str' ? 70 : 40)
  let lane = roles.includes('Pusher') || roles.includes('Nuker') ? 80 : 50
  let teamfight = roles.includes('Initiator') || roles.includes('Disabler') ? 85 : 55
  let scaling = roles.includes('Carry') ? 95 : (roles.includes('Support') ? 30 : 60)
  let burst = roles.includes('Nuker') ? 90 : 40
  
  if (hero.value.name.includes('phantom_assassin')) {
    survivability = 67; lane = 45; teamfight = 58; scaling = 91; burst = 88;
  }
  
  return { survivability, lane, teamfight, scaling, burst }
})

// Draft Tips
const draftTips = computed(() => {
  if (!hero.value) return []
  if (hero.value.name.includes('phantom_assassin')) {
    return [
      { text: 'Rush Battle Fury for farm efficiency — skip it only if the enemy has hard early aggression.', color: '#eab308' },
      { text: 'BKB is mandatory. PA evaporates to any magical burst without spell immunity.', color: '#ef4444' },
      { text: 'Max Q early for lane pressure and pick-off potential on rotations.', color: '#a855f7' }
    ]
  }
  return [
    { text: `Focus on positioning in teamfights. As a ${hero.value.roles[0]}, your impact relies on correct timing.`, color: '#eab308' },
    { text: `Consider itemizing defensively if the enemy team has high magic burst.`, color: '#ef4444' },
    { text: `Coordinate with your team for objectives when your ultimate is off cooldown.`, color: '#a855f7' }
  ]
})

const recommendedLane = computed(() => {
  if (!hero.value) return 'Unknown'
  return suggestedLaneLabel(hero.value.name, hero.value.roles)
})

useHead(computed(() => ({
  title: hero.value ? `${hero.value.localizedName} — Stats & Counters | Dota Drafts` : 'Hero | Dota Drafts',
})))

function goBack() {
  if (window.history.length > 2) router.back()
  else router.push('/heroes')
}

function attrLabel(attr: string) {
  if (attr === 'str') return 'Strength'
  if (attr === 'agi') return 'Agility'
  if (attr === 'int') return 'Intelligence'
  return 'Universal'
}

// Points for radar chart (Polygon)
const radarPoints = computed(() => {
  const m = impactMetrics.value
  const max = 100
  const center = 50
  const radius = 40
  
  const getPoint = (value: number, angleIndex: number, total: number) => {
    const angle = (Math.PI * 2 * angleIndex) / total - Math.PI / 2
    const dist = (value / max) * radius
    return `${center + dist * Math.cos(angle)},${center + dist * Math.sin(angle)}`
  }
  
  const values = [m.survivability, m.scaling, m.burst, m.teamfight, m.lane]
  return values.map((v, i) => getPoint(v, i, 5)).join(' ')
})

const radarBgPoints = computed(() => {
  const center = 50
  const radius = 40
  const getPoint = (value: number, angleIndex: number, total: number) => {
    const angle = (Math.PI * 2 * angleIndex) / total - Math.PI / 2
    const dist = (value / 100) * radius
    return `${center + dist * Math.cos(angle)},${center + dist * Math.sin(angle)}`
  }
  return [1, 2, 3, 4, 5].map((_, i) => getPoint(100, i, 5)).join(' ')
})

const strokeDasharray = computed(() => {
  const c = Math.PI * 2 * 45; // radius 45 for winrate circle
  return `${(winRate.value / 100) * c} ${c}`
})

</script>

<template>
  <div class="hero-detail-page">
    <div v-if="!store.isLoading && !hero" class="not-found">
      <h2>Hero not found</h2>
      <button class="back-btn" @click="goBack">← Go back</button>
    </div>

    <div v-else-if="store.isLoading && !hero" class="global-loader">
      <div class="spinner"></div>
      <p>Loading hero data...</p>
    </div>

    <template v-else-if="hero">
      <div class="detail-layout">
        <!-- LEFT COLUMN (Sticky) -->
        <div class="side-col left-col">
          <div class="hero-card">
            <img class="hero-portrait-large" :src="hero.imageUrl" :alt="hero.localizedName" />
            <h1 class="hero-name">{{ hero.localizedName }}</h1>
            <div class="hero-roles">
              <span class="role-badge" :class="hero.primaryAttr">{{ attrLabel(hero.primaryAttr).substring(0,3).toUpperCase() }}</span>
              <span class="role-badge" v-for="r in hero.roles.slice(0,2)" :key="r">{{ r }}</span>
            </div>
            
            <div class="hero-attrs" v-if="baseStats">
              <div class="attr-box">
                <span class="attr-icon str"></span>
                <span class="attr-val">{{ baseStats.baseStr }}</span>
                <span class="attr-gain">+{{ baseStats.gainStr }}</span>
              </div>
              <div class="attr-box">
                <span class="attr-icon agi"></span>
                <span class="attr-val">{{ baseStats.baseAgi }}</span>
                <span class="attr-gain">+{{ baseStats.gainAgi }}</span>
              </div>
              <div class="attr-box">
                <span class="attr-icon int"></span>
                <span class="attr-val">{{ baseStats.baseInt }}</span>
                <span class="attr-gain">+{{ baseStats.gainInt }}</span>
              </div>
            </div>
          </div>
          
          <div class="sidebar-section">
            <h3 class="sidebar-title">DRAFT CONTEXT</h3>
            <div class="draft-context-row">
              <span class="ctx-label">Position</span>
              <span class="ctx-val">{{ recommendedLane.split(' (')[0] }} (Pos. {{ recommendedLane.includes('Carry')?1:recommendedLane.includes('Mid')?2:recommendedLane.includes('Offlane')?3:recommendedLane.includes('Support')?4:5 }})</span>
            </div>
            <div class="draft-context-row">
              <span class="ctx-label">Lane</span>
              <span class="ctx-val">{{ recommendedLane.split(' (')[0] }}</span>
            </div>
            <div class="draft-context-row">
              <span class="ctx-label">Playstyle</span>
              <span class="ctx-val">{{ hero.roles.slice(0,2).join(' / ') }}</span>
            </div>
          </div>

          <div class="sidebar-section">
            <h3 class="sidebar-title">DRAFT PICKS</h3>
            
            <div class="draft-picks-list">
              <div class="pick-header counter">● COUNTERED BY</div>
              <div class="pick-item" v-for="c in heroCounters" :key="c.localizedName">
                {{ c.localizedName }}
              </div>
              
              <div class="pick-header synergy">● SYNERGIZES WITH</div>
              <div class="pick-item synergy-item" v-for="s in heroSynergies" :key="s.localizedName">
                {{ s.localizedName }}
              </div>
            </div>
          </div>
        </div>

        <!-- CENTER COLUMN (Scrollable) -->
        <div class="center-col">
          <div class="section-title">
            <div class="line"></div>
            <h2>ITEM BUILD</h2>
            <div class="tabs">
              <div class="tab active">Core</div>
              <div class="tab">Situational</div>
            </div>
          </div>
          
          <div class="item-build-card">
            <div class="build-phase" v-if="recommendedItems.starting.length">
              <h4 class="phase-title">STARTING</h4>
              <div class="item-grid">
                <div class="item-box" v-for="item in recommendedItems.starting.slice(0, 6)" :key="item.name">
                  <img :src="item.imageUrl" :alt="item.name" />
                  <div class="item-cost" v-if="item.cost">{{ item.cost }}g</div>
                </div>
              </div>
            </div>
            
            <div class="build-phase" v-if="recommendedItems.early.length || recommendedItems.core.length">
              <h4 class="phase-title">EARLY GAME <span class="time-range">6-8 min → 14-18 min</span></h4>
              <div class="item-grid">
                <div class="item-box" v-for="item in (recommendedItems.early.length ? recommendedItems.early : recommendedItems.core).slice(0, 6)" :key="item.name">
                  <img :src="item.imageUrl" :alt="item.name" />
                  <div class="item-cost" v-if="item.cost">{{ item.cost }}g</div>
                </div>
              </div>
            </div>
            
            <div class="build-phase" v-if="recommendedItems.core.length">
              <h4 class="phase-title">CORE <span class="time-range">20-24 min → 26-30 min</span></h4>
              <div class="item-grid">
                <div class="item-box" v-for="item in recommendedItems.core.slice(0, 6)" :key="item.name">
                  <img :src="item.imageUrl" :alt="item.name" />
                  <div class="item-cost" v-if="item.cost">{{ item.cost }}g</div>
                </div>
              </div>
            </div>
            
            <div class="build-phase" v-if="recommendedItems.luxury.length">
              <h4 class="phase-title">LATE GAME <span class="time-range">34-40 min → 38-44 min</span></h4>
              <div class="item-grid">
                <div class="item-box" v-for="item in recommendedItems.luxury.slice(0, 5)" :key="item.name">
                  <img :src="item.imageUrl" :alt="item.name" />
                  <div class="item-cost" v-if="item.cost">{{ item.cost }}g</div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="section-title">
            <div class="line"></div>
            <h2>SKILL BUILD</h2>
          </div>
          <div class="item-build-card" style="min-height: 120px; display: flex; align-items: center; justify-content: center; color: #64748b;">
            Skill build sequence will be displayed here.
          </div>
          
          <div class="section-title">
            <div class="line"></div>
            <h2>TALENT TREE</h2>
          </div>
          <div class="item-build-card" style="min-height: 200px; display: flex; align-items: center; justify-content: center; color: #64748b;">
            Talent tree choices will be displayed here.
          </div>
        </div>

        <!-- RIGHT COLUMN (Sticky) -->
        <div class="side-col right-col">
          <div class="section-title right-align">
            <h2>BUILD IMPACT</h2>
            <div class="patch-info">Based on matches - {{ activePatch?.label || 'Patch 7.37c' }}</div>
          </div>
          
          <div class="impact-stats-card">
            <div class="winrate-donut">
              <svg viewBox="0 0 100 100" class="donut-svg">
                <circle cx="50" cy="50" r="45" fill="none" stroke="#1e293b" stroke-width="8"></circle>
                <circle cx="50" cy="50" r="45" fill="none" stroke="#eab308" stroke-width="8" stroke-linecap="round"
                  :stroke-dasharray="strokeDasharray" stroke-dashoffset="0" transform="rotate(-90 50 50)"></circle>
              </svg>
              <div class="donut-text">
                <span class="val">{{ winRate.toFixed(0) }}%</span>
                <span class="lbl">WIN RATE</span>
              </div>
            </div>
            
            <div class="benchmarks-row">
              <div class="bench-item">
                <span class="val">{{ benchmarks?.kda?.toFixed(1) || 'N/A' }}</span>
                <span class="lbl">Avg KDA</span>
              </div>
              <div class="bench-item">
                <span class="val">{{ benchmarks?.gpm || 'N/A' }}</span>
                <span class="lbl">GPM</span>
              </div>
              <div class="bench-item">
                <span class="val">{{ benchmarks?.xpm || 'N/A' }}</span>
                <span class="lbl">XPM</span>
              </div>
            </div>
          </div>
          
          <div class="sidebar-section">
            <h3 class="sidebar-title">IMPACT METRICS</h3>
            <div class="metric-row">
              <div class="metric-header">
                <span class="metric-name"><i class="icon-survive"></i> Survivability</span>
                <span class="metric-val" style="color: #3b82f6;">{{ impactMetrics.survivability }}</span>
              </div>
              <div class="metric-bar"><div class="fill" :style="{ width: impactMetrics.survivability + '%', background: '#3b82f6' }"></div></div>
            </div>
            <div class="metric-row">
              <div class="metric-header">
                <span class="metric-name"><i class="icon-lane"></i> Lane Pressure</span>
                <span class="metric-val" style="color: #f59e0b;">{{ impactMetrics.lane }}</span>
              </div>
              <div class="metric-bar"><div class="fill" :style="{ width: impactMetrics.lane + '%', background: '#f59e0b' }"></div></div>
            </div>
            <div class="metric-row">
              <div class="metric-header">
                <span class="metric-name"><i class="icon-team"></i> Teamfight</span>
                <span class="metric-val" style="color: #a855f7;">{{ impactMetrics.teamfight }}</span>
              </div>
              <div class="metric-bar"><div class="fill" :style="{ width: impactMetrics.teamfight + '%', background: '#a855f7' }"></div></div>
            </div>
            <div class="metric-row">
              <div class="metric-header">
                <span class="metric-name"><i class="icon-scale"></i> Late-game Scaling</span>
                <span class="metric-val" style="color: #22c55e;">{{ impactMetrics.scaling }}</span>
              </div>
              <div class="metric-bar"><div class="fill" :style="{ width: impactMetrics.scaling + '%', background: '#22c55e' }"></div></div>
            </div>
            <div class="metric-row">
              <div class="metric-header">
                <span class="metric-name"><i class="icon-burst"></i> Burst Damage</span>
                <span class="metric-val" style="color: #ef4444;">{{ impactMetrics.burst }}</span>
              </div>
              <div class="metric-bar"><div class="fill" :style="{ width: impactMetrics.burst + '%', background: '#ef4444' }"></div></div>
            </div>
          </div>
          
          <div class="sidebar-section">
            <h3 class="sidebar-title">PROFILE OVERVIEW</h3>
            <div class="radar-chart-container">
              <svg viewBox="0 0 100 100" class="radar-svg">
                <!-- Grid -->
                <polygon :points="radarBgPoints" fill="none" stroke="#334155" stroke-width="0.5"></polygon>
                <!-- Axes -->
                <line x1="50" y1="50" x2="50" y2="10" stroke="#334155" stroke-width="0.5"></line>
                <line x1="50" y1="50" x2="88" y2="37" stroke="#334155" stroke-width="0.5"></line>
                <line x1="50" y1="50" x2="73" y2="82" stroke="#334155" stroke-width="0.5"></line>
                <line x1="50" y1="50" x2="26" y2="82" stroke="#334155" stroke-width="0.5"></line>
                <line x1="50" y1="50" x2="11" y2="37" stroke="#334155" stroke-width="0.5"></line>
                
                <!-- Data Polygon -->
                <polygon :points="radarPoints" fill="rgba(234, 179, 8, 0.2)" stroke="#eab308" stroke-width="1.5"></polygon>
              </svg>
              <div class="radar-labels">
                <span class="r-lbl top">Win Rate</span>
                <span class="r-lbl right-top">Scaling</span>
                <span class="r-lbl right-bottom">Burst</span>
                <span class="r-lbl left-bottom">Teamfight</span>
                <span class="r-lbl left-top">Lane</span>
              </div>
            </div>
          </div>
          
          <div class="sidebar-section">
            <h3 class="sidebar-title">DRAFT TIPS</h3>
            <div class="tips-list">
              <div class="tip-box" v-for="(tip, idx) in draftTips" :key="idx" :style="{ borderLeftColor: tip.color }">
                {{ tip.text }}
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.hero-detail-page {
  background: #090d16;
  color: #f8fafc;
  font-family: 'Outfit', sans-serif;
  min-height: 100vh;
  padding: 24px;
}

.detail-layout {
  display: flex;
  gap: 32px;
  max-width: 1400px;
  margin: 0 auto;
  align-items: flex-start;
}

/* Side Columns Sticky Setup */
.side-col {
  width: 320px;
  flex-shrink: 0;
  position: sticky;
  top: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-height: calc(100vh - 48px);
  overflow-y: auto;
  /* Hide scrollbar for neatness */
  scrollbar-width: none;
}
.side-col::-webkit-scrollbar {
  display: none;
}

/* Center Column */
.center-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* --- LEFT COLUMN STYLES --- */
.hero-card {
  background: #111827;
  border-radius: 12px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  border: 1px solid #1f2937;
}

.hero-portrait-large {
  width: 160px;
  height: 220px;
  object-fit: cover;
  border-radius: 12px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
  margin-bottom: 16px;
  border: 2px solid #334155;
}

.hero-name {
  font-size: 28px;
  font-weight: 800;
  text-align: center;
  margin: 0 0 12px 0;
  text-transform: uppercase;
  background: linear-gradient(to right, #fff, #94a3b8);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.hero-roles {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
}

.role-badge {
  background: #1f2937;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.5px;
  color: #94a3b8;
  text-transform: uppercase;
}
.role-badge.str { color: #f87171; border: 1px solid #7f1d1d; background: #450a0a; }
.role-badge.agi { color: #4ade80; border: 1px solid #14532d; background: #052e16; }
.role-badge.int { color: #60a5fa; border: 1px solid #1e3a8a; background: #172554; }

.hero-attrs {
  display: flex;
  justify-content: space-between;
  width: 100%;
  padding-top: 16px;
  border-top: 1px solid #1f2937;
}

.attr-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}
.attr-val {
  font-size: 18px;
  font-weight: 700;
}
.attr-gain {
  font-size: 12px;
  color: #64748b;
}

.sidebar-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.sidebar-title {
  font-size: 12px;
  color: #64748b;
  margin: 0;
  font-weight: 700;
  letter-spacing: 1px;
}

.draft-context-row {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  padding: 4px 0;
}
.ctx-label { color: #64748b; }
.ctx-val { font-weight: 600; }

.pick-header {
  font-size: 12px;
  font-weight: 700;
  margin: 12px 0 8px;
}
.pick-header.counter { color: #ef4444; }
.pick-header.synergy { color: #22c55e; }

.pick-item {
  background: #111827;
  padding: 8px 12px;
  border-radius: 6px;
  margin-bottom: 6px;
  font-size: 14px;
  border-left: 2px solid #ef4444;
}
.pick-item.synergy-item {
  border-left-color: #22c55e;
}

/* --- CENTER COLUMN STYLES --- */
.section-title {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: -8px; /* Pulled up closer to card */
}
.section-title .line {
  width: 4px;
  height: 20px;
  background: #eab308;
  border-radius: 4px;
}
.section-title h2 {
  font-size: 16px;
  margin: 0;
  letter-spacing: 1px;
}
.section-title .tabs {
  margin-left: auto;
  display: flex;
  gap: 8px;
}
.section-title .tab {
  padding: 4px 12px;
  font-size: 12px;
  border-radius: 6px;
  border: 1px solid #334155;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s;
}
.section-title .tab.active {
  color: #eab308;
  border-color: #eab308;
  background: rgba(234, 179, 8, 0.1);
}

.item-build-card {
  background: #111827;
  border: 1px solid #1f2937;
  border-radius: 12px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.build-phase {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.phase-title {
  margin: 0;
  font-size: 14px;
  color: #38bdf8;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.time-range {
  font-size: 12px;
  color: #64748b;
  font-weight: 400;
}

.item-grid {
  display: flex;
  gap: 12px;
}

.item-box {
  width: 60px;
  height: 60px;
  background: #1e293b;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  border: 1px solid #334155;
  overflow: hidden;
}
.item-box img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.item-cost {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0,0,0,0.7);
  font-size: 10px;
  text-align: center;
  padding: 2px 0;
  color: #fbbf24;
}

/* --- RIGHT COLUMN STYLES --- */
.section-title.right-align {
  justify-content: space-between;
}
.patch-info {
  font-size: 12px;
  color: #64748b;
}

.impact-stats-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
}

.winrate-donut {
  position: relative;
  width: 140px;
  height: 140px;
}
.donut-svg {
  transform: rotate(-90deg);
  width: 100%;
  height: 100%;
}
.donut-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
}
.donut-text .val {
  font-size: 28px;
  font-weight: 800;
  color: #eab308;
}
.donut-text .lbl {
  font-size: 10px;
  color: #64748b;
  letter-spacing: 1px;
}

.benchmarks-row {
  display: flex;
  width: 100%;
  justify-content: space-between;
  padding-top: 16px;
  border-top: 1px solid #1f2937;
}
.bench-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}
.bench-item .val {
  font-size: 18px;
  font-weight: 700;
}
.bench-item .lbl {
  font-size: 11px;
  color: #64748b;
}

.metric-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.metric-header {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
}
.metric-bar {
  height: 6px;
  background: #1e293b;
  border-radius: 3px;
  overflow: hidden;
}
.metric-bar .fill {
  height: 100%;
  border-radius: 3px;
}

.radar-chart-container {
  position: relative;
  width: 100%;
  height: 200px;
  display: flex;
  justify-content: center;
  align-items: center;
}
.radar-svg {
  width: 180px;
  height: 180px;
}
.radar-labels {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  pointer-events: none;
}
.r-lbl {
  position: absolute;
  font-size: 10px;
  color: #94a3b8;
}
.r-lbl.top { top: 5px; left: 50%; transform: translateX(-50%); }
.r-lbl.right-top { top: 30%; right: 20px; }
.r-lbl.right-bottom { bottom: 20px; right: 40px; }
.r-lbl.left-bottom { bottom: 20px; left: 40px; }
.r-lbl.left-top { top: 30%; left: 20px; }

.tips-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.tip-box {
  background: #111827;
  padding: 12px;
  border-radius: 6px;
  font-size: 13px;
  line-height: 1.4;
  border-left: 3px solid #334155;
  color: #cbd5e1;
}

/* Loader */
.not-found, .global-loader {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
}
.spinner {
  width: 36px; height: 36px;
  border: 3px solid rgba(234,179,8,0.1);
  border-top-color: #eab308;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
