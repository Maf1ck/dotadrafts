<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDraftsMainStore } from '../../stores/draftsMain'
import type { HeroRole } from '../../types/draft'

const store = useDraftsMainStore()
const { t } = useI18n()

const roleChips: (HeroRole | 'All')[] = [
  'All',
  'Carry',
  'Support',
  'Nuker',
  'Disabler',
  'Initiator',
  'Durable',
  'Escape',
  'Pusher',
]

function onBackdropClick(e: MouseEvent) {
  if (e.target === e.currentTarget) store.poolModalOpen = false
}

const isHeroSelected = (id: number) => store.heroPoolFilter.has(id)
</script>

<template lang="pug">
Transition(name="picker-fade")
  .picker-overlay(v-if="store.poolModalOpen" @click="onBackdropClick")
    .picker-drawer(@click.stop)
      .picker-header
        .picker-titles
          span.picker-label {{ t('pool.label', { count: store.heroPoolFilter.size }) }}
          h2.picker-title {{ t('pool.title') }}
          p.pool-hint {{ t('pool.myTeamHint') }}
          .my-team-toggle
            button.fp-btn(
              type="button"
              :class="{ active: store.myTeam === 'radiant' }"
              @click="store.setMyTeam('radiant')"
            ) Radiant
            button.fp-btn(
              type="button"
              :class="{ active: store.myTeam === 'dire' }"
              @click="store.setMyTeam('dire')"
            ) Dire
        .header-actions
          button.clear-btn(type="button" @click="store.clearHeroPool" v-if="store.heroPoolFilter.size > 0") {{ t('pool.clear') }}
          button.close-btn(type="button" aria-label="Close" @click="store.poolModalOpen = false")
            svg(width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2")
              line(x1="18" y1="6" x2="6" y2="18")
              line(x1="6" y1="6" x2="18" y2="18")

      .picker-toolbar
        .search-wrap
          svg.search-icon(width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2")
            circle(cx="11" cy="11" r="8")
            line(x1="21" y1="21" x2="16.65" y2="16.65")
          input.search-input(
            v-model="store.pickerSearch"
            type="search"
            :placeholder="t('picker.search')"
            autofocus
          )
        .role-chips
          button.chip(
            v-for="role in roleChips"
            :key="role"
            type="button"
            :class="{ active: store.pickerRoleFilter === role }"
            @click="store.pickerRoleFilter = role"
          ) {{ role === 'All' ? t('picker.roleAll') : role }}

      .picker-grid-wrap
        .picker-empty(v-if="store.isLoading") {{ t('picker.loading') }}
        .picker-empty(v-else-if="!store.filteredPickerHeroes.length") {{ t('picker.noResults') }}
        .picker-grid(v-else)
          button.hero-tile(
            v-for="hero in store.filteredPickerHeroes"
            :key="hero.id"
            type="button"
            :class="{ selected: isHeroSelected(hero.id) }"
            @click="store.toggleHeroPool(hero.id)"
          )
            img.hero-portrait(:src="hero.imageUrl" :alt="hero.localizedName")
            .hero-tile-overlay
            .check-icon(v-if="isHeroSelected(hero.id)")
              svg(width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3")
                polyline(points="20 6 9 17 4 12")
            span.hero-tile-name {{ hero.localizedName }}
            .hero-tile-roles {{ hero.roles.slice(0, 2).join(' · ') }}
</template>

<style lang="scss" scoped>
.picker-fade-enter-active,
.picker-fade-leave-active {
  transition: opacity 0.2s ease;

  .picker-drawer {
    transition: transform 0.25s ease;
  }
}

.picker-fade-enter-from,
.picker-fade-leave-to {
  opacity: 0;

  .picker-drawer {
    transform: translateX(24px);
  }
}

.picker-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(4, 6, 10, 0.72);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: flex-end;
}

.picker-drawer {
  width: min(520px, 100vw);
  height: 100%;
  background: #0c1018;
  border-left: 1px solid rgba(255, 255, 255, 0.06);
  display: flex;
  flex-direction: column;
  box-shadow: -12px 0 40px rgba(0, 0, 0, 0.45);
}

.picker-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 24px 24px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.picker-label {
  font-family: 'Outfit', sans-serif;
  font-size: 10px;
  font-weight: 700;
  color: #e5b53b;
  letter-spacing: 1px;
}

.picker-title {
  margin: 4px 0 0;
  font-family: 'Outfit', sans-serif;
  font-size: 20px;
  font-weight: 700;
  color: #f3f4f6;
}

.pool-hint {
  margin: 6px 0 0;
  font-size: 12px;
  color: #9ca3af;
  line-height: 1.35;
  max-width: 320px;
}

.my-team-toggle {
  display: inline-flex;
  gap: 3px;
  margin-top: 8px;
  padding: 2px;
  background: #141a24;
  border-radius: 5px;
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.fp-btn {
  padding: 5px 10px;
  border: none;
  border-radius: 4px;
  background: transparent;
  font-size: 11px;
  font-weight: 600;
  font-family: inherit;
  color: #9ca3af;
  cursor: pointer;

  &.active {
    background: #0c1018;
    color: #f3f4f6;
  }

  &:first-child.active { color: #3dd6c8; }
  &:last-child.active { color: #e85d7a; }
}

.clear-btn {
  background: transparent;
  border: none;
  font-family: 'Outfit', sans-serif;
  font-size: 12px;
  font-weight: 600;
  color: #e5b53b;
  cursor: pointer;
  padding: 4px 8px;
  transition: color 0.15s;

  &:hover {
    color: #f3f4f6;
  }
}

.close-btn {
  background: #161c28;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 8px;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;

  &:hover {
    background: #1e2536;
    color: #f3f4f6;
  }
}

.picker-toolbar {
  padding: 16px 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.search-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #111622;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 8px;
  padding: 0 12px;
  height: 42px;
}

.search-icon {
  color: #5c6475;
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  background: none;
  border: none;
  outline: none;
  font-family: 'Outfit', sans-serif;
  font-size: 14px;
  color: #f3f4f6;

  &::placeholder {
    color: #5c6475;
  }
}

.role-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.chip {
  padding: 5px 10px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  background: #111622;
  font-family: 'Outfit', sans-serif;
  font-size: 11px;
  color: #9ca3af;
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    color: #f3f4f6;
    border-color: rgba(255, 255, 255, 0.12);
  }

  &.active {
    color: #080b10;
    background: #e5b53b;
    border-color: #e5b53b;
    font-weight: 700;
  }
}

.picker-grid-wrap {
  flex: 1;
  overflow-y: auto;
  padding: 0 24px 24px;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 2px;
  }
}

.picker-empty {
  padding: 48px 0;
  text-align: center;
  font-family: 'Outfit', sans-serif;
  font-size: 14px;
  color: #5c6475;
}

.picker-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.hero-tile {
  position: relative;
  aspect-ratio: 0.85;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  padding: 0;
  background: #161c28;
  text-align: left;
  transition: border-color 0.15s, transform 0.15s, box-shadow 0.15s;

  &:hover {
    border-color: rgba(229, 181, 59, 0.5);
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.35);

    .hero-tile-overlay {
      background: linear-gradient(180deg, transparent 30%, rgba(8, 11, 16, 0.95) 100%);
    }
  }

  &.selected {
    border-color: #e5b53b;
    box-shadow: 0 0 0 1px #e5b53b;
    
    .hero-tile-overlay {
      background: linear-gradient(180deg, rgba(229, 181, 59, 0.1) 0%, rgba(8, 11, 16, 0.88) 100%);
    }
  }
}

.check-icon {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 20px;
  height: 20px;
  background: #e5b53b;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #080b10;
  z-index: 2;
}

.hero-portrait {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.hero-tile-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, transparent 40%, rgba(8, 11, 16, 0.88) 100%);
  pointer-events: none;
  transition: background 0.15s;
}

.hero-tile-name {
  position: absolute;
  left: 8px;
  right: 8px;
  bottom: 22px;
  font-family: 'Outfit', sans-serif;
  font-size: 11px;
  font-weight: 700;
  color: #f3f4f6;
  z-index: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.hero-tile-roles {
  position: absolute;
  left: 8px;
  right: 8px;
  bottom: 8px;
  font-family: 'Outfit', sans-serif;
  font-size: 9px;
  color: #9ca3af;
  z-index: 1;
}
</style>
