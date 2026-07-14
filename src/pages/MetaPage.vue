<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useHead } from '@vueuse/head'
import { useRouter } from 'vue-router'
import { Swords, TrendingUp, LayoutList } from '@lucide/vue'
import { useDraftsMainStore } from '../stores/draftsMain'

const { t } = useI18n()
const store = useDraftsMainStore()
const router = useRouter()

function goToHero(heroId: number) {
  router.push({ name: 'hero-detail', params: { id: heroId } })
}

useHead(computed(() => ({
  title: t('seo.meta.title'),
  meta: [
    { name: 'description', content: t('seo.meta.description') }
  ]
})))

onMounted(() => {
  if (store.heroes.length === 0) {
    store.fetchHeroes()
  }
})

// Helper: mock 7D trend based on heroId
function getTrend(heroId: number): number {
  return parseFloat(((heroId * 3.1) % 5 - 2.5).toFixed(1))
}

// Top climbers (highest positive trend, good win rate)
const topClimbers = computed(() => {
  return store.heroes
    .map(h => ({
      hero: h,
      winRate: store.heroWinRates.get(h.id) ?? 50,
      trend: getTrend(h.id),
    }))
    .filter(h => h.trend > 0)
    .sort((a, b) => b.trend - a.trend)
    .slice(0, 5)
})

// Tier List based on win rates
const tieredHeroes = computed(() => {
  const all = store.heroes.map(h => ({
    hero: h,
    winRate: store.heroWinRates.get(h.id) ?? 50,
  }))

  return {
    S: all.filter(h => h.winRate >= 53).sort((a, b) => b.winRate - a.winRate),
    A: all.filter(h => h.winRate >= 51.5 && h.winRate < 53).sort((a, b) => b.winRate - a.winRate),
    B: all.filter(h => h.winRate >= 49.5 && h.winRate < 51.5).sort((a, b) => b.winRate - a.winRate),
    C: all.filter(h => h.winRate < 49.5).sort((a, b) => a.winRate - b.winRate),
  }
})

// Critical counters from store's static data
const CRITICAL_COUNTERS = [
  { attacker: 'Slardar', victim: 'Anti-Mage', advantage: '+4.2%', desc: 'Corrosive Haze reveals Blink Dagger; high burst combo.' },
  { attacker: 'Axe', victim: 'Anti-Mage', advantage: '+3.8%', desc: 'Culling Blade threshold synergy; Blink counter-gap-close.' },
  { attacker: 'Crystal Maiden', victim: 'Storm Spirit', advantage: '+3.5%', desc: 'Frostbite shuts down Ball Lightning mobility.' },
  { attacker: 'Lion', victim: 'Juggernaut', advantage: '+3.1%', desc: 'Hex + Impale interrupts Omnislash safely.' },
]
</script>

