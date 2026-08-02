import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { SimulationConfig, SimulationResult } from '../types';
import { SimulationEngine } from '../components/encounterSimulator/simulationEngine';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PRNG = any;

export const useSimulationStore = defineStore('simulation', () => {
  const currentSimulation = ref<SimulationResult | null>(null);
  const isRunning = ref(false);
  const currentProgress = ref(0);

  async function runSimulation(config: SimulationConfig): Promise<SimulationResult> {
    isRunning.value = true;
    currentProgress.value = 0;

    return new Promise(resolve => {
      setTimeout(() => {
        // Simple seeded PRNG
        const prng: PRNG = () => Math.random();
        const engine = new SimulationEngine(config, prng);
        const result = engine.executeSimulation();

        currentSimulation.value = result;
        isRunning.value = false;
        currentProgress.value = 100;

        resolve(result);
      }, 0);
    });
  }

  function clearCurrent(): void {
    currentSimulation.value = null;
  }

  return {
    currentSimulation,
    isRunning,
    currentProgress,
    runSimulation,
    clearCurrent,
  };
});
