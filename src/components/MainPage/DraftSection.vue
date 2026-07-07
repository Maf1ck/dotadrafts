<script setup lang="ts">
import type { TeamDraft, WinPrediction } from '../../types/draft'
import TeamColumn from './TeamColumn.vue'
import ProbabilityPanel from './ProbabilityPanel.vue'

interface Props {
  radiant: TeamDraft
  dire: TeamDraft
  prediction: WinPrediction
}

defineProps<Props>()

const emit = defineEmits<{
  slotClick: [side: 'radiant' | 'dire', position: number]
  slotRemove: [side: 'radiant' | 'dire', position: number]
  banClick: [side: 'radiant' | 'dire', index: number]
}>()
</script>

<template lang="pug">
.draft-section
  TeamColumn(
    :draft="radiant"
    @slot-click="(side, pos) => emit('slotClick', side, pos)"
    @slot-remove="(side, pos) => emit('slotRemove', side, pos)"
    @ban-click="(side, idx) => emit('banClick', side, idx)"
  )
  ProbabilityPanel(:prediction="prediction")
  TeamColumn(
    :draft="dire"
    @slot-click="(side, pos) => emit('slotClick', side, pos)"
    @slot-remove="(side, pos) => emit('slotRemove', side, pos)"
    @ban-click="(side, idx) => emit('banClick', side, idx)"
  )
</template>

<style lang="scss" scoped>
.draft-section {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(200px, 240px) minmax(0, 1fr);
  gap: 12px;
  width: 100%;
  align-items: stretch;
}

@media (max-width: 1200px) {
  .draft-section {
    grid-template-columns: 1fr 1fr;
    grid-template-areas:
      'radiant dire'
      'prob prob';

    :deep(.team-column.radiant) { grid-area: radiant; }
    :deep(.team-column.dire) { grid-area: dire; }
    :deep(.probability-panel) { grid-area: prob; }
  }
}

@media (max-width: 720px) {
  .draft-section {
    grid-template-columns: 1fr;
    grid-template-areas:
      'prob'
      'radiant'
      'dire';
  }
}
</style>
