<template>
  <!-- start with choosing a name (or a random one) -->
  <name-selector />

  <!-- then choose a race -->
  <race-selection />

  <!-- then choose a background -->
  <background-selection />

  <!-- then choose a class -->
  <class-selection />

  <!-- then choose ability scores -->
  <ability-score-selection />

  <pre>{{ store.characters }}</pre>
</template>

<script lang="ts" setup>
  import { useCharacterStore } from '../../stores/characterStore';
  import ClassSelection from './sections/ClassSelection.vue';
  import NameSelector from './sections/NameSelector.vue';
  import RaceSelection from './sections/RaceSelection.vue';
  import BackgroundSelection from './sections/BackgroundSelection.vue';
  import AbilityScoreSelection from './sections/AbilityscoreSelection.vue';

  const store = useCharacterStore();
</script>
