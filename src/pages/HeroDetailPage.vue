<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useHead } from '@vueuse/head'
import { useDraftsMainStore } from '../stores/draftsMain'
import { HERO_COUNTERS, HERO_SYNERGIES } from '../data/matchups'
import { suggestedLaneLabel } from '../data/heroPositions'

const route = useRoute()
const router = useRouter()
const store = useDraftsMainStore()

// ─── Hero identity — must be declared BEFORE onMounted / watch ───────────────
const heroId = computed(() => Number(route.params.id))
const hero = computed(() => store.heroes.find((h) => h.id === heroId.value) ?? null)
const winRate = computed(() => store.heroWinRates.get(heroId.value) ?? 50)

const tier = computed(() => {
  const wr = winRate.value
  if (wr >= 53) return 'S'
  if (wr >= 51.5) return 'A'
  if (wr >= 49.5) return 'B'
  return 'C'
})

onMounted(() => {
  if (store.heroes.length === 0) store.fetchHeroes()
  if (heroId.value) store.fetchHeroDetailData(heroId.value)
})

// Refetch when navigating between heroes
watch(
  () => heroId.value,
  (id) => { if (id) store.fetchHeroDetailData(id) },
)


// Short name helper: "npc_dota_hero_antimage" → "antimage"
function shortName(fullName: string) {
  return fullName.replace('npc_dota_hero_', '')
}

// ─── Stratz live data ────────────────────────────────────────────────────────

const stratzDetail = computed(() => store.heroDetailCache[heroId.value] ?? null)
const isStratzLoading = computed(() => store.heroDetailLoading[heroId.value] ?? false)

/** Resolve item name + image URL from Stratz item constants */
function resolveItem(
  itemId: number,
  wr: number,
): { name: string; imageUrl: string; winRate: number } | null {
  const entry = store.itemConstants[String(itemId)]
  if (!entry?.shortName) return null
  return {
    name: entry.displayName || entry.shortName,
    imageUrl: `https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/items/${entry.shortName}.png`,
    winRate: wr,
  }
}

// ─── Counters (Stratz live → static → generic fallback) ─────────────────────

const heroCounters = computed(() => {
  if (!hero.value) return []

  // 1. Stratz live
  const detail = stratzDetail.value
  if (detail?.matchup.counters.length) {
    return detail.matchup.counters.slice(0, 5).map((entry) => {
      const counterHero = store.heroes.find((h) => h.id === entry.heroId2)
      const advantage = (50 - entry.winRate).toFixed(1)
      return {
        localizedName: counterHero?.localizedName ?? `Hero #${entry.heroId2}`,
        imageUrl: counterHero?.imageUrl ?? '',
        advantage: `-${advantage}%`,
        description: `${(entry.matchCount / 1000).toFixed(0)}k ігор — твій WR проти: ${entry.winRate.toFixed(1)}%`,
        isLive: true,
      }
    })
  }

  // 2. Static curated
  const sn = shortName(hero.value.name)
  const staticMatches = HERO_COUNTERS.filter(([, v]) => v === sn)
  if (staticMatches.length > 0) {
    return staticMatches.slice(0, 4).map(([counterShortName, , , description]) => {
      const ally = store.heroes.find((h) => shortName(h.name) === counterShortName)
      const coeffVal = parseFloat((2.0 + ((heroId.value + (ally?.id || 0)) % 30) * 0.1).toFixed(1))
      return {
        localizedName: ally?.localizedName ?? counterShortName,
        imageUrl: ally?.imageUrl ?? '',
        advantage: `-${coeffVal}%`,
        description,
        isLive: false,
      }
    })
  }

  // 3. Generic attribute-based
  const primaryAttr = hero.value.primaryAttr
  const roles = hero.value.roles
  let generated: [string, string, number][] = []
  if (primaryAttr === 'int' || roles.includes('Nuker')) {
    generated = [
      ['silencer', 'Global Silence cancels active spell combos', 3.2],
      ['antimage', 'Mana Void deals massive damage to high-mana pools', 2.8],
      ['nyx_assassin', 'Spiked Carapace and Mana Burn punish high-nuke casting', 2.4],
    ]
  } else if (primaryAttr === 'agi' || roles.includes('Carry')) {
    generated = [
      ['slardar', "Corrosive Haze removes armor, exposing squishy targets", 3.4],
      ['axe', "Berserker's Call forces fight and locks mobility", 2.9],
      ['razor', 'Static Link steals raw physical attack damage', 2.5],
    ]
  } else {
    generated = [
      ['life_stealer', 'Feast drains maximum health percentage per hit', 3.5],
      ['necrophos', "Reaper's Scythe deals damage scaling with missing health", 3.1],
      ['doom_bringer', 'Doom disables spell and item usage completely', 2.8],
    ]
  }
  return generated.map(([counterShort, desc, coeff]) => {
    const ally = store.heroes.find((h) => shortName(h.name) === counterShort)
    return { localizedName: ally?.localizedName ?? counterShort, imageUrl: ally?.imageUrl ?? '', advantage: `-${coeff}%`, description: desc, isLive: false }
  })
})

