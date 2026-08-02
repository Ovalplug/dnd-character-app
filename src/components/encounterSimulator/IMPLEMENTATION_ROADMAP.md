# Encounter Simulator — Implementation Roadmap

**Scope:** Full-featured tactical combat simulation engine with multi-run analysis, role-based AI, and split-mode testing.  
**Status:** Foundation laid (diceRollFunctions.ts, emulatorTyping.ts started; basic types defined).

## User Decisions (Locked)

1. **Phasing:** Simulation engine → basic setup UI → raw JSON results → frontend polish
2. **Scope:** Full MVP per scope doc, architected for easy expansion
3. **Replay:** **Seed-based deterministic runs** (store seed, replay on-demand; no turn logs)
4. **Concentration:** 1 spell per creature only
5. **AI:** Full weighted decision system (not heuristic)
6. **AoE:** Generate + score multiple positions, prioritize avoiding friendlies
7. **Flanking:** Exact opposite-side rule
8. **Performance:** Accuracy over speed; few minutes OK for 1000 runs; variable count
9. **Parallelization:** Sequential OK; parallel nice-to-have
10. **Map UI:** Simple square grid, click-to-place features (not VTT builder)
11. **Combatants:** Both bestiary + character store
12. **MVP Results:** Raw data (JSON/CSV), sorting/charts deferred to post-engine phase

---

## Phase 1: Core Data & Types + Seeding Strategy (Foundation)

### 1.1 Seeding & Deterministic Replay
**Goal:** Enable full replay from single seed without storing turn logs.

**Strategy:**
- Use cryptographic seed (e.g., 64-bit integer or UUID string)
- Seed a PRNG at simulation start (e.g., seeded Math.random via `seedrandom` npm package, or custom LCG)
- All randomness (d20, damage, initiative) calls use seeded PRNG, never Math.random()
- Store only: `{ seed, config }` per run
- Replay: re-run simulation with same seed → deterministic identical result

**Implementation:**
- Add to `emulatorTyping.ts`:
  ```typescript
  export interface SimulationRun {
    seed: string;         // UUID or hex string
    config: SimulationConfig;
    result: SimulationResult; // computed on-the-fly or cached
  }
  
  export interface SimulationBatch {
    batchId: string;
    created: number;
    runs: SimulationRun[];
    aggregatedStats: BatchStatistics;
  }
  ```
- Install `seedrandom` package for deterministic PRNG
- Refactor `diceRollFunctions.ts` to accept PRNG instance (not use global Math.random)

**Memory Benefit:** Store 1000 runs = 1000 × (seed + config ref) ≈ few KB. No turn-by-turn logs = massive savings.

---

### 1.2 Extend `emulatorTyping.ts`
**Goal:** Define all types needed for simulation state and AI.

**Create:**
- `SimulatorCombatant` — extends Monster with runtime state (HP, position, resources, conditions, role)
  ```typescript
  export interface SimulatorCombatant extends Monster {
    // Runtime state
    currentHp: number;
    tempHp: number;
    initiative: number;
    position: GridPosition;
    team: 'allies' | 'enemies' | 'neutral'; // or string
    role: CombatantRole; // Single role, can be composite: "Tank+Support"
    resources: {
      spellSlots: Record<number, { max: number; used: number }>;
      abilityRecharges: Record<string, number>; // ability name -> remaining uses
      weaponCharges: Record<string, number>;
    };
    conditions: ConditionState[]; // e.g., { type: 'prone', duration: 2 }
    concentratingOn?: SpellReference; // null or { name, level }
    deathSaves?: { successes: number; failures: number }; // if applicable
    isConscious: boolean;
    isTurnOver: boolean;
  }
  
  export interface ConditionState {
    type: string; // 'prone', 'grappled', etc.
    duration: number; // turns remaining; -1 = permanent
    source?: string; // what caused it
  }
  ```

- `SimulationState` — current turn state
  ```typescript
  export interface SimulationState {
    round: number;
    turnCount: number; // cumulative turns across all combatants
    activeParticipantIndex: number; // index into combatants array
    combatants: SimulatorCombatant[];
    map: GameMap;
    isActive: boolean;
    endReason?: 'team_eliminated' | 'round_limit' | 'all_surrendered';
  }
  ```

- `CombatantRole` — enum + interface
  ```typescript
  export type CombatantRoleType = 'Tank' | 'Healer' | 'DamagDealer' | 'Controller' | 'Boss' | 'Coward' | 'Scout' | 'Support';
  export type CompositeRole = `${CombatantRoleType}` | `${CombatantRoleType}+${CombatantRoleType}`;
  
  export interface RoleDefinition {
    type: CombatantRoleType;
    actionWeights: Record<string, number>; // e.g., { 'attack': 10, 'heal': 5, 'move': 3 }
    targetPriorities: Record<string, number>;
    resourcePreference: 'save' | 'balanced' | 'spend';
  }
  ```

