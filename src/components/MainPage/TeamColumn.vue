<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { TeamDraft } from '../../types/draft'
import HeroSlot from './HeroSlot.vue'

interface Props {
  draft: TeamDraft
}

defineProps<Props>()

const emit = defineEmits<{
  slotClick: [side: 'radiant' | 'dire', position: number]
  slotRemove: [side: 'radiant' | 'dire', position: number]
  banClick: [side: 'radiant' | 'dire', index: number]
}>()

const { t } = useI18n()

const positionLabels = computed((): Record<number, string> => ({
  1: t('pos.1'),
  2: t('pos.2'),
  3: t('pos.3'),
  4: t('pos.4'),
  5: t('pos.5'),
}))

const teamTitles = {
  radiant: 'Radiant',
  dire: 'Dire',
}
</script>

<template lang="pug">
.team-column(:class="draft.side")
  .team-head
    span.team-badge {{ teamTitles[draft.side] }}
    span.team-hint {{ t('team.picks') }}

  .bans-row
    span.bans-label {{ t('team.bans') }}
    .ban-thumbnails
      button.ban-thumb(
        v-for="(ban, i) in draft.bans"
        :key="i"
        type="button"
        :class="{ filled: !!ban }"
        :title="ban ? ban.localizedName : t('team.addBan')"
        @click="emit('banClick', draft.side, i)"
      )
        img(v-if="ban" :src="ban.imageUrl" :alt="ban.localizedName")
        .ban-empty(v-else)
          span +

  HeroSlot(
    v-for="slot in draft.slots"
    :key="slot.position"
    :hero="slot.hero"
    :position="slot.position"
    :position-label="positionLabels[slot.position]"
    :side="draft.side"
    @click="emit('slotClick', draft.side, slot.position)"
    @remove="emit('slotRemove', draft.side, slot.position)"
  )
</template>

<style lang="scss" scoped>
.team-column {
  min-width: 0;
  background: var(--dd-bg-card);
  border: 1px solid var(--dd-border);
  border-radius: var(--dd-radius);
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;

  &.radiant {
    border-top: 2px solid var(--dd-radiant);
  }

  &.dire {
    border-top: 2px solid var(--dd-dire);
  }
}

.team-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  padding: 0 2px 4px;
}

.team-badge {
  font-size: 14px;
  font-weight: 700;

  .radiant & { color: var(--dd-radiant); }
  .dire & { color: var(--dd-dire); }
}

.team-hint {
  font-size: 11px;
  color: var(--dd-text-dim);
}

.bans-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 2px 8px;
  border-bottom: 1px solid var(--dd-border-subtle);
}

.bans-label {
  font-size: 10px;
  font-weight: 700;
  color: var(--dd-text-dim);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  flex-shrink: 0;
}

.ban-thumbnails {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
}

.ban-thumb {
  width: 30px;
  height: 22px;
  border-radius: 4px;
  overflow: hidden;
  padding: 0;
  cursor: pointer;
  background: var(--dd-bg-elevated);
  border: 1px solid var(--dd-border-subtle);
  transition: border-color 0.15s, transform 0.1s;

  &:hover {
    transform: scale(1.06);
    border-color: var(--dd-border);
  }

  .radiant &.filled,
  .radiant &:hover {
    border-color: rgba(61, 214, 200, 0.35);
  }

  .dire &.filled,
  .dire &:hover {
    border-color: rgba(232, 93, 122, 0.35);
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    opacity: 0.4;
    filter: grayscale(0.4);
  }
}

.ban-empty {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;

  span {
    font-size: 14px;
    color: var(--dd-text-dim);
    line-height: 1;
  }
}
</style>
