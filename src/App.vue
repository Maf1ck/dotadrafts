<script setup lang="ts">
import { useHead } from '@vueuse/head'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import AppHeader from './components/MainPage/AppHeader.vue'
import AppFooter from './components/MainPage/AppFooter.vue'

const { locale } = useI18n()

useHead(computed(() => ({
  htmlAttrs: {
    lang: locale.value,
  },
})))
</script>

<template>
  <div class="app-layout">
    <AppHeader />
    <main class="main-content">
      <router-view />
    </main>
    <AppFooter />
  </div>
</template>

<style scoped>
.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  /* space for sticky header */
  padding-top: 0;
}
</style>
