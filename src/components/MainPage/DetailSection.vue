<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { ArrowRight, Circle } from '@lucide/vue'
import type { DetailTab, SynergyEntry, CounterEntry, MetaStatRow } from '../../types/draft'

interface Props {
  synergies: SynergyEntry[]
  counters: CounterEntry[]
  radiantTags: string[]
  direTags: string[]
  metaRows: MetaStatRow[]
}

const props = defineProps<Props>()
const { t } = useI18n()

const activeTab = ref<DetailTab>('overview')
const tabs = computed((): { key: DetailTab; label: string }[] => [
  { key: 'overview',     label: t('detail.tab.overview') },
  { key: 'matchups',    label: t('detail.tab.matchups') },
  { key: 'synergy',     label: t('detail.tab.synergy') },
  { key: 'composition', label: t('detail.tab.composition') },
])

// MetaStatRow labels are mapped via t() directly in template
const metaKeyMap: Record<string, string> = {
  Matchups: 'meta.matchups',
  Synergy: 'meta.synergy',
  Composition: 'meta.composition',
  'Meta Score': 'meta.metaScore',
  'Item Builds': 'meta.itemBuilds',
}

const rowsTranslated = computed(() =>
  props.metaRows.map((row) => ({
    ...row,
    labelUa: t(`${metaKeyMap[row.label] ?? 'meta.matchups'}.label`),
    hintUa:  t(`${metaKeyMap[row.label] ?? 'meta.matchups'}.hint`),
  }))
)

const severityLabel = computed(() => ({
  low:    t('severity.low'),
  medium: t('severity.medium'),
  high:   t('severity.high'),
}))

const hasDraftData = computed(
  () => props.counters.length > 0 || props.synergies.length > 0 || props.radiantTags.length > 0,
)
</script>

<template lang="pug">
.detail-section
  .section-head
    div
      h2.section-title {{ t('detail.title') }}
      p.section-desc {{ t('detail.desc') }}
    .legend
      span.legend-item.radiant
        Circle.legend-dot(:size="8" :stroke-width="0" fill="currentColor")
        | Radiant
      span.legend-item.dire
        Circle.legend-dot(:size="8" :stroke-width="0" fill="currentColor")
        | Dire

  .tab-bar
    button.tab-btn(
      v-for="tab in tabs"
      :key="tab.key"
      type="button"
      :class="{ active: activeTab === tab.key }"
      @click="activeTab = tab.key"
    ) {{ tab.label }}

  //- Overview
  .tab-panel(v-if="activeTab === 'overview'")
    .metrics-table
      .metrics-header
        span.col-metric {{ t('detail.metric') }}
        span.col-team Radiant
        span.col-team Dire
        span.col-edge {{ t('detail.edge') }}
      .metrics-row(v-for="row in rowsTranslated" :key="row.label")
        .col-metric
          span.metric-name {{ row.labelUa }}
          span.metric-hint {{ row.hintUa }}
        span.col-team.radiant {{ row.radiantValue }}
        span.col-team.dire {{ row.direValue }}
        span.col-edge(:class="row.advantage")
          | {{ row.advantage === 'radiant' ? 'Radiant' : row.advantage === 'dire' ? 'Dire' : '—' }}
    .empty-note(v-if="!hasDraftData")
      | {{ t('detail.emptyNote') }}

  //- Matchups
  .tab-panel(v-else-if="activeTab === 'matchups'")
    p.panel-hint {{ t('detail.countersHint') }}
    .list(v-if="counters.length")
      .list-item(v-for="(c, i) in counters" :key="i")
        .hero-pair
          img.mini-hero(:src="c.counter.imageUrl" :alt="c.counter.localizedName")
          ArrowRight.arrow(:size="12" :stroke-width="2.5")
          img.mini-hero(:src="c.victim.imageUrl" :alt="c.victim.localizedName")
        .item-body
          strong {{ c.counter.localizedName }}
          |  {{ t('detail.strongAgainst') }} 
          strong {{ c.victim.localizedName }}
          p.item-desc {{ c.description }}
        span.severity(:class="c.severity") {{ severityLabel[c.severity] }}
    .empty-note(v-else) {{ t('detail.needHeroes') }}

  //- Synergy
  .tab-panel(v-else-if="activeTab === 'synergy'")
    p.panel-hint {{ t('detail.synergyHint') }}
    .list(v-if="synergies.length")
      .list-item(v-for="(syn, i) in synergies" :key="i")
        .hero-pair
          img.mini-hero(:src="syn.heroA.imageUrl" :alt="syn.heroA.localizedName")
          span.plus +
          img.mini-hero(:src="syn.heroB.imageUrl" :alt="syn.heroB.localizedName")
        .item-body
          strong {{ syn.heroA.localizedName }} + {{ syn.heroB.localizedName }}
          p.item-desc {{ syn.description }}
        span.score {{ syn.synergyScore.toFixed(1) }}
    .empty-note(v-else) {{ t('detail.addTwo') }}

  //- Composition
  .tab-panel(v-else)
    p.panel-hint {{ t('detail.compHint') }}
    .comp-grid
      .comp-col
        h3.comp-title.radiant Radiant
        .tags
          span.tag.radiant(v-for="tag in radiantTags" :key="'r-' + tag") {{ tag }}
          span.tag-empty(v-if="!radiantTags.length") {{ t('detail.noTags') }}
      .comp-col
        h3.comp-title.dire Dire
        .tags
          span.tag.dire(v-for="tag in direTags" :key="'d-' + tag") {{ tag }}
          span.tag-empty(v-if="!direTags.length") {{ t('detail.noTags') }}
