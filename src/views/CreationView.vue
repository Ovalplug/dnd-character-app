<template>
  <div class="creation-view">
    <div class="view-header">
      <h1>Create & Manage</h1>
      <p class="subtitle">Create characters, encounters, spellbooks, backpacks, and items</p>
    </div>

    <div v-if="!isDataLoaded">
      <Loading />
    </div>

    <div v-else class="creation-grid">
      <!-- Characters Section -->
      <div class="section">
        <h2>Characters</h2>
        <button
          @click="navigateTo('/create/fullCreate')"
          :disabled="!isDataLoaded"
          class="creation-button primary"
        >
          <span class="button-icon">⚔️</span>
          <span class="button-text">
            <strong>Full Character</strong>
            <small>Complete character sheet</small>
          </span>
        </button>
      </div>

      <!-- Combat Section -->
      <div class="section">
        <h2>Combat</h2>
        <button
          @click="navigateTo('/create/encounter')"
          :disabled="!isDataLoaded"
          class="creation-button secondary"
        >
          <span class="button-icon">🎲</span>
          <span class="button-text">
            <strong>Encounter</strong>
            <small>Combat encounter setup</small>
          </span>
        </button>
      </div>

      <!-- Resources Section -->
      <div class="section">
        <h2>Resources</h2>
        <button
          @click="navigateTo('/create/spellbook')"
          :disabled="!isDataLoaded"
          class="creation-button secondary"
        >
          <span class="button-icon">📖</span>
          <span class="button-text">
            <strong>Spellbook</strong>
            <small>Manage spells and cantrips</small>
          </span>
        </button>
        <button
          @click="navigateTo('/create/backpack')"
          :disabled="!isDataLoaded"
          class="creation-button secondary"
        >
          <span class="button-icon">🎒</span>
          <span class="button-text">
            <strong>Backpack</strong>
            <small>Manage inventory</small>
          </span>
        </button>
        <button
          @click="navigateTo('/create/item')"
          :disabled="!isDataLoaded"
          class="creation-button secondary"
        >
          <span class="button-icon">✨</span>
          <span class="button-text">
            <strong>Item</strong>
            <small>Create custom items</small>
          </span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { useRouter } from 'vue-router';
  import { useDataStore } from '../stores/dataStore';
  import { onMounted, ref } from 'vue';
  import Loading from '../components/resources/Loading.vue';

  const router = useRouter();
  const dataStore = useDataStore();
  const isDataLoaded = ref(false);

  async function loadDataStore() {
    if (!dataStore.loaded) {
      try {
        await dataStore.init();
        isDataLoaded.value = true;
      } catch (err) {}
    } else {
      isDataLoaded.value = true;
    }
  }

  function navigateTo(path: string) {
    router.push(path);
  }

  onMounted(() => {
    loadDataStore();
  });
</script>

<style scoped>
  .creation-view {
    display: flex;
    flex-direction: column;
    gap: 2rem;
    padding: 2rem;
    max-width: 1200px;
    margin: 0 auto;
  }

  .view-header {
    text-align: center;
    margin-bottom: 1rem;
  }

  .view-header h1 {
    margin: 0;
    color: var(--color-primary);
    font-size: 2.5rem;
  }

  .subtitle {
    margin: 0.5rem 0 0 0;
    color: var(--color-muted);
    font-size: 1.1rem;
  }

  .creation-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: 2rem;
  }

  .section {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .section h2 {
    margin: 0;
    color: var(--color-primary);
    font-size: 1.3rem;
    padding-bottom: 0.5rem;
    border-bottom: 2px solid rgba(107, 46, 46, 0.2);
  }

  .creation-button {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem 1.5rem;
    border: 1px solid rgba(107, 46, 46, 0.2);
    border-radius: 8px;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.02), transparent);
    color: var(--color-text);
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: left;
    font-size: 1rem;
  }

  .creation-button:hover:not(:disabled) {
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.01));
    border-color: var(--color-primary);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(107, 46, 46, 0.15);
  }

  .creation-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .creation-button.primary {
    background: linear-gradient(135deg, var(--color-primary), #6b2e2e);
    border-color: var(--color-primary);
    color: white;
  }

  .creation-button.primary:hover:not(:disabled) {
    background: linear-gradient(135deg, #8b3e3e, #5c2424);
    box-shadow: 0 6px 16px rgba(107, 46, 46, 0.3);
  }

  .creation-button.secondary {
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.02), transparent);
    border-color: rgba(107, 46, 46, 0.2);
    color: var(--color-text);
  }

  .button-icon {
    font-size: 1.5rem;
    flex-shrink: 0;
  }

  .button-text {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .button-text strong {
    color: var(--color-primary);
    font-weight: 600;
  }

  .creation-button.primary .button-text strong {
    color: white;
  }

  .button-text small {
    font-size: 0.85rem;
    color: var(--color-muted);
  }

  .creation-button.primary .button-text small {
    color: rgba(255, 255, 255, 0.8);
  }

  @media (max-width: 768px) {
    .creation-view {
      padding: 1rem;
      gap: 1.5rem;
    }

    .view-header h1 {
      font-size: 2rem;
    }

    .creation-grid {
      grid-template-columns: 1fr;
      gap: 1.5rem;
    }

    .creation-button {
      padding: 0.8rem 1rem;
    }

    .button-icon {
      font-size: 1.25rem;
    }
  }
</style>
