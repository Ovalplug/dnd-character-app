<template>
  <div class="enc-create-root">
    <h1 class="enc-create-title">New Encounter</h1>
    <p class="enc-create-hint">
      Name your encounter then add creatures from the Monster resources page.
    </p>

    <div class="enc-create-form">
      <label class="form-label" for="encounter-name">Encounter Name</label>
      <input
        id="encounter-name"
        v-model="encounterName"
        placeholder="e.g. Goblin Ambush"
        class="enc-input"
        @keyup.enter="createEncounter"
      />
      <button
        class="creation-primary-button"
        @click="createEncounter"
        :disabled="!encounterName.trim()"
      >
        Create Encounter
      </button>
    </div>

    <p v-if="created" class="enc-success">
      Encounter created!
      <button class="enc-link-btn" @click="router.push('/encounters')">View all encounters</button>
    </p>
  </div>
</template>

<script lang="ts" setup>
  import { ref } from 'vue';
  import { useRouter } from 'vue-router';
  import { v4 as uuidv4 } from 'uuid';
  import { useEncounterStore } from '../../stores/encounterStore';

  const router = useRouter();
  const encounterName = ref('');
  const created = ref(false);
  const encounterStore = useEncounterStore();

  async function createEncounter() {
    if (!encounterName.value.trim()) return;
    const newEncounter = {
      id: uuidv4(),
      name: encounterName.value.trim(),
      updatedAt: Date.now(),
      monsters: [],
      players: [],
    };
    await encounterStore.addEncounter(newEncounter);
    encounterName.value = '';
    router.push(`/encounter/edit?id=${newEncounter.id}`);
  }
</script>

<style scoped>
  .enc-create-root {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    max-width: 480px;
    padding-bottom: 2rem;
  }

  .enc-create-title {
    margin: 0;
    color: var(--color-primary);
  }

  .enc-create-hint {
    margin: 0;
    color: var(--color-muted);
    font-size: 0.9rem;
  }

  .enc-create-form {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }

  .enc-input {
    width: 100%;
    padding: 0.65rem 0.85rem;
    border-radius: 8px;
    border: 1px solid rgba(107, 46, 46, 0.25);
    background: var(--color-surface);
    color: var(--color-text);
    font-size: 1rem;
    min-height: 44px;
  }

  .enc-input:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(107, 46, 46, 0.12);
  }

  .enc-success {
    margin: 0;
    color: var(--color-muted);
    font-size: 0.9rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .enc-link-btn {
    background: none;
    border: none;
    color: var(--color-primary);
    font-weight: 600;
    cursor: pointer;
    text-decoration: underline;
    padding: 0;
    font-size: inherit;
  }
</style>
