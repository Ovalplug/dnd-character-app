<template>
  <div class="container">
    <table class="race-table">
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
            <button class="icon-btn" @click="openPopOut(race)">
              <img :src="questionIcon" alt="info" width="20" height="20" />
            </button>
          </td>
          <td>
            <input
              type="checkbox"
              :checked="selectedRace?.name === race.name"
              @change="selectRace(race)"
              :id="'race-' + race.name"
            />
          </td>
        </tr>
      </tbody>
    </table>
    <PopOut :title="raceTitle" v-if="showPopOut" :onClose="closePopOut">
      <SingleRace v-if="selectedRace" :race="selectedRace" :fluff="selectedFluff" />
    </PopOut>
    <button class="next-btn" @click="updateRace" :disabled="!selectedRace">Next</button>
  </div>
</template>
<script lang="ts" setup>
  import PopOut from '../../PopOut.vue';
  import questionIcon from '../../../assets/icons/question.svg';
  import SingleRace from '../../resources/SingleRace.vue';
  import { computed, ref } from 'vue';
  import type { Race, RaceFluff } from '../../../types';

  const props = defineProps<{ races: Race[]; raceFluff: RaceFluff[] }>();
  const emit = defineEmits<{
    (e: 'nextStep'): void;
  }>();

  const sortedRaces = computed(() => {
    return [...props.races].sort((a, b) => a.name.localeCompare(b.name));
  });

  const selectedRace = ref<Race | null>(null);
  const selectedFluff = ref<RaceFluff | undefined>(undefined);
  const showPopOut = ref(false);

  const raceTitle = computed(() => {
    return selectedRace.value ? selectedRace.value.name : '';
  });

  function selectRace(race: Race) {
    selectedRace.value = race;
    selectedFluff.value = props.raceFluff.find(fluff => fluff.name === race.name);
  }

  function openPopOut(race: Race) {
    selectRace(race);
    showPopOut.value = true;
  }

  function closePopOut() {
    showPopOut.value = false;
  }

  function updateRace() {
    //i'll add this logic later; for now just move to the next step
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
</style>