- `GridPosition`, `MapCell`, `GameMap`
  ```typescript
  export interface GridPosition {
    x: number;
    y: number;
  }
  
  export type CellType = 'empty' | 'wall' | 'difficult_terrain' | 'elevation';
  
  export interface MapCell {
    position: GridPosition;
    type: CellType;
    elevation?: number; // 0 = ground level, > 0 = raised
  }
  
  export interface GameMap {
    width: number;
    height: number;
    cellSize: number; // 5 ft per cell (standard)
    cells: MapCell[]; // sparse: only non-empty cells stored
  }
  ```

- `SimulationConfig`, `SimulationResult`, `ResourceMode`, `ActionCandidate`
  ```typescript
  export type ResourceMode = 'low' | 'balanced' | 'max';
  
  export interface SimulationConfig {
    map: GameMap;
    combatants: Array<{
      monster: Monster; // from bestiary/character store
      team: 'allies' | 'enemies' | 'neutral';
      role: CompositeRole;
      position: GridPosition;
      applyDeathSaves?: boolean;
      allowSurrender?: boolean;
      surrenderHpThreshold?: number; // e.g., 0.3 for 30% HP
    }>;
    resourceMode: ResourceMode;
    roundLimit: number;
  }
  
  export interface ActionCandidate {
    type: 'attack' | 'cast_spell' | 'move' | 'dodge' | 'disengage' | 'dash' | 'action_other';
    name: string;
    targetIndex?: number; // combatant index
    targetPosition?: GridPosition;
    expectedDamage?: number;
    expectedHealing?: number;
    resourceCost?: { spellSlot?: number; ability?: string };
    score: number; // computed by AI
  }
  
  export interface SimulationResult {
    seed: string;
    config: SimulationConfig;
    outcome: 'allies_win' | 'enemies_win' | 'tie' | 'round_limit';
    totalRounds: number;
    totalTurns: number;
    finalCombatants: Array<{
      name: string;
      team: string;
      finalHp: number;
      damageTaken: number;
      damageDealt: number;
      kills: number;
      died: boolean;
      actions: Array<{
        type: string;
        count: number;
      }>;
      resourcesUsed: {
        spellSlots: Record<number, number>;
        abilityUses: Record<string, number>;
      };
    }>;
  }
  
  export interface BatchStatistics {
    totalRuns: number;
    allyWinRate: number; // %
    averageRounds: number;
    averageTurns: number;
    resourceModeBreakdown: Record<ResourceMode, BatchStatistics>; // recursive
    perCombatantStats: Array<{
      name: string;
      team: string;
      avgDamageDealt: number;
      avgDamageTaken: number;
      killRate: number;
      deathRate: number;
    }>;
  }
  ```

---

### 1.3 Extend `diceRollFunctions.ts`
**Goal:** Implement all 5e dice mechanics, seeded.

**Update existing + Add:**
- Refactor to accept `rng: () => number` parameter (seeded PRNG, not global Math.random)
- Fix `rollDice()` modifier application (currently per-die; should be total)
- Add:
  - `rollD20(modifier?, rng?, advantage?, disadvantage?)` — single d20 + mods + adv/dis
  - `rollAttack(attacker, target, rng, advantage?, disadvantage?)` — full to-hit + damage
  - `rollSave(dc, abilityMod, rng, advantage?, disadvantage?)` — d20 vs DC
  - `rollInitiative(dexMod, rng)` — d20 + DEX for turn order
  - `rollDamage(expression, rng)` — parse "2d6 + 3", roll, return total
  - `rollCrit(expression, rng)` — crit: double dice, same mods
  - `calculateAverageDamage(expression)` — for threat assessment (no RNG)

**Example:**
```typescript
export function rollD20(modifier: number, rng: () => number, advantage?: boolean, disadvantage?: boolean): number {
  const roll1 = Math.floor(rng() * 20) + 1;
  if (advantage) {
    const roll2 = Math.floor(rng() * 20) + 1;
    return Math.max(roll1, roll2) + modifier;
  }
  if (disadvantage) {
    const roll2 = Math.floor(rng() * 20) + 1;
    return Math.min(roll1, roll2) + modifier;
  }
  return roll1 + modifier;
}
```

---

### 1.4 Text Parsing for Monster Abilities (`monsterParser.ts`)
**Goal:** Parse spell/legendary/lair/mythic actions from Monster JSON text fields.

**Create file:** `src/components/encounterSimulator/monsterParser.ts`

**Problem:** Monster JSON has actions/legendary/lair/mythic as `Entries` (mix of strings and rich objects with `name`, `entries`, etc.). Spellcasting is in `MonsterSpellcasting[]` but abilities are in raw text.

