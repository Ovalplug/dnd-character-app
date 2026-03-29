<template>
  <div class="container">
    <button class="next-btn" @click="updateRace" :disabled="!canProceed">Next</button>
    <table
      v-if="!selectedRace || !selectedRace.subraces || !selectedRace.subraces.length"
      class="race-table"
    >
      <thead>
        <tr>
          <th>Race Name</th>
          <th>Info</th>
          <th>Select</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(race, index) in sortedRaces" :key="index">
          <td>{{ race.name }}</td>
          <td>
            <button class="icon-btn" @click="openPopOut(index)">
              <img :src="questionIcon" alt="info" width="20" height="20" />
            </button>
          </td>
          <td>
            <input
              type="checkbox"
              :checked="selectedRaceIndex === index"
              @change="selectRace(index)"
              :id="'race-' + index"
            />
          </td>
        </tr>
      </tbody>
    </table>

    <div
      v-if="selectedRace && selectedRace.subraces && selectedRace.subraces.length"
      class="subrace-section"
    >
      <h3>{{ selectedRace.name }} — Choose a Subrace</h3>
      <button class="back-btn" @click="clearRace">← Back</button>
      <table class="race-table">
        <thead>
          <tr>
            <th>Subrace Name</th>
            <th>Select</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(subrace, i) in selectedRace.subraces" :key="i">
            <td>{{ subrace.name }}</td>
            <td>
              <input
                type="checkbox"
                :checked="selectedSubraceIndex === i"
                @change="selectSubrace(i)"
                :id="'subrace-' + i"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <PopOut :title="raceTitleForPopout" v-if="showPopOut" :onClose="closePopOut">
      <SingleRace v-if="selectedPopoutRace" :race="selectedPopoutRace" :fluff="selectedFluff" />
    </PopOut>
    <button class="next-btn" @click="updateRace" :disabled="!canProceed">Next</button>
  </div>
</template>

<script lang="ts" setup>
  import PopOut from '../../PopOut.vue';
  import questionIcon from '../../../assets/icons/question.svg';
  import SingleRace from '../../resources/SingleRace.vue';
  import { computed, ref } from 'vue';
  import type { Race, RaceFluff } from '../../../types';
  import { useCharacterStore } from '../../../stores/characterStore';

  const store = useCharacterStore();

  const props = defineProps<{ races: Race[]; raceFluff: RaceFluff[] }>();
  const emit = defineEmits<{
    (e: 'nextStep'): void;
  }>();

  const sortedRaces = computed(() => {
    return [...props.races].sort((a, b) => a.name.localeCompare(b.name));
  });

  const selectedRaceIndex = ref<number | null>(null);
  const selectedSubraceIndex = ref<number | null>(null);
  const selectedRaceForInfoIndex = ref<number | null>(null);
  const selectedFluff = ref<RaceFluff | undefined>(undefined);
  const showPopOut = ref(false);

  const selectedRace = computed(() => {
    return selectedRaceIndex.value !== null ? sortedRaces.value[selectedRaceIndex.value] : null;
  });

  const canProceed = computed(() => {
    if (!selectedRace.value) return false;
    if (selectedRace.value.subraces && selectedRace.value.subraces.length > 0) {
      return selectedSubraceIndex.value !== null;
    }
    return true;
  });

  const selectedPopoutRace = computed(() => {
    return selectedRaceForInfoIndex.value !== null
      ? sortedRaces.value[selectedRaceForInfoIndex.value]
      : null;
  });

  const raceTitleForPopout = computed(() => {
    return selectedPopoutRace.value ? selectedPopoutRace.value.name : '';
  });

  function selectRace(index: number) {
    selectedRaceIndex.value = index;
    selectedSubraceIndex.value = null;
    const race = sortedRaces.value[index];
    if (race) {
      selectedFluff.value = props.raceFluff.find(fluff => fluff.name === race.name);
    } else {
      selectedFluff.value = undefined;
    }
  }

  function selectSubrace(index: number) {
    selectedSubraceIndex.value = index;
  }

  function clearRace() {
    selectedRaceIndex.value = null;
    selectedSubraceIndex.value = null;
    selectedFluff.value = undefined;
  }

  function openPopOut(index: number) {
    selectedRaceForInfoIndex.value = index;
    const race = sortedRaces.value[index];
    if (race) {
      selectedFluff.value = props.raceFluff.find(fluff => fluff.name === race.name);
    } else {
      selectedFluff.value = undefined;
    }
    showPopOut.value = true;
  }

  function closePopOut() {
    showPopOut.value = false;
  }

  function updateRace() {
    if (selectedRace.value) {
      store.updateCharacterRace(selectedRace.value);
      if (
        selectedRace.value.subraces &&
        selectedRace.value.subraces.length > 0 &&
        selectedSubraceIndex.value !== null
      ) {
        store.updateCharacterSubrace(
          selectedRace.value.subraces[selectedSubraceIndex.value] ?? null
        );
      }
    }
    emit('nextStep');
  }
</script>

<style scoped>
  .race-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 1rem;
  }
  .race-table th,
  .race-table td {
    border: 1px solid #ccc;
    padding: 0.5rem;
    text-align: left;
  }
  .icon-btn {
    background: none;
    border: none;
    cursor: pointer;
  }
  .icon-btn img {
    vertical-align: middle;
  }
  .next-btn {
    margin-top: 1rem;
    padding: 0.5rem 1rem;
    font-size: 1rem;
  }
  .container {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .subrace-section {
    width: 100%;
    margin-top: 1rem;
  }
  .subrace-section h3 {
    margin-bottom: 0.5rem;
  }
  .back-btn {
    margin-bottom: 0.75rem;
    padding: 0.25rem 0.75rem;
    font-size: 0.9rem;
    cursor: pointer;
  }
</style>
