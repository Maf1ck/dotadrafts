<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { useDraftsMainStore } from '../../stores/draftsMain'
import { setLocale, LOCALES } from '../../i18n'
import { useRoute } from 'vue-router'

const { t, locale } = useI18n()

const store = useDraftsMainStore()
const { activePatch, activeRank, isSteamConnected } = storeToRefs(store)

const route = useRoute()

const navItems = computed(() => [
  { key: 'draft', label: t('nav.draft'), to: '/' },
  { key: 'sandbox', label: t('nav.sandbox'), to: '/sandbox' },
  { key: 'heroes', label: t('nav.heroes'), to: '/heroes' },
  { key: 'meta', label: t('nav.meta'), to: '/meta' },
  { key: 'about', label: t('nav.about'), to: '/about' },
])

function isActive(key: string) {
  if (key === 'heroes') return route.name === 'heroes' || route.name === 'hero-detail'
  return route.name === key
}
</script>

<template lang="pug">
header.app-header
  .header-inner
    .logo-nav
      router-link.logo(to="/" aria-label="Dota Drafts home")
        svg.logo-icon(width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg")
          path(d="M12 2L3 7v5c0 5.5 3.8 10.7 9 12 5.2-1.3 9-6.5 9-12V7L12 2z" fill="#e5b53b")
        span.logo-dota DOTA
        span.logo-drafts DRAFTS
      nav.nav-items
        router-link.nav-item(
          v-for="item in navItems"
          :key="item.key"
          :to="item.to"
          :class="{ active: isActive(item.key) }"
        ) {{ item.label }}

    .header-right
      .lang-switcher
        button.lang-btn(
          v-for="loc in LOCALES"
          :key="loc.code"
          type="button"
          :class="{ active: locale === loc.code }"
          @click="setLocale(loc.code)"
        ) {{ loc.label }}
      .filters-row
        span.chip {{ activePatch.label }}
        span.chip {{ activeRank.label }}
      button.steam-btn(v-if="!isSteamConnected" type="button" @click="store.connectSteam")
        | {{ t('header.connectSteam') }}
      .user-avatar(v-else)
        span U
</template>

<style lang="scss" scoped>
.app-header {
  position: sticky;
  top: 0;
  z-index: 900;
  width: 100%;
  min-height: 60px;
  background: rgba(12, 16, 24, 0.94);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--dd-border);
  display: flex;
  align-items: center;
  padding: 0 20px;
  flex-shrink: 0;

  @media (max-width: 768px) {
    padding: 0 12px;
  }
}

.header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 12px;
  flex-wrap: wrap;
  padding: 8px 0;
}

.logo-nav {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
  min-width: 0;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  flex-shrink: 0;

  &-dota {
    font-family: 'Outfit', sans-serif;
    font-size: 20px;
    font-weight: 700;
    color: #e5b53b;
  }

  &-drafts {
    font-family: 'Outfit', sans-serif;
    font-size: 20px;
    font-weight: 700;
    color: #f3f4f6;
  }
}

.nav-items {
  display: flex;
  align-items: center;
  gap: 8px 16px;
  flex-wrap: wrap;
}

.nav-item {
  background: none;
  border: none;
  cursor: pointer;
  font-family: 'Outfit', sans-serif;
  font-size: 14px;
  color: #9ca3af;
  padding: 4px 0;
  position: relative;
  transition: color 0.2s;
  text-decoration: none;
  white-space: nowrap;

  &::after {
    content: '';
    position: absolute;
    bottom: -4px;
    left: 0;
    right: 0;
    height: 2px;
    background: #e5b53b;
    border-radius: 1px;
    transform: scaleX(0);
    transition: transform 0.2s ease;
  }

  &:hover {
    color: #f3f4f6;
  }

  &.active {
    color: #e5b53b;
    font-weight: 700;

    &::after {
      transform: scaleX(1);
    }
  }
}

.header-right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-left: auto;
}

.filters-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.chip {
  display: inline-flex;
  align-items: center;
  padding: 5px 10px;
  background: var(--dd-bg-card);
  border: 1px solid var(--dd-border-subtle);
  border-radius: var(--dd-radius-sm);
  font-size: 12px;
  color: var(--dd-text-muted);
}

.steam-btn {
  display: inline-flex;
  align-items: center;
  padding: 8px 16px;
  background: #e5b53b;
  border: none;
  border-radius: 8px;
  font-family: 'Outfit', sans-serif;
  font-size: 13px;
  font-weight: 700;
  color: #080b10;
  cursor: pointer;
  transition: background 0.2s, transform 0.1s;

  &:hover {
    background: #f0c54a;
    transform: translateY(-1px);
  }
}

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 18px;
  background: #1a2130;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: #9ca3af;
}

.lang-switcher {
  display: flex;
  gap: 2px;
  padding: 3px;
  background: var(--dd-bg-card);
  border: 1px solid var(--dd-border-subtle);
  border-radius: var(--dd-radius-sm);
}

.lang-btn {
  padding: 4px 9px;
  border: none;
  border-radius: 4px;
  background: transparent;
  font-family: 'Outfit', sans-serif;
  font-size: 11px;
  font-weight: 700;
  color: var(--dd-text-dim);
  cursor: pointer;
  letter-spacing: 0.03em;
  transition: background 0.15s, color 0.15s;

  &:hover {
    color: var(--dd-text);
  }

  &.active {
    background: #e5b53b;
    color: #080b10;
  }
}
</style>