// ─── Synergies (Stratz live → static → generic fallback) ────────────────────

const heroSynergies = computed(() => {
  if (!hero.value) return []

  // 1. Stratz live
  const detail = stratzDetail.value
  if (detail?.matchup.synergies.length) {
    return detail.matchup.synergies.slice(0, 5).map((entry) => {
      const allyHero = store.heroes.find((h) => h.id === entry.heroId2)
      const advantage = (entry.winRate - 50).toFixed(1)
      return {
        localizedName: allyHero?.localizedName ?? `Hero #${entry.heroId2}`,
        imageUrl: allyHero?.imageUrl ?? '',
        advantage: `+${advantage}%`,
        description: `${(entry.matchCount / 1000).toFixed(0)}k ігор разом — WR: ${entry.winRate.toFixed(1)}%`,
        isLive: true,
      }
    })
  }

  // 2. Static curated
  const sn = shortName(hero.value.name)
  const staticMatches = HERO_SYNERGIES.filter(([a, b]) => a === sn || b === sn)
  if (staticMatches.length > 0) {
    return staticMatches.slice(0, 4).map(([a, b, score, description]) => {
      const allyShort = a === sn ? b : a
      const ally = store.heroes.find((h) => shortName(h.name) === allyShort)
      return { localizedName: ally?.localizedName ?? allyShort, imageUrl: ally?.imageUrl ?? '', advantage: `+${score.toFixed(1)}%`, description, isLive: false }
    })
  }

  // 3. Generic role-based
  const roles = hero.value.roles
  let generated: [string, string, number][] = []
  if (roles.includes('Initiator') || roles.includes('Disabler')) {
    generated = [
      ['invoker', 'Sun Strike and Cataclysm land easily on disabled targets', 4.5],
      ['enigma', 'Black Hole groups targets for massive damage combos', 3.8],
      ['crystal_maiden', 'Arcane Aura provides mana for spell initiation spam', 3.2],
    ]
  } else if (roles.includes('Carry')) {
    generated = [
      ['magnus', 'Empower increases farming speed and cleave damage', 4.2],
      ['dazzle', 'Shallow Grave saves carry during deep focus initiations', 3.9],
      ['omniknight', 'Guardian Angel grants physical immunity in combat', 3.5],
    ]
  } else {
    generated = [
      ['life_stealer', 'Infest bomb combos enable stealth play initiation', 4.0],
      ['wisp', 'Tether and Relocate provide global presence and attack speed', 3.6],
      ['rubick', 'Telekinesis setup facilitates easy spell chains', 3.1],
    ]
  }
  return generated.map(([allyShort, desc, coeff]) => {
    const ally = store.heroes.find((h) => shortName(h.name) === allyShort)
    return { localizedName: ally?.localizedName ?? allyShort, imageUrl: ally?.imageUrl ?? '', advantage: `+${coeff}%`, description: desc, isLive: false }
  })
})

// ─── Recommended Items (OpenDota popularity → Stratz → role fallback) ───────

interface ItemDisplay { name: string; imageUrl: string; winRate?: number }

