<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useHead } from '@vueuse/head'
import { useDraftsMainStore } from '../stores/draftsMain'
import { listNeutralItems, listShopItems } from '../services/opendotaItems'
import { suggestItemsForDraft } from '../services/itemSuggestions'
import { scoreHeroBuild } from '../services/buildImpact'
import type { Hero } from '../types/draft'

const { t } = useI18n()
const store = useDraftsMainStore()

useHead(
  computed(() => ({
    title: t('seo.sandbox.title'),
    meta: [{ name: 'description', content: t('seo.sandbox.description') }],
  })),
)

type CatalogTab = 'shop' | 'neutrals' | 'suggest' | 'popular' | 'talents' | 'skills'

const selectedHeroId = ref<number | null>(null)
const catalogTab = ref<CatalogTab>('shop')
const search = ref('')
const neutralTier = ref<number | 'all'>('all')

const draftedHeroes = computed(() => [...store.radiantHeroes, ...store.direHeroes])

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
  if (id) {
    store.ensureHeroBuild(id)
    void store.fetchHeroItemsData(id)
  }
})

onMounted(() => {
  void store.ensureItemConstants(true)
  void store.fetchHeroes()
})

const selectedHero = computed(
  () => draftedHeroes.value.find((h) => h.id === selectedHeroId.value) ?? null,
)

const build = computed(() => {
  if (!selectedHeroId.value) {
    return { items: [] as number[], neutrals: [] as number[], talents: {} as Record<number, 'left' | 'right'>, skills: [] as string[] }
  }
  return (
    store.heroBuilds[selectedHeroId.value] ?? {
      items: [],
      neutrals: [],
      talents: {},
      skills: [],
    }
  )
})

const allies = computed(() => {
  if (!selectedHero.value) return [] as Hero[]
  const onRadiant = store.radiantHeroes.some((h) => h.id === selectedHero.value!.id)
  const team = onRadiant ? store.radiantHeroes : store.direHeroes
  return team.filter((h) => h.id !== selectedHero.value!.id)
})

const enemies = computed(() => {
  if (!selectedHero.value) return [] as Hero[]
  const onRadiant = store.radiantHeroes.some((h) => h.id === selectedHero.value!.id)
  return onRadiant ? store.direHeroes : store.radiantHeroes
})

const heroPower = computed(() => {
  if (!selectedHeroId.value) return 0
  return scoreHeroBuild(build.value.items, build.value.neutrals, store.openDotaItems)
})

const shopCatalog = computed(() => {
  let list = listShopItems(store.openDotaItems)
  const q = search.value.trim().toLowerCase()
  if (q) {
    list = list.filter(
      (i) =>
        i.displayName.toLowerCase().includes(q) || i.shortName.toLowerCase().includes(q),
    )
  }
  return list
})

const neutralCatalog = computed(() => {
  let list = listNeutralItems(store.openDotaItems)
  if (neutralTier.value !== 'all') list = list.filter((i) => i.tier === neutralTier.value)
  const q = search.value.trim().toLowerCase()
  if (q) {
    list = list.filter(
      (i) =>
        i.displayName.toLowerCase().includes(q) || i.shortName.toLowerCase().includes(q),
    )
  }
  return list
})

const suggestions = computed(() => {
  if (!selectedHero.value) return []
  return suggestItemsForDraft(
    selectedHero.value,
    allies.value,
    enemies.value,
    store.openDotaItems,
    14,
  )
})

const popular = computed(() => {
  if (!selectedHeroId.value) return { starting: [], early: [], core: [], luxury: [] }
  return store.getResolvedItemsForHero(selectedHeroId.value)
})

function toggleItem(id: number) {
  if (!selectedHeroId.value) return
  const info = store.openDotaItems[id]
  store.toggleBuildItem(selectedHeroId.value, id, !!info?.isNeutral)
}

function isEquipped(id: number) {
  return build.value.items.includes(id) || build.value.neutrals.includes(id)
}

const itemSlotIds = computed(() => {
  const slots: (number | null)[] = [...build.value.items]
  while (slots.length < 6) slots.push(null)
  return slots.slice(0, 6)
})

const neutralId = computed(() => build.value.neutrals[0] ?? null)

