<template>
  <div class="class-select-bar">
    <select v-model="currSelectionString" class="class-select">
      <option v-for="option in classOptions" :key="option" :value="option">{{ option }}</option>
    </select>
  </div>
  <div v-if="currSelectionString === 'Base'">
    <div class="class-info-panel">
      <div class="class-info-row" v-if="props.currClass.hd">
        <span class="class-info-label">Hit Dice</span>
        <span class="class-info-value">1{{ props.currClass.hd }} per level</span>
      </div>
      <template v-for="line in proficiencyLines" :key="line">
        <div class="class-info-row">
          <span class="class-info-label">{{ line.split(':')[0] }}</span>
          <span class="class-info-value">{{ line.split(':').slice(1).join(':').trim() }}</span>
        </div>
      </template>
      <div class="class-info-equip" v-if="equipmentLines.length">
        <div class="class-info-label">Starting Equipment</div>
        <div v-for="line in equipmentLines" :key="line" class="class-info-equip-line">
          {{ line }}
        </div>
      </div>
    </div>
    <ResourceEntries :entries="currSelection" />
  </div>
  <div v-else-if="currSelectionString !== 'Tables'">
    <ResourceEntries :entries="currSelection" />
  </div>
  <div v-else>
    <FeatureTable :classFeatures="props.currClass.classFeatures" />
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
  import FeatureTable from './FeatureTable.vue';

  const { initDebug } = useDebug();
  const dataStore = useDataStore();

  const props = defineProps<{
    currClass: CharClass;
    currSubclasses: Subclass[] | null;
  }>();

  const currSelectionString = ref('Info');

  const proficiencyLines = computed(() => {
    if (!props.currClass.startingProficiencies) return [];
    return props.currClass.startingProficiencies
      .split('\n')
      .filter(l => l.trim() && l.includes(':'));
  });

  const equipmentLines = computed(() => {
    if (!props.currClass.startingEquipment) return [];
    return props.currClass.startingEquipment.split('\n').filter(l => l.trim());
  });

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
    margin: 0.75rem 0;
    padding: 0 0.5rem;
  }

  .class-select {
    padding: 0.6rem 1rem;
    font-size: 0.95rem;
    border: 1px solid rgba(107, 46, 46, 0.25);
    border-radius: 8px;
    background: var(--color-bg);
    color: var(--color-text);
    outline: none;
    min-height: 44px;
    max-width: 100%;
    cursor: pointer;
    transition: border-color 0.2s, box-shadow 0.2s;
  }

  .class-select:focus {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(107, 46, 46, 0.15);
  }

  .class-select option {
    padding: 0.5rem;
  }

  .class-info-panel {
    margin: 0 0.5rem 1rem;
    border: 1px solid rgba(107, 46, 46, 0.2);
    border-radius: 8px;
    overflow: hidden;
  }

  .class-info-row {
    display: flex;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    border-bottom: 1px solid rgba(107, 46, 46, 0.1);
    font-size: 0.9rem;
  }

  .class-info-row:last-child {
    border-bottom: none;
  }

  .class-info-label {
    font-weight: 600;
    color: var(--color-primary, #6b2e2e);
    min-width: 9rem;
    flex-shrink: 0;
  }

  .class-info-value {
    color: var(--color-text);
  }

  .class-info-equip {
    padding: 0.5rem 0.75rem;
    font-size: 0.9rem;
  }

  .class-info-equip .class-info-label {
    display: block;
    margin-bottom: 0.35rem;
  }

  .class-info-equip-line {
    color: var(--color-text);
    padding: 0.1rem 0;
    line-height: 1.5;
  }
</style>
