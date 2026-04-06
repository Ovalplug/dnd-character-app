<template>
  <div v-if="debug">
    <!-- <pre>{{ classes }}</pre> -->
    <pre>{{ subclasses }}</pre>
  </div>
  <ul class="resource-list">
    <div
      v-for="charClass in classes"
      :key="charClass.name"
      @click="selectClass(charClass)"
      class="class-item"
      tabindex="0"
      @keydown.enter="selectClass(charClass)"
      role="button"
    >
      <p>
        {{ charClass.name }}<span class="p2"> ({{ charClass.source }})</span>
      </p>
    </div>
    <PopOut :title="selectedClass?.name" v-if="selectedClass" :onClose="deselectClass">
      <div>
        <SingleClass :currClass="selectedClass" :currSubclasses="selectedSubclasses" />
      </div>
    </PopOut>
  </ul>
</template>

<script lang="ts" setup>
  import { onMounted, ref } from 'vue';
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
</script>

<style scoped>
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