function itemImg(id: number | null): string {
  if (id == null) return ''
  return store.openDotaItems[id]?.imageUrl ?? ''
}

function itemName(id: number | null): string {
  if (id == null) return ''
  return store.openDotaItems[id]?.displayName ?? ''
}

function hasItem(id: number | null): boolean {
  return id != null && !!store.openDotaItems[id]
}

function clickSlot(id: number | null) {
  if (id == null) return
  toggleItem(id)
}

const talentLevels = [10, 15, 20, 25] as const

function talentLeft(level: number): string {
  return talentOptions(level)[0]
}

function talentRight(level: number): string {
  return talentOptions(level)[1]
}

function talentOptions(level: number): [string, string] {
  const name = selectedHero.value?.localizedName ?? 'Hero'
  const role = selectedHero.value?.roles[0] ?? 'Flex'
  const presets: Record<number, [string, string]> = {
    10: [`+20 ${role} damage`, `+175 HP`],
    15: [`Improved ${name} spell`, `+12% evasion`],
    20: [`+1 ability level`, `+25 movement speed`],
    25: [`Ultimate upgrade`, `+30% status resistance`],
  }
  return presets[level] ?? ['A', 'B']
}

function addSkill(key: string) {
  if (!selectedHeroId.value) return
  const skills = [...build.value.skills]
  if (skills.length >= 18) return
  if (key === 'R' && skills.filter((s) => s === 'R').length >= 3) return
  skills.push(key)
  store.setBuildSkills(selectedHeroId.value, skills)
}

function sideLabel(hero: Hero) {
  return store.radiantHeroes.some((h) => h.id === hero.id) ? 'R' : 'D'
}

function equippedLabel(heroId: number) {
  const b = store.heroBuilds[heroId]
  const items = b?.items.length ?? 0
  const neutrals = b?.neutrals.length ?? 0
  return `${items}/6 · N${neutrals}`
}
</script>

