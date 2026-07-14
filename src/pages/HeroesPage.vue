<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useHead } from '@vueuse/head'
import { useRouter } from 'vue-router'
import { useDraftsMainStore } from '../stores/draftsMain'
import type { Hero } from '../types/draft'

const { t } = useI18n()
const store = useDraftsMainStore()
const router = useRouter()

function goToHero(heroId: number) {
  router.push({ name: 'hero-detail', params: { id: heroId } })
}

useHead(computed(() => ({
  title: t('seo.heroes.title'),
  meta: [
    { name: 'description', content: t('seo.heroes.description') }
  ]
})))

// Filters & Sort State
const searchQuery = ref('')
const selectedAttr = ref<'all_attrs' | 'str' | 'agi' | 'int' | 'all'>('all_attrs')
const sortBy = ref<'winRate' | 'pickRate' | 'localizedName'>('winRate')
const sortDesc = ref(true)

// Helper stats generators (consistent mock data based on ID)
function getPickRate(heroId: number): number {
  return parseFloat(((heroId * 7.3) % 15 + 3).toFixed(1))
}

function getTrend7D(heroId: number): number {
  return parseFloat(((heroId * 3.1) % 5 - 2.5).toFixed(1))
}

function getMetaTier(winRate: number): 'S' | 'A' | 'B' | 'C' {
  if (winRate >= 53) return 'S'
  if (winRate >= 51.5) return 'A'
  if (winRate >= 49.5) return 'B'
  return 'C'
}

// Ensure store is populated
onMounted(() => {
  if (store.heroes.length === 0) {
    store.fetchHeroes()
  }
})

// Computed table data
const tableData = computed(() => {
  return store.heroes.map(hero => {
    const wr = store.heroWinRates.get(hero.id) ?? 50
    return {
      hero,
      winRate: wr,
      pickRate: getPickRate(hero.id),
      trend: getTrend7D(hero.id),
      tier: getMetaTier(wr)
    }
  })
})

// Filtered and Sorted list
const filteredHeroes = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  return tableData.value.filter(item => {
    const nameMatch = item.hero.localizedName.toLowerCase().includes(query) ||
                      item.hero.name.toLowerCase().includes(query)
    const attrMatch = selectedAttr.value === 'all_attrs' || item.hero.primaryAttr === selectedAttr.value
    return nameMatch && attrMatch
  })
})

const sortedHeroes = computed(() => {
  const list = [...filteredHeroes.value]
  const field = sortBy.value
  const desc = sortDesc.value

  list.sort((a, b) => {
    let valA: any
    let valB: any

    if (field === 'localizedName') {
      valA = a.hero.localizedName
      valB = b.hero.localizedName
    } else {
      valA = a[field]
      valB = b[field]
    }

    if (valA < valB) return desc ? 1 : -1
    if (valA > valB) return desc ? -1 : 1
    return 0
  })

  return list
})

function toggleSort(field: 'winRate' | 'pickRate' | 'localizedName') {
  if (sortBy.value === field) {
    sortDesc.value = !sortDesc.value
  } else {
    sortBy.value = field
    sortDesc.value = true
  }
}

function getAttrIconClass(attr: string) {
  if (attr === 'str') return 'attr-str'
  if (attr === 'agi') return 'attr-agi'
  if (attr === 'int') return 'attr-int'
  return 'attr-univ'
}
</script>

