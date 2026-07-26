<template>
  <div v-if="debug">
    <!-- <pre>{{ classes }}</pre> -->
    <pre>{{ subclasses }}</pre>
  </div>
  <div class="class-container">
    <div class="search-row">
      <input v-model="searchVal" type="search" placeholder="Search classes…" class="search-input" />
    </div>
    <ul class="resource-list">
      <div
        v-for="charClass in filteredClasses"
        :key="charClass.name"
        @click="selectClass(charClass)"
        class="rl-item"
        tabindex="0"
        @keydown.enter="selectClass(charClass)"
        role="button"
      >
        <div class="rl-item__body">
          <span class="rl-item__name">{{ charClass.name }}</span>
          <div class="rl-item__tags">
            <span v-if="charClass.source" class="rl-tag rl-tag--source">{{
              charClass.source
            }}</span>
            <span v-if="charClass.hd" class="rl-tag rl-tag--primary">{{ charClass.hd }}</span>
            <span v-if="getSubclassCount(charClass) > 0" class="rl-tag"
              >{{ getSubclassCount(charClass) }} subclass{{
                getSubclassCount(charClass) !== 1 ? 'es' : ''
              }}</span
            >
          </div>
        </div>
      </div>
      <PopOut :title="selectedClass?.name" v-if="selectedClass" :onClose="deselectClass">
        <div>
          <SingleClass :currClass="selectedClass" :currSubclasses="selectedSubclasses" />
        </div>
      </PopOut>
    </ul>
  </div>
</template>

<script lang="ts" setup>
  import { computed, onMounted, ref } from 'vue';
  import { useDebug } from '../../composables/useDebug';
  import { useDataStore } from '../../stores/dataStore';
  import type { Classes, Subclasses, CharClass } from '../../types';
  import SingleClass from './SingleClass.vue';
  import PopOut from '../PopOut.vue';

  const { debug, initDebug } = useDebug();
  const dataStore = useDataStore();

  const props = defineProps<{
    classes: Classes;
    subclasses: Subclasses;
  }>();

  const searchVal = ref('');

  const filteredClasses = computed(() => {
    const sorted = [...props.classes].sort((a, b) => a.name.localeCompare(b.name));
    if (!searchVal.value.trim()) return sorted;
    const q = searchVal.value.trim().toLowerCase();
    return sorted.filter(c => c.name.toLowerCase().includes(q));
  });

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

  const selectedClass = ref<CharClass | null>(null);
  const selectedSubclasses = ref<any | null>(null);
  function selectClass(charClass: CharClass) {
    selectedClass.value = charClass;
    selectedSubclasses.value = selectSubclassesForClass(charClass);
  }
  function deselectClass() {
    selectedClass.value = null;
    selectedSubclasses.value = null;
  }
  function selectSubclassesForClass(charClass: CharClass) {
    return dataStore.subclasses[charClass.name];
  }
  function getSubclassCount(charClass: CharClass): number {
    return dataStore.subclasses[charClass.name]?.length ?? 0;
  }
</script>

<style scoped>
  .class-container {
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

  .class-item {
    cursor: pointer;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid rgba(107, 46, 46, 0.12);
    min-height: 44px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    transition: background 0.14s;
  }

  .class-item:hover,
  .class-item:focus-visible {
    background: var(--color-surface);
    outline: none;
  }

  .class-item p {
    margin: 0;
    font-size: 0.95rem;
  }
</style>
