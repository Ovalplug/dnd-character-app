import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { SimulationConfig, SimulationResult, ResourceMode } from '../types';
import { SimulationEngine } from '../components/encounterSimulator/simulationEngine';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import seedrandom from 'seedrandom';

interface SplitTestResults {
  low: SimulationResult;
  balanced: SimulationResult;
  max: SimulationResult;
}

interface BatchRun {
  runIndex: number;
  results: SplitTestResults;
}

export const useSimulationStore = defineStore('simulation', () => {
  const currentSimulation = ref<SimulationResult | null>(null);
  const splitTestResults = ref<SplitTestResults | null>(null);
  const batchRuns = ref<BatchRun[]>([]);
  const isRunning = ref(false);
  const currentProgress = ref(0);
  const error = ref<string | null>(null);

  async function runSimulation(config: SimulationConfig, seed?: string): Promise<SplitTestResults | null> {
    isRunning.value = true;
    currentProgress.value = 0;
    error.value = null;

    return new Promise(resolve => {
      setTimeout(() => {
        try {
          const results: SplitTestResults = {} as SplitTestResults;
          const modes: ResourceMode[] = ['low', 'balanced', 'max'];
          const baseSeed = seed || `sim-${Date.now()}-${Math.random()}`;

          for (let i = 0; i < modes.length; i++) {
            const mode = modes[i] as ResourceMode;
            // Create new config for this mode
            const modeConfig: SimulationConfig = { ...config, resourceMode: mode };

            // Create seeded PRNG for each mode run
            const modeSeed = `${baseSeed}-${mode}`;
            const rng = seedrandom(modeSeed);
            const engine = new SimulationEngine(modeConfig, rng);
            const result = engine.executeSimulation();
            
            // Set the seed in the result
            (result as any).seed = baseSeed;
            results[mode] = result;

            // Update progress
            currentProgress.value = Math.round(((i + 1) / modes.length) * 100);
          }

          splitTestResults.value = results;
          // Keep the first result (balanced) as currentSimulation for backwards compatibility
          currentSimulation.value = results.balanced;
          isRunning.value = false;

          resolve(results);
        } catch (err) {
          error.value = err instanceof Error ? err.message : 'Unknown error during simulation';
          console.error('Simulation error:', err);
          isRunning.value = false;
          currentProgress.value = 0;
          resolve(null);
        }
      }, 0);
    });
  }

  function clearCurrent(): void {
    currentSimulation.value = null;
    splitTestResults.value = null;
    error.value = null;
  }

  async function runBatchSimulation(
    config: SimulationConfig,
    numberOfRuns: number,
    seed?: string
  ): Promise<BatchRun[] | null> {
    isRunning.value = true;
    currentProgress.value = 0;
    error.value = null;
    batchRuns.value = [];

    return new Promise(resolve => {
      setTimeout(() => {
        try {
          const runs: BatchRun[] = [];
          const baseSeed = seed || `batch-${Date.now()}-${Math.random()}`;

          for (let runNum = 0; runNum < numberOfRuns; runNum++) {
            const results: SplitTestResults = {} as SplitTestResults;
            const modes: ResourceMode[] = ['low', 'balanced', 'max'];
            const runSeed = `${baseSeed}-run${runNum}`;

            for (let i = 0; i < modes.length; i++) {
              const mode = modes[i] as ResourceMode;
              const modeConfig: SimulationConfig = { ...config, resourceMode: mode };

              // Create seeded PRNG for each mode run
              const modeSeed = `${runSeed}-${mode}`;
              const rng = seedrandom(modeSeed);
              const engine = new SimulationEngine(modeConfig, rng);
              const result = engine.executeSimulation();
              
              // Set the seed in the result
              (result as any).seed = runSeed;
              results[mode] = result;
            }

            runs.push({
              runIndex: runNum + 1,
              results,
            });

            // Update progress based on total operations (runs * 3 modes)
            const totalOps = numberOfRuns * 3;
            const completed = (runNum + 1) * 3;
            currentProgress.value = Math.round((completed / totalOps) * 100);
          }

          batchRuns.value = runs;
          isRunning.value = false;

          resolve(runs);
        } catch (err) {
          error.value = err instanceof Error ? err.message : 'Unknown error during batch simulation';
          console.error('Batch simulation error:', err);
          isRunning.value = false;
          currentProgress.value = 0;
          resolve(null);
        }
      }, 0);
    });
  }

  /**
   * Helper to aggregate stats for a set of results
   */
  function aggregateResultStats(results: SimulationResult[]) {
    if (results.length === 0) {
      return {
        totalRuns: 0,
        allyWinRate: 0,
        averageRounds: 0,
        averageTurns: 0,
        perCombatantStats: [],
      };
    }

    const totalRuns = results.length;
    const allyWins = results.filter(r => r.outcome === 'allies_win').length;
    const allyWinRate = totalRuns > 0 ? (allyWins / totalRuns) * 100 : 0;

    const avgRounds = results.reduce((sum, r) => sum + r.totalRounds, 0) / totalRuns;
    const avgTurns = results.reduce((sum, r) => sum + r.totalTurns, 0) / totalRuns;

    // Per-combatant stats with action tracking
    const combatantMap = new Map<string, any>();
    for (const result of results) {
      for (const combatant of result.finalCombatants) {
        if (!combatantMap.has(combatant.name)) {
          combatantMap.set(combatant.name, {
            name: combatant.name,
            team: combatant.team,
            damageDealt: 0,
            damageTaken: 0,
            kills: 0,
            deaths: 0,
            runCount: 0,
            actions: new Map<string, number>(),
            spellSlotsUsed: new Map<number, number>(),
          });
        }
        const stats = combatantMap.get(combatant.name)!;
        stats.damageDealt += combatant.damageDealt;
        stats.damageTaken += combatant.damageTaken;
        stats.kills += combatant.kills;
        if (combatant.died) stats.deaths++;
        stats.runCount++;

        // Track actions
        for (const action of combatant.actions || []) {
          const count = stats.actions.get(action.type) || 0;
          stats.actions.set(action.type, count + action.count);
        }

        // Track spell slot usage
        for (const [level, used] of Object.entries(combatant.resourcesUsed?.spellSlots || {})) {
          const levelNum = parseInt(level, 10);
          const count = stats.spellSlotsUsed.get(levelNum) || 0;
          stats.spellSlotsUsed.set(levelNum, count + (used as number));
        }
      }
    }

    const perCombatantStats = Array.from(combatantMap.values()).map(stat => ({
      name: stat.name,
      team: stat.team,
      avgDamageDealt: stat.damageDealt / stat.runCount,
      avgDamageTaken: stat.damageTaken / stat.runCount,
      killRate: stat.kills / stat.runCount,
      deathRate: stat.deaths / stat.runCount,
      actions: Object.fromEntries(stat.actions),
      avgSpellSlotsUsed: Object.fromEntries(stat.spellSlotsUsed),
    }));

    return {
      totalRuns,
      allyWinRate,
      averageRounds: Math.round(avgRounds * 10) / 10,
      averageTurns: Math.round(avgTurns * 10) / 10,
      perCombatantStats,
    };
  }

  const batchStatistics = computed(() => {
    if (batchRuns.value.length === 0) return null;

    // Collect results by mode
    const lowResults: SimulationResult[] = [];
    const balancedResults: SimulationResult[] = [];
    const maxResults: SimulationResult[] = [];

    for (const run of batchRuns.value) {
      lowResults.push(run.results.low as SimulationResult);
      balancedResults.push(run.results.balanced as SimulationResult);
      maxResults.push(run.results.max as SimulationResult);
    }

    const allResults = [...lowResults, ...balancedResults, ...maxResults];

    // Aggregate overall stats
    const overall = aggregateResultStats(allResults);

    // Per-mode stats
    const perMode = {
      low: aggregateResultStats(lowResults),
      balanced: aggregateResultStats(balancedResults),
      max: aggregateResultStats(maxResults),
    };

    return {
      ...overall,
      perMode,
    };
  });

  /**
   * Export batch statistics as CSV
   */
  function exportStatisticsAsCSV(): string {
    if (!batchStatistics.value) return '';

    const stats = batchStatistics.value;
    const lines: string[] = [];

    // Header: Overall stats
    lines.push('OVERALL STATISTICS');
    lines.push(`Total Runs,${stats.totalRuns}`);
    lines.push(`Ally Win Rate,${stats.allyWinRate.toFixed(1)}%`);
    lines.push(`Average Rounds,${stats.averageRounds}`);
    lines.push(`Average Turns,${stats.averageTurns}`);
    lines.push('');

    // Per-mode breakdown
    lines.push('PER-MODE STATISTICS');
    lines.push('Mode,Runs,Win Rate,Avg Rounds,Avg Turns');
    for (const mode of ['low', 'balanced', 'max'] as const) {
      const modeStats = stats.perMode[mode];
      lines.push(
        `${mode},${modeStats.totalRuns},${modeStats.allyWinRate.toFixed(1)}%,${modeStats.averageRounds},${modeStats.averageTurns}`
      );
    }
    lines.push('');

    // Per-combatant stats
    lines.push('PER-COMBATANT STATISTICS (Aggregate)');
    lines.push('Name,Team,Avg Damage Dealt,Avg Damage Taken,Kill Rate,Death Rate');
    for (const combatant of stats.perCombatantStats) {
      lines.push(
        `"${combatant.name}",${combatant.team},${combatant.avgDamageDealt.toFixed(2)},${combatant.avgDamageTaken.toFixed(2)},${(combatant.killRate * 100).toFixed(1)}%,${(combatant.deathRate * 100).toFixed(1)}%`
      );
    }
    lines.push('');

    // Per-mode combatant stats
    for (const mode of ['low', 'balanced', 'max'] as const) {
      lines.push(`PER-COMBATANT STATISTICS (${mode.toUpperCase()} MODE)`);
      lines.push('Name,Team,Avg Damage Dealt,Avg Damage Taken,Kill Rate,Death Rate');
      for (const combatant of stats.perMode[mode].perCombatantStats) {
        lines.push(
          `"${combatant.name}",${combatant.team},${combatant.avgDamageDealt.toFixed(2)},${combatant.avgDamageTaken.toFixed(2)},${(combatant.killRate * 100).toFixed(1)}%,${(combatant.deathRate * 100).toFixed(1)}%`
        );
      }
      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Download statistics as CSV file
   */
  function downloadStatisticsCSV(): void {
    const csv = exportStatisticsAsCSV();
    if (!csv) return;

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    link.setAttribute('href', url);
    link.setAttribute('download', `encounter-sim-stats-${timestamp}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return {
    currentSimulation,
    splitTestResults,
    batchRuns,
    isRunning,
    currentProgress,
    error,
    runSimulation,
    runBatchSimulation,
    batchStatistics,
    clearCurrent,
    exportStatisticsAsCSV,
    downloadStatisticsCSV,
  };
});