<template lang="pug">
.sandbox-page
  .page-head
    div
      p.kicker {{ t('sandbox.pageKicker') }}
      h1.title {{ t('sandbox.pageTitle') }}
      p.lead {{ t('sandbox.pageLead') }}
    .win-card
      .win-row
        span.side.radiant Radiant
        strong {{ store.prediction.radiantWinRate.toFixed(1) }}%
      .bar
        .fill.radiant(:style="{ width: store.prediction.radiantWinRate + '%' }")
        .fill.dire(:style="{ width: store.prediction.direWinRate + '%' }")
      .win-row
        span.side.dire Dire
        strong {{ store.prediction.direWinRate.toFixed(1) }}%
      p.build-note {{ t('sandbox.buildWinNote', { r: store.radiantBuildScore.toFixed(1), d: store.direBuildScore.toFixed(1) }) }}

  .empty(v-if="!draftedHeroes.length")
    p {{ t('sandbox.needPicks') }}
    router-link.to-draft(to="/") {{ t('sandbox.goDraft') }}

  .layout(v-else)
    aside.heroes-col
      h2.col-title {{ t('sandbox.drafted') }}
      button.hero-row(
        v-for="h in draftedHeroes"
        :key="h.id"
        type="button"
        :class="{ active: selectedHeroId === h.id }"
        @click="selectedHeroId = h.id"
      )
        span.badge(:class="sideLabel(h) === 'R' ? 'radiant' : 'dire'") {{ sideLabel(h) }}
        img(:src="h.imageUrl" :alt="h.localizedName")
        .meta
          span.name {{ h.localizedName }}
          span.slots {{ equippedLabel(h.id) }}

    section.editor(v-if="selectedHero")
      .editor-head
        img.portrait(:src="selectedHero.imageUrl" :alt="selectedHero.localizedName")
        div
          h2 {{ selectedHero.localizedName }}
          p.sub {{ t('sandbox.heroPower', { n: heroPower.toFixed(1) }) }}
        button.clear(type="button" @click="store.clearHeroBuild(selectedHero.id)") {{ t('sandbox.clear') }}

      .slots-block
        h3 {{ t('sandbox.itemSlots') }}
        .slots
          .slot(
            v-for="(itemId, idx) in itemSlotIds"
            :key="'i'+idx"
            :class="{ filled: hasItem(itemId) }"
          )
            img(
              v-if="hasItem(itemId)"
              :src="itemImg(itemId)"
              :alt="itemName(itemId)"
              @click="clickSlot(itemId)"
            )
            span(v-else) {{ idx + 1 }}

      .slots-block
        h3 {{ t('sandbox.neutralSlot') }}
        .slots.neutral
          .slot.wide(:class="{ filled: hasItem(neutralId) }")
            template(v-if="hasItem(neutralId)")
              img(
                :src="itemImg(neutralId)"
                :alt="itemName(neutralId)"
                @click="clickSlot(neutralId)"
              )
              span.nname {{ itemName(neutralId) }}
            span(v-else) {{ t('sandbox.pickNeutral') }}

      .tabs
        button(type="button" :class="{ active: catalogTab === 'shop' }" @click="catalogTab = 'shop'") {{ t('sandbox.tabShop') }}
        button(type="button" :class="{ active: catalogTab === 'neutrals' }" @click="catalogTab = 'neutrals'") {{ t('sandbox.tabNeutrals') }}
        button(type="button" :class="{ active: catalogTab === 'suggest' }" @click="catalogTab = 'suggest'") {{ t('sandbox.tabSuggest') }}
        button(type="button" :class="{ active: catalogTab === 'popular' }" @click="catalogTab = 'popular'") {{ t('sandbox.popularBuild') }}
        button(type="button" :class="{ active: catalogTab === 'talents' }" @click="catalogTab = 'talents'") {{ t('sandbox.talents') }}
        button(type="button" :class="{ active: catalogTab === 'skills' }" @click="catalogTab = 'skills'") {{ t('sandbox.skills') }}

      .catalog(v-if="catalogTab === 'shop' || catalogTab === 'neutrals'")
        .catalog-tools
          input(v-model="search" type="search" :placeholder="t('sandbox.searchItems')")
          .tier-filters(v-if="catalogTab === 'neutrals'")
            button(type="button" :class="{ active: neutralTier === 'all' }" @click="neutralTier = 'all'") All
            button(
              v-for="tier in [1, 2, 3, 4, 5]"
              :key="tier"
              type="button"
              :class="{ active: neutralTier === tier }"
              @click="neutralTier = tier"
            ) T{{ tier }}
        .grid
          button.item(
            v-for="item in (catalogTab === 'shop' ? shopCatalog : neutralCatalog)"
            :key="item.id"
            type="button"
            :class="{ on: isEquipped(item.id) }"
            :title="item.displayName"
            @click="toggleItem(item.id)"
          )
            img(:src="item.imageUrl" :alt="item.displayName")
            span {{ item.displayName }}
            span.tier(v-if="item.tier") T{{ item.tier }}

      .catalog(v-else-if="catalogTab === 'suggest'")
        p.hint {{ t('sandbox.suggestHint') }}
        .grid
          button.item(
            v-for="s in suggestions"
            :key="s.item.id"
            type="button"
            :class="{ on: isEquipped(s.item.id) }"
            @click="toggleItem(s.item.id)"
          )
            img(:src="s.item.imageUrl" :alt="s.item.displayName")
            span {{ s.item.displayName }}
            span.why {{ s.reason }}

      .catalog(v-else-if="catalogTab === 'popular'")
        .phase(
          v-for="(items, key) in { start: popular.starting, early: popular.early, mid: popular.core, late: popular.luxury }"
          :key="String(key)"
        )
          h4 {{ key }}
          .mini
            button(
              v-for="item in items"
              :key="item.id"
              type="button"
              :class="{ on: isEquipped(item.id) }"
              @click="toggleItem(item.id)"
            )
              img(:src="item.imageUrl" :alt="item.name")

      .catalog(v-else-if="catalogTab === 'talents'")
        .talent(v-for="lvl in talentLevels" :key="lvl")
          span.lvl {{ lvl }}
          button(
            type="button"
            :class="{ on: build.talents[lvl] === 'left' }"
            @click="store.setBuildTalent(selectedHero.id, lvl, 'left')"
          ) {{ talentLeft(lvl) }}
          button(
            type="button"
            :class="{ on: build.talents[lvl] === 'right' }"
            @click="store.setBuildTalent(selectedHero.id, lvl, 'right')"
          ) {{ talentRight(lvl) }}

      .catalog(v-else)
        .skill-row
          button(v-for="k in ['Q', 'W', 'E', 'R', 'S']" :key="k" type="button" @click="addSkill(k)") {{ k }}
          button(type="button" @click="store.setBuildSkills(selectedHero.id, [])") {{ t('sandbox.clear') }}
        .chips
          span(v-for="(s, i) in build.skills" :key="i + s") {{ s }}
