<template>
  <div ref="elementRef" class="move-here-anchor"></div>
</template>

<script setup lang="ts">
  import { onMounted, ref } from 'vue';

  const elementRef = ref<HTMLElement | null>(null);

  onMounted(() => {
    elementRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
</script>

<style scoped>
  .move-here-anchor {
    width: 100%;
    height: 1px;
  }
</style>
