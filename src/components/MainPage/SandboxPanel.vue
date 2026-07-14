<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Sword, Sparkles, ListOrdered, Lock } from '@lucide/vue'
import { useDraftsMainStore } from '../../stores/draftsMain'
import type { Hero } from '../../types/draft'

const { t } = useI18n()
const store = useDraftsMainStore()

type SandboxTab = 'items' | 'talents' | 'skills'

const activeTab = ref<SandboxTab>('items')
const selectedHeroId = ref<number | null>(null)
const equippedItemIds = ref<Set<number>>(new Set())
const talentPicks = ref<Record<number, 'left' | 'right'>>({})
const skillOrder = ref<string[]>([])

const draftedHeroes = computed(() => {
  const all: Hero[] = []
  for (const slot of store.radiant.slots) {
    if (slot.hero) all.push(slot.hero)
  }
  for (const slot of store.dire.slots) {
    if (slot.hero) all.push(slot.hero)
  }
  return all
})

const selectedHero = computed(
  () => draftedHeroes.value.find((h) => h.id === selectedHeroId.value) ?? null,
)

watch(
  draftedHeroes,
  (heroes) => {
    if (!heroes.length) {
      selectedHeroId.value = null
      return
    }
    if (!selectedHeroId.value || !heroes.some((h) => h.id === selectedHeroId.value)) {
      selectedHeroId.value = heroes[0]!.id
    }
  },
  { immediate: true },
)

watch(selectedHeroId, (id) => {
  equippedItemIds.value = new Set()
  talentPicks.value = {}
  skillOrder.value = []
  if (id) void store.fetchHeroItemsData(id)
})

const itemBuild = computed(() => {
  if (!selectedHeroId.value) return { starting: [], early: [], core: [], luxury: [] }
  return store.getResolvedItemsForHero(selectedHeroId.value)
})

const allSuggestedItems = computed(() => {
  const b = itemBuild.value
  const seen = new Set<number>()
  const list: { id: number; name: string; imageUrl: string; phase: string }[] = []
  const push = (items: { id: number; name: string; imageUrl: string }[], phase: string) => {
    for (const i of items) {
      if (seen.has(i.id)) continue
      seen.add(i.id)
      list.push({ ...i, phase })
    }
  }
  push(b.starting, 'start')
  push(b.early, 'early')
  push(b.core, 'core')
  push(b.luxury, 'late')
  return list
})

const impactDelta = computed(() => {
  const n = equippedItemIds.value.size
  if (!n) return 0
  // Simple sandbox impact model: each equipped meta item nudges win chance
  const base = n * 0.45
  const coreBonus = allSuggestedItems.value
    .filter((i) => equippedItemIds.value.has(i.id) && i.phase === 'core')
    .length * 0.35
  return Math.min(4.5, +(base + coreBonus).toFixed(1))
})

function toggleItem(id: number) {
  const next = new Set(equippedItemIds.value)
  if (next.has(id)) next.delete(id)
  else {
    if (next.size >= 6) return
    next.add(id)
  }
  equippedItemIds.value = next
}

const talentLevels = [10, 15, 20, 25] as const

function talentOptions(level: number) {
  const hero = selectedHero.value
  const name = hero?.localizedName ?? 'Hero'
  const role = hero?.roles[0] ?? 'Flex'
  const presets: Record<number, [string, string]> = {
    10: [`+20 ${role} damage`, `+175 HP`],
    15: [`Improved ${name} spell`, `+12% evasion`],
    20: [`+1 ability level`, `+25 movement speed`],
    25: [`Ultimate upgrade`, `+30% status resistance`],
  }
  return presets[level] ?? ['Option A', 'Option B']
}

function pickTalent(level: number, side: 'left' | 'right') {
  talentPicks.value = { ...talentPicks.value, [level]: side }
}

const skillButtons = computed(() => {
  const name = selectedHero.value?.localizedName?.[0] ?? 'H'
  return [
    { key: 'Q', label: 'Q', hint: `${name} Q` },
    { key: 'W', label: 'W', hint: `${name} W` },
    { key: 'E', label: 'E', hint: `${name} E` },
    { key: 'R', label: 'R', hint: 'Ult' },
    { key: 'S', label: 'Stat', hint: '+2 all' },
  ]
})

