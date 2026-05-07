<template>
  <div class="settings-root">
    <h1 class="settings-title">Settings</h1>

    <section class="settings-section">
      <h2 class="settings-section-title">Resource Sources</h2>
      <p class="settings-hint">
        Toggle which sourcebooks are visible across the app. Disabled sources are hidden from all
        resource lists.
      </p>

      <div v-if="!dataStore.loaded" class="settings-loading">Loading sources…</div>

      <div v-else>
        <div class="source-controls">
          <button class="btn-secondary" @click="dataStore.enableAllSources()">Enable All</button>
          <button class="btn-secondary" @click="dataStore.disableAllSources()">Disable All</button>
        </div>

        <ul class="source-list">
          <li
            v-for="source in dataStore.allSources"
            :key="source.acronym"
            class="source-item"
            :class="{ disabled: !isEnabled(source.acronym) }"
          >
            <label class="source-label">
              <input
                type="checkbox"
                class="source-checkbox"
                :checked="isEnabled(source.acronym)"
                @change="dataStore.toggleSource(source.acronym)"
              />
              <span class="source-name">{{ source.name }}</span>
              <span class="source-acronym">{{ source.acronym }}</span>
            </label>
          </li>
        </ul>
      </div>
    </section>
  </div>
</template>

<script lang="ts" setup>
  import { onMounted } from 'vue';
  import { useDataStore } from '../stores/dataStore';

  const dataStore = useDataStore();

  onMounted(async () => {
    if (!dataStore.loaded) {
      await dataStore.init();
    }
  });

  function isEnabled(acronym: string): boolean {
    return dataStore.enabledSources[acronym] !== false;
  }
</script>

<style scoped>
  .settings-root {
    max-width: 720px;
    padding: 1rem 0;
  }

  .settings-title {
    margin: 0 0 1.5rem;
    font-size: 1.75rem;
    color: var(--color-primary);
  }

  .settings-section {
    background: var(--color-surface);
    border: 1px solid var(--color-accent);
    border-radius: var(--radius);
    padding: 1.25rem 1.5rem;
  }

  .settings-section-title {
    margin: 0 0 0.35rem;
    font-size: 1.1rem;
    color: var(--color-primary);
  }

  .settings-hint {
    margin: 0 0 1rem;
    font-size: 0.875rem;
    color: var(--color-muted);
  }

  .settings-loading {
    color: var(--color-muted);
    font-style: italic;
  }

  .source-controls {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 0.875rem;
  }

  .btn-secondary {
    padding: 0.35rem 0.85rem;
    border: 1px solid var(--color-accent);
    border-radius: 6px;
    background: transparent;
    color: var(--color-primary);
    cursor: pointer;
    font-size: 0.85rem;
    transition: background 0.15s;
  }

  .btn-secondary:hover {
    background: var(--color-accent);
    color: #fff;
  }

  .source-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
  }

  .source-item {
    border-radius: 6px;
    transition: background 0.1s;
  }

  .source-item:hover {
    background: rgba(201, 164, 75, 0.12);
  }

  .source-item.disabled .source-name {
    opacity: 0.45;
    text-decoration: line-through;
  }

  .source-label {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.45rem 0.5rem;
    cursor: pointer;
    user-select: none;
  }

  .source-checkbox {
    width: 1rem;
    height: 1rem;
    accent-color: var(--color-primary);
    flex-shrink: 0;
  }

  .source-name {
    flex: 1;
    font-size: 0.9rem;
    color: var(--color-text);
  }

  .source-acronym {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--color-muted);
    background: rgba(122, 107, 87, 0.12);
    border-radius: 4px;
    padding: 0.1rem 0.4rem;
    letter-spacing: 0.03em;
    flex-shrink: 0;
  }
</style>
