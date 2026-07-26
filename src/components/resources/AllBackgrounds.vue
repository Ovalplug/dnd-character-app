<template>
  <div class="bg-container">
    <div class="search-row">
      <input v-model="searchVal" type="search" placeholder="Search backgrounds…" class="search-input" />
    </div>
    <ul class="resource-list">
    <div
      v-for="bg in filteredBackgrounds"
      :key="bg.name"
      @click="selectBackground(bg)"
      class="rl-item"
      tabindex="0"
      @keydown.enter="selectBackground(bg)"
      role="button"
    >
      <div class="rl-item__body">
        <span class="rl-item__name">{{ bg.name }}</span>
        <div class="rl-item__tags">
          <span v-if="bg.source" class="rl-tag rl-tag--source">{{ bg.source }}</span>
          <span v-if="getSkillSummary(bg)" class="rl-tag">{{ getSkillSummary(bg) }}</span>
        </div>
      </div>
    </div>
  </ul>
  </div>
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

  const searchVal = ref('');

  // Don't mutate props in-place. Create a sorted copy instead.
  const sortedBackgrounds = computed(() =>
    [...props.backgrounds].sort((a, b) => a.name.localeCompare(b.name))
  );

  const filteredBackgrounds = computed(() => {
    if (!searchVal.value.trim()) return sortedBackgrounds.value;
    const q = searchVal.value.trim().toLowerCase();
    return sortedBackgrounds.value.filter(bg => bg.name.toLowerCase().includes(q));
  });

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

  function getSkillSummary(bg: Background): string {
    const profs = bg.skillProficiencies;
    if (!profs) return '';
    const skills: string[] = [];
    if (Array.isArray(profs)) {
      for (const item of profs) {
        if (typeof item === 'string') {
          skills.push(item.charAt(0).toUpperCase() + item.slice(1));
        } else if (typeof item === 'object' && item !== null) {
          Object.entries(item).forEach(([k, v]) => {
            if (v === true) skills.push(k.charAt(0).toUpperCase() + k.slice(1));
          });
        }
      }
    } else if (typeof profs === 'object') {
      Object.entries(profs as Record<string, boolean>).forEach(([k, v]) => {
        if (v === true) skills.push(k.charAt(0).toUpperCase() + k.slice(1));
      });
    }
    return skills.slice(0, 3).join(', ');
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
  .bg-container {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .search-row {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }

  .search-input {
    flex: 1;
    padding: 0.6rem 0.8rem;
    border: 1px solid var(--color-muted);
    border-radius: 8px;
    background: var(--color-surface);
    color: var(--color-text);
    font-size: 1rem;
    min-height: 44px;
  }

  .search-input:focus {
    outline: 2px solid var(--color-primary);
    outline-offset: 1px;
  }

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