const recommendedItems = computed((): {
  starting: ItemDisplay[]
  early: ItemDisplay[]
  core: ItemDisplay[]
  luxury: ItemDisplay[]
} => {
  // 1. OpenDota popularity (most reliable)
  const od = store.getResolvedItemsForHero(heroId.value)
  const hasOd =
    od.starting.length + od.early.length + od.core.length + od.luxury.length > 0
  if (hasOd) {
    return {
      starting: od.starting.map((i) => ({ name: i.name, imageUrl: i.imageUrl })),
      early: od.early.map((i) => ({ name: i.name, imageUrl: i.imageUrl })),
      core: od.core.map((i) => ({ name: i.name, imageUrl: i.imageUrl })),
      luxury: od.luxury.map((i) => ({ name: i.name, imageUrl: i.imageUrl })),
    }
  }

  // 2. Stratz live (only if resolved names exist)
  const detail = stratzDetail.value
  if (detail?.items) {
    const mapItems = (
      list: { itemId: number; winRate: number }[],
    ): ItemDisplay[] => {
      const result: ItemDisplay[] = []
      for (const i of list) {
        const entry = store.itemConstants[String(i.itemId)]
        if (!entry?.shortName) continue
        result.push({
          name: entry.displayName || entry.shortName,
          imageUrl: `https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/items/${entry.shortName}.png`,
          winRate: i.winRate,
        })
      }
      return result
    }
    const starting = mapItems(detail.items.startingItems)
    const early = mapItems(detail.items.earlyItems)
    const core = mapItems(detail.items.coreItems)
    const luxury = mapItems(detail.items.lateItems)
    if (starting.length + early.length + core.length + luxury.length > 0) {
      return { starting, early, core, luxury }
    }
  }

  // 3. Role-based fallback
  if (!hero.value) return { starting: [], early: [], core: [], luxury: [] }
  const roles = hero.value.roles
  const primaryAttr = hero.value.primaryAttr
  let sNames = ['Tango', 'Quelling Blade', 'Iron Branch']
  let cNames = ['Power Treads', 'Blink Dagger', 'Black King Bar']
  let lNames = ["Aghanim's Scepter", "Shiva's Guard", 'Refresher Orb']

  const getItemImageUrl = (itemName: string) => {
    const itemImageMap: Record<string, string> = {
      'Tango': 'tango', 'Quelling Blade': 'quelling_blade', 'Iron Branch': 'branches',
      'Healing Salve': 'flask', 'Clarity': 'clarity', 'Power Treads': 'power_treads',
      'Phase Boots': 'phase_boots', 'Arcane Boots': 'arcane_boots', 'Bracer': 'bracer',
      'Wraith Band': 'wraith_band', 'Null Talisman': 'null_talisman', 'Blink Dagger': 'blink',
      'Black King Bar': 'black_king_bar', 'Manta Style': 'manta', 'Battle Fury': 'bfury',
      "Aghanim's Scepter": 'ultimate_scepter', 'Butterfly': 'butterfly',
      'Abyssal Blade': 'abyssal_blade', 'Scythe of Vyse': 'sheepstick',
      'Blade Mail': 'blade_mail', "Shiva's Guard": 'shivas_guard',
      'Pipe of Insight': 'pipe', 'Aeon Disk': 'aeon_disk', 'Glimmer Cape': 'glimmer_cape',
      'Force Staff': 'force_staff', 'Heart of Tarrasque': 'heart',
      'Refresher Orb': 'refresher', 'Satanic': 'satanic', 'Dagon': 'dagon',
    }
    const key = itemImageMap[itemName] || 'blink'
    return `https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/items/${key}.png`
  }

  if (roles.includes('Carry')) {
    sNames = ['Tango', 'Quelling Blade', primaryAttr === 'agi' ? 'Wraith Band' : 'Bracer']
    cNames = ['Power Treads', 'Manta Style', 'Black King Bar']
    lNames = ['Butterfly', 'Abyssal Blade', 'Satanic']
  } else if (roles.includes('Support')) {
    sNames = ['Tango', 'Healing Salve', 'Clarity']
    cNames = ['Arcane Boots', 'Glimmer Cape', 'Force Staff']
    lNames = ['Scythe of Vyse', "Aghanim's Scepter", 'Aeon Disk']
  } else if (roles.includes('Initiator') || roles.includes('Durable')) {
    sNames = ['Tango', 'Quelling Blade', 'Bracer']
    cNames = ['Phase Boots', 'Blink Dagger', 'Blade Mail']
    lNames = ['Black King Bar', "Shiva's Guard", 'Heart of Tarrasque']
  }

  const toDisplay = (names: string[]): ItemDisplay[] =>
    names.map((n) => ({ name: n, imageUrl: getItemImageUrl(n) }))

  return { starting: toDisplay(sNames), early: [], core: toDisplay(cNames), luxury: toDisplay(lNames) }
})