**Parse:**
```typescript
export interface ParsedAbility {
  name: string;
  type: 'action' | 'legendary' | 'reaction' | 'lair' | 'mythic';
  costDescription: string; // e.g., "Costs 2 Legendary Actions"
  entries: string[]; // flattened description
  spellReference?: string; // "Fireball" if detectable
  dc?: number; // if spell/save mentioned
  requiresConcentration?: boolean;
  rechargeRoll?: string; // e.g., "5–6" for Recharge 5–6
}

export function parseMonsterActions(monster: Monster): ParsedAbility[] {
  const abilities: ParsedAbility[] = [];
  
  if (monster.action) {
    abilities.push(...parseEntries(monster.action, 'action'));
  }
  if (monster.legendary) {
    abilities.push(...parseEntries(monster.legendary, 'legendary'));
  }
  if (monster.reaction) {
    abilities.push(...parseEntries(monster.reaction, 'reaction'));
  }
  if (monster.lairActions) {
    abilities.push(...parseEntries(monster.lairActions, 'lair'));
  }
  if (monster.mythic) {
    abilities.push(...parseEntries(monster.mythic, 'mythic'));
  }
  
  return abilities;
}

function parseEntries(entries: Entry[], type: string): ParsedAbility[] {
  // Flatten entries into ParsedAbility objects
  // Extract name, DC, spell names from text
  // Detect recharge patterns ("Recharge 5–6", "Recharge")
  // Return array of abilities
}

export function getMonsterSpells(monster: Monster): string[] {
  // Extract spell names from spellcasting + parsed abilities
  // Return array of spell names (e.g., ['Fireball', 'Magic Missile'])
}
```

**Regex patterns to use:**
- Spell detection: `/\b(Fireball|Magic Missile|Hold Person|...)\b/i`
- DC detection: `/DC (\d+)/`
- Recharge: `/Recharge (\d+(?:–\d+)?)/`
- Concentration: `/concentration|^@${link}/i`
- Spell slot parsing: `/(\d+)(?:st|nd|rd|th)?-level/i`

**Data source:** Use `dataStore.ts` spell list to validate detected spell names.

---

### 1.5 Extend `types.ts` (Main File)
**Goal:** Export simulator types for project-wide use.

**Add to main types.ts:**
- Import all types from `emulatorTyping.ts` and re-export
- OR: add simulator section with key types (SimulatorCombatant, SimulationConfig, etc.)
- Keep in emulatorTyping.ts: simulator-only types; export to types.ts: widely-used ones

**Approach:** Keep emulatorTyping.ts as source-of-truth, re-export key types to types.ts for convenience.

---

## Phase 2: Simulation Engine Core (Combat Mechanics)

### 2.1 Combat Rules Executor (`combatRules.ts`)
**Goal:** Implement 5e core mechanics isolated from UI/AI.

**Create file:** `src/components/encounterSimulator/combatRules.ts`

**Core functions:**
```typescript
export function resolveTurn(
  state: SimulationState,
  combatant: SimulatorCombatant,
  action: ActionCandidate,
  rng: () => number
): TurnResult {
  // Dispatch to specific resolver based on action.type
  // Return TurnResult with events, HP changes, resource updates
}

export interface TurnResult {
  events: string[]; // ["Goblin attacks Wizard", "Hit! 7 damage", ...]
  combatantUpdates: Partial<SimulatorCombatant>[]; // all affected combatants
  actionExecuted: boolean;
}
```

**Attack resolution:**
```typescript
export function resolveAttack(
  attacker: SimulatorCombatant,
  target: SimulatorCombatant,
  action: ActionCandidate, // must have weapon/spell info
  rng: () => number
): {
  hit: boolean;
  damage: number;
  isCrit: boolean;
  targetAlive: boolean;
}
```

**Spell casting:**
```typescript
export function resolveSpell(
  caster: SimulatorCombatant,
  target: SimulatorCombatant | GridPosition,
  spell: Spell,
  rng: () => number
): TurnResult
```

**Saving throws:**
```typescript
export function resolveSave(
  target: SimulatorCombatant,
  dc: number,
  ability: SavingThrow,
  rng: () => number
): boolean // true = success
```

**Death saves:**
```typescript
export function resolveDeathSave(
  combatant: SimulatorCombatant,
  rng: () => number
): {
  successes: number;
  failures: number;
  isDead: boolean;
  isStable: boolean;
}
```

**Status effects:**
```typescript
export function applyCondition(
  combatant: SimulatorCombatant,
  condition: string, // 'prone', 'grappled', etc.
  duration: number // turns
): void

export function removeExpiredConditions(state: SimulationState): void
```

**Resources:**
```typescript
export function consumeResource(
  combatant: SimulatorCombatant,
  type: 'spell_slot',
  level: number
): boolean // true if consumed, false if unavailable

export function applyResourceMode(
  combatant: SimulatorCombatant,
  mode: ResourceMode
): void // reduce resources if 'low' mode
```

---

### 2.2 Movement & Positioning (`movement.ts`)
**Goal:** Pathfinding, LOS, cover, terrain costs.

**Create file:** `src/components/encounterSimulator/movement.ts`

