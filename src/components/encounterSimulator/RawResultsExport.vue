<template>
  <div class="results-export">
    <div class="results-export__header">
      <h2 class="results-export__title">Export Simulation Results</h2>
      <p class="results-export__subtitle" v-if="result">Seed: {{ result.seed }}</p>
    </div>

    <div class="results-export__controls">
      <button class="btn btn--primary" @click="exportJSON" :disabled="!result">Export JSON</button>
      <button class="btn btn--primary" @click="exportCSV" :disabled="!result">Export CSV</button>
      <button class="btn btn--secondary" @click="copyToClipboard" :disabled="!result">
        Copy JSON
      </button>
    </div>

    <div v-if="result" class="results-export__data">
      <div class="results-export__section">
        <h3 class="results-export__section-title">Overview</h3>
        <div class="results-export__table">
          <div class="results-export__row">
            <span class="results-export__label">Outcome:</span>
            <span class="results-export__value">{{ result.outcome }}</span>
          </div>
          <div class="results-export__row">
            <span class="results-export__label">Total Rounds:</span>
            <span class="results-export__value">{{ result.totalRounds }}</span>
          </div>
          <div class="results-export__row">
            <span class="results-export__label">Total Turns:</span>
            <span class="results-export__value">{{ result.totalTurns }}</span>
          </div>
          <div class="results-export__row">
            <span class="results-export__label">Survivors:</span>
            <span class="results-export__value">{{ result?.finalCombatants?.length || 0 }}</span>
          </div>
        </div>
      </div>

      <div class="results-export__section">
        <h3 class="results-export__section-title">Survivors</h3>
        <div class="results-export__table">
          <div
            v-for="(comb, idx) in survivorList"
            :key="`survivor-${idx}`"
            class="results-export__row"
          >
            <span class="results-export__label">{{ comb.name }}</span>
            <span class="results-export__value"
              >HP: {{ comb.finalHp }}, Damage Dealt: {{ comb.damageDealt }}</span
            >
          </div>
        </div>
      </div>

      <div class="results-export__section">
        <h3 class="results-export__section-title">Combat Statistics</h3>
        <div class="results-export__table">
          <div
            v-for="(comb, idx) in result.finalCombatants"
            :key="`stat-${idx}`"
            class="results-export__row"
          >
            <span class="results-export__label">{{ comb.name }}</span>
            <span class="results-export__value"
              >Kills: {{ comb.kills }}, Damage Taken: {{ comb.damageTaken }}</span
            >
          </div>
        </div>
      </div>

      <div class="results-export__raw">
        <h3 class="results-export__section-title">Raw JSON</h3>
        <textarea
          class="results-export__textarea"
          :value="JSON.stringify(result, null, 2)"
          readonly
        ></textarea>
      </div>
    </div>

    <div v-else class="results-export__empty">
      <p>No results to export. Run a simulation first.</p>
    </div>

    <div v-if="copied" class="results-export__toast">Copied to clipboard!</div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue';
  import type { SimulationResult } from '../../types';

  const props = defineProps<{
    result?: SimulationResult | null;
  }>();

  const copied = ref(false);

  const survivorList = computed(() => {
    if (!props.result?.finalCombatants) return [];
    return props.result.finalCombatants.filter(c => !c.died);
  });

  function exportJSON(): void {
    if (!props.result) return;

    const data = JSON.stringify(props.result, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    downloadFile(blob, `simulation-${props.result.seed}.json`);
  }

  function exportCSV(): void {
    if (!props.result?.finalCombatants) return;

    const rows: string[] = [];
    rows.push('Name,Team,FinalHp,DamageTaken,DamageDealt,Kills,Died');

    for (const comb of props.result.finalCombatants) {
      const died = comb.died ? 'Yes' : 'No';
      rows.push(
        `"${comb.name}","${comb.team}",${comb.finalHp},${comb.damageTaken},${comb.damageDealt},${comb.kills},${died}`
      );
    }

    const csv = rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    downloadFile(blob, `simulation-${props.result.seed}.csv`);
  }

  function downloadFile(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function copyToClipboard(): void {
    if (!props.result) return;

    const data = JSON.stringify(props.result, null, 2);
    navigator.clipboard.writeText(data).then(() => {
      copied.value = true;
      setTimeout(() => {
        copied.value = false;
      }, 2000);
    });
  }
</script>

<style scoped>
  .results-export {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    padding: 1.5rem;
    background: var(--color-bg);
    border-radius: var(--radius);
  }

  .results-export__header {
    text-align: center;
  }

  .results-export__title {
    margin: 0;
    font-size: 1.5rem;
    color: var(--color-primary);
  }

  .results-export__subtitle {
    margin: 0.5rem 0 0;
    color: var(--color-muted);
    font-size: 0.875rem;
  }

  .results-export__controls {
    display: flex;
    gap: 0.75rem;
    justify-content: center;
    flex-wrap: wrap;
  }

  .btn {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: var(--radius);
    cursor: pointer;
    font-weight: 500;
    transition: all 0.2s;
    font-size: 0.875rem;
  }

  .btn--primary {
    background: var(--color-accent);
    color: var(--color-text);
  }

  .btn--primary:active:not(:disabled) {
    background: #b8923a;
  }

  .btn--secondary {
    background: var(--color-primary);
    color: var(--color-surface);
  }

  .btn--secondary:active:not(:disabled) {
    background: #8b1f1f;
  }

  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .results-export__data {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    max-height: 800px;
    overflow-y: auto;
  }

  .results-export__section {
    background: var(--color-surface);
    border-radius: var(--radius);
    padding: 1rem;
    border: 1px solid var(--color-muted);
  }

  .results-export__section-title {
    margin: 0 0 0.75rem;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-primary);
    text-transform: uppercase;
    border-bottom: 1px solid var(--color-muted);
    padding-bottom: 0.5rem;
  }

  .results-export__table {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .results-export__row {
    display: flex;
    justify-content: space-between;
    padding: 0.5rem 0;
    font-size: 0.875rem;
    border-bottom: 1px solid var(--color-muted);
  }

  .results-export__row:last-child {
    border-bottom: none;
  }

  .results-export__label {
    font-weight: 500;
    color: var(--color-muted);
  }

  .results-export__value {
    color: var(--color-text);
    text-align: right;
  }

  .results-export__log {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    max-height: 300px;
    overflow-y: auto;
    font-size: 0.75rem;
  }

  .results-export__log-entry {
    display: flex;
    gap: 0.5rem;
    padding: 0.25rem;
    background: var(--color-bg);
    border-radius: 2px;
  }

  .results-export__log-round {
    color: var(--color-primary);
    font-weight: 500;
    min-width: 40px;
  }

  .results-export__log-actor {
    color: var(--color-accent);
    font-weight: 500;
    min-width: 80px;
  }

  .results-export__log-event {
    color: var(--color-text);
    flex: 1;
  }

  .results-export__raw {
    background: var(--color-surface);
    border-radius: var(--radius);
    padding: 1rem;
    border: 1px solid var(--color-muted);
  }

  .results-export__textarea {
    width: 100%;
    height: 300px;
    padding: 0.75rem;
    background: var(--color-bg);
    border: 1px solid var(--color-muted);
    border-radius: 4px;
    color: var(--color-text);
    font-family: 'Courier New', monospace;
    font-size: 0.75rem;
    resize: vertical;
  }

  .results-export__empty {
    padding: 3rem 1rem;
    text-align: center;
    color: var(--color-muted);
  }

  .results-export__toast {
    position: fixed;
    bottom: 2rem;
    right: 2rem;
    padding: 1rem 1.5rem;
    background: var(--color-primary);
    color: var(--color-surface);
    border-radius: var(--radius);
    font-weight: 500;
    animation: slideUp 0.3s ease-out;
  }

  @keyframes slideUp {
    from {
      transform: translateY(100%);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  @media (max-width: 640px) {
    .results-export {
      padding: 1rem;
    }

    .results-export__controls {
      flex-direction: column;
    }

    .btn {
      width: 100%;
    }

    .results-export__toast {
      left: 1rem;
      right: 1rem;
      bottom: 1rem;
    }
  }
</style>
