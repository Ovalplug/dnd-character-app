<template>
  <ul>
    <div v-for="race in races" :key="race.name" @click="selectRace(race)" class="race-item">
      <p>
        {{ race.name }}<span class="p2"> ({{ race.source }})</span>
      </p>
    </div>
  </ul>
  <PopOut :title="raceTitle" v-if="selectedRace" :onClose="deselectRace">
    <div v-if="debug">
      <pre>{{ JSON.stringify(selectedRace, null, 2) }}</pre>
    </div>
    <div>
      <SingleRace :race="selectedRace" :fluff="selectedFluff" />
    </div>
  </PopOut>
</template>

<script lang="ts" setup>
  import type { Race, RaceFluff } from '../types';
  import PopOut from './PopOut.vue';
  import { computed, onMounted, ref } from 'vue';
  import { useDebug } from '../composables/useDebug';
  import { useDataStore } from '../stores/dataStore';
  import SingleRace from './SingleRace.vue';

  const { debug, initDebug } = useDebug();
  const dataStore = useDataStore();

  const { races, raceFluff } = defineProps<{ races: Race[]; raceFluff: RaceFluff[] }>();
  races.sort((a, b) => a.name.localeCompare(b.name));
  const selectedRace = ref<Race | null>(null);
  const selectedFluff = ref<RaceFluff | undefined>(undefined);

  const raceTitle = computed(() => {
    return selectedRace.value ? selectedRace.value.name : '';
  });

  function selectRace(race: Race) {
    selectedRace.value = race;
    selectedFluff.value = raceFluff.find(fluff => fluff.name === race.name);
  }

  function deselectRace() {
    selectedRace.value = null;
    selectedFluff.value = undefined;
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
  .race-item {
    cursor: pointer;
    padding: 0.5rem;
    border-bottom: 1px solid #ccc;
  }

  .race-item:hover {
    background-color: #f0f0f0;
  }
</style>
