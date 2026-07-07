<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { WinPrediction } from '../../types/draft'

interface Props {
  prediction: WinPrediction
}

const props = defineProps<Props>()
const { t } = useI18n()

const radiantWidth = computed(() => `${props.prediction.radiantWinRate}%`)
const direWidth = computed(() => `${props.prediction.direWinRate}%`)

const deltaText = computed(() => {
  if (!props.prediction.deltaHero) {
    return t('prob.selectHero')
  }
  const sign = props.prediction.deltaTeam === 'radiant' ? '+' : '−'
  const team = props.prediction.deltaTeam === 'radiant' ? 'Radiant' : 'Dire'
  return `${sign}${props.prediction.delta.toFixed(1)}% ${team} · ${props.prediction.deltaHero}`
})
</script>

<template lang="pug">
.probability-panel
  .panel-head
    span.panel-kicker {{ t('prob.winChance') }}
    p.panel-desc {{ t('prob.updatesAfter') }}

  .win-numbers
    .win-side.radiant
      span.team-name Radiant
      span.win-val {{ prediction.radiantWinRate.toFixed(1) }}%
    .win-divider
    .win-side.dire
      span.team-name Dire
      span.win-val {{ prediction.direWinRate.toFixed(1) }}%

  .progress-bar
    .bar-fill.radiant(:style="{ width: radiantWidth }")
    .bar-fill.dire(:style="{ width: direWidth }")

  .delta-badge(:class="prediction.deltaHero ? prediction.deltaTeam : 'neutral'")
    span {{ deltaText }}
</template>

<style lang="scss" scoped>
.probability-panel {
  background: var(--dd-bg-card);
  border: 1px solid var(--dd-border);
  border-radius: var(--dd-radius);
  padding: 16px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 14px;
  min-width: 0;
  height: 100%;
}

.panel-kicker {
  font-size: 11px;
  font-weight: 700;
  color: var(--dd-gold);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.panel-desc {
  margin: 4px 0 0;
  font-size: 12px;
  color: var(--dd-text-dim);
  line-height: 1.4;
}

.win-numbers {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: end;
  gap: 8px;
}

.win-side {
  display: flex;
  flex-direction: column;
  gap: 2px;

  &.dire {
    align-items: flex-end;
    text-align: right;
  }
}

.team-name {
  font-size: 11px;
  font-weight: 600;
  color: var(--dd-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.win-val {
  font-size: clamp(22px, 4vw, 30px);
  font-weight: 700;
  line-height: 1.1;

  .radiant & { color: var(--dd-radiant); }
  .dire & { color: var(--dd-dire); }
}

.win-divider {
  width: 1px;
  height: 36px;
  background: var(--dd-border);
  align-self: center;
}

.progress-bar {
  display: flex;
  width: 100%;
  height: 8px;
  background: var(--dd-bg-elevated);
  border-radius: 4px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  transition: width 0.5s ease;

  &.radiant { background: var(--dd-radiant); }
  &.dire { background: var(--dd-dire); }
}

.delta-badge {
  text-align: center;
  padding: 8px 10px;
  border-radius: var(--dd-radius-sm);
  background: var(--dd-bg-elevated);
  border: 1px solid var(--dd-border-subtle);

  span {
    font-size: 12px;
    color: var(--dd-text-muted);
    line-height: 1.35;
  }

  &.radiant {
    background: var(--dd-radiant-dim);
    border-color: rgba(61, 214, 200, 0.2);
    span { color: var(--dd-radiant); font-weight: 600; }
  }

  &.dire {
    background: var(--dd-dire-dim);
    border-color: rgba(232, 93, 122, 0.2);
    span { color: var(--dd-dire); font-weight: 600; }
  }
}
</style>
