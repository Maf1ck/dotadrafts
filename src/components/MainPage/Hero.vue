<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { useDraftsMainStore } from '../../stores/draftsMain'
import type { SlotPosition, TeamSide } from '../../types/draft'

import DraftSection from './DraftSection.vue'
import DetailSection from './DetailSection.vue'
import RecommendationPanel from './RecommendationPanel.vue'
import SandboxPanel from './SandboxPanel.vue'
import HeroPickerModal from './HeroPickerModal.vue'
import HeroPoolModal from './HeroPoolModal.vue'

const { t } = useI18n()

const store = useDraftsMainStore()
const {
  radiant,
  dire,
  prediction,
  metaRows,
  synergies,
  counters,
  analysis,
  recommendations,
  advisingTeam,
} = storeToRefs(store)

function handleSlotClick(side: TeamSide, position: number) {
  store.openPickSlot(side, position as SlotPosition)
}

function handleSlotRemove(side: TeamSide, position: number) {
  store.removePick(side, position as SlotPosition)
}

function handleBanClick(side: TeamSide, index: number) {
  store.openBanSlot(side, index)
}
</script>

<template lang="pug">
.page
  .page-body
    section.draft-area
      .toolbar
        .toolbar-text
          h1.page-title {{ t('page.title') }}
          p.page-hint {{ t('page.hint') }}
        button.reset-btn(type="button" @click="store.resetDraft") {{ t('page.reset') }}

      DraftSection(
        :radiant="radiant"
        :dire="dire"
        :prediction="prediction"
        @slot-click="handleSlotClick"
        @slot-remove="handleSlotRemove"
        @ban-click="handleBanClick"
      )

      DetailSection(
        :synergies="synergies"
        :counters="counters"
        :radiant-tags="analysis.radiantComposition"
        :dire-tags="analysis.direComposition"
        :meta-rows="metaRows"
      )

    aside.sidebar
      RecommendationPanel(
        :recommendations="recommendations"
        :for-team="advisingTeam"
        @pick="(rec) => store.applyRecommendation(rec)"
        @switch-team="store.setAdvisingTeam"
      )
      SandboxPanel

  HeroPickerModal
  HeroPoolModal
</template>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--dd-bg);
}

.page-body {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(280px, 360px);
  gap: 16px;
  padding: 16px 20px 24px;
  flex: 1;
  align-items: start;

  @media (max-width: 1100px) {
    grid-template-columns: 1fr;
  }

  @media (max-width: 600px) {
    padding: 12px;
  }
}

.draft-area {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}

.toolbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.page-title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: var(--dd-text);
}

.page-hint {
  margin: 4px 0 0;
  font-size: 13px;
  color: var(--dd-text-dim);
  line-height: 1.4;
}

.reset-btn {
  padding: 8px 14px;
  border-radius: var(--dd-radius-sm);
  border: 1px solid var(--dd-border);
  background: var(--dd-bg-card);
  font-family: var(--dd-font);
  font-size: 13px;
  font-weight: 600;
  color: var(--dd-text-muted);
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  flex-shrink: 0;

  &:hover {
    background: var(--dd-bg-card-hover);
    color: var(--dd-text);
  }
}

.sidebar {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;

  @media (max-width: 1100px) {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
}
</style>
