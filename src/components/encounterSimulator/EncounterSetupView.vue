<template>
  <div class="encounter-setup">
    <div class="encounter-setup__header">
      <h1 class="encounter-setup__title">Combat Encounter Simulator</h1>
      <p class="encounter-setup__subtitle">Design your tactical encounter and watch AI battle</p>
    </div>

    <!-- Tabs -->
    <div class="encounter-setup__tabs">
      <button
        v-for="tab in tabs"
        :key="tab"
        class="encounter-setup__tab"
        :class="{ 'encounter-setup__tab--active': activeTab === tab }"
        @click="activeTab = tab"
      >
        {{ tabLabels[tab] }}
      </button>
    </div>

    <!-- Tab Content -->
    <div class="encounter-setup__content">
      <!-- Step 1: Map -->
      <div v-show="activeTab === 'map'" class="encounter-setup__panel">
        <SimpleMapEditor @map-updated="onMapUpdated" />
      </div>

      <!-- Step 2: Teams -->
      <div v-show="activeTab === 'teams'" class="encounter-setup__panel">
        <CombatantSelector :monsters="availableMonsters" @teams-selected="onTeamsSelected" />
      </div>

      <!-- Step 3: Settings -->
      <div v-show="activeTab === 'settings'" class="encounter-setup__panel">
        <div class="encounter-setup__settings">
          <div class="encounter-setup__setting-group">
            <label class="encounter-setup__label">Round Limit</label>
            <input
              v-model.number="simulationConfig.roundLimit"
              type="number"
              min="5"
              max="100"
              class="encounter-setup__input"
            />
          </div>

          <div class="encounter-setup__setting-group">
            <label class="encounter-setup__label">Resource Mode</label>
            <select v-model="simulationConfig.resourceMode" class="encounter-setup__select">
              <option value="low">Low</option>
              <option value="balanced">Balanced</option>
              <option value="max">Max</option>
            </select>
          </div>

          <div class="encounter-setup__summary">
            <h3 class="encounter-setup__summary-title">Configuration Summary</h3>
            <div class="encounter-setup__summary-item">
              <span>Map:</span>
              <span>{{ mapConfig ? `${mapConfig.width}x${mapConfig.height}` : 'Not set' }}</span>
            </div>
            <div class="encounter-setup__summary-item">
              <span>Allies:</span>
              <span>{{ alliesCount }} combatants</span>
            </div>
            <div class="encounter-setup__summary-item">
              <span>Enemies:</span>
              <span>{{ enemiesCount }} combatants</span>
            </div>
            <div class="encounter-setup__summary-item">
              <span>Rounds:</span>
              <span>{{ simulationConfig.roundLimit }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Step 4: Results -->
      <div v-show="activeTab === 'results'" class="encounter-setup__panel">
        <div v-if="isSimulating" class="encounter-setup__progress">
          <div class="encounter-setup__progress-bar">
            <div
              class="encounter-setup__progress-fill"
              :style="{ width: `${simulationProgress}%` }"
            ></div>
          </div>
          <p class="encounter-setup__progress-text">{{ simulationProgress }}% Complete</p>
        </div>

        <div v-else-if="lastResult" class="encounter-setup__results">
          <div class="encounter-setup__result-box">
            <h3>Battle Result: {{ lastResult.outcome }}</h3>
            <div class="encounter-setup__result-stats">
              <div class="encounter-setup__stat">
                <span class="encounter-setup__stat-label">Rounds:</span>
                <span class="encounter-setup__stat-value">{{ lastResult.totalRounds }}</span>
              </div>
              <div class="encounter-setup__stat">
                <span class="encounter-setup__stat-label">Turns:</span>
                <span class="encounter-setup__stat-value">{{ lastResult.totalTurns }}</span>
              </div>
              <div class="encounter-setup__stat">
                <span class="encounter-setup__stat-label">Survivors:</span>
                <span class="encounter-setup__stat-value">{{
                  lastResult.finalCombatants.length
                }}</span>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="encounter-setup__empty">
          <p>Run simulation to see results</p>
        </div>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="encounter-setup__actions">
      <button class="btn btn--secondary" @click="previousTab" :disabled="activeTabIndex === 0">
        Previous
      </button>
      <button class="btn btn--primary" @click="nextTabOrRun" :disabled="!canProceed">
        {{ activeTabIndex === 3 ? 'Run Simulation' : 'Next' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue';
  import { useSimulationStore } from '../../stores/simulationStore';
  import { useDataStore } from '../../stores/dataStore';
  import SimpleMapEditor from './SimpleMapEditor.vue';
  import CombatantSelector from './CombatantSelector.vue';
  import type { GameMap, SimulationConfig, Monster, CompositeRole } from '../../types';

  interface CombatantConfig {
    monster: Monster;
    role: CompositeRole;
  }

  const tabs = ref<Array<'map' | 'teams' | 'settings' | 'results'>>([
    'map',
    'teams',
    'settings',
    'results',
  ]);
  const tabLabels: Record<string, string> = {
    map: 'Map',
    teams: 'Teams',
    settings: 'Settings',
    results: 'Results',
  };

  const activeTab = ref<'map' | 'teams' | 'settings' | 'results'>('map');
  const simulationStore = useSimulationStore();
  const dataStore = useDataStore();

  const mapConfig = ref<GameMap | null>(null);
  const alliesConfig = ref<CombatantConfig[]>([]);
  const enemiesConfig = ref<CombatantConfig[]>([]);
  const simulationConfig = ref<Partial<SimulationConfig>>({
    roundLimit: 20,
    resourceMode: 'balanced' as const,
  });

  const availableMonsters = computed(() => dataStore.monsters?.slice(0, 20) || []);
  const alliesCount = computed(() => alliesConfig.value.length);
  const enemiesCount = computed(() => enemiesConfig.value.length);
  const isSimulating = computed(() => simulationStore.isRunning);
  const simulationProgress = computed(() => simulationStore.currentProgress);
  const lastResult = computed(() => simulationStore.currentSimulation);

  const activeTabIndex = computed(() => {
    const idx = tabs.value.indexOf(activeTab.value);
    return idx >= 0 ? idx : 0;
  });

  const canProceed = computed(() => {
    switch (activeTab.value) {
      case 'map':
        return mapConfig.value !== null;
      case 'teams':
        return alliesCount.value > 0 && enemiesCount.value > 0;
      case 'settings':
        return true;
      case 'results':
        return !isSimulating.value;
      default:
        return false;
    }
  });

  function onMapUpdated(map: GameMap): void {
    mapConfig.value = map;
  }

  function onTeamsSelected(allies: CombatantConfig[], enemies: CombatantConfig[]): void {
    alliesConfig.value = allies;
    enemiesConfig.value = enemies;
  }

  function previousTab(): void {
    const idx = activeTabIndex.value;
    if (idx > 0) {
      const prevTab = tabs.value[idx - 1];
      if (prevTab) activeTab.value = prevTab;
    }
  }

  function nextTabOrRun(): void {
    const idx = activeTabIndex.value;
    if (idx < tabs.value.length - 1) {
      const nextTab = tabs.value[idx + 1];
      if (nextTab) activeTab.value = nextTab;
    } else {
      runSimulation();
    }
  }

  async function runSimulation(): Promise<void> {
    if (!mapConfig.value || alliesCount.value === 0 || enemiesCount.value === 0) {
      return;
    }

    const config: SimulationConfig = {
      map: mapConfig.value as any,
      combatants: [
        ...alliesConfig.value.map(c => ({
          monster: c.monster,
          team: 'allies' as const,
          role: c.role,
          position: {
            x: Math.floor(Math.random() * mapConfig.value!.width),
            y: Math.floor(Math.random() * mapConfig.value!.height),
          } as any,
        })),
        ...enemiesConfig.value.map(c => ({
          monster: c.monster,
          team: 'enemies' as const,
          role: c.role,
          position: {
            x: Math.floor(Math.random() * mapConfig.value!.width),
            y: Math.floor(Math.random() * mapConfig.value!.height),
          } as any,
        })),
      ],
      resourceMode: (simulationConfig.value.resourceMode || 'balanced') as
        | 'low'
        | 'balanced'
        | 'max',
      roundLimit: simulationConfig.value.roundLimit || 20,
    };

    await simulationStore.runSimulation(config);
  }
</script>

<style scoped>
  .encounter-setup {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    padding: 1.5rem;
    background: var(--color-bg);
    min-height: 100vh;
  }

  .encounter-setup__header {
    text-align: center;
  }

  .encounter-setup__title {
    margin: 0;
    font-size: 2rem;
    color: var(--color-primary);
  }

  .encounter-setup__subtitle {
    margin: 0.5rem 0 0;
    color: var(--color-muted);
  }

  .encounter-setup__tabs {
    display: flex;
    gap: 0.5rem;
    border-bottom: 2px solid var(--color-muted);
    overflow-x: auto;
  }

  .encounter-setup__tab {
    padding: 0.75rem 1rem;
    background: transparent;
    border: none;
    border-bottom: 2px solid transparent;
    cursor: pointer;
    color: var(--color-muted);
    font-weight: 500;
    transition: all 0.2s;
  }

  .encounter-setup__tab--active {
    color: var(--color-primary);
    border-bottom-color: var(--color-primary);
  }

  .encounter-setup__tab:active:not(.encounter-setup__tab--active) {
    color: var(--color-text);
  }

  .encounter-setup__content {
    flex: 1;
    min-height: 400px;
  }

  .encounter-setup__panel {
    animation: fadeIn 0.2s ease-in;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .encounter-setup__settings {
    display: flex;
    flex-direction: column;
    gap: 2rem;
    padding: 1rem;
    background: var(--color-surface);
    border-radius: var(--radius);
  }

  .encounter-setup__setting-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .encounter-setup__label {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--color-text);
  }

  .encounter-setup__input,
  .encounter-setup__select {
    padding: 0.75rem;
    background: var(--color-bg);
    border: 1px solid var(--color-muted);
    border-radius: 4px;
    color: var(--color-text);
    font-size: 1rem;
  }

  .encounter-setup__summary {
    padding: 1rem;
    background: var(--color-bg);
    border-radius: 4px;
    border-left: 3px solid var(--color-accent);
  }

  .encounter-setup__summary-title {
    margin: 0 0 0.75rem;
    font-size: 0.875rem;
    color: var(--color-primary);
  }

  .encounter-setup__summary-item {
    display: flex;
    justify-content: space-between;
    padding: 0.5rem 0;
    font-size: 0.875rem;
    border-bottom: 1px solid var(--color-muted);
  }

  .encounter-setup__summary-item:last-child {
    border-bottom: none;
  }

  .encounter-setup__progress {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 2rem;
    text-align: center;
  }

  .encounter-setup__progress-bar {
    height: 8px;
    background: var(--color-muted);
    border-radius: 4px;
    overflow: hidden;
  }

  .encounter-setup__progress-fill {
    height: 100%;
    background: var(--color-accent);
    transition: width 0.2s;
  }

  .encounter-setup__progress-text {
    color: var(--color-text);
    font-weight: 500;
  }

  .encounter-setup__results {
    padding: 1rem;
  }

  .encounter-setup__result-box {
    padding: 1.5rem;
    background: var(--color-surface);
    border-radius: var(--radius);
    border-left: 4px solid var(--color-accent);
  }

  .encounter-setup__result-box h3 {
    margin: 0 0 1rem;
    color: var(--color-primary);
  }

  .encounter-setup__result-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 1rem;
  }

  .encounter-setup__stat {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .encounter-setup__stat-label {
    font-size: 0.75rem;
    color: var(--color-muted);
    text-transform: uppercase;
  }

  .encounter-setup__stat-value {
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--color-text);
  }

  .encounter-setup__empty {
    padding: 3rem 1rem;
    text-align: center;
    color: var(--color-muted);
  }

  .encounter-setup__actions {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
  }

  .btn {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: var(--radius);
    cursor: pointer;
    font-weight: 500;
    transition: all 0.2s;
    min-width: 120px;
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

  @media (max-width: 640px) {
    .encounter-setup {
      padding: 1rem;
    }

    .encounter-setup__title {
      font-size: 1.5rem;
    }

    .encounter-setup__actions {
      flex-direction: column;
    }

    .btn {
      min-width: unset;
      width: 100%;
    }
  }
</style>
