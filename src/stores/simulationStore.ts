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

  const batchStatistics = computed(() => {
    if (batchRuns.value.length === 0) return null;

    // Aggregate statistics across all runs
    const allResults: SimulationResult[] = [];
    for (const run of batchRuns.value) {
      allResults.push(run.results.low as SimulationResult);
      allResults.push(run.results.balanced as SimulationResult);
      allResults.push(run.results.max as SimulationResult);
    }

    const totalRuns = allResults.length;

    // Count ally wins
    const allyWins = allResults.filter(r => r.outcome === 'allies_win').length;
    const allyWinRate = totalRuns > 0 ? (allyWins / totalRuns) * 100 : 0;

    // Average rounds and turns
    const avgRounds = allResults.reduce((sum, r) => sum + r.totalRounds, 0) / totalRuns;
    const avgTurns = allResults.reduce((sum, r) => sum + r.totalTurns, 0) / totalRuns;

    // Per-combatant stats
    const combatantMap = new Map<string, any>();
    for (const result of allResults) {
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
          });
        }
        const stats = combatantMap.get(combatant.name)!;
        stats.damageDealt += combatant.damageDealt;
        stats.damageTaken += combatant.damageTaken;
        stats.kills += combatant.kills;
        if (combatant.died) stats.deaths++;
        stats.runCount++;
      }
    }

    const perCombatantStats = Array.from(combatantMap.values()).map(stat => ({
      name: stat.name,
      team: stat.team,
      avgDamageDealt: stat.damageDealt / stat.runCount,
      avgDamageTaken: stat.damageTaken / stat.runCount,
      killRate: stat.kills / stat.runCount,
      deathRate: stat.deaths / stat.runCount,
    }));

    return {
      totalRuns,
      allyWinRate,
      averageRounds: Math.round(avgRounds * 10) / 10,
      averageTurns: Math.round(avgTurns * 10) / 10,
      perCombatantStats,
    };
  });

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
  };
});