**Implementations:**
```typescript
export function getAvailableMoves(
  state: SimulationState,
  combatant: SimulatorCombatant
): GridPosition[]
// Returns all cells reachable within combatant's speed, accounting for:
// - Walls (blocking)
// - Difficult terrain (double cost)
// - Other combatants (blocking)
// - Movement speed (ft / 5 = cells)
// Uses A* or BFS for pathfinding

export function canMoveTo(
  state: SimulationState,
  combatant: SimulatorCombatant,
  target: GridPosition
): boolean // true if passable, false if blocked

export function getMovementCost(
  state: SimulationState,
  from: GridPosition,
  to: GridPosition,
  combatant: SimulatorCombatant
): number // in feet

export function hasLineOfSight(
  state: SimulationState,
  from: GridPosition,
  to: GridPosition,
  ignoreElevation?: boolean
): boolean
// Returns false if wall blocks path
// Elevation affects LOS at distance

export function getCoverModifier(
  state: SimulationState,
  attacker: GridPosition,
  target: GridPosition
): number // +0 (none), +2 (half), or -1 (full = no target)

export function canCastSpellAt(
  state: SimulationState,
  caster: GridPosition,
  target: GridPosition,
  spell: Spell
): boolean // checks range + LOS if required
```

**Grid:** 5 ft per cell (standard). Diagonal = 5 ft (not 10 ft; variant rule assumed off per scope).

---

### 2.3 AI Decision-Making (`aiDecisions.ts`)
**Goal:** Full weighted scoring for action/target selection.

**Create file:** `src/components/encounterSimulator/aiDecisions.ts`

**Main entry points:**
```typescript
export function evaluateAllActions(
  state: SimulationState,
  combatant: SimulatorCombatant,
  allSpells: Map<string, Spell> // spell lookup
): ActionCandidate[]
// Generate all valid actions (attack targets, spells, move, dodge, etc.)
// Score each
// Return sorted by score (highest first)

export function selectAction(
  state: SimulationState,
  combatant: SimulatorCombatant,
  allSpells: Map<string, Spell>
): ActionCandidate
// Pick top-scoring action from evaluateAllActions
```

**Threat assessment:**
```typescript
function assessThreat(
  state: SimulationState,
  attacker: SimulatorCombatant,
  potential_target: SimulatorCombatant
): number
// Base: avg damage output per turn (from stat block)
// Modifiers:
// - Boss enemies: +10
// - High HP: +5
// - High AC (harder to hit): -3
// - Spellcaster (concentration threat): +5
// - Currently threatening nearest ally: +8
// - Already wounded: +2
// - Returns score
```

**Action scoring:**
```typescript
function scoreAction(
  state: SimulationState,
  combatant: SimulatorCombatant,
  action: ActionCandidate,
  roleWeights: RoleWeights
): number
// roleWeights[action.type] * expectedOutcome
// - expectedOutcome: % to hit × damage, or healing value
// - Resource penalty: scale by mode (low: heavy penalty, max: no penalty)
// - Action economy: 2 actions = lower score unless critical
// - Risk: risky positioning = lower for conservative roles
// Returns score (0–100 or open scale)
```

**Role definitions & weights:**
```typescript
interface RoleWeights {
  actionPriorities: Record<string, number>; // { 'attack': 15, 'heal': 8, ... }
  targetPriorities: Record<string, number>; // { 'ally_at_risk': 20, 'boss': 10, ... }
  resourceConservation: 0 | 1 | 2; // 0 = spend freely, 1 = balanced, 2 = save
}

const ROLE_DEFINITIONS: Record<CombatantRoleType, RoleWeights> = {
  Tank: {
    actionPriorities: { 'defend': 20, 'attack': 5, 'move': 8 },
    targetPriorities: { 'nearest_to_ally': 15, 'damage_output': 8 },
    resourceConservation: 1,
  },
  Healer: {
    actionPriorities: { 'heal': 20, 'attack': 2, 'move': 5 },
    targetPriorities: { 'ally_low_hp': 25, 'ally_in_danger': 15 },
    resourceConservation: 1,
  },
  DamagDealer: {
    actionPriorities: { 'attack': 20, 'move': 5, 'defend': 2 },
    targetPriorities: { 'boss': 15, 'highest_damage': 12, 'weak': 5 },
    resourceConservation: 0,
  },
  Controller: {
    actionPriorities: { 'crowd_control': 18, 'attack': 5, 'move': 6 },
    targetPriorities: { 'group': 18, 'boss': 12, 'isolated': 10 },
    resourceConservation: 1,
  },
  Boss: {
    actionPriorities: { 'attack': 18, 'move': 5, 'coordinate': 10 },
    targetPriorities: { 'weakest': 12, 'threatening_all': 15 },
    resourceConservation: 0,
  },
  Coward: {
    actionPriorities: { 'retreat': 20, 'disengage': 15, 'attack': 3 },
    targetPriorities: { 'escape_route': 25, 'nearest': 5 },
    resourceConservation: 2,
  },
  Scout: {
    actionPriorities: { 'flanking': 18, 'move': 12, 'attack': 15 },
    targetPriorities: { 'isolated': 20, 'flanked': 15, 'low_ac': 8 },
    resourceConservation: 1,
  },
  Support: {
    actionPriorities: { 'buff': 18, 'heal': 12, 'attack': 5 },
    targetPriorities: { 'ally_preparing': 15, 'ally_at_risk': 12 },
    resourceConservation: 1,
  },
};
```

