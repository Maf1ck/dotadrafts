<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDraftsMainStore } from '../../stores/draftsMain'

const { t } = useI18n()
const store = useDraftsMainStore()

const draftedCount = computed(() => store.radiantHeroes.length + store.direHeroes.length)
</script>

<template lang="pug">
.builds-cta
  span.cta-tag {{ t('sandbox.tag') }}
  h3.cta-title {{ t('sandbox.pageTitle') }}
  p.cta-desc {{ t('sandbox.sidebarHint') }}
  .cta-meta(v-if="draftedCount")
    | {{ t('sandbox.draftedCount', { n: draftedCount }) }}
  router-link.cta-btn(to="/sandbox") {{ t('page.openSandbox') }}
</template>

<style lang="scss" scoped>
.builds-cta {
  background: var(--dd-bg-card);
  border: 1px solid var(--dd-border);
  border-radius: var(--dd-radius);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.cta-tag {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: var(--dd-gold);
}

.cta-title {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  color: var(--dd-text);
}

.cta-desc {
  margin: 0;
  font-size: 12px;
  color: var(--dd-text-dim);
  line-height: 1.4;
}

.cta-meta {
  font-size: 11px;
  color: var(--dd-text-muted);
}

.cta-btn {
  margin-top: 4px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 14px;
  border-radius: var(--dd-radius-sm);
  border: 1px solid rgba(229, 181, 59, 0.45);
  background: rgba(229, 181, 59, 0.12);
  color: var(--dd-gold);
  font-size: 13px;
  font-weight: 700;
  text-decoration: none;
  transition: background 0.15s;

  &:hover {
    background: rgba(229, 181, 59, 0.2);
  }
}
</style>
