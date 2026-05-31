<template>
  <section class="combat-section">
    <h3 class="section-label">Actions</h3>
    <div class="actions-grid">
      <button
        v-for="action in BASIC_ACTIONS"
        :key="`${action.type}-${action.name}`"
        class="action-chip"
        :class="`action-chip--${action.type.toLowerCase().replace(' ', '-')}`"
        type="button"
        @click="selectedAction = action"
      >
        <span class="action-chip-type">{{ action.type }}</span>
        <span class="action-chip-name">{{ action.name }}</span>
      </button>
    </div>

    <PopOut
      v-if="selectedAction"
      :title="`${selectedAction.name} · ${selectedAction.type}`"
      mini
      @close="selectedAction = null"
    >
      <div class="action-rules-popout">
        <p class="action-rules-summary">{{ selectedAction.summary }}</p>
        <ul class="action-rules-list">
          <li v-for="rule in selectedAction.rules" :key="rule">{{ rule }}</li>
        </ul>
      </div>
    </PopOut>
  </section>
</template>

<script setup lang="ts">
  import { ref } from 'vue';
  import PopOut from '../../../PopOut.vue';
  import { BASIC_ACTIONS, type CombatAction } from '../../../../constants';

  const selectedAction = ref<CombatAction | null>(null);
</script>

<style scoped>
  .combat-section {
    background: var(--color-surface);
    border-radius: var(--radius);
    box-shadow: var(--color-card-shadow);
    padding: 0.75rem 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }

  .section-label {
    font-size: 0.72rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--color-muted);
    margin: 0;
  }

  .actions-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
  }

  .action-chip {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0.3rem 0.6rem;
    border-radius: 8px;
    font-size: 0.75rem;
    border-width: 1px;
    border-style: solid;
    cursor: pointer;
    transition: transform 0.12s ease, box-shadow 0.12s ease;
  }

  .action-chip:hover,
  .action-chip:focus-visible {
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(31, 27, 22, 0.08);
  }

  .action-chip:focus-visible {
    outline: 2px solid rgba(107, 46, 46, 0.25);
    outline-offset: 2px;
  }

  .action-chip-type {
    font-size: 0.55rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    opacity: 0.75;
  }

  .action-chip-name {
    font-weight: 600;
    white-space: nowrap;
  }

  .action-chip--action {
    background: rgba(107, 46, 46, 0.1);
    color: var(--color-primary);
    border: 1px solid rgba(107, 46, 46, 0.18);
  }

  .action-chip--special {
    background: rgba(46, 74, 107, 0.1);
    color: #2e4a6b;
    border: 1px solid rgba(46, 74, 107, 0.18);
  }

  .action-chip--reaction {
    background: rgba(201, 164, 75, 0.15);
    color: #7a5d1a;
    border: 1px solid rgba(201, 164, 75, 0.3);
  }

  .action-chip--bonus-action {
    background: rgba(74, 107, 46, 0.1);
    color: #4a6b2e;
    border: 1px solid rgba(74, 107, 46, 0.18);
  }

  .action-rules-popout {
    display: grid;
    gap: 0.9rem;
  }

  .action-rules-summary {
    margin: 0;
    font-size: 0.98rem;
    line-height: 1.55;
    color: var(--color-text);
  }

  .action-rules-list {
    margin: 0;
    padding-left: 1.2rem;
    display: grid;
    gap: 0.65rem;
    color: var(--color-text);
    line-height: 1.55;
  }
</style>