**Concentration conflict:**
```typescript
function resolveConcentration(
  caster: SimulatorCombatant,
  currentSpell: Spell | null,
  newSpell: Spell
): { breakCurrent: boolean }
// Compare: benefit of new vs. loss of current
// Return decision
```

**AoE targeting:**
```typescript
function findBestAoEPlacement(
  state: SimulationState,
  caster: SimulatorCombatant,
  spell: Spell, // must have area type (radius, etc.)
  candidates: GridPosition[] // all valid centers
): GridPosition
// For each candidate:
//   - Calculate damage to enemies
//   - Calculate damage to friendlies
//   - Score: enemyDamage - (friendlyDamage × 10) // heavily penalize friendly fire
// Return highest-scoring position
// If friendlyDamage too high on all, skip spell
```

---

## Phase 3: Simulation Engine & State Management

### 3.1 Simulation Runner (`simulationEngine.ts`)
**Goal:** Orchestrate one full combat run from setup to end, using seeded RNG.

**Create file:** `src/components/encounterSimulator/simulationEngine.ts`

```typescript
export function runSingleSimulation(
  config: SimulationConfig,
  seed: string, // UUID or hex
  allSpells: Map<string, Spell>
): SimulationResult {
  // 1. Initialize PRNG from seed
  const rng = seedrandom(seed);
  
  // 2. Create SimulationState
  const state = initializeState(config, rng);
  
  // 3. Main loop
  while (!isEncounterOver(state)) {
    // Get current combatant's turn
    const combatant = state.combatants[state.activeParticipantIndex];
    
    // Skip if unconscious/dead
    if (!combatant.isConscious) {
      advanceTurn(state);
      continue;
    }
    
    // AI selects action
    const action = selectAction(state, combatant, allSpells);
    
    // Resolve action
    const turnResult = resolveTurn(state, combatant, action, rng);
    
    // Apply updates to state
    applyTurnResult(state, turnResult);
    
    // Check for end conditions (team eliminated, etc.)
    if (isTeamEliminated(state)) {
      state.endReason = determinateOutcome(state);
      break;
    }
    
    // Advance turn
    advanceTurn(state);
    
    // Check round limit
    if (state.round >= config.roundLimit) {
      state.endReason = 'round_limit';
      break;
    }
  }
  
  // 4. Aggregate results
  return generateResult(state, seed, config);
}

export function runBatch(
  config: SimulationConfig,
  count: number = 100,
  allSpells: Map<string, Spell>,
  onProgress?: (completed: number, total: number) => void
): {
  runs: SimulationRun[];
  aggregated: BatchStatistics;
} {
  const runs: SimulationRun[] = [];
  
  // Split count across resource modes: 1/3 each
  const perMode = Math.floor(count / 3);
  const modes: ResourceMode[] = ['low', 'balanced', 'max'];
  
  let completed = 0;
  for (const mode of modes) {
    const modeConfig = { ...config, resourceMode: mode };
    for (let i = 0; i < perMode; i++) {
      const seed = generateSeed(); // UUID.v4() or custom
      const result = runSingleSimulation(modeConfig, seed, allSpells);
      runs.push({ seed, config: modeConfig, result });
      
      completed++;
      if (onProgress) onProgress(completed, count);
    }
  }
  
  // Handle remainder (if count % 3 !== 0)
  for (let i = 0; i < (count % 3); i++) {
    const seed = generateSeed();
    const result = runSingleSimulation(config, seed, allSpells);
    runs.push({ seed, config, result });
    completed++;
    if (onProgress) onProgress(completed, count);
  }
  
  // Aggregate stats
  const aggregated = aggregateStats(runs);
  
  return { runs, aggregated };
}
```

**Helper functions:**
```typescript
function initializeState(config: SimulationConfig, rng: () => number): SimulationState {
  // 1. Create SimulatorCombatant[] from config
  // 2. Roll initiative for each
  // 3. Sort by initiative (highest first)
  // 4. Apply resource mode reductions
  // 5. Return SimulationState
}

function advanceTurn(state: SimulationState): void {
  // Move to next combatant in initiative order (wrap around)
  state.activeParticipantIndex = (state.activeParticipantIndex + 1) % state.combatants.length;
  if (state.activeParticipantIndex === 0) {
    state.round++;
  }
  state.turnCount++;
  
  // Decrease condition durations
  removeExpiredConditions(state);
}

function isEncounterOver(state: SimulationState): boolean {
  return state.endReason !== undefined;
}

function isTeamEliminated(state: SimulationState): boolean {
  // Check if any team (allies, enemies) all dead/unconscious
}

function determineOutcome(state: SimulationState): 'allies_win' | 'enemies_win' | 'tie' {
  // Analyze final state
}

function generateResult(state: SimulationState, seed: string, config: SimulationConfig): SimulationResult {
  // Aggregate per-combatant stats
  // Count damage, actions, kills, deaths
  // Return SimulationResult
}

function aggregateStats(runs: SimulationRun[]): BatchStatistics {
  // Average across all runs
  // Break down by resource mode
  // Per-combatant stats (avg damage, kill rate, etc.)
}
```

