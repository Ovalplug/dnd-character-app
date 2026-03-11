<template>
  <div class="class-select-bar">
    <select v-model="currSelectionString" class="class-select">
      <option v-for="option in classOptions" :key="option" :value="option">{{ option }}</option>
    </select>
  </div>
  <div v-if="currSelectionString !== 'Tables'">
    <ResourceEntries :entries="currSelection" />
  </div>
  <div v-else>
    <div v-for="(table, i) in currSelection" :key="i">
      <EntryTable :table="table" />
    </div>
  </div>
</template>
<script lang="ts" setup>
  import { computed, onMounted, ref } from 'vue';
  import { useDebug } from '../../composables/useDebug';
  import { useDataStore } from '../../stores/dataStore';
  import type { CharClass, Subclass } from '../../types';
  import ResourceEntries from './ResourceEntries.vue';
  import EntryTable from './EntryTable.vue';

  const { initDebug } = useDebug();
  const dataStore = useDataStore();

  const props = defineProps<{
    currClass: CharClass;
    currSubclasses: Subclass[] | null;
  }>();

  const currSelectionString = ref('Info');
  //computed currSelection
  const currSelection = computed(() => {
    const sel = currSelectionString.value;
    if (sel === 'Info') {
      return props.currClass.fluff || [];
    } else if (sel === 'Base') {
      return props.currClass.featureList || [];
    } else if (sel === 'Tables') {
      return props.currClass.classTableGroups || [];
    } else {
      // Subclass selection
      if (!props.currSubclasses) return [];
      const subclass = props.currSubclasses.find(sub => sub.name === sel);
      return subclass && subclass.subclassFeatures ? subclass.subclassFeatures : [];
    }
  });

  const classOptions = ['Info', 'Base', 'Tables', ...getSubclassNamesForClass()];

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

  function getSubclassNamesForClass() {
    let returnArr: any[] = [];
    if (props.currSubclasses) {
      returnArr = props.currSubclasses.map(sub => sub.name);
    }

    //return alphabetical list of subclass names
    return returnArr.sort((a, b) => a.localeCompare(b));
  }
</script>
<style scoped>
  .class-select-bar {
    display: flex;
    justify-content: center;
    align-items: center;
    margin: 1rem 0;
  }

  .class-select {
    padding: 0.5rem 1rem;
    font-size: 1rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    background-color: #f9f9f9;
    color: #333;
    outline: none;
    transition: border-color 0.3s, box-shadow 0.3s;
  }

  .class-select:focus {
    border-color: #007bff;
    box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.25);
  }

  .class-select option {
    padding: 0.5rem;
  }
</style>
