<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Lock } from '@lucide/vue'
import { useDraftsMainStore } from '../../stores/draftsMain'
import type { Hero } from '../../types/draft'
import SandboxHeroModal from './SandboxHeroModal.vue'

const { t } = useI18n()
const store = useDraftsMainStore()

const modalHero = ref<Hero | null>(null)
const modalOpen = ref(false)

const draftedHeroes = computed(() => {
  const all: Hero[] = []
  for (const slot of store.radiant.slots) {
    if (slot.hero) all.push(slot.hero)
  }
  for (const slot of store.dire.slots) {
    if (slot.hero) all.push(slot.hero)
  }
  return all
})

watch(draftedHeroes, (heroes) => {
  if (modalHero.value && !heroes.some((h) => h.id === modalHero.value!.id)) {
    modalOpen.value = false
    modalHero.value = null
  }
})

function openSandbox(hero: Hero) {
  modalHero.value = hero
  modalOpen.value = true
  void store.fetchHeroItemsData(hero.id)
  void store.ensureItemConstants()
}

function closeModal() {
  modalOpen.value = false
}
</script>

<template lang="pug">
.sandbox-panel
  .sandbox-header
    span.sandbox-tag {{ t('sandbox.tag') }}
    span.sandbox-title {{ t('sandbox.title') }}
    p.sandbox-desc {{ t('sandbox.descActive') }}

  .empty-state(v-if="!draftedHeroes.length")
    Lock(:size="18" :stroke-width="2")
    p {{ t('sandbox.needPicks') }}

  template(v-else)
    p.open-hint {{ t('sandbox.clickHero') }}
    .hero-picker-row
      button.hero-chip(
        v-for="h in draftedHeroes"
        :key="h.id"
        type="button"
        @click="openSandbox(h)"
      )
        img(:src="h.imageUrl" :alt="h.localizedName")
        span {{ h.localizedName }}
        span.open-label {{ t('sandbox.open') }}

  SandboxHeroModal(
    :hero="modalHero"
    :open="modalOpen"
    @close="closeModal"
  )
</template>

<style lang="scss" scoped>
.sandbox-panel {
  background: var(--dd-bg-card);
  border: 1px solid var(--dd-border);
  border-radius: var(--dd-radius);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.sandbox-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.sandbox-tag {
  font-size: 9px;
  font-weight: 700;
  color: var(--dd-gold, #e5b53b);
  letter-spacing: 1px;
  text-transform: uppercase;
}

.sandbox-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--dd-text, #f3f4f6);
}

.sandbox-desc,
.open-hint {
  margin: 0;
  font-size: 11px;
  color: var(--dd-text-dim, #9ca3af);
  line-height: 1.45;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 20px 12px;
  text-align: center;
  color: var(--dd-text-dim, #5c6475);
  border: 1px dashed var(--dd-border);
  border-radius: var(--dd-radius-sm);

  p {
    margin: 0;
    font-size: 12px;
    line-height: 1.4;
  }
}

.hero-picker-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.hero-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px 4px 4px;
  border-radius: 6px;
  border: 1px solid var(--dd-border-subtle);
  background: var(--dd-bg-elevated);
  color: var(--dd-text-muted);
  cursor: pointer;
  font-size: 11px;
  font-family: inherit;
  transition: border-color 0.15s, background 0.15s;

  img {
    width: 28px;
    height: 20px;
    border-radius: 3px;
    object-fit: cover;
  }

  .open-label {
    font-size: 9px;
    font-weight: 700;
    color: var(--dd-gold);
    text-transform: uppercase;
    margin-left: 2px;
  }

  &:hover {
    border-color: rgba(229, 181, 59, 0.45);
    color: var(--dd-text);
    background: rgba(229, 181, 59, 0.08);
  }
}
</style>