---

### 3.2 Simulation State Store (`simulationStore.ts`)
**Goal:** Pinia store for current simulation session.

**Create file:** `src/stores/simulationStore.ts`

```typescript
export const useSimulationStore = defineStore('simulator', {
  state: () => ({
    currentConfig: null as SimulationConfig | null,
    currentBatch: null as { runs: SimulationRun[], aggregated: BatchStatistics } | null,
    batchProgress: { completed: 0, total: 0 },
    selectedRunIndex: -1,
  }),
  
  actions: {
    initializeSimulation(config: SimulationConfig) {
      this.currentConfig = config;
      this.currentBatch = null;
      this.selectedRunIndex = -1;
    },
    
    async runBatchSimulations(count: number, allSpells: Map<string, Spell>) {
      if (!this.currentConfig) throw new Error('No config set');
      
      this.batchProgress = { completed: 0, total: count };
      
      const result = await runBatch(
        this.currentConfig,
        count,
        allSpells,
        (completed, total) => {
          this.batchProgress = { completed, total };
        }
      );
      
      this.currentBatch = result;
    },
    
    selectRun(index: number) {
      this.selectedRunIndex = index;
    },
    
    exportResultsJSON() {
      if (!this.currentBatch) throw new Error('No results to export');
      return JSON.stringify(this.currentBatch, null, 2);
    },
    
    exportResultsCSV() {
      if (!this.currentBatch) throw new Error('No results to export');
      // Generate CSV from aggregated stats
      return generateCSV(this.currentBatch.aggregated);
    },
    
    getReplayForRun(index: number): SimulationResult {
      if (!this.currentBatch) throw new Error('No batch loaded');
      const run = this.currentBatch.runs[index];
      
      // Re-run the simulation with the same seed
      return runSingleSimulation(run.config, run.seed, allSpells);
    },
  },
});
```

---

## Phase 4: Basic Setup UI & Raw Results (MVP Frontend)

### 4.1 Simple Map Editor (`SimpleMapEditor.vue`)
**Goal:** Click-to-place walls/terrain on grid. No drag, no fancy UI.

**Create file:** `src/components/encounterSimulator/SimpleMapEditor.vue`

**UI:**
- Input: grid dimensions (width × height), cell size dropdown (5 ft / 10 ft)
- Toolbar: buttons for terrain types (Wall, Difficult, Empty)
- Grid canvas: clickable cells, show visual state (gray = wall, light = difficult, white = empty)
- Clear all button, Save config button

**No features:**
- No drag-and-drop
- No elevation editor (MVP; save for later)
- No preview of combatants

**Example:**
```vue
<template>
  <div class="map-editor">
    <div class="controls">
      <label>Width: <input v-model.number="gridWidth" type="number" min="5" max="50" /></label>
      <label>Height: <input v-model.number="gridHeight" type="number" min="5" max="50" /></label>
      <button @click="terrain = 'empty'">Empty</button>
      <button @click="terrain = 'wall'">Wall</button>
      <button @click="terrain = 'difficult'">Difficult</button>
      <button @click="clearMap">Clear</button>
    </div>
    <div class="grid" :style="{ gridTemplate: `repeat(${gridWidth}, 1fr)` }">
      <div
        v-for="(cell, idx) in mapCells"
        :key="idx"
        :class="['cell', cell.type]"
        @click="toggleCell(idx)"
      />
    </div>
  </div>
</template>
```

---

### 4.2 Combatant Selector (`CombatantSelector.vue`)
**Goal:** Add combatants from bestiary + character store. Simple rows.

**Create file:** `src/components/encounterSimulator/CombatantSelector.vue`

**UI:**
- Search box (filter bestiary + characters)
- Dropdown: Team (Allies / Enemies / Neutral)
- Dropdown: Role (Tank, Healer, DamagDealer, Controller, Boss, Coward, Scout, Support)
- Dropdown: Apply death saves? (yes/no)
- Dropdown: Allow surrender? (yes/no)
- Button: Add to encounter
- List of selected combatants (removable)

**Data sources:**
- `characterStore.characters` (PC list)
- `dataStore.filteredMonsters` (bestiary)

**Example:**
```vue
<template>
  <div class="combatant-selector">
    <input v-model="searchQuery" placeholder="Search bestiary/characters..." />
    <div v-if="searchResults.length" class="results">
      <div v-for="combatant in searchResults" :key="`${combatant.source}|${combatant.name}`">
        {{ combatant.name }}
        <button @click="selectCombatant(combatant)">Add</button>
      </div>
    </div>
    
    <div class="config">
      <select v-model="selectedTeam">
        <option value="allies">Allies</option>
        <option value="enemies">Enemies</option>
        <option value="neutral">Neutral</option>
      </select>
      
      <select v-model="selectedRole">
        <option value="Tank">Tank</option>
        <!-- ... 8 roles ... -->
      </select>
      
      <label><input v-model="applyDeathSaves" type="checkbox" /> Death saves</label>
      <label><input v-model="allowSurrender" type="checkbox" /> Allow surrender</label>
      
      <button @click="addCombatant">Add to Encounter</button>
    </div>
    
    <div class="selected">
      <h3>Selected Combatants</h3>
      <div v-for="(c, idx) in selectedCombatants" :key="idx" class="combatant-row">
        {{ c.name }} ({{ c.team }} / {{ c.role }})
        <button @click="removeCombatant(idx)">×</button>
      </div>
    </div>
  </div>
</template>
```

