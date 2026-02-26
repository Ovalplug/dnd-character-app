<template>
  <ul>
    <div v-for="feat in feats" :key="feat.name" @click="selectFeat(feat)" class="feat-item">
      <p>
        {{ feat.name }}<span class="p2"> ({{ feat.source }})</span>
      </p>
    </div>
  </ul>
  <PopOut :title="featTitle" v-if="selectedFeat" :onClose="deselectFeat">
    <div v-if="debug">
      <pre>{{ JSON.stringify(selectedFeat, null, 2) }}</pre>
    </div>
    <div>
      <SingleFeat :feat="selectedFeat" />
    </div>
  </PopOut>
</template>

<script lang="ts" setup>
  //   import router from '../router';
  import type { Feat } from '../types';
  import PopOut from './PopOut.vue';
  import { computed, onMounted, ref } from 'vue';
  import { useDebug } from '../composables/useDebug';
  import { useDataStore } from '../stores/dataStore';
  import SingleFeat from './SingleFeat.vue';

  const { debug, initDebug } = useDebug();
  const dataStore = useDataStore();

  const { feats } = defineProps<{ feats: Feat[] }>();
  feats.sort((a, b) => a.name.localeCompare(b.name));
  const selectedFeat = ref<Feat | null>(null);

  const featTitle = computed(() => {
    return selectedFeat.value ? selectedFeat.value.name : '';
  });

  function selectFeat(feat: Feat) {
    selectedFeat.value = feat;
  }

  function deselectFeat() {
    selectedFeat.value = null;
  }

  onMounted(async () => {
    await initDebug();
    if (!dataStore.loaded) {
      try {
        await dataStore.init();
      } catch (err) {
        // keep this simple; devs can improve error handling/UI later
        // eslint-disable-next-line no-console
        console.error('Failed to load data store', err);
      }
    }
  });
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
</style>
