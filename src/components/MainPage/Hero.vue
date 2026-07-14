<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { useDraftsMainStore } from '../../stores/draftsMain'
import type { SlotPosition, TeamSide } from '../../types/draft'
import { CM_SEQUENCE } from '../../data/cmSequence'

import DraftSection from './DraftSection.vue'
import DetailSection from './DetailSection.vue'
import RecommendationPanel from './RecommendationPanel.vue'
import BuildsCtaPanel from './BuildsCtaPanel.vue'
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
  adviceTeam,
  draftMode,
  firstPickSide,
  cmStepIndex,
  cmCurrentStep,
  cmCurrentSide,
  cmIsComplete,
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

const cmProgress = () => `${Math.min(cmStepIndex.value + 1, CM_SEQUENCE.length)} / ${CM_SEQUENCE.length}`
</script>

<template lang="pug">
.page
  .page-body
    section.draft-area
      .toolbar
        .toolbar-text
          h1.page-title {{ t('page.title') }}
          p.page-hint {{ draftMode === 'simulator' ? t('page.hintSim') : t('page.hint') }}
        .toolbar-actions
          router-link.sandbox-link(to="/sandbox") {{ t('page.openSandbox') }}
          .mode-toggle
            button.mode-btn(
              type="button"
              :class="{ active: draftMode === 'manual' }"
              @click="draftMode !== 'manual' && store.setDraftMode('manual')"
            ) {{ t('page.modeManual') }}
            button.mode-btn(
              type="button"
              :class="{ active: draftMode === 'simulator' }"
              @click="draftMode !== 'simulator' && store.setDraftMode('simulator')"
            ) {{ t('page.modeSim') }}
          button.reset-btn(type="button" @click="store.resetDraft") {{ t('page.reset') }}

      .cm-bar(v-if="draftMode === 'simulator'")
        .cm-row
          span.cm-label {{ t('page.firstPick') }}
          .fp-toggle
            button.fp-btn(
              type="button"
              :class="{ active: firstPickSide === 'radiant' }"
              @click="store.setFirstPickSide('radiant')"
            ) Radiant
            button.fp-btn(
              type="button"
              :class="{ active: firstPickSide === 'dire' }"
              @click="store.setFirstPickSide('dire')"
            ) Dire
        .cm-status(v-if="cmIsComplete") {{ t('page.cmDone') }}
        .cm-status(v-else)
          span.cm-turn(
            :class="cmCurrentSide"
          ) {{ cmCurrentSide === 'radiant' ? 'Radiant' : 'Dire' }}
          span.cm-action {{ cmCurrentStep?.type === 'ban' ? t('page.cmBan') : t('page.cmPick') }}
          span.cm-step {{ cmProgress() }}
          button.cm-pick-btn(type="button" @click="store.openCmPicker") {{ t('page.cmChoose') }}

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
        :for-team="adviceTeam"
        :action-type="draftMode === 'simulator' ? (cmCurrentStep?.type ?? 'pick') : 'pick'"
        @pick="(rec) => store.applyRecommendation(rec)"
        @switch-team="store.setAdvisingTeam"
      )
      BuildsCtaPanel

  HeroPickerModal
  HeroPoolModal
</template>

<style lang="scss" scoped>
.page {
  min-height: 0;
  flex: 1;
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

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.sandbox-link {
  padding: 8px 12px;
  border-radius: var(--dd-radius-sm);
  border: 1px solid rgba(229, 181, 59, 0.4);
  background: rgba(229, 181, 59, 0.1);
  color: var(--dd-gold);
  font-size: 12px;
  font-weight: 700;
  text-decoration: none;
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

.mode-toggle {
  display: flex;
  gap: 3px;
  padding: 3px;
  background: var(--dd-bg-elevated);
  border-radius: var(--dd-radius-sm);
  border: 1px solid var(--dd-border-subtle);
}

.mode-btn {
  padding: 7px 12px;
  border: none;
  border-radius: 4px;
  background: transparent;
  font-family: var(--dd-font);
  font-size: 12px;
  font-weight: 600;
  color: var(--dd-text-dim);
  cursor: pointer;

  &.active {
    background: var(--dd-bg-card);
    color: var(--dd-gold);
  }
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

.cm-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 12px;
  background: var(--dd-bg-card);
  border: 1px solid var(--dd-border);
  border-radius: var(--dd-radius);
}

.cm-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.cm-label {
  font-size: 11px;
  font-weight: 700;
  color: var(--dd-text-dim);
  text-transform: uppercase;
}

.fp-toggle {
  display: flex;
  gap: 3px;
  padding: 2px;
  background: var(--dd-bg-elevated);
  border-radius: 4px;
  border: 1px solid var(--dd-border-subtle);
}

.fp-btn {
  padding: 4px 10px;
  border: none;
  border-radius: 3px;
  background: transparent;
  font-size: 11px;
  font-weight: 600;
  font-family: inherit;
  color: var(--dd-text-dim);
  cursor: pointer;

  &.active {
    background: var(--dd-bg-card);
    color: var(--dd-text);
  }

  &:first-child.active { color: var(--dd-radiant); }
  &:last-child.active { color: var(--dd-dire); }
}

.cm-status {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--dd-text-muted);
}

.cm-turn {
  font-weight: 700;

  &.radiant { color: var(--dd-radiant); }
  &.dire { color: var(--dd-dire); }
}

.cm-action {
  font-weight: 700;
  color: var(--dd-gold);
  text-transform: uppercase;
  font-size: 11px;
  letter-spacing: 0.04em;
}

.cm-step {
  font-size: 11px;
  color: var(--dd-text-dim);
}

.cm-pick-btn {
  padding: 6px 12px;
  border-radius: 5px;
  border: 1px solid rgba(229, 181, 59, 0.4);
  background: rgba(229, 181, 59, 0.1);
  color: var(--dd-gold);
  font-size: 12px;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
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