---

### 4.3 Encounter Setup View (`EncounterSetupView.vue`)
**Goal:** Combine map editor + combatant selector + run controls.

**Create file:** `src/views/EncounterSetupView.vue`

**Sections:**
1. **Map Configuration** (SimpleMapEditor)
2. **Combatant Setup** (CombatantSelector)
3. **Run Configuration**
   - Resource mode: Low / Balanced / Max (single select or radio)
   - Round limit: input (default 20)
   - Run count: input (default 100)
4. **Run Button**
   - Label changes during execution: "Run 100 Simulations" → "Running..." → "Complete"
   - Progress bar (completed / total)
5. **Results Link** (appears after completion)
   - "View Results" button → navigate to results view

**Actions:**
- Stores config in `simulationStore`
- On "Run": calls `simulationStore.runBatchSimulations()`
- On complete: enables "View Results" navigation

---

### 4.4 Raw Results Output (`RawResultsExport.vue`)
**Goal:** Display and export raw simulation data (JSON/CSV).

**Create file:** `src/components/encounterSimulator/RawResultsExport.vue`

**Sections:**
1. **Summary Stats**
   - Win rate (%)
   - Avg rounds
   - Avg turns
   - Total runs

2. **Resource Mode Breakdown**
   - Tabs: Low / Balanced / Max
   - Per-mode summary (same stats, repeated)

3. **Raw Data Display**
   - JSON viewer (full batch data, collapsible)
   - Per-run data (collapsed by default, expand to inspect individual run results)

4. **Export Buttons**
   - Download JSON
   - Download CSV (aggregated stats only)

**Example:**
```vue
<template>
  <div class="results-view">
    <div class="summary">
      <h2>Simulation Results</h2>
      <p>Total Runs: {{ batch.runs.length }}</p>
      <p>Ally Win Rate: {{ winRate }}%</p>
      <p>Avg Rounds: {{ avgRounds }}</p>
    </div>
    
    <div class="mode-tabs">
      <button
        v-for="mode in ['low', 'balanced', 'max']"
        :key="mode"
        @click="activeMode = mode"
        :class="{ active: activeMode === mode }"
      >
        {{ mode }}
      </button>
      <div class="mode-stats">
        <!-- Display aggregated stats for activeMode -->
      </div>
    </div>
    
    <div class="raw-data">
      <h3>Raw JSON</h3>
      <pre>{{ JSON.stringify(batch, null, 2) }}</pre>
    </div>
    
    <div class="exports">
      <button @click="downloadJSON">Download JSON</button>
      <button @click="downloadCSV">Download CSV</button>
    </div>
  </div>
</template>
```

**No features:**
- No charts/graphs (deferred to Phase 5)
- No sorting/filtering (deferred to Phase 5)
- No per-run drill-down or replay (deferred to Phase 6)

---

## Phase 5: Polish, Visualization & Post-Engine Improvements

### 5.1 Results Analytics UI (`AnalyticsResults.vue`)
**Goal:** Add sorting, filtering, charts to raw results.

**Sections:**
- **Sortable Per-Combatant Table** (damage dealt, damage taken, kill rate, death rate)
- **Action Frequency Charts** (pie chart: attacks vs. spells vs. moves)
- **Resource Usage Breakdown** (spell slots by level, ability recharges)

**Deferred features:**
- Heatmaps (position frequency)
- Damage timeline
- Interactive replay (step through simulation)

---

### 5.2 Integration & Router
**Goal:** Wire simulator into app routes.

**Routes:**
- `/simulator` → EncounterSetupView (or list existing encounters)
- `/simulator/setup` → EncounterSetupView
- `/simulator/results` → RawResultsExport + AnalyticsResults (tabbed)

**NavBar integration:**
- Add "Simulator" link to main nav

---

### 5.3 Testing Strategy (MVP)
**Unit tests (Jest):**
- `diceRollFunctions.test.ts` — d20, advantage/disadvantage, damage parsing
- `combatRules.test.ts` — attack resolution, saves, death saves
- `aiDecisions.test.ts` — action scoring, threat assessment
- `movement.test.ts` — pathfinding, LOS, cover

**Integration tests:**
- Full simulation run (end state consistency)
- Batch aggregation correctness

**Manual testing:**
- 100-run batch (verify outputs, spot check stats)
- Replay: re-run same seed, confirm identical result

---

## Phase 6: Advanced Features (Post-MVP)