<template lang="pug">
.page-container
  header.meta-header
    span.subtitle-tag META TRENDS & COUNTERS
    h1.title CURRENT META ANALYSIS
    p.description {{ t('seo.meta.description') }}

  .meta-grid
    // Column 1 — Critical Counters + Top Climbers
    .meta-col
      .meta-card
        .card-header
          .card-icon.icon-counter
            Swords(:size="16" :stroke-width="2.5")
          h2.card-title CRITICAL MATCHUP COUNTERS

        .counter-list
          .counter-item(v-for="c in CRITICAL_COUNTERS" :key="c.attacker + c.victim")
            .counter-badge counters
            .counter-pair
              span.counter-name {{ c.attacker }}
              svg(width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5")
                polyline(points="9 18 15 12 9 6")
              span.counter-victim {{ c.victim }}
            .counter-bottom
              span.advantage {{ c.advantage }} Advantage
              span.counter-desc {{ c.desc }}

      .meta-card
        .card-header
          .card-icon.icon-climbers
            TrendingUp(:size="16" :stroke-width="2.5")
          h2.card-title HIGHEST META CLIMBERS

        .loader-wrap(v-if="store.isLoading")
          .spinner
        .climbers-list(v-else)
          .climber-item(
            v-for="item in topClimbers"
            :key="item.hero.id"
            @click="goToHero(item.hero.id)"
            style="cursor:pointer"
          )
            img.climber-portrait(:src="item.hero.imageUrl" :alt="item.hero.localizedName")
            .climber-info
              span.climber-name {{ item.hero.localizedName }}
              span.climber-wr Win Rate: {{ item.winRate.toFixed(1) }}%
            .climber-trend.positive +{{ item.trend }}% (7D)

    // Column 2 — Tier List
    .meta-col
      .meta-card.tier-card
        .card-header
          .card-icon.icon-tier
            LayoutList(:size="16" :stroke-width="2.5")
          h2.card-title CURRENT META TIER LIST
          p.card-sub Tier rankings based on 100k+ matches. Updated daily.

        .loader-wrap(v-if="store.isLoading")
          .spinner
        .tier-list(v-else)
          .tier-row(v-for="tier in ['S', 'A', 'B', 'C']" :key="tier" :class="`tier-row-${tier.toLowerCase()}`")
            .tier-label(:class="`tier-${tier.toLowerCase()}`") {{ tier }}
            .tier-heroes
              .tier-hero-chip(
                v-for="item in tieredHeroes[tier]"
                :key="item.hero.id"
                @click="goToHero(item.hero.id)"
              )
                img.tier-hero-img(:src="item.hero.imageUrl" :alt="item.hero.localizedName")
                span.tier-hero-name {{ item.hero.localizedName }}
</template>

<style lang="scss" scoped>
.page-container {
  padding: 40px 24px;
  color: var(--dd-text);
  max-width: 1200px;
  margin: 0 auto;
  min-height: 100vh;
}

.meta-header {
  margin-bottom: 32px;
  text-align: center;

  .subtitle-tag {
    font-family: 'Outfit', sans-serif;
    font-size: 11px;
    font-weight: 700;
    color: var(--dd-gold);
    letter-spacing: 2px;
    text-transform: uppercase;
  }

  .title {
    margin: 8px 0 12px;
    font-family: 'Outfit', sans-serif;
    font-size: 36px;
    font-weight: 800;
    color: #ffffff;
    letter-spacing: -0.5px;
    background: linear-gradient(135deg, #fff 0%, #a5b4fc 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .description {
    font-size: 15px;
    color: var(--dd-text-dim);
    max-width: 600px;
    margin: 0 auto;
  }
}

.meta-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;

  @media (min-width: 960px) {
    grid-template-columns: 1fr 1fr;
  }
}

.meta-col {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.meta-card {
  background: var(--dd-bg-card);
  border: 1px solid var(--dd-border);
  border-radius: var(--dd-radius);
  padding: 24px;

  &.tier-card {
    flex: 1;
  }
}

.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;

  .card-sub {
    width: 100%;
    font-size: 12px;
    color: var(--dd-text-muted);
    margin: 0;
  }
}

.card-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  &.icon-counter { background: rgba(239, 68, 68, 0.15); color: #ef4444; }
  &.icon-climbers { background: rgba(16, 185, 129, 0.15); color: #10b981; }
  &.icon-tier { background: rgba(229, 181, 59, 0.15); color: var(--dd-gold); }
}

.card-title {
  margin: 0;
  font-family: 'Outfit', sans-serif;
  font-size: 14px;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: 0.05em;
}

// — Counters
.counter-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.counter-item {
  padding: 14px;
  background: var(--dd-bg-elevated);
  border: 1px solid var(--dd-border-subtle);
  border-radius: var(--dd-radius-sm);
  display: flex;
  flex-direction: column;
  gap: 8px;
  transition: border-color 0.15s;

  &:hover {
    border-color: rgba(239, 68, 68, 0.3);
  }
}

.counter-badge {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
  padding: 3px 8px;
  border-radius: 20px;
  width: fit-content;
}

.counter-pair {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #fff;
  font-weight: 700;
  font-size: 14px;
}

.counter-victim {
  color: var(--dd-text-dim);
}

.counter-bottom {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
}

.advantage {
  color: #ef4444;
  font-weight: 700;
}

.counter-desc {
  color: var(--dd-text-muted);
}

// — Climbers
.loader-wrap {
  display: flex;
  justify-content: center;
  padding: 32px 0;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(229, 181, 59, 0.1);
  border-top-color: var(--dd-gold);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.climbers-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.climber-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  background: var(--dd-bg-elevated);
  border: 1px solid var(--dd-border-subtle);
  border-radius: var(--dd-radius-sm);
  transition: border-color 0.15s;

  &:hover {
    border-color: rgba(16, 185, 129, 0.3);
  }
}

.climber-portrait {
  width: 48px;
  height: 34px;
  object-fit: cover;
  border-radius: 4px;
}

.climber-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.climber-name {
  font-weight: 700;
  font-size: 14px;
  color: #fff;
}

.climber-wr {
  font-size: 12px;
  color: var(--dd-text-dim);
}

.climber-trend {
  font-weight: 700;
  font-size: 14px;

  &.positive {
    color: #10b981;
  }
}

// — Tier List
.tier-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.tier-row {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 12px;
  border-radius: var(--dd-radius-sm);

  &:hover {
    background: rgba(255, 255, 255, 0.02);
  }

  &.tier-row-s { border-left: 3px solid #ef4444; }
  &.tier-row-a { border-left: 3px solid #f59e0b; }
  &.tier-row-b { border-left: 3px solid #3b82f6; }
  &.tier-row-c { border-left: 3px solid #6b7280; }
}

.tier-label {
  font-family: 'Outfit', sans-serif;
  font-size: 20px;
  font-weight: 900;
  width: 24px;
  text-align: center;
  flex-shrink: 0;
  line-height: 1;
  margin-top: 4px;

  &.tier-s { color: #ef4444; }
  &.tier-a { color: #f59e0b; }
  &.tier-b { color: #3b82f6; }
  &.tier-c { color: #6b7280; }
}

.tier-heroes {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tier-hero-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px 4px 4px;
  background: var(--dd-bg-elevated);
  border: 1px solid var(--dd-border-subtle);
  border-radius: 20px;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;

  &:hover {
    border-color: rgba(229, 181, 59, 0.4);
    background: rgba(229, 181, 59, 0.04);
  }
}

.tier-hero-img {
  width: 24px;
  height: 18px;
  object-fit: cover;
  border-radius: 10px;
}

.tier-hero-name {
  font-size: 12px;
  font-weight: 600;
  color: var(--dd-text);
}
</style>
