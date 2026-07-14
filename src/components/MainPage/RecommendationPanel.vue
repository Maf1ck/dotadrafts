<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { RecommendedHero, TeamSide } from '../../types/draft'
import { useDraftsMainStore } from '../../stores/draftsMain'

interface Props {
  recommendations: RecommendedHero[]
  forTeam: TeamSide
}

const props = defineProps<Props>()

const emit = defineEmits<{
  pick: [rec: RecommendedHero]
  switchTeam: [team: TeamSide]
}>()

const store = useDraftsMainStore()
const { t } = useI18n()
const teamLabel = computed(() => (props.forTeam === 'radiant' ? 'Radiant' : 'Dire'))

const poolBtnText = computed(() => {
  if (store.heroPoolFilter.size === 0) {
    return t('rec.poolAll', 'Pool: All')
  }
  return t('rec.poolCount', { count: store.heroPoolFilter.size }, `Pool: ${store.heroPoolFilter.size} Heroes`)
})
</script>

<template lang="pug">
.recommendation-panel
  .rec-header
    div
      h2.rec-title {{ t('rec.title') }}
      p.rec-desc {{ t('rec.bestFor', { team: teamLabel }) }}
    .header-controls
      button.pool-filter-btn(
        type="button"
        @click="store.poolModalOpen = true"
        :class="{ filtered: store.heroPoolFilter.size > 0 }"
      )
        svg.pool-icon(width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2")
          polygon(points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3")
        span {{ poolBtnText }}
      .team-toggle
        button.toggle-btn(
          type="button"
          :class="{ active: forTeam === 'radiant' }"
          @click="emit('switchTeam', 'radiant')"
        ) Radiant
        button.toggle-btn(
          type="button"
          :class="{ active: forTeam === 'dire' }"
          @click="emit('switchTeam', 'dire')"
        ) Dire

  .rec-empty(v-if="!recommendations.length") {{ t('rec.allFilled', { team: teamLabel }) }}

  .rec-list(v-else)
    button.rec-card(
      v-for="(rec, i) in recommendations"
      :key="`${forTeam}-${rec.hero.id}-${rec.suggestedPosition ?? i}`"
      type="button"
      :class="{ top: i === 0 }"
      @click="emit('pick', rec)"
    )
      img.rec-hero-img(:src="rec.hero.imageUrl" :alt="rec.hero.localizedName")
      .rec-info
        span.rec-hero-name {{ rec.hero.localizedName }}
        span.rec-role {{ rec.role }}
        span.rec-reason {{ rec.reason }}
      span.score-badge(:class="{ high: rec.score >= 80 }") {{ rec.score.toFixed(0) }}
</template>

<style lang="scss" scoped>
.recommendation-panel {
  background: var(--dd-bg-card);
  border: 1px solid var(--dd-border);
  border-radius: var(--dd-radius);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.rec-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.rec-title {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: var(--dd-text);
}

.rec-desc {
  margin: 4px 0 0;
  font-size: 12px;
  color: var(--dd-text-dim);
}

.header-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.pool-filter-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  background: var(--dd-bg-elevated);
  border: 1px solid var(--dd-border-subtle);
  border-radius: var(--dd-radius-sm);
  font-family: var(--dd-font);
  font-size: 11px;
  font-weight: 600;
  color: var(--dd-text-dim);
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    color: var(--dd-text);
    border-color: var(--dd-border);
    background: var(--dd-bg-card-hover);
  }

  &.filtered {
    color: var(--dd-gold);
    border-color: rgba(229, 181, 59, 0.4);
    background: rgba(229, 181, 59, 0.05);
  }
}

.pool-icon {
  flex-shrink: 0;
}

.team-toggle {
  display: flex;
  gap: 3px;
  padding: 3px;
  background: var(--dd-bg-elevated);
  border-radius: var(--dd-radius-sm);
  border: 1px solid var(--dd-border-subtle);
  flex-shrink: 0;
}

.toggle-btn {
  padding: 5px 10px;
  border: none;
  border-radius: 4px;
  background: transparent;
  font-family: var(--dd-font);
  font-size: 11px;
  font-weight: 600;
  color: var(--dd-text-dim);
  cursor: pointer;

  &.active {
    background: var(--dd-bg-card);
    color: var(--dd-text);
  }

  &:first-child.active { color: var(--dd-radiant); }
  &:last-child.active { color: var(--dd-dire); }
}

.rec-empty {
  padding: 24px 12px;
  text-align: center;
  font-size: 13px;
  color: var(--dd-text-dim);
}

.rec-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 480px;
  overflow-y: auto;

  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-thumb {
    background: var(--dd-border);
    border-radius: 2px;
  }
}

.rec-card {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  text-align: left;
  padding: 8px;
  background: var(--dd-bg-elevated);
  border: 1px solid var(--dd-border-subtle);
  border-radius: var(--dd-radius-sm);
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;

  &:hover {
    background: var(--dd-bg-card-hover);
    border-color: var(--dd-border);
  }

  &.top {
    border-color: rgba(212, 168, 67, 0.35);
  }
}

.rec-hero-img {
  width: 52px;
  height: 38px;
  border-radius: 5px;
  object-fit: cover;
  flex-shrink: 0;
}

.rec-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.rec-hero-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--dd-text);
}

.rec-role {
  font-size: 10px;
  font-weight: 600;
  color: var(--dd-gold);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.rec-reason {
  font-size: 11px;
  color: var(--dd-text-dim);
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.score-badge {
  font-size: 13px;
  font-weight: 700;
  color: var(--dd-text-muted);
  padding: 4px 8px;
  border-radius: 5px;
  background: var(--dd-bg-card);
  flex-shrink: 0;

  &.high {
    color: var(--dd-gold);
    background: rgba(212, 168, 67, 0.12);
  }
}
</style>