<template lang="pug">
.page-container
  header.heroes-header
    span.subtitle-tag HERO DATABASE & STATISTICS
    h1.title EXPLORE HERO STATS
    p.description {{ t('seo.heroes.description') }}

  .toolbar
    .search-wrap
      svg.search-icon(width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2")
        circle(cx="11" cy="11" r="8")
        line(x1="21" y1="21" x2="16.65" y2="16.65")
      input.search-input(
        v-model="searchQuery"
        type="text"
        placeholder="Search heroes..."
      )

    .filters
      button.filter-btn(
        :class="{ active: selectedAttr === 'all_attrs' }"
        @click="selectedAttr = 'all_attrs'"
      ) All Attributes
      button.filter-btn(
        :class="{ active: selectedAttr === 'str' }"
        @click="selectedAttr = 'str'"
      )
        span.dot.str
        span Strength
      button.filter-btn(
        :class="{ active: selectedAttr === 'agi' }"
        @click="selectedAttr = 'agi'"
      )
        span.dot.agi
        span Agility
      button.filter-btn(
        :class="{ active: selectedAttr === 'int' }"
        @click="selectedAttr = 'int'"
      )
        span.dot.int
        span Intelligence
      button.filter-btn(
        :class="{ active: selectedAttr === 'all' }"
        @click="selectedAttr = 'all'"
      )
        span.dot.univ
        span Universal

  .stats-container
    .loader(v-if="store.isLoading")
      .spinner
      p Loading Hero Data...
    
    .empty-state(v-else-if="sortedHeroes.length === 0")
      p No heroes found matching your filters.

    .table-responsive(v-else)
      table.stats-table
        thead
          tr
            th.sortable(@click="toggleSort('localizedName')")
              .th-content
                span HERO NAME
                span.sort-indicator(v-if="sortBy === 'localizedName'") {{ sortDesc ? '↓' : '↑' }}
            th.sortable(@click="toggleSort('winRate')")
              .th-content
                span WIN RATE
                span.sort-indicator(v-if="sortBy === 'winRate'") {{ sortDesc ? '↓' : '↑' }}
            th.sortable(@click="toggleSort('pickRate')")
              .th-content
                span PICK RATE
                span.sort-indicator(v-if="sortBy === 'pickRate'") {{ sortDesc ? '↓' : '↑' }}
            th META TIER
            th 7D TREND
        tbody
          tr.hero-row(
            v-for="item in sortedHeroes"
            :key="item.hero.id"
            @click="goToHero(item.hero.id)"
          )
            td.hero-col
              .hero-info
                img.hero-portrait(:src="item.hero.imageUrl" :alt="item.hero.localizedName")
                span.hero-name {{ item.hero.localizedName }}
                span.attr-badge(:class="getAttrIconClass(item.hero.primaryAttr)")
            td.win-rate(:class="{ high: item.winRate >= 52, low: item.winRate < 48 }") {{ item.winRate.toFixed(1) }}%
            td {{ item.pickRate }}%
            td
              span.tier-badge(:class="`tier-${item.tier.toLowerCase()}`") Tier {{ item.tier }}
            td.trend-col(:class="{ positive: item.trend > 0, negative: item.trend < 0 }")
              span {{ item.trend > 0 ? '+' : '' }}{{ item.trend }}%
              svg.detail-arrow(width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2")
                polyline(points="9 18 15 12 9 6")
</template>

<style lang="scss" scoped>
.page-container {
  padding: 40px 24px;
  color: var(--dd-text);
  max-width: 1200px;
  margin: 0 auto;
  min-height: 100vh;
}

.heroes-header {
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

.toolbar {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;

  @media (min-width: 768px) {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
}

.search-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--dd-bg-elevated);
  border: 1px solid var(--dd-border-subtle);
  border-radius: var(--dd-radius);
  padding: 0 16px;
  height: 46px;
  width: 100%;
  max-width: 320px;
  transition: border-color 0.15s;

  &:focus-within {
    border-color: rgba(229, 181, 59, 0.4);
  }
}

.search-icon {
  color: var(--dd-text-muted);
}

.search-input {
  background: transparent;
  border: none;
  outline: none;
  color: #fff;
  font-family: var(--dd-font);
  font-size: 14px;
  width: 100%;

  &::placeholder {
    color: var(--dd-text-muted);
  }
}

.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.filter-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: var(--dd-bg-card);
  border: 1px solid var(--dd-border-subtle);
  border-radius: var(--dd-radius-sm);
  color: var(--dd-text-dim);
  font-family: var(--dd-font);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    color: #fff;
    border-color: var(--dd-border);
    background: var(--dd-bg-elevated);
  }

  &.active {
    color: #000;
    background: var(--dd-gold);
    border-color: var(--dd-gold);

    .dot.str { background: #000; }
    .dot.agi { background: #000; }
    .dot.int { background: #000; }
    .dot.univ { background: #000; }
  }
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;

  &.str { background: #f43f5e; }
  &.agi { background: #10b981; }
  &.int { background: #06b6d4; }
  &.univ { background: #a855f7; }
}

.stats-container {
  background: var(--dd-bg-card);
  border: 1px solid var(--dd-border);
  border-radius: var(--dd-radius);
  overflow: hidden;
}

.loader, .empty-state {
  padding: 64px 20px;
  text-align: center;
  color: var(--dd-text-dim);
}

.spinner {
  width: 36px;
  height: 36px;
  border: 3px solid rgba(229, 181, 59, 0.1);
  border-top-color: var(--dd-gold);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.table-responsive {
  width: 100%;
  overflow-x: auto;
}

.stats-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 14px;

  th, td {
    padding: 16px 24px;
    border-bottom: 1px solid var(--dd-border-subtle);
  }

  th {
    background: rgba(255, 255, 255, 0.01);
    color: var(--dd-text-muted);
    font-weight: 700;
    font-size: 11px;
    letter-spacing: 0.05em;
    user-select: none;

    &.sortable {
      cursor: pointer;
      &:hover {
        color: #fff;
        background: rgba(255, 255, 255, 0.02);
      }
    }
  }

  tbody tr {
    transition: background 0.15s;
    cursor: pointer;

    &:hover {
      background: rgba(229, 181, 59, 0.04);
      .detail-arrow { opacity: 1; color: var(--dd-gold); }
    }
  }
}

.th-content {
  display: flex;
  align-items: center;
  gap: 6px;
}

.sort-indicator {
  color: var(--dd-gold);
}

.hero-col {
  min-width: 200px;
}

.hero-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.hero-portrait {
  width: 44px;
  height: 32px;
  object-fit: cover;
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.hero-name {
  font-weight: 600;
  color: #ffffff;
}

.attr-badge {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  margin-left: 4px;

  &.attr-str { background: #f43f5e; }
  &.attr-agi { background: #10b981; }
  &.attr-int { background: #06b6d4; }
  &.attr-univ { background: #a855f7; }
}

.win-rate {
  font-weight: 700;

  &.high {
    color: #10b981;
  }

  &.low {
    color: #f43f5e;
  }
}

.tier-badge {
  font-size: 11px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 12px;
  text-transform: uppercase;

  &.tier-s {
    color: #ef4444;
    background: rgba(239, 68, 68, 0.12);
  }
  &.tier-a {
    color: #f59e0b;
    background: rgba(245, 158, 11, 0.12);
  }
  &.tier-b {
    color: #3b82f6;
    background: rgba(59, 130, 246, 0.12);
  }
  &.tier-c {
    color: #9ca3af;
    background: rgba(156, 163, 175, 0.12);
  }
}

.trend-col {
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 10px;

  &.positive { color: #10b981; }
  &.negative { color: #f43f5e; }
}

.detail-arrow {
  opacity: 0;
  color: var(--dd-text-muted);
  transition: opacity 0.15s, color 0.15s;
  flex-shrink: 0;
}
</style>