- **Interactive replay:** Step through simulation turn-by-turn
- **Heatmaps:** Position frequency per combatant
- **Combatant detail view:** Deep drill-down per combatant
- **Custom role builder:** UI to define role weights
- **Encounter templates:** Save/load preset configs
- **Advanced terrain:** Water, lava, hazards with rules
- **Objectives system:** Side objectives influence AI behavior
- **Morale/surrender refinement:** Per-team morale tracking
- **Web Workers:** Parallel batch runs for faster 1000+ sim batches

---

## File Structure (Final)

```
src/components/encounterSimulator/
├── scope.md                              (existing)
├── IMPLEMENTATION_ROADMAP.md             (this file)
├── diceRollFunctions.ts                  (extend)
├── emulatorTyping.ts                     (extend: types only)
├── monsterParser.ts                      (create: text parsing)
├── combatRules.ts                        (create: 5e rules)
├── movement.ts                           (create: pathfinding, LOS)
├── aiDecisions.ts                        (create: AI scoring)
├── simulationEngine.ts                   (create: orchestration)
├── SimpleMapEditor.vue                   (create: map UI)
├── CombatantSelector.vue                 (create: combatant picker)
├── EncounterSetupView.vue                (create: main setup view)
├── RawResultsExport.vue                  (create: JSON/CSV export)
├── AnalyticsResults.vue                  (create: charts, sorting)
└── (future) InteractiveReplay.vue, CombatantDetail.vue, etc.

src/stores/
└── simulationStore.ts                    (create: state management)

src/types.ts                              (extend: re-export simulator types)
src/router/index.ts                       (update: add simulator routes)
```

---

## Implementation Sequence (Recommended)

**Step 1: Types & Parsing (1-2 days)**
- Finalize `emulatorTyping.ts` with all types
- Implement `monsterParser.ts` (spell + legendary action parsing)
- Update `types.ts` to re-export

**Step 2: Mechanics Foundation (3-4 days)**
- Implement `diceRollFunctions.ts` (all 5e rolls, seeded RNG)
- Implement `combatRules.ts` (attack, spell, save, death save resolution)
- Implement `movement.ts` (pathfinding, LOS, cover)
- Unit test each

**Step 3: AI & Simulation (3-4 days)**
- Implement `aiDecisions.ts` (all 8 role definitions + scoring)
- Implement `simulationEngine.ts` (orchestration + batch runner)
- Implement `simulationStore.ts` (Pinia state)
- Integration test single run + batch

**Step 4: MVP Frontend (2-3 days)**
- `SimpleMapEditor.vue` (grid editor)
- `CombatantSelector.vue` (combatant picker)
- `EncounterSetupView.vue` (full setup)
- `RawResultsExport.vue` (JSON/CSV export)
- Wire routes

**Step 5: Testing & Polish (1-2 days)**
- Full end-to-end testing (setup → run → results)
- Bug fixes
- Performance profiling
- Documentation

**Step 6: Analytics & Post-MVP (1-2+ days)**
- `AnalyticsResults.vue` (charts, sorting)
- Optional: testing framework, replay viewer, etc.

**Total: ~2-3 weeks solo**

---

## Key Technical Decisions (Locked)

| Decision | Value |
| --- | --- |
| Replay Strategy | Seed-based (deterministic RNG, re-run on demand) |
| Turn Logs | None stored; aggregate stats only (memory efficient) |
| Concentration | 1 spell per creature |
| Flanking | Exact opposite sides |
| AoE Targeting | Generate + score multiple positions |
| AI | Full weighted scoring (8 roles with defined weights) |
| Grid | Square, 5 ft/cell, diagonal = 5 ft |
| Performance | Accuracy prioritized; sequential OK; few minutes acceptable |
| Map UI | Simple click-to-place (no VTT builder) |
| Combatant Sources | Bestiary + character store both |
| MVP Results | Raw JSON/CSV, sorting/charts deferred |
| Spell Parsing | Regex + manual spell list validation from `dataStore` |
| Legendary Actions | Text parsing from `action`/`legendary`/`lair` entries |
| Resource Modes | Low (1/3), Balanced (1/3), Max (1/3) per batch |

---

## Known Complexities & Notes

1. **Text Parsing:** Monster abilities are in `Entries` format (rich mix of strings + objects). Parsing spell names, DCs, ranges requires careful regex + spell list validation.

2. **Spell Resolution:** `MonsterSpellcasting` provides spell lists; spells must be looked up in `dataStore.spells` to get full rules (range, save DC, effects, etc.).

3. **Advantage/Disadvantage Sources:** Many (flanking, high ground, hidden, conditions). AI must be aware of all to score actions correctly.

4. **Performance:** A* pathfinding + complex scoring × 1000 runs. Optimize: pre-cache threat assessments, early-exit invalid moves, profile hot functions.

5. **State Mutation:** Simulation modifies combatants in-place. Clone state for each run to avoid cross-pollution between seeds.

6. **Seeding Library:** Use `seedrandom` npm package for deterministic PRNG. Ensures replay consistency.

---
