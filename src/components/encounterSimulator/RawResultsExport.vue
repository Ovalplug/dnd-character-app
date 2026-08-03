<template>
  <div class="results-export">
    <div class="results-export__header">
      <h2 class="results-export__title">Simulation Results</h2>
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
      <!-- Overview -->
      <div class="results-export__section">
        <h3 class="results-export__section-title">Overview</h3>
        <div class="overview-grid">
          <div class="overview-stat">
            <span class="overview-stat__label">Outcome</span>
            <span class="overview-stat__value" :class="outcomeClass">{{ outcomeLabel }}</span>
          </div>
          <div class="overview-stat">
            <span class="overview-stat__label">Rounds</span>
            <span class="overview-stat__value">{{ result.totalRounds }}</span>
          </div>
          <div class="overview-stat">
            <span class="overview-stat__label">Turns</span>
            <span class="overview-stat__value">{{ result.totalTurns }}</span>
          </div>
          <div class="overview-stat">
            <span class="overview-stat__label">Survivors</span>
            <span class="overview-stat__value"
              >{{ survivorList.length }} / {{ result.finalCombatants.length }}</span
            >
          </div>
        </div>
      </div>

      <!-- Initiative order -->
      <div class="results-export__section">
        <h3 class="results-export__section-title">Initiative Order</h3>
        <div class="init-table">
          <div class="init-table__head">
            <span>Name</span><span>Team</span><span>Init</span><span>Status</span>
          </div>
          <div
            v-for="(c, i) in initiativeOrder"
            :key="`init-${i}`"
            class="init-table__row"
            :class="c.died ? 'init-table__row--dead' : 'init-table__row--alive'"
          >
            <span class="init-name">{{ c.name }}</span>
            <span
              class="rl-tag"
              :class="c.team === 'allies' ? 'rl-tag--primary' : 'rl-tag--accent'"
              >{{ c.team }}</span
            >
            <span class="init-value">{{ c.initiative }}</span>
            <span>{{ c.died ? 'â˜ ' : 'âœ“' }}</span>
          </div>
        </div>
      </div>

      <!-- Combatant scorecards -->
      <div class="results-export__section">
        <h3 class="results-export__section-title">Combatant Scorecards</h3>
        <div class="scorecards">
          <div
            v-for="(c, i) in result.finalCombatants"
            :key="`card-${i}`"
            class="scorecard"
            :class="c.died ? 'scorecard--dead' : 'scorecard--alive'"
          >
            <div class="scorecard__name">
              {{ c.name }}
              <span
                class="rl-tag"
                :class="c.team === 'allies' ? 'rl-tag--primary' : 'rl-tag--accent'"
                >{{ c.team }}</span
              >
            </div>
            <div class="scorecard__hp-bar">
              <div class="scorecard__hp-fill" :style="{ width: hpPct(c) + '%' }"></div>
            </div>
            <div class="scorecard__stats">
              <div class="sc-stat">
                <span class="sc-stat__label">HP</span>
                <span class="sc-stat__value">{{ c.finalHp }} / {{ c.maxHp }}</span>
              </div>
              <div class="sc-stat">
                <span class="sc-stat__label">Dmg Dealt</span>
                <span class="sc-stat__value">{{ c.damageDealt }}</span>
              </div>
              <div class="sc-stat">
                <span class="sc-stat__label">Dmg Taken</span>
                <span class="sc-stat__value">{{ c.damageTaken }}</span>
              </div>
              <div class="sc-stat">
                <span class="sc-stat__label">Kills</span>
                <span class="sc-stat__value">{{ c.kills }}</span>
              </div>
              <div class="sc-stat" v-if="c.hitCount + c.missCount > 0">
                <span class="sc-stat__label">Hit Rate</span>
                <span class="sc-stat__value">{{ hitRate(c) }}%</span>
              </div>
              <div class="sc-stat" v-if="c.critCount > 0">
                <span class="sc-stat__label">Crits</span>
                <span class="sc-stat__value">{{ c.critCount }}</span>
              </div>
            </div>
            <!-- Resource usage -->
            <div class="scorecard__resources" v-if="hasResources(c)">
              <div
                v-for="(used, level) in c.resourcesUsed.spellSlots"
                :key="`slot-${level}`"
                class="sc-stat"
              >
                <span class="sc-stat__label">Lvl {{ level }} slots</span>
                <span class="sc-stat__value">{{ used }} used</span>
              </div>
              <div
                v-for="(used, spell) in c.resourcesUsed.dailySpellsUsed"
                :key="`daily-${spell}`"
                class="sc-stat"
              >
                <span class="sc-stat__label">{{ spell }}</span>
                <span class="sc-stat__value">{{ used }} used</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Turn log preview -->
      <div class="results-export__section" v-if="result.turnLog.length > 0">
        <h3 class="results-export__section-title">Turn Log (first 30)</h3>
        <div class="turn-log">
          <div
            v-for="(ev, i) in result.turnLog.slice(0, 30)"
            :key="`ev-${i}`"
            class="turn-log__entry"
          >
            <span class="turn-log__round">R{{ ev.round }}</span>
            <span
              class="turn-log__actor"
              :class="
                ev.combatantTeam === 'allies' ? 'turn-log__actor--ally' : 'turn-log__actor--enemy'
              "
              >{{ ev.combatantName }}</span
            >
            <span class="turn-log__text">{{ ev.outcome.events[0] ?? ev.actionTaken.name }}</span>
            <span class="turn-log__hp" v-if="ev.outcome.targetHpAfter !== undefined">
              â†’ {{ ev.outcome.targetName }} [{{ ev.outcome.targetHpAfter }} HP]
            </span>
          </div>
        </div>
      </div>

      <!-- Raw JSON -->
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

  const initiativeOrder = computed(() => {
    if (!props.result?.finalCombatants) return [];
    return [...props.result.finalCombatants].sort((a, b) => b.initiative - a.initiative);
  });

  const outcomeLabel = computed(() => {
    const o = props.result?.outcome;
    if (o === 'allies_win') return 'Allies Win';
    if (o === 'enemies_win') return 'Enemies Win';
    if (o === 'round_limit') return 'Round Limit Reached';
    return o ?? 'â€”';
  });

  const outcomeClass = computed(() => {
    const o = props.result?.outcome;
    if (o === 'allies_win') return 'outcome--allies';
    if (o === 'enemies_win') return 'outcome--enemies';
    return '';
  });

  function hpPct(c: SimulationResult['finalCombatants'][0]): number {
    if (!c.maxHp || c.maxHp <= 0) return 0;
    return Math.max(0, Math.min(100, Math.round((c.finalHp / c.maxHp) * 100)));
  }

  function hitRate(c: SimulationResult['finalCombatants'][0]): number {
    const total = c.hitCount + c.missCount + c.critCount;
    if (total === 0) return 0;
    return Math.round(((c.hitCount + c.critCount) / total) * 100);
  }

  function hasResources(c: SimulationResult['finalCombatants'][0]): boolean {
    const slots = Object.values(c.resourcesUsed.spellSlots).some(v => v > 0);
    const daily = Object.values(c.resourcesUsed.dailySpellsUsed ?? {}).some(v => v > 0);
    return slots || daily;
  }

  function exportJSON(): void {
    if (!props.result) return;
    const data = JSON.stringify(props.result, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    downloadFile(blob, `simulation-${props.result.seed}.json`);
  }

  function exportCSV(): void {
    if (!props.result?.finalCombatants) return;
    const rows: string[] = [];
    rows.push(
      'Name,Team,Initiative,MaxHp,FinalHp,HP%,DamageTaken,DamageDealt,Kills,Hits,Misses,Crits,HitRate%,Died'
    );
    for (const c of props.result.finalCombatants) {
      const pct = hpPct(c);
      const rate = hitRate(c);
      rows.push(
        `"${c.name}","${c.team}",${c.initiative},${c.maxHp},${c.finalHp},${pct}%,${c.damageTaken},${
          c.damageDealt
        },${c.kills},${c.hitCount},${c.missCount},${c.critCount},${rate}%,${c.died ? 'Yes' : 'No'}`
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
    font-size: 0.875rem;
    min-height: 44px;
  }
  .btn--primary {
    background: var(--color-accent);
    color: var(--color-text);
  }
  .btn--secondary {
    background: var(--color-primary);
    color: var(--color-surface);
  }
  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .results-export__data {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
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

  /* Overview */
  .overview-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 0.75rem;
  }
  .overview-stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0.75rem;
    background: var(--color-bg);
    border-radius: 8px;
  }
  .overview-stat__label {
    font-size: 0.75rem;
    color: var(--color-muted);
  }
  .overview-stat__value {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--color-text);
  }
  .outcome--allies {
    color: #2a8a2a;
  }
  .outcome--enemies {
    color: var(--color-danger);
  }

  /* Initiative table */
  .init-table {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  .init-table__head {
    display: grid;
    grid-template-columns: 1fr auto auto auto;
    gap: 0.5rem;
    padding: 0.25rem 0.5rem;
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--color-muted);
    text-transform: uppercase;
  }
  .init-table__row {
    display: grid;
    grid-template-columns: 1fr auto auto auto;
    gap: 0.5rem;
    align-items: center;
    padding: 0.4rem 0.5rem;
    border-radius: 6px;
    font-size: 0.875rem;
  }
  .init-table__row--alive {
    background: var(--color-bg);
  }
  .init-table__row--dead {
    background: var(--color-bg);
    opacity: 0.55;
  }
  .init-name {
    font-weight: 500;
  }
  .init-value {
    font-weight: 700;
    color: var(--color-accent);
  }

  /* Scorecards */
  .scorecards {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  .scorecard {
    padding: 0.875rem;
    background: var(--color-bg);
    border-radius: 8px;
    border-left: 4px solid var(--color-accent);
  }
  .scorecard--dead {
    border-left-color: var(--color-danger);
    opacity: 0.7;
  }
  .scorecard__name {
    font-weight: 600;
    font-size: 1rem;
    margin-bottom: 0.5rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .scorecard__hp-bar {
    height: 6px;
    background: var(--color-muted);
    border-radius: 3px;
    margin-bottom: 0.75rem;
    overflow: hidden;
  }
  .scorecard__hp-fill {
    height: 100%;
    background: var(--color-accent);
    border-radius: 3px;
    transition: width 0.3s;
  }
  .scorecard--dead .scorecard__hp-fill {
    background: var(--color-danger);
  }
  .scorecard__stats {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 0.5rem;
  }
  .scorecard__resources {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 0.5rem;
    padding-top: 0.5rem;
    border-top: 1px solid var(--color-muted);
  }
  .sc-stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0.4rem;
    background: var(--color-surface);
    border-radius: 6px;
  }
  .sc-stat__label {
    font-size: 0.7rem;
    color: var(--color-muted);
  }
  .sc-stat__value {
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--color-text);
  }

  /* Turn log */
  .turn-log {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    max-height: 320px;
    overflow-y: auto;
  }
  .turn-log__entry {
    display: flex;
    align-items: baseline;
    gap: 0.5rem;
    padding: 0.3rem 0.4rem;
    background: var(--color-bg);
    border-radius: 4px;
    font-size: 0.8rem;
    flex-wrap: wrap;
  }
  .turn-log__round {
    color: var(--color-muted);
    min-width: 28px;
    font-size: 0.7rem;
  }
  .turn-log__actor {
    font-weight: 600;
    min-width: 80px;
  }
  .turn-log__actor--ally {
    color: var(--color-primary);
  }
  .turn-log__actor--enemy {
    color: var(--color-accent);
  }
  .turn-log__text {
    flex: 1;
    color: var(--color-text);
  }
  .turn-log__hp {
    color: var(--color-muted);
    font-size: 0.75rem;
  }

  /* Raw JSON */
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
    box-sizing: border-box;
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
