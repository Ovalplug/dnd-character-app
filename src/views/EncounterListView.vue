<template>
  <div class="encounter-list-root">
    <div class="page-header">
      <h1>Encounters</h1>
      <button class="new-btn" @click="router.push('/create/encounter')">+ New</button>
    </div>

    <div v-if="!encounterStore.loaded" class="loading-state">
      <Loading message="Loading encounters..." :size="64" variant="bold" />
    </div>

    <div v-else-if="encounterStore.encounters.length === 0" class="empty-state">
      <img :src="swordIcon" class="empty-icon" alt="" />
      <p class="empty-text">No encounters yet.</p>
      <button class="creation-primary-button" @click="router.push('/create/encounter')">
        Create First Encounter
      </button>
    </div>

    <ul v-else class="encounter-list">
      <li v-for="encounter in encounterStore.encounters" :key="encounter.id" class="encounter-card">
        <div class="encounter-info">
          <span class="encounter-name">{{ encounter.name }}</span>
          <span class="encounter-meta">
            {{ encounter.monsters?.length ?? 0 }} creature{{
              (encounter.monsters?.length ?? 0) !== 1 ? 's' : ''
            }}
          </span>
        </div>
        <div class="encounter-actions">
          <button class="enc-btn enc-btn--run" @click="runEncounter(encounter.id)">Run</button>
          <button class="enc-btn enc-btn--edit" @click="editEncounter(encounter.id)">Edit</button>
          <button class="enc-btn enc-btn--delete" @click="confirmDelete(encounter)">Delete</button>
        </div>
      </li>
    </ul>

    <PopOut v-if="deleteTarget" title="Delete Encounter?" :mini="true" @close="deleteTarget = null">
      <div class="delete-confirm">
        <p>
          Delete <strong>{{ deleteTarget.name }}</strong
          >? This cannot be undone.
        </p>
        <div class="delete-actions">
          <button class="enc-btn enc-btn--delete" @click="doDelete">Delete</button>
          <button class="enc-btn" @click="deleteTarget = null">Cancel</button>
        </div>
      </div>
    </PopOut>
  </div>
</template>

<script setup lang="ts">
  import { onMounted, ref } from 'vue';
  import { useRouter } from 'vue-router';
  import { useEncounterStore } from '../stores/encounterStore';
  import Loading from '../components/resources/Loading.vue';
  import PopOut from '../components/PopOut.vue';
  import swordIcon from '../assets/icons/sword.svg?url';

  const router = useRouter();
  const encounterStore = useEncounterStore();

  const deleteTarget = ref<any>(null);

  onMounted(async () => {
    await encounterStore.loadEncounters();
  });

  function runEncounter(id: string) {
    router.push(`/encounter/run?id=${id}`);
  }

  function editEncounter(id: string) {
    router.push(`/encounter/edit?id=${id}`);
  }

  function confirmDelete(encounter: any) {
    deleteTarget.value = encounter;
  }

  async function doDelete() {
    if (!deleteTarget.value) return;
    await encounterStore.deleteEncounter(deleteTarget.value.id);
    deleteTarget.value = null;
  }
</script>

<style scoped>
  .encounter-list-root {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding-bottom: 2rem;
  }

  .page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid rgba(107, 46, 46, 0.12);
  }

  .page-header h1 {
    margin: 0;
    color: var(--color-primary);
  }

  .new-btn {
    padding: 0.5rem 1rem;
    border-radius: 8px;
    border: 1px solid rgba(107, 46, 46, 0.2);
    background: linear-gradient(90deg, var(--color-primary), var(--color-primary-600));
    color: #fff;
    font-weight: 700;
    font-size: 0.9rem;
    cursor: pointer;
    min-height: 44px;
    transition: transform 0.15s ease;
  }

  .new-btn:hover {
    transform: translateY(-1px);
  }

  .loading-state {
    display: flex;
    justify-content: center;
    padding: 3rem 0;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
    padding: 3rem 1rem;
    text-align: center;
    border: 1px dashed rgba(107, 46, 46, 0.2);
    border-radius: var(--radius);
    background: var(--color-surface);
  }

  .empty-icon {
    width: 56px;
    height: 56px;
    opacity: 0.3;
  }

  .empty-text {
    margin: 0;
    color: var(--color-muted);
    font-size: 1rem;
  }

  .encounter-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .encounter-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    border-radius: var(--radius);
    background: var(--color-surface);
    border: 1px solid rgba(107, 46, 46, 0.12);
    box-shadow: var(--color-card-shadow);
  }

  .encounter-info {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    min-width: 0;
  }

  .encounter-name {
    font-weight: 700;
    font-size: 1rem;
    color: var(--color-text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .encounter-meta {
    font-size: 0.8rem;
    color: var(--color-muted);
  }

  .encounter-actions {
    display: flex;
    gap: 0.4rem;
    flex-shrink: 0;
  }

  .enc-btn {
    padding: 0.4rem 0.75rem;
    border-radius: 7px;
    border: 1px solid rgba(107, 46, 46, 0.2);
    background: var(--color-bg);
    color: var(--color-text);
    font-weight: 600;
    font-size: 0.85rem;
    cursor: pointer;
    min-height: 36px;
    transition: background 0.15s ease;
  }

  .enc-btn:hover {
    background: rgba(107, 46, 46, 0.08);
  }

  .enc-btn--run {
    background: linear-gradient(90deg, var(--color-primary), var(--color-primary-600));
    color: #fff;
    border-color: transparent;
  }

  .enc-btn--run:hover {
    background: var(--color-primary-600);
  }

  .enc-btn--edit {
    border-color: var(--color-accent);
    color: var(--color-primary);
  }

  .enc-btn--delete {
    border-color: rgba(183, 59, 59, 0.3);
    color: var(--color-danger);
  }

  .enc-btn--delete:hover {
    background: rgba(183, 59, 59, 0.08);
  }

  .delete-confirm {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .delete-confirm p {
    margin: 0;
  }

  .delete-actions {
    display: flex;
    gap: 0.5rem;
    justify-content: flex-end;
  }
</style>
