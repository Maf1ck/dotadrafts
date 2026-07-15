<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Sword, Sparkles, ListOrdered, Package } from '@lucide/vue'
import { useDraftsMainStore } from '../../stores/draftsMain'
import { suggestItemsForDraft } from '../../services/itemSuggestions'
import { listShopItems } from '../../services/opendotaItems'
import type { Hero } from '../../types/draft'

const props = defineProps<{
  hero: Hero | null
  open: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const { t } = useI18n()
const store = useDraftsMainStore()

type PhaseTab = 'suggest' | 'starting' | 'early' | 'mid' | 'late' | 'catalog' | 'talents' | 'skills'

const activeTab = ref<PhaseTab>('suggest')
const equippedItemIds = ref<Set<number>>(new Set())
const talentPicks = ref<Record<number, 'left' | 'right'>>({})
const skillOrder = ref<string[]>([])
const catalogSearch = ref('')

watch(
  () => props.hero?.id,
  (id) => {
    equippedItemIds.value = new Set()
    talentPicks.value = {}
    skillOrder.value = []
    catalogSearch.value = ''
    activeTab.value = 'suggest'
    if (id) {
      void store.fetchHeroItemsData(id)
      void store.ensureItemConstants()
    }
  },
)

const allies = computed(() => {
  if (!props.hero) return [] as Hero[]
  const radiantIds = new Set(store.radiantHeroes.map((h) => h.id))
  const onRadiant = radiantIds.has(props.hero.id)
  const team = onRadiant ? store.radiantHeroes : store.direHeroes
  return team.filter((h) => h.id !== props.hero!.id)
})

const enemies = computed(() => {
  if (!props.hero) return [] as Hero[]
  const radiantIds = new Set(store.radiantHeroes.map((h) => h.id))
  const onRadiant = radiantIds.has(props.hero.id)
  return onRadiant ? store.direHeroes : store.radiantHeroes
})

const itemBuild = computed(() => {
  if (!props.hero) return { starting: [], early: [], core: [], luxury: [] }
  return store.getResolvedItemsForHero(props.hero.id)
})

const matchupSuggestions = computed(() => {
  if (!props.hero) return []
  return suggestItemsForDraft(
    props.hero,
    allies.value,
    enemies.value,
    store.openDotaItems,
    12,
  )
})

const catalogItems = computed(() => {
  const q = catalogSearch.value.trim().toLowerCase()
  // Shop only — neutrals live on the Builds page Neutrals tab
  let list = listShopItems(store.openDotaItems)
  if (q) {
    list = list.filter(
      (i) =>
        i.displayName.toLowerCase().includes(q) ||
        i.shortName.toLowerCase().includes(q),
    )
  }
  return list
})

const phaseItems = computed(() => {
  const b = itemBuild.value
  switch (activeTab.value) {
    case 'starting':
      return b.starting.map((i) => ({ ...i, phase: 'start' }))
    case 'early':
      return b.early.map((i) => ({ ...i, phase: 'early' }))
    case 'mid':
      return b.core.map((i) => ({ ...i, phase: 'mid' }))
    case 'late':
      return b.luxury.map((i) => ({ ...i, phase: 'late' }))
    default:
      return []
  }
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
  const hero = props.hero
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
  const name = props.hero?.localizedName?.[0] ?? 'H'
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

function onBackdrop(e: MouseEvent) {
  if (e.target === e.currentTarget) emit('close')
}

const tabs = computed(() => [
  { key: 'suggest' as const, label: t('sandbox.tabSuggest'), icon: Package },
  { key: 'starting' as const, label: t('sandbox.tabStart'), icon: Sword },
  { key: 'early' as const, label: t('sandbox.tabEarly'), icon: Sword },
  { key: 'mid' as const, label: t('sandbox.tabMid'), icon: Sword },
  { key: 'late' as const, label: t('sandbox.tabLate'), icon: Sword },
  { key: 'catalog' as const, label: t('sandbox.tabAll'), icon: Sword },
  { key: 'talents' as const, label: t('sandbox.talents'), icon: Sparkles },
  { key: 'skills' as const, label: t('sandbox.skills'), icon: ListOrdered },
])

const loading = computed(
  () => !!props.hero && store.itemsDataLoading[props.hero.id],
)
</script>

<template lang="pug">
Transition(name="sandbox-fade")
  .sandbox-overlay(v-if="open && hero" @click="onBackdrop")
    .sandbox-modal(@click.stop)
      .modal-header
        .hero-head
          img.hero-img(:src="hero.imageUrl" :alt="hero.localizedName")
          div
            span.modal-tag {{ t('sandbox.tag') }}
            h2.modal-title {{ hero.localizedName }}
            p.modal-sub {{ t('sandbox.modalSub') }}
        button.close-btn(type="button" aria-label="Close" @click="emit('close')")
          | ×

      .equipped-bar(v-if="equippedItemIds.size")
        span.eq-label {{ t('sandbox.equipped') }}
        .eq-slots
          template(v-for="id in equippedItemIds" :key="id")
            img.eq-icon(
              v-if="store.openDotaItems[id]"
              :src="store.openDotaItems[id].imageUrl"
              :alt="store.openDotaItems[id].displayName"
              :title="store.openDotaItems[id].displayName"
              @click="toggleItem(id)"
            )

      .tab-bar
        button.tab-btn(
          v-for="tab in tabs"
          :key="tab.key"
          type="button"
          :class="{ active: activeTab === tab.key }"
          @click="activeTab = tab.key"
        )
          span {{ tab.label }}

      .tab-body
        //- Matchup suggestions
        template(v-if="activeTab === 'suggest'")
          p.section-hint {{ t('sandbox.suggestHint') }}
          .empty-hint(v-if="!enemies.length && !allies.length") {{ t('sandbox.needMatchup') }}
          .items-grid(v-else-if="matchupSuggestions.length")
            button.item-tile(
              v-for="s in matchupSuggestions"
              :key="s.item.id"
              type="button"
              :class="{ equipped: equippedItemIds.has(s.item.id) }"
              @click="toggleItem(s.item.id)"
            )
              img(:src="s.item.imageUrl" :alt="s.item.displayName")
              span.name {{ s.item.displayName }}
              span.reason {{ t(`tips.${s.reasonKey}`) }}
          .empty-hint(v-else) {{ t('sandbox.noSuggest') }}

          h3.sub-title {{ t('sandbox.popularBuild') }}
          .loading(v-if="loading") {{ t('sandbox.loadingItems') }}
          .phase-blocks(v-else)
            .phase-block(v-for="(items, key) in { start: itemBuild.starting, early: itemBuild.early, mid: itemBuild.core, late: itemBuild.luxury }" :key="key")
              span.phase-label {{ key }}
              .mini-grid
                button.mini-item(
                  v-for="item in items"
                  :key="item.id"
                  type="button"
                  :class="{ equipped: equippedItemIds.has(item.id) }"
                  :title="item.name"
                  @click="toggleItem(item.id)"
                )
                  img(:src="item.imageUrl" :alt="item.name")

        //- Phase buckets
        template(v-else-if="['starting','early','mid','late'].includes(activeTab)")
          .loading(v-if="loading") {{ t('sandbox.loadingItems') }}
          .items-grid(v-else-if="phaseItems.length")
            button.item-tile(
              v-for="item in phaseItems"
              :key="item.id"
              type="button"
              :class="{ equipped: equippedItemIds.has(item.id) }"
              @click="toggleItem(item.id)"
            )
              img(:src="item.imageUrl" :alt="item.name")
              span.phase {{ item.phase }}
              span.name {{ item.name }}
          .empty-hint(v-else) {{ t('sandbox.noItems') }}

        //- Full catalog
        template(v-else-if="activeTab === 'catalog'")
          input.catalog-search(
            v-model="catalogSearch"
            type="search"
            :placeholder="t('sandbox.searchItems')"
          )
          .catalog-grid
            button.catalog-tile(
              v-for="item in catalogItems"
              :key="item.id"
              type="button"
              :class="{ equipped: equippedItemIds.has(item.id) }"
              :title="item.displayName"
              @click="toggleItem(item.id)"
            )
              img(:src="item.imageUrl" :alt="item.displayName")
              span {{ item.displayName }}

        //- Talents
        template(v-else-if="activeTab === 'talents'")
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
        template(v-else)
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
.sandbox-overlay {
  position: fixed;
  inset: 0;
  z-index: 1200;
  background: rgba(6, 8, 14, 0.72);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.sandbox-modal {
  width: min(720px, 100%);
  max-height: min(88vh, 900px);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: var(--dd-bg-card);
  border: 1px solid var(--dd-border);
  border-radius: var(--dd-radius);
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.45);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--dd-border-subtle);
}

.hero-head {
  display: flex;
  gap: 12px;
  align-items: center;
  min-width: 0;
}

.hero-img {
  width: 64px;
  height: 42px;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid var(--dd-border);
}

.modal-tag {
  font-size: 9px;
  font-weight: 700;
  color: var(--dd-gold);
  letter-spacing: 1px;
  text-transform: uppercase;
}

.modal-title {
  margin: 2px 0 0;
  font-size: 18px;
  font-weight: 700;
  color: var(--dd-text);
}

.modal-sub {
  margin: 2px 0 0;
  font-size: 12px;
  color: var(--dd-text-dim);
}

.close-btn {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: 1px solid var(--dd-border);
  background: var(--dd-bg-elevated);
  color: var(--dd-text-muted);
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
}

.equipped-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-bottom: 1px solid var(--dd-border-subtle);
  background: var(--dd-bg-elevated);
}

.eq-label {
  font-size: 10px;
  font-weight: 700;
  color: var(--dd-text-dim);
  text-transform: uppercase;
}

.eq-slots {
  display: flex;
  gap: 4px;
}

.eq-icon {
  width: 36px;
  height: 26px;
  object-fit: cover;
  border-radius: 3px;
  cursor: pointer;
  border: 1px solid rgba(61, 214, 200, 0.45);
}

.tab-bar {
  display: flex;
  gap: 4px;
  padding: 8px 12px;
  overflow-x: auto;
  border-bottom: 1px solid var(--dd-border-subtle);
}

.tab-btn {
  flex-shrink: 0;
  padding: 6px 10px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: var(--dd-text-dim);
  font-size: 11px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;

  &.active {
    background: var(--dd-bg-elevated);
    color: var(--dd-gold);
  }
}

.tab-body {
  padding: 14px 16px 18px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-hint,
.hint-soft,
.empty-hint,
.loading {
  margin: 0;
  font-size: 12px;
  color: var(--dd-text-dim);
  line-height: 1.4;
}

.sub-title {
  margin: 8px 0 0;
  font-size: 12px;
  font-weight: 700;
  color: var(--dd-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 8px;
}

.item-tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px 6px;
  border-radius: 6px;
  border: 1px solid var(--dd-border-subtle);
  background: var(--dd-bg-elevated);
  cursor: pointer;
  font-family: inherit;
  color: var(--dd-text-muted);
  text-align: center;

  img {
    width: 44px;
    height: 32px;
    object-fit: cover;
    border-radius: 3px;
  }

  .phase {
    font-size: 8px;
    font-weight: 700;
    color: var(--dd-gold);
    text-transform: uppercase;
  }

  .name {
    font-size: 10px;
    line-height: 1.2;
  }

  .reason {
    font-size: 9px;
    color: var(--dd-text-dim);
    line-height: 1.25;
  }

  &.equipped {
    border-color: rgba(61, 214, 200, 0.5);
    color: var(--dd-text);
  }
}

.phase-blocks {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.phase-block {
  display: flex;
  align-items: center;
  gap: 10px;
}

.phase-label {
  width: 40px;
  font-size: 10px;
  font-weight: 700;
  color: var(--dd-gold);
  text-transform: uppercase;
}

.mini-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.mini-item {
  padding: 0;
  border: 1px solid var(--dd-border-subtle);
  border-radius: 4px;
  background: transparent;
  cursor: pointer;

  img {
    display: block;
    width: 40px;
    height: 28px;
    object-fit: cover;
    border-radius: 3px;
  }

  &.equipped {
    border-color: rgba(61, 214, 200, 0.55);
    box-shadow: 0 0 0 1px rgba(61, 214, 200, 0.25);
  }
}

.catalog-search {
  width: 100%;
  padding: 8px 10px;
  border-radius: 6px;
  border: 1px solid var(--dd-border);
  background: var(--dd-bg-elevated);
  color: var(--dd-text);
  font-family: inherit;
  font-size: 13px;
}

.catalog-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(88px, 1fr));
  gap: 6px;
  max-height: 420px;
  overflow-y: auto;
}

.catalog-tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 6px 4px;
  border-radius: 5px;
  border: 1px solid var(--dd-border-subtle);
  background: var(--dd-bg-elevated);
  cursor: pointer;
  font-family: inherit;
  font-size: 9px;
  color: var(--dd-text-muted);
  text-align: center;

  img {
    width: 42px;
    height: 30px;
    object-fit: cover;
    border-radius: 3px;
  }

  span {
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &.equipped {
    border-color: rgba(61, 214, 200, 0.5);
    color: var(--dd-text);
  }
}

.talent-row {
  display: grid;
  grid-template-columns: 28px 1fr 1fr;
  gap: 6px;
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

.sandbox-fade-enter-active,
.sandbox-fade-leave-active {
  transition: opacity 0.18s ease;
}

.sandbox-fade-enter-from,
.sandbox-fade-leave-to {
  opacity: 0;
}
</style>
