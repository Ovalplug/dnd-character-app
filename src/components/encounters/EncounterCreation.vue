<template>
  <div>
    <h1>Encounter Creation</h1>
    <p>Once created, you will be able to view from the Encounter List.</p>
    <p>You can add creatures directly from the resource library.</p>
    <input v-model="encounterName" placeholder="Encounter Name" />
    <button @click="createEncounter" :disabled="!encounterName">Create Encounter</button>
  </div>
</template>

<script lang="ts" setup>
  import { ref } from 'vue';
  import { v4 as uuidv4 } from 'uuid';
  import { useEncounterStore } from '../../stores/encounterStore';
  import type { EncounterCreature } from '../../types';

  const encounterName = ref('');
  const encounterStore = useEncounterStore();

  async function createEncounter() {
    if (!encounterName.value) return;
    const newEncounter = {
      id: uuidv4(),
      name: encounterName.value,
      updatedAt: Date.now(),
      monsters: [] as EncounterCreature[],
      players: [],
    };
    await encounterStore.addEncounter(newEncounter);
    encounterName.value = '';
  }
</script>
