<template>
  <ul class="resource-list">
    <div
      v-for="bg in sortedBackgrounds"
      :key="bg.name"
      @click="selectBackground(bg)"
      class="background-item"
      tabindex="0"
      @keydown.enter="selectBackground(bg)"
      role="button"
    >
      <p>
        {{ bg.name }}<span class="p2"> ({{ bg.source }})</span>
      </p>
    </div>
  </ul>
  <PopOut :title="backgroundTitle" v-if="selectedBackground" :onClose="deselectBackground">
    <div v-if="debug">
      <pre>{{ JSON.stringify(selectedBackground, null, 2) }}</pre>
    </div>
    <div>
      <SingleBackground
        :background="selectedBackground"
        :backgroundFluff="selectedBackgroundFluff"
      />
    </div>
  </PopOut>
</template>

<script lang="ts" setup>
  import type { Backgrounds, BackgroundFluffs, Background } from '../../types';
  import PopOut from '../PopOut.vue';
  import { computed, onMounted, ref } from 'vue';
  import { useDebug } from '../../composables/useDebug';
  import { useDataStore } from '../../stores/dataStore';
  import SingleBackground from './SingleBackground.vue';

  const { debug, initDebug } = useDebug();
  const dataStore = useDataStore();

  const props = defineProps<{ backgrounds: Backgrounds; backgroundFluffs: BackgroundFluffs }>();

  // Don't mutate props in-place. Create a sorted copy instead.
  const sortedBackgrounds = computed(() =>
    [...props.backgrounds].sort((a, b) => a.name.localeCompare(b.name))
  );

  const selectedBackground = ref<Background | null>(null);
  const selectedBackgroundFluff = computed(() => {
    if (!selectedBackground.value) return undefined;
    return (
      props.backgroundFluffs.find(
        fluff =>
          fluff.name === selectedBackground.value?.name &&
          fluff.source === selectedBackground.value?.source
      ) || undefined
    );
  });

  const backgroundTitle = computed(() =>
    selectedBackground.value ? selectedBackground.value.name : ''
  );

  function selectBackground(bg: Background) {
    selectedBackground.value = bg;
  }

  function deselectBackground() {
    selectedBackground.value = null;
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
  .resource-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .background-item {
    cursor: pointer;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid rgba(107, 46, 46, 0.12);
    min-height: 44px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    transition: background 0.14s;
  }

  .background-item:hover,
  .background-item:focus-visible {
    background: var(--color-surface);
    outline: none;
  }

  .background-item p {
    margin: 0;
    font-size: 0.95rem;
  }
</style>
