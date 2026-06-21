<template>
  <EncounterMain :participants="participants" :spells="spells" />
</template>

<script lang="ts" setup>
  import EncounterMain from '../components/encounters/EncounterMain.vue';

  import { useDataStore } from '../stores/dataStore';

  const dataStore = useDataStore();

  const participants = dataStore.monsters.slice(0, 3); // Get the first three monsters for the encounter
  const spells = dataStore.spells;
</script>
