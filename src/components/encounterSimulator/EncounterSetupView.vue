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
            <label class="encounter-setup__label">Random Seed (Optional)</label>
            <input
              v-model="simulationSeed"
              type="text"
              placeholder="Leave empty for random seed"
              class="encounter-setup__input"
            />
            <p class="encounter-setup__help-text">Use a seed to reproduce the same encounter. Share seeds to let others replay your battles.</p>
          </div>

          <div class="encounter-setup__setting-group">
            <label class="encounter-setup__label">Number of Batch Runs</label>
            <input
              v-model.number="numberOfRuns"
              type="number"
              min="1"
              max="50"
              class="encounter-setup__input"
            />
            <p class="encounter-setup__help-text">Run 1 = single simulation (3 modes). Run N = batch of N simulations (3N total).</p>
          </div>

          <div class="encounter-setup__setting-info">
            <p><strong>Note:</strong> Each run executes in all 3 resource modes (Low, Balanced, Max) for split testing analysis.</p>
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
            <div class="encounter-setup__summary-item">
              <span>Seed:</span>
              <span>{{ simulationSeed || 'Random' }}</span>
            </div>
            <div class="encounter-setup__summary-item">
              <span>Batch Runs:</span>
              <span>{{ numberOfRuns }} ({{ numberOfRuns * 3 }} total with all modes)</span>
            </div>
            <div class="encounter-setup__summary-item">
              <span>Test Modes:</span>
              <span>Low, Balanced, Max (all 3)</span>
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

        <div v-else-if="simulationError" class="encounter-setup__error">
          <h3>Simulation Error</h3>
          <p>{{ simulationError }}</p>
          <button class="btn btn--secondary" @click="clearError">Dismiss</button>
        </div>

        <div v-else-if="batchStats" class="encounter-setup__results">
          <div class="encounter-setup__batch-header">
            <h3 class="encounter-setup__split-title">Batch Statistics ({{ batchStats.totalRuns }} simulations)</h3>
            <button class="btn btn--secondary" @click="downloadCSV" title="Download statistics as CSV">
              ⬇ Download CSV
            </button>
          </div>

          <div class="encounter-setup__batch-summary">
            <div class="encounter-setup__batch-stat">
              <span class="encounter-setup__batch-stat-label">Ally Win Rate:</span>
              <span class="encounter-setup__batch-stat-value">{{ batchStats.allyWinRate.toFixed(1) }}%</span>
            </div>
            <div class="encounter-setup__batch-stat">
              <span class="encounter-setup__batch-stat-label">Avg Rounds:</span>
              <span class="encounter-setup__batch-stat-value">{{ batchStats.averageRounds }}</span>
            </div>
            <div class="encounter-setup__batch-stat">
              <span class="encounter-setup__batch-stat-label">Avg Turns:</span>
              <span class="encounter-setup__batch-stat-value">{{ batchStats.averageTurns }}</span>
            </div>
          </div>

          <!-- Per-Mode Breakdown -->
          <div class="encounter-setup__mode-breakdown">
            <h4>Per-Mode Breakdown</h4>
            <div class="encounter-setup__mode-table">
              <div class="encounter-setup__mode-header">
                <span>Mode</span>
                <span>Runs</span>
                <span>Win Rate</span>
                <span>Avg Rounds</span>
                <span>Avg Turns</span>
              </div>
              <div v-for="mode in (['low', 'balanced', 'max'] as const)" :key="mode" class="encounter-setup__mode-row">
                <span>{{ mode }}</span>
                <span>{{ modeStats[mode]?.totalRuns || 0 }}</span>
                <span>{{ modeStats[mode]?.allyWinRate.toFixed(1) || '-' }}%</span>
                <span>{{ modeStats[mode]?.averageRounds || '-' }}</span>
                <span>{{ modeStats[mode]?.averageTurns || '-' }}</span>
              </div>
            </div>
          </div>

          <div class="encounter-setup__combatant-stats">
            <h4>Per-Combatant Averages (Aggregate)</h4>
            <div class="encounter-setup__stats-table">
              <div class="encounter-setup__stats-header">
                <span>Name</span>
                <span>Avg Damage Dealt</span>
                <span>Avg Damage Taken</span>
                <span>Kill Rate</span>
                <span>Death Rate</span>
              </div>
              <div
                v-for="stat in batchStats.perCombatantStats"
                :key="stat.name"
                class="encounter-setup__stats-row"
              >
                <span>{{ stat.name }}</span>
                <span>{{ stat.avgDamageDealt.toFixed(1) }}</span>
                <span>{{ stat.avgDamageTaken.toFixed(1) }}</span>
                <span>{{ (stat.killRate * 100).toFixed(1) }}%</span>
                <span>{{ (stat.deathRate * 100).toFixed(1) }}%</span>
              </div>
            </div>
          </div>
        </div>

        <div v-else-if="splitResults" class="encounter-setup__results">
          <h3 class="encounter-setup__split-title">Split Test Results (3 Resource Modes)</h3>
          <div class="encounter-setup__split-grid">
            <div
              v-for="(result, mode) in splitResults"
              :key="mode"
              class="encounter-setup__result-box"
            >
              <h4 class="encounter-setup__mode-label">{{ mode.toUpperCase() }}</h4>
              <div class="encounter-setup__result-stats">
                <div class="encounter-setup__stat">
                  <span class="encounter-setup__stat-label">Outcome:</span>
                  <span class="encounter-setup__stat-value">{{ result.outcome }}</span>
                </div>
                <div class="encounter-setup__stat">
                  <span class="encounter-setup__stat-label">Rounds:</span>
                  <span class="encounter-setup__stat-value">{{ result.totalRounds }}</span>
                </div>
                <div class="encounter-setup__stat">
                  <span class="encounter-setup__stat-label">Turns:</span>
                  <span class="encounter-setup__stat-value">{{ result.totalTurns }}</span>
                </div>
                <div class="encounter-setup__stat">
                  <span class="encounter-setup__stat-label">Survivors:</span>
                  <span class="encounter-setup__stat-value">{{
                    result.finalCombatants?.length || 0
                  }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="encounter-setup__empty">
          <p>Run simulation to see results</p>
        </div>
      </div>

      <!-- Step 5: Replay -->
      <div v-show="activeTab === 'replay'" class="encounter-setup__panel">
        <div v-if="turnLog.length > 0" class="encounter-setup__replay">
          <ReplayViewer :turn-log="turnLog" />
        </div>
        <div v-else class="encounter-setup__empty">
          <p>Run a simulation to enable replay</p>
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
  import { useCharacterStore } from '../../stores/characterStore';
  import SimpleMapEditor from './SimpleMapEditor.vue';
  import CombatantSelector from './CombatantSelector.vue';
  import ReplayViewer from './ReplayViewer.vue';
  import type { GameMap, SimulationConfig, Monster, CompositeRole, playerCharacter } from '../../types';
  import { Position } from '../../types';

  interface CombatantConfig {
    monster: Monster;
    role: CompositeRole;
  }

  /**
   * Convert a player character to a Monster-like format for simulator use
   */
  function playerCharacterToMonster(char: playerCharacter): Monster {
    return {
      name: char.name,
      source: 'PC',
      size: char.size,
      type: { type: 'Humanoid' },
      alignment: char.alignment ? [char.alignment] : [],
      ac: [char.acOverride ?? char.ac],
      hp: {
        average: char.maxHp,
        formula: `${char.maxHp}d1`,
      },
      speed: char.speed,
      str: char.abilityScores.str,
      dex: char.abilityScores.dex,
      con: char.abilityScores.con,
      int: char.abilityScores.int,
      wis: char.abilityScores.wis,
      cha: char.abilityScores.cha,
      save: {},
      skill: {} as any,
      passive: char.passivePerception ?? 10,
      languages: [],
      cr: '1/8',
      trait: [],
      action: [],
      reaction: [],
      legendary: [],
    } as Monster;
  }

  const tabs = ref<Array<'map' | 'teams' | 'settings' | 'results' | 'replay'>>([
    'map',
    'teams',
    'settings',
    'results',
    'replay',
  ]);
  const tabLabels: Record<string, string> = {
    map: 'Map',
    teams: 'Teams',
    settings: 'Settings',
    results: 'Results',
    replay: 'Replay',
  };

  const activeTab = ref<'map' | 'teams' | 'settings' | 'results' | 'replay'>('map');
  const simulationStore = useSimulationStore();
  const dataStore = useDataStore();
  const characterStore = useCharacterStore();

  const mapConfig = ref<GameMap | null>(null);
  const alliesConfig = ref<CombatantConfig[]>([]);
  const enemiesConfig = ref<CombatantConfig[]>([]);
  const simulationConfig = ref<Partial<SimulationConfig>>({
    roundLimit: 20,
    resourceMode: 'balanced' as const,
  });
  const numberOfRuns = ref(1);
  const simulationSeed = ref('');

  const availableMonsters = computed(() => {
    const monsters = dataStore.monsters || [];
    const characters = characterStore.characters || [];
    const convertedCharacters = characters.map(char => playerCharacterToMonster(char));
    return [...monsters, ...convertedCharacters];
  });
  const alliesCount = computed(() => alliesConfig.value.length);
  const enemiesCount = computed(() => enemiesConfig.value.length);
  const isSimulating = computed(() => simulationStore.isRunning);
  const simulationProgress = computed(() => simulationStore.currentProgress);
  const splitResults = computed(() => simulationStore.splitTestResults);
  const batchStats = computed(() => simulationStore.batchStatistics);
  const modeStats = computed(() => {
    if (!batchStats.value) return {};
    return {
      low: batchStats.value.perMode.low,
      balanced: batchStats.value.perMode.balanced,
      max: batchStats.value.perMode.max,
    };
  });
  const turnLog = computed(() => {
    if (splitResults.value?.balanced?.turnLog) {
      return splitResults.value.balanced.turnLog;
    }
    return [];
  });
  const simulationError = computed(() => simulationStore.error);

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
      case 'replay':
        return true;
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
          position: new Position(
            Math.floor(Math.random() * mapConfig.value!.width),
            Math.floor(Math.random() * mapConfig.value!.height)
          ),
        })),
        ...enemiesConfig.value.map(c => ({
          monster: c.monster,
          team: 'enemies' as const,
          role: c.role,
          position: new Position(
            Math.floor(Math.random() * mapConfig.value!.width),
            Math.floor(Math.random() * mapConfig.value!.height)
          ),
        })),
      ],
      resourceMode: 'balanced' as const,
      roundLimit: simulationConfig.value.roundLimit || 20,
    };

    const seed = simulationSeed.value || undefined;

    if (numberOfRuns.value > 1) {
      // Run batch simulation
      await simulationStore.runBatchSimulation(config, numberOfRuns.value, seed);
    } else {
      // Run single split test simulation
      await simulationStore.runSimulation(config, seed);
    }
  }

  function clearError(): void {
    simulationStore.clearCurrent();
  }

  function downloadCSV(): void {
    simulationStore.downloadStatisticsCSV();
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

  .encounter-setup__setting-info {
    padding: 1rem;
    background: var(--color-surface);
    border-left: 3px solid var(--color-accent);
    border-radius: 4px;
  }

  .encounter-setup__setting-info p {
    margin: 0;
    font-size: 0.875rem;
    color: var(--color-text);
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

  .encounter-setup__error {
    padding: 1.5rem;
    background: var(--color-surface);
    border-radius: var(--radius);
    border-left: 4px solid var(--color-danger);
  }

  .encounter-setup__error h3 {
    margin: 0 0 0.5rem;
    color: var(--color-danger);
  }

  .encounter-setup__error p {
    margin: 0 0 1rem;
    color: var(--color-text);
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

  .encounter-setup__split-title {
    margin: 0 0 1.5rem;
    color: var(--color-primary);
    font-size: 1.25rem;
  }

  .encounter-setup__split-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1.5rem;
    margin-bottom: 1.5rem;
  }

  .encounter-setup__mode-label {
    margin: 0 0 1rem;
    font-size: 0.875rem;
    font-weight: 700;
    color: var(--color-accent);
    text-transform: uppercase;
    letter-spacing: 0.05em;
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

  .encounter-setup__batch-summary {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin-bottom: 2rem;
    padding: 1.5rem;
    background: var(--color-surface);
    border-radius: var(--radius);
    border-left: 4px solid var(--color-accent);
  }

  .encounter-setup__batch-stat {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .encounter-setup__batch-stat-label {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--color-muted);
    text-transform: uppercase;
  }

  .encounter-setup__batch-stat-value {
    font-size: 2rem;
    font-weight: 700;
    color: var(--color-primary);
  }

  .encounter-setup__batch-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
  }

  .encounter-setup__batch-header h3 {
    margin: 0;
  }

  .encounter-setup__batch-header .btn {
    white-space: nowrap;
  }

  .encounter-setup__mode-breakdown {
    padding: 1.5rem;
    background: var(--color-surface);
    border-radius: var(--radius);
    margin-bottom: 2rem;
  }

  .encounter-setup__mode-breakdown h4 {
    margin: 0 0 1rem;
    color: var(--color-primary);
  }

  .encounter-setup__mode-table {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .encounter-setup__mode-header,
  .encounter-setup__mode-row {
    display: grid;
    grid-template-columns: 1fr 1fr 1.5fr 1.5fr 1.5fr;
    gap: 1rem;
    padding: 0.75rem;
    font-size: 0.875rem;
  }

  .encounter-setup__mode-header {
    font-weight: 600;
    background: var(--color-bg);
    border-radius: 4px;
    color: var(--color-muted);
    text-transform: uppercase;
  }

  .encounter-setup__mode-row {
    padding: 1rem 0.75rem;
    border-bottom: 1px solid var(--color-accent);
  }

  .encounter-setup__mode-row:last-child {
    border-bottom: none;
  }

  .encounter-setup__combatant-stats {
    padding: 1.5rem;
    background: var(--color-surface);
    border-radius: var(--radius);
  }

  .encounter-setup__combatant-stats h4 {
    margin: 0 0 1rem;
    color: var(--color-primary);
  }

  .encounter-setup__stats-table {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .encounter-setup__stats-header {
    display: grid;
    grid-template-columns: 1fr 1.5fr 1.5fr 1fr 1fr;
    gap: 0.75rem;
    padding: 0.75rem;
    background: var(--color-bg);
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--color-muted);
    text-transform: uppercase;
  }

  .encounter-setup__stats-row {
    display: grid;
    grid-template-columns: 1fr 1.5fr 1.5fr 1fr 1fr;
    gap: 0.75rem;
    padding: 0.75rem;
    align-items: center;
    border-radius: 4px;
    border: 1px solid var(--color-muted);
    font-size: 0.875rem;
  }

  .encounter-setup__help-text {
    margin: 0.5rem 0 0;
    font-size: 0.75rem;
    color: var(--color-muted);
    font-style: italic;
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