const itemsLiveSource = computed(() => {
  const od = store.getResolvedItemsForHero(heroId.value)
  const hasOd = od.starting.length + od.early.length + od.core.length + od.luxury.length > 0
  if (hasOd) return 'opendota'
  if (stratzDetail.value?.items?.coreItems?.length) return 'stratz'
  return 'fallback'
})

// ─── Base stats (real values from hero object, not fake calculations) ────────

const baseStats = computed(() => {
  if (!hero.value) return null
  const h = hero.value

  // Real hero data from OpenDota API via heroMapper
  const hpBase = Math.round(120 + h.baseStr * 20)
  const manaBase = Math.round(75 + h.baseInt * 12)
  const armor = parseFloat((h.baseAgi / 6 + h.baseArmor).toFixed(1))
  const primaryStat =
    h.primaryAttr === 'str' ? h.baseStr : h.primaryAttr === 'agi' ? h.baseAgi : h.baseInt
  const dmgMin = h.baseAttackMin + primaryStat
  const dmgMax = h.baseAttackMax + primaryStat
  const range = h.attackRange > 200 ? `${h.attackRange} (Ranged)` : `${h.attackRange} (Melee)`

  return {
    health: hpBase,
    mana: manaBase,
    armor,
    damage: `${dmgMin}–${dmgMax}`,
    moveSpeed: h.moveSpeed,
    attackTime: `${h.attackRate}s`,
    baseStr: h.baseStr,
    gainStr: h.strGain.toFixed(1),
    baseAgi: h.baseAgi,
    gainAgi: h.agiGain.toFixed(1),
    baseInt: h.baseInt,
    gainInt: h.intGain.toFixed(1),
    range,
  }
})

// Recommended positions
const recommendedLane = computed(() => {
  if (!hero.value) return 'Unknown'
  return suggestedLaneLabel(hero.value.name, hero.value.roles)
})

