<script setup lang="ts">
import type { Hero } from '../../types/draft'

interface Props {
  hero: Hero | null
  position: number
  positionLabel: string
  side: 'radiant' | 'dire'
}

defineProps<Props>()
const emit = defineEmits<{
  click: []
  remove: [position: number]
}>()
</script>

<template lang="pug">
.hero-slot(
  :class="[side, { filled: !!hero, empty: !hero }]"
  @click="emit('click')"
)
  template(v-if="hero")
    .hero-image-wrap
      img.hero-img(:src="hero.imageUrl" :alt="hero.localizedName")
    .hero-info
      span.hero-name {{ hero.localizedName }}
      span.hero-roles {{ hero.roles.slice(0, 2).join(' · ') }}
    button.remove-btn(type="button" aria-label="Прибрати" @click.stop="emit('remove', position)")
      svg(width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5")
        line(x1="18" y1="6" x2="6" y2="18")
        line(x1="6" y1="6" x2="18" y2="18")

  template(v-else)
    .empty-inner
      span.pos-num {{ position }}
      span.empty-label {{ positionLabel }}
</template>

<style lang="scss" scoped>
.hero-slot {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 58px;
  border-radius: var(--dd-radius-sm);
  padding: 6px 8px;
  cursor: pointer;
  position: relative;
  transition: background 0.15s, border-color 0.15s;
  border: 1px solid transparent;

  &.filled {
    background: var(--dd-bg-elevated);

    &.radiant {
      border-color: rgba(61, 214, 200, 0.18);
      &:hover { border-color: rgba(61, 214, 200, 0.4); background: var(--dd-bg-card-hover); }
    }

    &.dire {
      border-color: rgba(232, 93, 122, 0.18);
      &:hover { border-color: rgba(232, 93, 122, 0.4); background: var(--dd-bg-card-hover); }
    }
  }

  &.empty {
    background: rgba(0, 0, 0, 0.2);
    border: 1px dashed var(--dd-border);

    &:hover {
      border-color: var(--dd-border);
      background: var(--dd-bg-elevated);
    }
  }
}

.hero-image-wrap {
  width: 56px;
  height: 42px;
  flex-shrink: 0;
  border-radius: 5px;
  overflow: hidden;
}

.hero-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.hero-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding-right: 28px;
}

.hero-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--dd-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.hero-roles {
  font-size: 11px;
  color: var(--dd-text-dim);
}

.remove-btn {
  position: absolute;
  right: 6px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  color: var(--dd-text-dim);
  padding: 4px;
  border-radius: 4px;

  &:hover {
    color: var(--dd-text);
    background: rgba(255, 255, 255, 0.06);
  }
}

.empty-inner {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
}

.pos-num {
  width: 24px;
  height: 24px;
  border-radius: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  flex-shrink: 0;
  background: var(--dd-bg-card);
  color: var(--dd-text-dim);

  .radiant & { color: var(--dd-radiant); }
  .dire & { color: var(--dd-dire); }
}

.empty-label {
  font-size: 12px;
  color: var(--dd-text-muted);
}
</style>
