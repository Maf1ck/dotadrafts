<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useHead } from '@vueuse/head'
import { useDraftsMainStore } from '../stores/draftsMain'
import HeroBuildView from '../components/Sandbox/HeroBuildView.vue'
import type { Hero } from '../types/draft'

const { t } = useI18n()
const store = useDraftsMainStore()

useHead(computed(() => ({
  title: t('seo.sandbox.title'),
  meta: [{ name: 'description', content: t('seo.sandbox.description') }],
})))

const selectedHeroId = ref<number | null>(null)
const draftedHeroes = computed(() => [...store.radiantHeroes, ...store.direHeroes])

watch(draftedHeroes, (heroes) => {
  if (!heroes.length) { selectedHeroId.value = null; return }
  if (!selectedHeroId.value || !heroes.some(h => h.id === selectedHeroId.value)) {
    selectedHeroId.value = heroes[0]!.id
  }
}, { immediate: true })

watch(selectedHeroId, (id) => {
  if (!id) return
  store.ensureHeroBuild(id)
  store.fetchHeroItemsData(id)
  store.fetchHeroBenchmarksData(id)
  store.fetchHeroDetailData(id)
})

onMounted(() => {
  store.ensureItemConstants()
  store.fetchHeroes()
})

const selectedHero = computed(() =>
  draftedHeroes.value.find(h => h.id === selectedHeroId.value) ?? null
)

const allies = computed((): Hero[] => {
  if (!selectedHero.value) return []
  const onRadiant = store.radiantHeroes.some(h => h.id === selectedHero.value!.id)
  const team = onRadiant ? store.radiantHeroes : store.direHeroes
  return team.filter(h => h.id !== selectedHero.value!.id)
})

const enemies = computed((): Hero[] => {
  if (!selectedHero.value) return []
  const onRadiant = store.radiantHeroes.some(h => h.id === selectedHero.value!.id)
  return onRadiant ? store.direHeroes : store.radiantHeroes
})

function sideLabel(hero: Hero) {
  return store.radiantHeroes.some(h => h.id === hero.id) ? 'R' : 'D'
}

function isRadiant(hero: Hero) {
  return store.radiantHeroes.some(h => h.id === hero.id)
}
</script>

<template>
<div class="sandbox-page">
  <!-- Header -->
  <div class="sb-header">
    <h1 class="sb-title">Build Explorer</h1>
    <p class="sb-hint">Click a hero to see their recommended build, matchup data and impact metrics</p>
  </div>

  <div class="sb-body">
    <!-- Left: Team picks -->
    <div class="sb-teams">
      <!-- Radiant -->
      <div class="team-block" v-if="store.radiantHeroes.length">
        <div class="team-label radiant">▲ RADIANT</div>
        <div
          class="hero-pick-row"
          v-for="hero in store.radiantHeroes"
          :key="hero.id"
          :class="{ active: selectedHeroId === hero.id }"
          @click="selectedHeroId = hero.id"
        >
          <img :src="hero.imageUrl" :alt="hero.localizedName" class="pick-portrait" />
          <div class="pick-info">
            <div class="pick-name">{{ hero.localizedName }}</div>
            <div class="pick-roles">{{ hero.roles.slice(0,2).join(' · ') }}</div>
          </div>
          <div class="pick-side radiant">R</div>
        </div>
      </div>

      <!-- Dire -->
      <div class="team-block" v-if="store.direHeroes.length">
        <div class="team-label dire">▼ DIRE</div>
        <div
          class="hero-pick-row"
          v-for="hero in store.direHeroes"
          :key="hero.id"
          :class="{ active: selectedHeroId === hero.id }"
          @click="selectedHeroId = hero.id"
        >
          <img :src="hero.imageUrl" :alt="hero.localizedName" class="pick-portrait" />
          <div class="pick-info">
            <div class="pick-name">{{ hero.localizedName }}</div>
            <div class="pick-roles">{{ hero.roles.slice(0,2).join(' · ') }}</div>
          </div>
          <div class="pick-side dire">D</div>
        </div>
      </div>

      <!-- Empty state -->
      <div v-if="!draftedHeroes.length" class="empty-teams">
        <div class="empty-icon">⚔️</div>
        <p>Go to the main page and draft some heroes to analyze their builds here.</p>
      </div>
    </div>

    <!-- Main: Hero Build View -->
    <div class="sb-main">
      <HeroBuildView
        v-if="selectedHero"
        :hero="selectedHero"
        :allies="allies"
        :enemies="enemies"
      />
      <div v-else class="no-hero">
        <div class="no-hero-icon">🗡️</div>
        <p>Select a hero to view their build</p>
      </div>
    </div>
  </div>
</div>
</template>

<style lang="scss" scoped>
.sandbox-page {
  display: flex;
  flex-direction: column;
  min-height: 0;
  flex: 1;
  padding: 20px;
  gap: 16px;
  background: var(--dd-bg);
}

.sb-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.sb-title {
  margin: 0;
  font-size: 20px;
  font-weight: 800;
  color: var(--dd-text);
}
.sb-hint {
  margin: 0;
  font-size: 13px;
  color: var(--dd-text-dim);
}

.sb-body {
  display: grid;
  grid-template-columns: 240px 1fr;
  gap: 16px;
  flex: 1;
  min-height: 0;
  align-items: start;
}

.sb-teams {
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: sticky;
  top: 16px;
}

.team-block {
  background: var(--dd-bg-card);
  border: 1px solid var(--dd-border);
  border-radius: 10px;
  overflow: hidden;
}

.team-label {
  padding: 8px 12px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.08em;
  &.radiant { color: var(--dd-radiant); background: rgba(82,196,26,0.08); }
  &.dire { color: var(--dd-dire); background: rgba(239,68,68,0.08); }
}

.hero-pick-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  cursor: pointer;
  border-top: 1px solid var(--dd-border-subtle);
  transition: background 0.15s;

  &:hover { background: var(--dd-bg-elevated); }
  &.active { background: rgba(234,179,8,0.08); border-left: 2px solid var(--dd-gold); }
}

.pick-portrait {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid rgba(255,255,255,0.1);
  flex-shrink: 0;
}

.pick-info {
  flex: 1;
  min-width: 0;
}
.pick-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--dd-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.pick-roles {
  font-size: 10px;
  color: var(--dd-text-dim);
}

.pick-side {
  font-size: 10px;
  font-weight: 800;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  &.radiant { background: rgba(82,196,26,0.2); color: var(--dd-radiant); }
  &.dire { background: rgba(239,68,68,0.2); color: var(--dd-dire); }
}

.empty-teams {
  background: var(--dd-bg-card);
  border: 1px solid var(--dd-border);
  border-radius: 10px;
  padding: 24px 16px;
  text-align: center;
  color: var(--dd-text-dim);
  font-size: 13px;
  line-height: 1.5;
}
.empty-icon { font-size: 28px; margin-bottom: 8px; }

.sb-main {
  min-width: 0;
}

.no-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  color: var(--dd-text-dim);
  font-size: 14px;
  gap: 12px;
}
.no-hero-icon { font-size: 40px; }
</style>