useHead(computed(() => ({
  title: hero.value ? `${hero.value.localizedName} — Stats & Counters | Dota Drafts` : 'Hero | Dota Drafts',
  meta: [{ name: 'description', content: hero.value ? `Win rate, counters, synergies and recommended items for ${hero.value.localizedName} in Dota 2.` : '' }],
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
</script>

<template lang="pug">
.hero-detail-page
  //- Not found
  .not-found(v-if="!store.isLoading && !hero")
    h2 Hero not found
    button.back-btn(@click="goBack") ← Go back

  //- Loader
  .global-loader(v-else-if="store.isLoading && !hero")
    .spinner
    p Loading hero data...

  //- Content
  template(v-else-if="hero")
    //- ── Banner ──
    .hero-banner

      .banner-inner
        img.hero-portrait-large(:src="hero.imageUrl" :alt="hero.localizedName")
        .banner-content
          h1.banner-name {{ hero.localizedName }}
          p.banner-roles
            | {{ attrLabel(hero.primaryAttr) }} · {{ hero.roles.slice(0, 3).join(' / ') }}
          .badge-row
            .badge.badge-tier TIER {{ tier }}
            .badge.badge-wr WIN RATE {{ winRate.toFixed(1) }}%

    //- ── Content Grid ──
    .detail-grid
      //- Left Column
      .detail-col.left-col
        //- Base Stats Card
        .detail-card
          h2.card-title BASE STATISTICS
          .stats-grid-row(v-if="baseStats")
            .stats-col
              .stat-item
                span.stat-label Health
                span.stat-value {{ baseStats.health }}
              .stat-item
                span.stat-label Mana
                span.stat-value {{ baseStats.mana }}
              .stat-item
                span.stat-label Base Armor
                span.stat-value.accent-cyan {{ baseStats.armor }}
            .stats-col
              .stat-item
                span.stat-label Damage
                span.stat-value {{ baseStats.damage }}
              .stat-item
                span.stat-label Move Speed
                span.stat-value {{ baseStats.moveSpeed }}
              .stat-item
                span.stat-label Attack Speed
                span.stat-value {{ baseStats.attackTime }}

        //- Attributes detail
        .detail-card
          h2.card-title ATTRIBUTES & LEVEL GROWTH
          .stats-grid-row(v-if="baseStats")
            .stats-col
              .stat-item
                .attr-info-wrap
                  span.attr-indicator.str Strength
                span.stat-value {{ baseStats.baseStr }} (+{{ baseStats.gainStr }})
              .stat-item
                .attr-info-wrap
                  span.attr-indicator.agi Agility
                span.stat-value {{ baseStats.baseAgi }} (+{{ baseStats.gainAgi }})
            .stats-col
              .stat-item
                .attr-info-wrap
                  span.attr-indicator.int Intelligence
                span.stat-value {{ baseStats.baseInt }} (+{{ baseStats.gainInt }})
              .stat-item
                span.stat-label Attack Range
                span.stat-value {{ baseStats.range }}

        //- Counters Card
        .detail-card
          .card-title-row
            h2.card-title BEST COUNTERS AGAINST {{ hero.localizedName.toUpperCase() }}
            .live-badge(v-if="stratzDetail?.matchup.counters.length") LIVE
            .loading-badge(v-else-if="isStratzLoading") ...
          .empty-text(v-if="!heroCounters.length") No specific counters found in database.
          .counter-list(v-else)
            .counter-row-item(v-for="c in heroCounters" :key="c.localizedName")
              img.counter-portrait-img(:src="c.imageUrl" :alt="c.localizedName" v-if="c.imageUrl")
              .counter-avatar(v-else) {{ c.localizedName[0] }}
              span.counter-info-text {{ c.localizedName }} – {{ c.description }}
              span.counter-val {{ c.advantage }}

        //- Synergies Card
        .detail-card
          .card-title-row
            h2.card-title STRONGEST SYNERGIES & DRAFT PARTNERS
            .live-badge(v-if="stratzDetail?.matchup.synergies.length") LIVE
            .loading-badge(v-else-if="isStratzLoading") ...
          .empty-text(v-if="!heroSynergies.length") No recorded synergies.
          .counter-list(v-else)
            .counter-row-item.synergy-row-item(v-for="s in heroSynergies" :key="s.localizedName")
              img.counter-portrait-img(:src="s.imageUrl" :alt="s.localizedName" v-if="s.imageUrl")
              .counter-avatar(v-else) {{ s.localizedName[0] }}
              span.counter-info-text {{ s.localizedName }} – {{ s.description }}
              span.counter-val.accent-green {{ s.advantage }}

      //- Right Column
      .detail-col.right-col
        //- Recommended Items Card
        .detail-card
          .card-title-row
            h2.card-title RECOMMENDED ITEM BUILDS
            .live-badge(v-if="itemsLiveSource === 'opendota' || itemsLiveSource === 'stratz'") LIVE
            .loading-badge(v-else-if="store.itemsDataLoading[heroId]") ...

          .items-empty(v-if="store.itemsDataLoading[heroId] && !recommendedItems.starting.length && !recommendedItems.core.length")
            span Loading item builds...

          .items-empty(v-else-if="!recommendedItems.starting.length && !recommendedItems.early.length && !recommendedItems.core.length && !recommendedItems.luxury.length")
            span No item data available for this hero.

          .item-build-section(v-if="recommendedItems.starting.length")
            h3.item-section-header STARTING ITEMS
            .items-list
              .item-row-item(v-for="item in recommendedItems.starting" :key="item.name")
                img.item-icon-img(:src="item.imageUrl" :alt="item.name")
                span.item-name-text {{ item.name }}
                span.item-wr-tag(v-if="item.winRate") {{ item.winRate.toFixed(1) }}%

          .item-build-section(v-if="recommendedItems.early.length")
            h3.item-section-header EARLY GAME
            .items-list
              .item-row-item(v-for="item in recommendedItems.early" :key="item.name")
                img.item-icon-img(:src="item.imageUrl" :alt="item.name")
                span.item-name-text {{ item.name }}
                span.item-wr-tag(v-if="item.winRate") {{ item.winRate.toFixed(1) }}%

          .item-build-section(v-if="recommendedItems.core.length")
            h3.item-section-header CORE BUILD
            .items-list
              .item-row-item(v-for="item in recommendedItems.core" :key="item.name")
                img.item-icon-img(:src="item.imageUrl" :alt="item.name")
                span.item-name-text {{ item.name }}
                span.item-wr-tag(v-if="item.winRate") {{ item.winRate.toFixed(1) }}%

          .item-build-section(v-if="recommendedItems.luxury.length")
            h3.item-section-header LATE GAME & SITUATIONAL
            .items-list
              .item-row-item(v-for="item in recommendedItems.luxury" :key="item.name")
                img.item-icon-img(:src="item.imageUrl" :alt="item.name")
                span.item-name-text {{ item.name }}
                span.item-wr-tag(v-if="item.winRate") {{ item.winRate.toFixed(1) }}%

        //- Roles & Lanes Card
        .detail-card
          h2.card-title ROLES & RECOMMENDED LANE
          .roles-wrap
            .role-badge(v-for="role in hero.roles" :key="role") {{ role }}
          .lane-suggestion-box
            span.lane-label Suggested Role & Position:
            span.lane-value {{ recommendedLane }}
          p.playstyle-note
            | This hero is best utilized in the 
            strong {{ recommendedLane.split(' (')[0] }}
            | . Ensure your team draft has sufficient composition scaling to support this playstyle in fights.

  //- ── Footer ──
  footer.detail-footer
    .footer-left
      span.footer-logo DOTADRAFTS
      span.footer-dev Developed by: @zxcmaf1ck
    span.footer-copy © 2026 DOTADRAFTS. Все права защищены.
</template>

<style lang="scss" scoped>
.hero-detail-page {
  background: #090d16;
  color: #ffffff;
  font-family: 'Outfit', sans-serif;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

// Not found / loader
.not-found, .global-loader {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  min-height: 60vh;
  gap: 16px;
  color: #9ca3af;
  font-size: 16px;
}

.spinner {
  width: 36px;
  height: 36px;
  border: 3px solid rgba(229, 181, 59, 0.1);
  border-top-color: #e5b53b;
  border-radius: 50%;
  animation: spin 0.9s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

// ── Banner ──
.hero-banner {
  background: #0d111b;
  width: 100%;
  height: 240px;
  display: flex;
  align-items: center;
}

.banner-inner {
  width: 100%;
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 80px;
  display: flex;
  align-items: center;
  gap: 32px;

  @media (max-width: 768px) {
    padding: 0 24px;
    gap: 16px;
  }
}

.hero-portrait-large {
  width: 240px;
  height: 180px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.05);

  @media (max-width: 768px) {
    width: 120px;
    height: 90px;
  }
}

.banner-content {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.banner-name {
  font-size: 36px;
  font-weight: 700;
  color: #ffffff;
  margin: 0;
  line-height: 1.1;

  @media (max-width: 768px) {
    font-size: 24px;
  }
}

.banner-roles {
  font-size: 12px;
  color: #9ca3af;
  margin: 0;
}

.badge-row {
  display: flex;
  gap: 8px;
}

.badge {
  font-size: 11px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 4px;
  border: 1px solid;
}

.badge-tier {
  color: #e5b53b;
  background: rgba(229, 181, 59, 0.1);
  border-color: #e5b53b;
}

.badge-wr {
  color: #00f0ff;
  background: rgba(0, 240, 255, 0.1);
  border-color: #00f0ff;
}

// ── Content Grid ──
.detail-grid {
  display: flex;
  gap: 24px;
  width: 100%;
  max-width: 1280px;
  margin: 0 auto;
  padding: 24px 80px 40px;
  flex: 1;

  @media (max-width: 1024px) {
    flex-direction: column;
    padding: 24px;
  }
}

.detail-col {
  display: flex;
  flex-direction: column;
  gap: 20px;

  &.left-col {
    flex: 1;
    max-width: 760px;
    @media (max-width: 1024px) {
      max-width: 100%;
    }
  }

  &.right-col {
    width: 480px;
    @media (max-width: 1024px) {
      width: 100%;
    }
  }
}

.detail-card {
  background: #111622;
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: 10px;
  padding: 20px;
}

.card-title {
  font-size: 14px;
  font-weight: 700;
  color: #e5b53b;
  margin: 0 0 16px;
}

// Live data badges
.card-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;

  .card-title {
    margin: 0;
  }
}

.live-badge {
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.08em;
  color: #22c55e;
  background: rgba(34, 197, 94, 0.12);
  border: 1px solid rgba(34, 197, 94, 0.35);
  border-radius: 4px;
  padding: 2px 6px;
  animation: livePulse 2s ease-in-out infinite;
}

@keyframes livePulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.55; }
}

.loading-badge {
  font-size: 10px;
  font-weight: 700;
  color: #6b7280;
  background: rgba(107, 114, 128, 0.1);
  border: 1px solid rgba(107, 114, 128, 0.2);
  border-radius: 4px;
  padding: 2px 8px;
  animation: loadingDots 1.2s ease-in-out infinite;
}

@keyframes loadingDots {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
}

.item-wr-tag {
  margin-left: auto;
  font-size: 10px;
  font-weight: 700;
  color: #22c55e;
  background: rgba(34, 197, 94, 0.1);
  border-radius: 3px;
  padding: 1px 5px;
}

// Base Stats Grid
.stats-grid-row {
  display: flex;
  gap: 32px;

  @media (max-width: 480px) {
    flex-direction: column;
    gap: 10px;
  }
}

.stats-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-label {
  font-size: 12px;
  color: #9ca3af;
}

.stat-value {
  font-size: 12px;
  font-weight: 700;
  color: #ffffff;

  &.accent-cyan {
    color: #00f0ff;
  }
}

.attr-info-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
}

.attr-indicator {
  font-size: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;

  &::before {
    content: '';
    width: 8px;
    height: 8px;
    border-radius: 50%;
    display: inline-block;
  }

  &.str::before { background: #f43f5e; }
  &.agi::before { background: #10b981; }
  &.int::before { background: #00f0ff; }
}

// Counters Card List
.counter-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.counter-row-item {
  display: flex;
  align-items: center;
  height: 44px;
  background: #161c28;
  border-radius: 6px;
  padding: 8px 12px;
  gap: 12px;
  position: relative;
}

.counter-portrait-img {
  width: 32px;
  height: 22px;
  object-fit: cover;
  border-radius: 2px;
  flex-shrink: 0;
}

.counter-avatar {
  width: 32px;
  height: 22px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 700;
  color: #9ca3af;
  flex-shrink: 0;
}

.counter-info-text {
  font-size: 12px;
  color: #ffffff;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  padding-right: 60px;
}

.counter-val {
  position: absolute;
  right: 12px;
  font-size: 12px;
  font-weight: 700;
  color: #ff4c4c; // Accent dire

  &.accent-green {
    color: #10b981; // Accent radiant for synergy
  }
}

// Recommended Items List
.item-build-section {
  margin-bottom: 20px;

  &:last-child {
    margin-bottom: 0;
  }
}

.items-empty {
  padding: 18px 12px;
  text-align: center;
  font-size: 13px;
  color: #5c6475;
}

.item-section-header {
  font-size: 10px;
  font-weight: 700;
  color: #9ca3af;
  letter-spacing: 1px;
  margin: 0 0 10px;
}

.items-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.item-row-item {
  display: flex;
  align-items: center;
  height: 36px;
  gap: 12px;
}

.item-icon-img {
  width: 36px;
  height: 28px;
  object-fit: cover;
  border-radius: 2px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: #161c28;
}

.item-name-text {
  font-size: 12px;
  color: #ffffff;
}

.empty-text {
  font-size: 12px;
  color: #6b7280;
  text-align: center;
  padding: 8px 0;
}

// Roles & Lanes Card
.roles-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}

.role-badge {
  padding: 5px 12px;
  border-radius: 20px;
  background: rgba(229, 181, 59, 0.1);
  border: 1px solid rgba(229, 181, 59, 0.2);
  color: #e5b53b;
  font-size: 11px;
  font-weight: 600;
}

.lane-suggestion-box {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: 6px;
  padding: 10px 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
}

.lane-label {
  font-size: 12px;
  color: #9ca3af;
}

.lane-value {
  font-size: 12px;
  font-weight: 700;
  color: #00f0ff;
}

.playstyle-note {
  font-size: 12px;
  color: #9ca3af;
  line-height: 1.6;
  margin: 0;

  strong {
    color: #ffffff;
  }
}

// ── Footer ──
.detail-footer {
  background: #0d111b;
  border-top: 1px solid rgba(255, 255, 255, 0.04);
  height: 100px;
  padding: 24px 80px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;

  @media (max-width: 768px) {
    padding: 24px;
    flex-direction: column;
    height: auto;
    gap: 16px;
    text-align: center;
  }
}

.footer-left {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.footer-logo {
  font-size: 14px;
  font-weight: 700;
  color: #e5b53b;
}

.footer-dev {
  font-size: 11px;
  color: #9ca3af;
}

.footer-copy {
  font-size: 11px;
  color: #6b7280;
}

.back-btn {
  padding: 10px 20px;
  background: #111622;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  color: #ffffff;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.15s;
  &:hover { background: #161c28; }
}
</style>
