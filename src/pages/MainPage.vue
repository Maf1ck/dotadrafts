<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useHead } from "@vueuse/head";
import Hero from "../components/MainPage/Hero.vue";

const { t } = useI18n();

useHead(computed(() => ({
  title: t('seo.home.title'),
  meta: [
    { name: 'description', content: t('seo.home.description') }
  ]
})));
</script>

<template>
  <Hero />
</template>

<style lang="scss" scoped>

</style>