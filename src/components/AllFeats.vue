<template>
  <ul>
    <div v-for="feat in feats" :key="feat.name" @click="selectFeat(feat)" class="feat-item">
      <p>
        {{ feat.name }}<span class="p2"> ({{ feat.source }})</span>
      </p>
    </div>
  </ul>
  <PopOut :title="featTitle" v-if="selectedFeat" :onClose="deselectFeat">
    <p>me me me</p>
  </PopOut>
</template>

<script lang="ts" setup>
  //   import router from '../router';
  import type { Feat } from '../types';
  import PopOut from './PopOut.vue';
  import { computed, ref } from 'vue';

  const { feats } = defineProps<{ feats: Feat[] }>();
  feats.sort((a, b) => a.name.localeCompare(b.name));

  const selectedFeat = ref<string | null>(null);
  const featTitle = computed(() => {
    const feat = feats.find(f => queryParameterisedFeatName(f.name) === selectedFeat.value);
    return feat ? feat.name : '';
  });

  function selectFeat(feat: Feat) {
    selectedFeat.value = queryParameterisedFeatName(feat.name);
  }

  function deselectFeat() {
    selectedFeat.value = null;
  }
  function queryParameterisedFeatName(name: string) {
    return name.toLowerCase().replace(/\s+/g, '-');
  }
</script>

<style scoped>
  .feat-item {
    cursor: pointer;
    padding: 0.5rem;
    border-bottom: 1px solid #ccc;
  }

  .feat-item:hover {
    background-color: #f0f0f0;
  }

  .p2 {
    font-size: 0.75rem;
    color: #666;
  }
</style>