</template>

<style lang="scss" scoped>
.detail-section {
  background: var(--dd-bg-card);
  border: 1px solid var(--dd-border);
  border-radius: var(--dd-radius);
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.section-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.section-title {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: var(--dd-text);
}

.section-desc {
  margin: 4px 0 0;
  font-size: 12px;
  color: var(--dd-text-dim);
}

.legend {
  display: flex;
  gap: 14px;
  font-size: 12px;
  color: var(--dd-text-muted);
  align-items: center;

  .legend-item {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  .radiant { color: var(--dd-radiant); }
  .dire { color: var(--dd-dire); }

  .legend-dot {
    flex-shrink: 0;
  }
}

.tab-bar {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  padding: 3px;
  background: var(--dd-bg-elevated);
  border-radius: var(--dd-radius-sm);
  border: 1px solid var(--dd-border-subtle);
}

.tab-btn {
  padding: 7px 14px;
  border: none;
  border-radius: 5px;
  background: transparent;
  font-family: var(--dd-font);
  font-size: 13px;
  font-weight: 500;
  color: var(--dd-text-muted);
  cursor: pointer;
  transition: background 0.15s, color 0.15s;

  &:hover { color: var(--dd-text); }

  &.active {
    background: var(--dd-bg-card);
    color: var(--dd-gold);
    font-weight: 700;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  }
}

.tab-panel {
  min-height: 160px;
}

.panel-hint {
  margin: 0 0 12px;
  font-size: 12px;
  color: var(--dd-text-dim);
}

.metrics-table {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.metrics-header,
.metrics-row {
  display: grid;
  grid-template-columns: 1fr 72px 72px 72px;
  gap: 8px;
  align-items: center;
  padding: 10px 12px;
  border-radius: var(--dd-radius-sm);

  @media (max-width: 600px) {
    grid-template-columns: 1fr 1fr;
    .col-edge { grid-column: 1 / -1; text-align: right; }
    .metrics-header .col-edge { display: none; }
  }
}

.metrics-header {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--dd-text-dim);
  background: var(--dd-bg-elevated);
}

.metrics-row {
  background: rgba(255, 255, 255, 0.015);
  border: 1px solid var(--dd-border-subtle);
  position: relative;
}

.col-metric {
  min-width: 0;
}

.metric-name {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: var(--dd-text);
}

.metric-hint {
  display: block;
  font-size: 11px;
  color: var(--dd-text-dim);
  margin-top: 2px;
  line-height: 1.3;
}

.col-team {
  font-size: 14px;
  font-weight: 700;
  text-align: center;

  &.radiant { color: var(--dd-radiant); }
  &.dire { color: var(--dd-dire); }
}

.col-edge {
  font-size: 11px;
  font-weight: 700;
  text-align: center;
  color: var(--dd-text-dim);

  &.radiant { color: var(--dd-radiant); }
  &.dire { color: var(--dd-dire); }
}

.list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.list-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 12px;
  background: var(--dd-bg-elevated);
  border-radius: var(--dd-radius-sm);
  border: 1px solid var(--dd-border-subtle);
}

.hero-pair {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;

  .arrow, .plus {
    font-size: 11px;
    color: var(--dd-text-dim);
  }
}

.mini-hero {
  width: 36px;
  height: 26px;
  border-radius: 4px;
  object-fit: cover;
}

.item-body {
  flex: 1;
  min-width: 0;
  font-size: 12px;
  color: var(--dd-text-muted);
  line-height: 1.4;

  strong { color: var(--dd-text); }
}

.item-desc {
  margin: 4px 0 0;
  font-size: 11px;
  color: var(--dd-text-dim);
}

.severity {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  padding: 3px 8px;
  border-radius: 4px;
  flex-shrink: 0;

  &.high { color: var(--dd-dire); background: var(--dd-dire-dim); }
  &.medium { color: var(--dd-gold); background: rgba(212, 168, 67, 0.12); }
  &.low { color: var(--dd-text-dim); background: var(--dd-bg-card); }
}

.score {
  font-size: 14px;
  font-weight: 700;
  color: var(--dd-radiant);
  flex-shrink: 0;
}

.comp-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;

  @media (max-width: 560px) {
    grid-template-columns: 1fr;
  }
}

.comp-title {
  margin: 0 0 10px;
  font-size: 13px;
  font-weight: 700;

  &.radiant { color: var(--dd-radiant); }
  &.dire { color: var(--dd-dire); }
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag {
  padding: 5px 10px;
  border-radius: 5px;
  font-size: 12px;
  font-weight: 600;
  text-transform: capitalize;

  &.radiant {
    color: var(--dd-radiant);
    background: var(--dd-radiant-dim);
  }

  &.dire {
    color: var(--dd-dire);
    background: var(--dd-dire-dim);
  }
}

.tag-empty {
  font-size: 12px;
  color: var(--dd-text-dim);
}

.empty-note {
  margin-top: 12px;
  padding: 14px;
  text-align: center;
  font-size: 13px;
  color: var(--dd-text-dim);
  background: var(--dd-bg-elevated);
  border-radius: var(--dd-radius-sm);
  border: 1px dashed var(--dd-border);
}
</style>
