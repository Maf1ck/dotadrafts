<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const year = new Date().getFullYear()
</script>

<template lang="pug">
footer.app-footer
  .footer-inner
    .footer-brand
      span.brand-dota DOTA
      span.brand-drafts DRAFTS
      p.tagline {{ t('footer.tagline') }}
    nav.footer-nav
      router-link(to="/") {{ t('nav.draft') }}
      router-link(to="/sandbox") {{ t('nav.sandbox') }}
      router-link(to="/heroes") {{ t('nav.heroes') }}
      router-link(to="/meta") {{ t('nav.meta') }}
      router-link(to="/about") {{ t('nav.about') }}
    p.copy © {{ year }} Dota Drafts · {{ t('footer.copy') }}
</template>

<style lang="scss" scoped>
.app-footer {
  margin-top: auto;
  border-top: 1px solid var(--dd-border);
  background: var(--dd-bg-elevated);
  padding: 20px 20px 24px;
}

.footer-inner {
  max-width: 1280px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.footer-brand {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 6px 10px;
}

.brand-dota {
  font-family: 'Outfit', sans-serif;
  font-size: 16px;
  font-weight: 700;
  color: var(--dd-gold, #e5b53b);
}

.brand-drafts {
  font-family: 'Outfit', sans-serif;
  font-size: 16px;
  font-weight: 700;
  color: var(--dd-text, #f3f4f6);
}

.tagline {
  margin: 0;
  width: 100%;
  font-size: 12px;
  color: var(--dd-text-dim);
  line-height: 1.4;
}

.footer-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 18px;

  a {
    font-size: 13px;
    color: var(--dd-text-muted);
    text-decoration: none;

    &:hover { color: var(--dd-gold, #e5b53b); }
    &.router-link-active { color: var(--dd-gold, #e5b53b); }
  }
}

.copy {
  margin: 0;
  font-size: 11px;
  color: var(--dd-text-dim);
}
</style>
