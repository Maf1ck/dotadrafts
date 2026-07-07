<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { SandboxFeature } from '../../types/draft'

const { t } = useI18n()

const features = computed((): SandboxFeature[] => [
  { icon: 'lock', label: t('sandbox.items'),   locked: true },
  { icon: 'lock', label: t('sandbox.talents'), locked: true },
  { icon: 'lock', label: t('sandbox.skills'),  locked: true },
])

const emit = defineEmits<{
  unlock: []
}>()
</script>

<template lang="pug">
.sandbox-panel
  .sandbox-header
    span.sandbox-tag {{ t('sandbox.soon') }}
    span.sandbox-title {{ t('sandbox.title') }}

  p.sandbox-desc {{ t('sandbox.desc') }}

  .preview-row
    .feature-chip(v-for="f in features" :key="f.label")
      svg.lock-icon(width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5")
        rect(x="3" y="11" width="18" height="11" rx="2" ry="2")
        path(d="M7 11V7a5 5 0 0 1 10 0v4")
      span {{ f.label }}

  .action-row
    button.unlock-btn(@click="emit('unlock')")
      | {{ t('sandbox.unlockBtn') }}
</template>

<style lang="scss" scoped>
.sandbox-panel {
  background: var(--dd-bg-card);
  border: 1px solid var(--dd-border);
  border-radius: var(--dd-radius);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

// ─── Header ──────────────────────────────────────────────────────────────────

.sandbox-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.sandbox-tag {
  font-family: 'Outfit', sans-serif;
  font-size: 9px;
  font-weight: 700;
  color: #e5b53b;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.sandbox-title {
  font-family: 'Outfit', sans-serif;
  font-size: 14px;
  font-weight: 700;
  color: #f3f4f6;
}

// ─── Description ─────────────────────────────────────────────────────────────

.sandbox-desc {
  font-family: 'Outfit', sans-serif;
  font-size: 11px;
  color: #9ca3af;
  line-height: 1.55;
  margin: 0;
}

// ─── Feature Chips ───────────────────────────────────────────────────────────

.preview-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.feature-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  background: var(--dd-bg-elevated);
  border: 1px solid var(--dd-border-subtle);
  border-radius: var(--dd-radius-sm);
  opacity: 0.75;
}

.lock-icon {
  color: #5c6475;
  flex-shrink: 0;
}

.feature-chip span {
  font-family: 'Outfit', sans-serif;
  font-size: 10px;
  color: #9ca3af;
}

// ─── Unlock Button ───────────────────────────────────────────────────────────

.action-row {
  display: flex;
  align-items: center;
  width: 100%;
}

.unlock-btn {
  display: inline-flex;
  align-items: center;
  padding: 8px 16px;
  background: rgba(229, 181, 59, 0.1);
  border: 1px solid #e5b53b;
  border-radius: 6px;
  font-family: 'Outfit', sans-serif;
  font-size: 11px;
  font-weight: 700;
  color: #e5b53b;
  cursor: pointer;
  transition: background 0.2s, transform 0.1s;

  &:hover {
    background: rgba(229, 181, 59, 0.2);
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
}
</style>