function addSkill(key: string) {
  if (skillOrder.value.length >= 18) return
  if (key === 'R') {
    const ultLevels = skillOrder.value.filter((k) => k === 'R').length
    if (ultLevels >= 3) return
  }
  skillOrder.value = [...skillOrder.value, key]
}

function clearSkills() {
  skillOrder.value = []
}

const tabs = computed(() => [
  { key: 'items' as const, label: t('sandbox.items'), icon: Sword },
  { key: 'talents' as const, label: t('sandbox.talents'), icon: Sparkles },
  { key: 'skills' as const, label: t('sandbox.skills'), icon: ListOrdered },
])
</script>

<template lang="pug">
.sandbox-panel
  .sandbox-header
    span.sandbox-tag {{ t('sandbox.tag') }}
    span.sandbox-title {{ t('sandbox.title') }}
    p.sandbox-desc {{ t('sandbox.descActive') }}

  .empty-state(v-if="!draftedHeroes.length")
    Lock(:size="18" :stroke-width="2")
    p {{ t('sandbox.needPicks') }}

  template(v-else)
    .hero-picker-row
      button.hero-chip(
        v-for="h in draftedHeroes"
        :key="h.id"
        type="button"
        :class="{ active: selectedHeroId === h.id }"
        @click="selectedHeroId = h.id"
      )
        img(:src="h.imageUrl" :alt="h.localizedName")
        span {{ h.localizedName }}

    .tab-bar
      button.tab-btn(
        v-for="tab in tabs"
        :key="tab.key"
        type="button"
        :class="{ active: activeTab === tab.key }"
        @click="activeTab = tab.key"
      )
        component(:is="tab.icon" :size="13" :stroke-width="2.2")
        span {{ tab.label }}

    //- Items
    .tab-body(v-if="activeTab === 'items'")
      .impact-row(v-if="selectedHero")
        span.impact-label {{ t('sandbox.impact') }}
        span.impact-val(:class="{ up: impactDelta > 0 }")
          | {{ impactDelta > 0 ? '+' : '' }}{{ impactDelta.toFixed(1) }}%

      .loading(v-if="selectedHeroId && store.itemsDataLoading[selectedHeroId] && !allSuggestedItems.length")
        | {{ t('sandbox.loadingItems') }}

      .items-grid(v-else-if="allSuggestedItems.length")
        button.item-tile(
          v-for="item in allSuggestedItems"
          :key="item.id"
          type="button"
          :class="{ equipped: equippedItemIds.has(item.id) }"
          :title="item.name"
          @click="toggleItem(item.id)"
        )
          img(:src="item.imageUrl" :alt="item.name")
          span.phase {{ item.phase }}
          span.name {{ item.name }}

      .hint(v-else) {{ t('sandbox.noItems') }}
      p.hint-soft {{ t('sandbox.itemsHint') }}

    //- Talents
    .tab-body(v-else-if="activeTab === 'talents'")
      .talent-row(v-for="level in talentLevels" :key="level")
        span.talent-lvl {{ level }}
        button.talent-opt(
          type="button"
          :class="{ selected: talentPicks[level] === 'left' }"
          @click="pickTalent(level, 'left')"
        ) {{ talentOptions(level)[0] }}
        button.talent-opt(
          type="button"
          :class="{ selected: talentPicks[level] === 'right' }"
          @click="pickTalent(level, 'right')"
        ) {{ talentOptions(level)[1] }}
      p.hint-soft {{ t('sandbox.talentsHint') }}

    //- Skills
    .tab-body(v-else)
      .skill-btns
        button.skill-btn(
          v-for="s in skillButtons"
          :key="s.key"
          type="button"
          :title="s.hint"
          @click="addSkill(s.key)"
        ) {{ s.label }}
        button.skill-clear(type="button" @click="clearSkills") {{ t('sandbox.clear') }}
      .skill-order(v-if="skillOrder.length")
        span.skill-chip(v-for="(s, i) in skillOrder" :key="i + s") {{ s }}
      p.hint-soft {{ t('sandbox.skillsHint') }}
</template>

