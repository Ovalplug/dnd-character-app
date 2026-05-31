<template>
  <section class="creation-panel">
    <div class="creation-intro">
      <p>Choose the race first, then narrow into a subrace if that ancestry offers one.</p>
    </div>

    <div class="creation-actions creation-actions--top">
      <button
        type="button"
        class="creation-primary-button"
        @click="updateRace"
        :disabled="!canProceed"
      >
        Continue
      </button>
    </div>

    <div class="creation-summary">
      <span class="creation-summary__label">Current selection</span>
      <span class="creation-summary__value">{{ selectedSummary }}</span>
    </div>

    <div
      v-if="!selectedRace || !selectedRace.subraces || !selectedRace.subraces.length"
      class="creation-table-wrap"
    >
      <table class="creation-table">
        <thead>
          <tr>
            <th>Race</th>
            <th>Info</th>
            <th class="creation-table__choice">Select</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(race, index) in sortedRaces" :key="index">
            <td>{{ race.name }}</td>
            <td>
              <button type="button" class="creation-icon-button" @click="openPopOut(index)">
                <img :src="questionIcon" alt="info" width="20" height="20" />
              </button>
            </td>
            <td class="creation-table__choice">
              <input
                type="radio"
                name="selected-race"
                :checked="selectedRaceIndex === index"
                @change="selectRace(index)"
                :id="'race-' + index"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div
      v-if="selectedRace && selectedRace.subraces && selectedRace.subraces.length"
      class="creation-stack"
    >
      <div class="creation-actions race-selection__subrace-actions">
        <span class="creation-summary__label">{{ selectedRace.name }} subrace</span>
        <button type="button" class="creation-secondary-button" @click="clearRace">
          Change race
        </button>
      </div>
      <div class="creation-table-wrap">
        <table class="creation-table">
          <thead>
            <tr>
              <th>Subrace</th>
              <th class="creation-table__choice">Select</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(subrace, i) in selectedRace.subraces" :key="i">
              <td>{{ subrace.name }}</td>
              <td class="creation-table__choice">
                <input
                  type="radio"
                  name="selected-subrace"
                  :checked="selectedSubraceIndex === i"
                  @change="selectSubrace(i)"
                  :id="'subrace-' + i"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <PopOut :title="raceTitleForPopout" v-if="showPopOut" :onClose="closePopOut">
      <SingleRace v-if="selectedPopoutRace" :race="selectedPopoutRace" :fluff="selectedFluff" />
    </PopOut>

    <div class="creation-actions">
      <button
        type="button"
        class="creation-primary-button"
        @click="updateRace"
        :disabled="!canProceed"
      >
        Continue
      </button>
    </div>
  </section>
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

  const selectedRaceIndex = ref<number | null>(
    (() => {
      const currentRace = store.getCharRace();
      if (!currentRace) return null;
      const index = sortedRaces.value.findIndex(
        race => race.name === currentRace.name && race.source === currentRace.source
      );
      return index >= 0 ? index : null;
    })()
  );
  const selectedSubraceIndex = ref<number | null>(
    (() => {
      const currentRace = store.getCharRace();
      const currentSubrace = store.currNewCharacter?.subrace;
      if (!currentRace || !currentSubrace) return null;
      const race = sortedRaces.value.find(
        entry => entry.name === currentRace.name && entry.source === currentRace.source
      );
      const index =
        race?.subraces?.findIndex(subrace => subrace.name === currentSubrace.name) ?? -1;
      return index >= 0 ? index : null;
    })()
  );
  const selectedRaceForInfoIndex = ref<number | null>(null);
  const selectedFluff = ref<RaceFluff | undefined>(
    (() => {
      const currentRace = store.getCharRace();
      return currentRace
        ? props.raceFluff.find(fluff => fluff.name === currentRace.name)
        : undefined;
    })()
  );
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

  const selectedSummary = computed(() => {
    if (!selectedRace.value) return 'No race selected';
    const selectedSubrace =
      selectedSubraceIndex.value !== null
        ? selectedRace.value.subraces?.[selectedSubraceIndex.value]
        : undefined;
    if (selectedSubrace) {
      return `${selectedRace.value.name} (${selectedSubrace.name})`;
    }
    return selectedRace.value.name;
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
    selectedRaceForInfoIndex.value = null;
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
  .race-selection__subrace-actions {
    justify-content: space-between;
  }
</style>
