<script lang="ts">
import { defineComponent } from "vue";
import Hero from "../components/MainPage/Hero.vue";

export default defineComponent({
  name: "MainPage",
  components: {
    Hero,
  },
});
</script>

<template>
  <Hero />
</template>

<style lang="scss" scoped>

</style>