</template>

<style lang="scss" scoped>
.sandbox-page {
  padding: 16px 20px 32px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 1280px;
  margin: 0 auto;
  width: 100%;
}

.page-head {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.kicker {
  margin: 0;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: var(--dd-gold);
}

.title {
  margin: 4px 0 0;
  font-size: 22px;
  color: var(--dd-text);
}

.lead {
  margin: 6px 0 0;
  font-size: 13px;
  color: var(--dd-text-dim);
  max-width: 520px;
  line-height: 1.45;
}

.win-card {
  min-width: min(280px, 100%);
  padding: 12px 14px;
  background: var(--dd-bg-card);
  border: 1px solid var(--dd-border);
  border-radius: var(--dd-radius);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.win-row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: var(--dd-text);

  .side.radiant { color: var(--dd-radiant); font-weight: 700; }
  .side.dire { color: var(--dd-dire); font-weight: 700; }
}

.bar {
  display: flex;
  height: 8px;
  border-radius: 4px;
  overflow: hidden;
  background: var(--dd-bg-elevated);
}

.fill.radiant { background: var(--dd-radiant); }
.fill.dire { background: var(--dd-dire); }

.build-note {
  margin: 0;
  font-size: 11px;
  color: var(--dd-text-dim);
}

.empty {
  padding: 40px 20px;
  text-align: center;
  border: 1px dashed var(--dd-border);
  border-radius: var(--dd-radius);
  color: var(--dd-text-dim);

  .to-draft {
    display: inline-block;
    margin-top: 12px;
    color: var(--dd-gold);
    font-weight: 700;
  }
}

.layout {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  gap: 14px;

  @media (max-width: 860px) {
    grid-template-columns: 1fr;
  }
}

.heroes-col,
.editor {
  background: var(--dd-bg-card);
  border: 1px solid var(--dd-border);
  border-radius: var(--dd-radius);
  padding: 12px;
}

.col-title {
  margin: 0 0 10px;
  font-size: 12px;
  text-transform: uppercase;
  color: var(--dd-text-dim);
}

.hero-row {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px;
  margin-bottom: 6px;
  border-radius: 6px;
  border: 1px solid transparent;
  background: var(--dd-bg-elevated);
  cursor: pointer;
  text-align: left;
  font-family: inherit;

  img {
    width: 42px;
    height: 28px;
    object-fit: cover;
    border-radius: 3px;
  }

  .meta {
    display: flex;
    flex-direction: column;
    min-width: 0;

    .name { font-size: 12px; font-weight: 600; color: var(--dd-text); }
    .slots { font-size: 10px; color: var(--dd-text-dim); }
  }

  &.active {
    border-color: rgba(229, 181, 59, 0.45);
    background: rgba(229, 181, 59, 0.08);
  }
}

.badge {
  width: 18px;
  height: 18px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 800;
  display: grid;
  place-items: center;

  &.radiant { background: rgba(61, 214, 200, 0.2); color: var(--dd-radiant); }
  &.dire { background: rgba(232, 93, 122, 0.2); color: var(--dd-dire); }
}

.editor-head {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;

  .portrait {
    width: 72px;
    height: 48px;
    object-fit: cover;
    border-radius: 6px;
  }

  h2 { margin: 0; font-size: 18px; color: var(--dd-text); }
  .sub { margin: 2px 0 0; font-size: 12px; color: var(--dd-text-dim); }

  .clear {
    margin-left: auto;
    border: 1px solid var(--dd-border);
    background: transparent;
    color: var(--dd-text-dim);
    border-radius: 5px;
    padding: 6px 10px;
    cursor: pointer;
    font-family: inherit;
  }
}

.slots-block {
  margin-bottom: 12px;

  h3 {
    margin: 0 0 6px;
    font-size: 11px;
    text-transform: uppercase;
    color: var(--dd-text-dim);
  }
}

.slots {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;

  .slot {
    width: 52px;
    height: 38px;
    border-radius: 5px;
    border: 1px dashed var(--dd-border);
    background: var(--dd-bg-elevated);
    display: grid;
    place-items: center;
    font-size: 11px;
    color: var(--dd-text-dim);

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 4px;
      cursor: pointer;
    }

    &.filled { border-style: solid; border-color: rgba(61, 214, 200, 0.45); }

    &.wide {
      width: min(220px, 100%);
      justify-content: flex-start;
      padding: 0 8px;
      gap: 8px;
      display: flex;
      align-items: center;

      img { width: 44px; height: 30px; flex-shrink: 0; }
      .nname { font-size: 12px; color: var(--dd-text); }
    }
  }
}

.tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 10px;

  button {
    border: none;
    background: var(--dd-bg-elevated);
    color: var(--dd-text-dim);
    padding: 7px 10px;
    border-radius: 5px;
    font-size: 11px;
    font-weight: 600;
    cursor: pointer;
    font-family: inherit;

    &.active {
      color: var(--dd-gold);
      background: rgba(229, 181, 59, 0.12);
    }
  }
}

.catalog-tools {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 10px;

  input {
    flex: 1;
    min-width: 160px;
    padding: 8px 10px;
    border-radius: 6px;
    border: 1px solid var(--dd-border);
    background: var(--dd-bg-elevated);
    color: var(--dd-text);
    font-family: inherit;
  }
}

.tier-filters {
  display: flex;
  gap: 4px;

  button {
    border: 1px solid var(--dd-border-subtle);
    background: var(--dd-bg-elevated);
    color: var(--dd-text-dim);
    border-radius: 4px;
    padding: 4px 8px;
    cursor: pointer;
    font-size: 11px;
    font-family: inherit;

    &.active {
      color: var(--dd-gold);
      border-color: rgba(229, 181, 59, 0.4);
    }
  }
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(104px, 1fr));
  gap: 6px;
  max-height: 420px;
  overflow: auto;
}

.item {
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
  text-align: center;

  img {
    width: 42px;
    height: 30px;
    object-fit: cover;
    border-radius: 3px;
  }

  span {
    font-size: 9px;
    line-height: 1.2;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .why,
  .tier {
    color: var(--dd-text-dim);
    white-space: normal;
  }

  &.on {
    border-color: rgba(61, 214, 200, 0.5);
    color: var(--dd-text);
  }
}

.phase {
  margin-bottom: 10px;

  h4 {
    margin: 0 0 6px;
    font-size: 11px;
    color: var(--dd-gold);
    text-transform: uppercase;
  }

  .mini {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }

  button {
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

    &.on { border-color: rgba(61, 214, 200, 0.55); }
  }
}

.hint {
  font-size: 12px;
  color: var(--dd-text-dim);
}

.talent {
  display: grid;
  grid-template-columns: 32px 1fr 1fr;
  gap: 6px;
  margin-bottom: 6px;

  .lvl {
    display: grid;
    place-items: center;
    color: var(--dd-gold);
    font-weight: 700;
    font-size: 12px;
  }

  button {
    text-align: left;
    padding: 8px;
    border-radius: 5px;
    border: 1px solid var(--dd-border-subtle);
    background: var(--dd-bg-elevated);
    color: var(--dd-text-muted);
    font-size: 11px;
    cursor: pointer;
    font-family: inherit;

    &.on {
      border-color: rgba(229, 181, 59, 0.5);
      color: var(--dd-text);
    }
  }
}

.skill-row {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 8px;

  button {
    padding: 7px 10px;
    border-radius: 5px;
    border: 1px solid var(--dd-border);
    background: var(--dd-bg-elevated);
    color: var(--dd-text);
    cursor: pointer;
    font-family: inherit;
    font-weight: 700;
  }
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;

  span {
    width: 22px;
    height: 22px;
    display: grid;
    place-items: center;
    border-radius: 4px;
    background: var(--dd-bg-elevated);
    border: 1px solid var(--dd-border-subtle);
    font-size: 10px;
    font-weight: 700;
    color: var(--dd-gold);
  }
}
</style>