<style lang="scss" scoped>
.sandbox-panel {
  background: var(--dd-bg-card);
  border: 1px solid var(--dd-border);
  border-radius: var(--dd-radius);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.sandbox-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.sandbox-tag {
  font-size: 9px;
  font-weight: 700;
  color: var(--dd-gold, #e5b53b);
  letter-spacing: 1px;
  text-transform: uppercase;
}

.sandbox-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--dd-text, #f3f4f6);
}

.sandbox-desc {
  margin: 0;
  font-size: 11px;
  color: var(--dd-text-dim, #9ca3af);
  line-height: 1.45;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 20px 12px;
  text-align: center;
  color: var(--dd-text-dim, #5c6475);
  border: 1px dashed var(--dd-border);
  border-radius: var(--dd-radius-sm);

  p {
    margin: 0;
    font-size: 12px;
    line-height: 1.4;
  }
}

.hero-picker-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.hero-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px 4px 4px;
  border-radius: 6px;
  border: 1px solid var(--dd-border-subtle);
  background: var(--dd-bg-elevated);
  color: var(--dd-text-muted);
  cursor: pointer;
  font-size: 11px;
  font-family: inherit;

  img {
    width: 28px;
    height: 20px;
    border-radius: 3px;
    object-fit: cover;
  }

  &.active {
    border-color: rgba(229, 181, 59, 0.45);
    color: var(--dd-text);
    background: rgba(229, 181, 59, 0.08);
  }
}

.tab-bar {
  display: flex;
  gap: 4px;
  padding: 3px;
  background: var(--dd-bg-elevated);
  border-radius: var(--dd-radius-sm);
  border: 1px solid var(--dd-border-subtle);
}

.tab-btn {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 7px 6px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: var(--dd-text-dim);
  font-size: 11px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;

  &.active {
    background: var(--dd-bg-card);
    color: var(--dd-gold, #e5b53b);
  }
}

.tab-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.impact-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 10px;
  background: var(--dd-bg-elevated);
  border-radius: 6px;
  border: 1px solid var(--dd-border-subtle);
}

.impact-label {
  font-size: 11px;
  color: var(--dd-text-muted);
}

.impact-val {
  font-size: 14px;
  font-weight: 700;
  color: var(--dd-text-dim);

  &.up { color: var(--dd-radiant, #3dd6c8); }
}

.items-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
}

.item-tile {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 6px 4px;
  border-radius: 6px;
  border: 1px solid var(--dd-border-subtle);
  background: var(--dd-bg-elevated);
  cursor: pointer;
  font-family: inherit;
  color: var(--dd-text-muted);

  img {
    width: 40px;
    height: 30px;
    object-fit: cover;
    border-radius: 3px;
  }

  .phase {
    position: absolute;
    top: 4px;
    right: 4px;
    font-size: 8px;
    font-weight: 700;
    text-transform: uppercase;
    color: var(--dd-gold);
    opacity: 0.8;
  }

  .name {
    font-size: 9px;
    text-align: center;
    line-height: 1.2;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &.equipped {
    border-color: rgba(61, 214, 200, 0.5);
    box-shadow: 0 0 0 1px rgba(61, 214, 200, 0.2);
    color: var(--dd-text);
  }
}

.talent-row {
  display: grid;
  grid-template-columns: 28px 1fr 1fr;
  gap: 6px;
  align-items: stretch;
}

.talent-lvl {
  font-size: 11px;
  font-weight: 700;
  color: var(--dd-gold);
  display: flex;
  align-items: center;
  justify-content: center;
}

.talent-opt {
  padding: 8px 6px;
  border-radius: 5px;
  border: 1px solid var(--dd-border-subtle);
  background: var(--dd-bg-elevated);
  color: var(--dd-text-muted);
  font-size: 10px;
  line-height: 1.3;
  cursor: pointer;
  font-family: inherit;
  text-align: left;

  &.selected {
    border-color: rgba(229, 181, 59, 0.5);
    color: var(--dd-text);
    background: rgba(229, 181, 59, 0.1);
  }
}

.skill-btns {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.skill-btn,
.skill-clear {
  padding: 7px 10px;
  border-radius: 5px;
  border: 1px solid var(--dd-border);
  background: var(--dd-bg-elevated);
  color: var(--dd-text);
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
}

.skill-clear {
  color: var(--dd-text-dim);
  font-weight: 600;
}

.skill-order {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.skill-chip {
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  background: var(--dd-bg-elevated);
  border: 1px solid var(--dd-border-subtle);
  font-size: 10px;
  font-weight: 700;
  color: var(--dd-gold);
}

.hint,
.hint-soft,
.loading {
  margin: 0;
  font-size: 11px;
  color: var(--dd-text-dim);
  line-height: 1.4;
}

.hint-soft {
  opacity: 0.85;
}
</style>
