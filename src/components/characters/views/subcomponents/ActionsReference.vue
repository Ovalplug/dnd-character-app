<template>
  <section class="combat-section">
    <h3 class="section-label">Actions</h3>
    <div class="actions-grid">
      <div
        v-for="action in BASIC_ACTIONS"
        :key="`${action.type}-${action.name}`"
        class="action-chip"
        :class="`action-chip--${action.type.toLowerCase().replace(' ', '-')}`"
      >
        <span class="action-chip-type">{{ action.type }}</span>
        <span class="action-chip-name">{{ action.name }}</span>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
  import { BASIC_ACTIONS } from '../../../../constants';
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
</style>
