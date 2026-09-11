/**
 * Encounter Simulator Type Definitions & Base Classes (OOP)
 * Core types, interfaces, and classes for tactical combat simulation.
 */

import type { Monster } from '../../types';

// ============================================================================
// ENUMS & LITERAL TYPES
// ============================================================================

export type CombatantRoleType =
  | 'Tank'
  | 'Healer'
  | 'DamageDealer'
  | 'Controller'
  | 'Boss'
  | 'Coward'
  | 'Scout'
  | 'Support';

export type CompositeRole = `${CombatantRoleType}` | `${CombatantRoleType}+${CombatantRoleType}`;

export type CellType = 'empty' | 'wall' | 'difficult_terrain' | 'elevation';

export type ResourceMode = 'low' | 'balanced' | 'max';

export type SimulationOutcome = 'allies_win' | 'enemies_win' | 'tie' | 'round_limit';

export type ActionType =
  | 'attack'
  | 'cast_spell'
  | 'move'
  | 'dodge'
  | 'disengage'
  | 'dash'
  | 'action_other';

export type HazardType =
  | 'floor_fire'
  | 'pit'
  | 'toxic_cloud'
  | 'lightning_storm'
  | 'quaking_ground'
  | 'acid_splash';

export type MoraleState = 'fearless' | 'steadfast' | 'wary' | 'faltering' | 'rout';

export type Team = 'allies' | 'enemies' | 'neutral';

export type DiceType = 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20' | 'd100';

export type DiceRolls = [
  {
    dice: DiceType;
    number: number;
    modifier?: number;
  }
];

// ============================================================================
// BASIC INTERFACES
// ============================================================================

export interface GridPosition {
  x: number;
  y: number;
}

export interface MapCell {
  position: GridPosition;
  type: CellType;
  elevation?: number;
}

export interface ConditionState {
  type: string;
  duration: number;
  source?: string;
}

export interface SpellReference {
  name: string;
  level: number;
}

export interface ParsedAbility {
  name: string;
  type: 'action' | 'legendary' | 'reaction' | 'lair' | 'mythic';
  costDescription: string;
  entries: string[];
  spellReference?: string;
  dc?: number;
  requiresConcentration?: boolean;
  rechargeRoll?: string;
}

/** One group of dice within a damage roll (e.g. the "2d8" in "2d8+3"). */
export interface DiceGroup {
  expression: string; // e.g. "2d8" (already doubled for crits)
  diceType: string; // e.g. "d8"
  count: number; // number of dice rolled
  rolls: number[]; // individual die results
  subtotal: number; // sum of rolls (no modifier)
}

/** Full breakdown of a single damage roll. */
export interface DamageRoll {
  expression: string; // original expression e.g. "2d8+3"
  groups: DiceGroup[];
  modifier: number; // flat bonus/penalty
  rawTotal: number; // total before resistance/immunity adjustments
  total: number; // final damage after adjustments
  damageType: string;
  isCrit: boolean;
}

export interface ParsedAttack {
  name: string;
  attackBonus: number;
  damageExpression: string;
  damageType: string;
  isRanged: boolean;
  isMelee: boolean;
  reach: number;
  range?: string;
  /** Structured attack data from bestiary JSON attackDetails field. */
  attackDetails?: AttackDetails;
  /** All damage options (e.g. greatsword: longsword & shortsword variants). */
  damageOptions?: Array<{ expression: string; type: string }>;
}

/**
 * Structured attack data from bestiary JSON attackDetails field.
 * Represents a single attack action with full mechanical detail.
 */
export interface AttackDetails {
  /** Attack type: melee, ranged, spell, or ability. */
  type: 'melee' | 'ranged' | 'spell' | 'ability';
  /** Range in feet. 0 = touch/unspecified. */
  range: number;
  /** Attack bonus to hit, or null for save-based attacks. */
  toHit: number | null;
  /** Number of targets: 1=single, -1=all in area, 'all'=entire enemy team. */
  targets: number | -1 | 'all';
  /** Damage expressions with type and when (failure/success). */
  damage: Array<{ type: string; damage: string; when?: string }>;
  /** Saving throw for save-based attacks. */
  save?: { dc: number; ability: string };
  /** Conditions inflicted on failed save. */
  inflictsConditions?: Array<{ condition: string; save?: string; escape?: number | null }>;
}

export interface ParsedMonsterProfile {
  attacks: ParsedAttack[];
  multiattackCount: number;
  hasMultiattack: boolean;
  multiattackSequence?: Array<{ attackName: string; count: number }>;
  proficiencyBonus: number;
  isLegendary: boolean;
  /** All attackDetails extracted from monster actions. */
  attackDetails: AttackDetails[];
  /** Primary save DC from spellcasting or actions. */
  primarySaveDC?: number;
}

export interface RoleDefinition {
  type: CombatantRoleType;
  actionWeights: Record<string, number>;
  targetPriorities: Record<string, number>;
  resourcePreference: 'save' | 'balanced' | 'spend';
}

export interface ActionCandidate {
  type: ActionType;
  name: string;
  targetIndex?: number;
  targetPosition?: GridPosition;
  expectedDamage?: number;
  expectedHealing?: number;
  resourceCost?: {
    spellSlot?: number;
    ability?: string;
    isAtWill?: boolean;
    dailySpellKey?: string;
  };
  damageExpression?: string;
  damageType?: string;
  attackBonus?: number;
  score: number;
  hasSave?: boolean;
  saveDC?: number;
  saveAbility?: 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';
  /** Attack type from attackDetails. */
  attackType?: 'melee' | 'ranged' | 'spell' | 'ability';
  /** Whether this is an area-of-effect attack. */
  isAreaAttack?: boolean;
  /** Number of targets for this attack. */
  targetCount?: number;
  /** Conditions this attack inflicts on target. */
  inflictsConditions?: Array<{ condition: string; save?: string; escape?: number | null }>;
  /** Damage options for attacks with multiple expressions. */
  damageOptions?: Array<{ expression: string; type: string }>;
}

export interface TurnResult {
  events: string[];
  combatantUpdates: Partial<SimulatorCombatant>[];
  actionExecuted: boolean;
  damageDealt?: number;
  targetName?: string;
  targetHpBefore?: number;
  targetHpAfter?: number;
  isCrit?: boolean;
  damageBreakdown?: DamageRoll;
  saveResult?: SpellSaveResult;
}

export interface TurnEvent {
  round: number;
  turnIndex: number;
  combatantName: string;
  combatantTeam: Team;
  actionTaken: {
    type: ActionType;
    name: string;
    description: string;
  };
  outcome: {
    success: boolean;
    damageDealt?: number;
    isCrit?: boolean;
    targetName?: string;
    targetHpBefore?: number;
    targetHpAfter?: number;
    hpBefore: number;
    hpAfter: number;
    events: string[];
    damageBreakdown?: DamageRoll;
    saveResult?: SpellSaveResult;
  };
}

/**
 * Minimal spell descriptor used by the simulation engine.
 * Only the fields needed to determine damage behaviour are included.
 */
export interface SimSpell {
  name: string;
  level: number;
  damageInflict?: string[];
  entries: (string | object)[];
  /** Save DC extracted from entries (e.g., "DC 15"). Null if spell deals direct damage. */
  saveDC?: number;
  /** Primary save ability extracted from entries (e.g., "dex"). Null if no save. */
  saveAbility?: 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';
}

export interface SimulationConfig {
  map: GameMap;
  combatants: Array<{
    monster: Monster;
    team: Team;
    role: CompositeRole;
    position: GridPosition;
    applyDeathSaves?: boolean;
    allowSurrender?: boolean;
    surrenderHpThreshold?: number;
  }>;
  resourceMode: ResourceMode;
  roundLimit: number;
  /** Keyed by lowercase spell name. Populated from dataStore before running. */
  spellMap?: Record<string, SimSpell>;
  /** Optional side objectives that influence AI behavior. */
  sideObjectives?: SideObjective[];
  /** Optional environmental hazards active in the encounter. */
  hazards?: Hazard[];
}

export interface SideObjective {
  id: string;
  name: string;
  description: string;
  /** If true, AI prioritizes reaching/holding this position. */
  holdPosition?: boolean;
  /** Grid position the objective is centered on. */
  position?: { x: number; y: number };
  /** Radius in grid cells. */
  radius?: number;
  /** How much the objective boosts AI action score when active. */
  priorityWeight?: number;
  /** Condition to complete the objective (e.g. 'enemies_near_position'). */
  completionCondition?: string;
  /** Bonus score if objective is active. */
  activeScore?: number;
}

export interface SimulationResult {
  seed: string;
  config: SimulationConfig;
  resourceMode: ResourceMode;
  outcome: SimulationOutcome;
  totalRounds: number;
  totalTurns: number;
  turnLog: TurnEvent[];
  finalCombatants: Array<{
    name: string;
    team: Team;
    maxHp: number;
    finalHp: number;
    initiative: number;
    damageTaken: number;
    damageDealt: number;
    kills: number;
    died: boolean;
    hitCount: number;
    missCount: number;
    critCount: number;
    actions: Array<{
      type: string;
      count: number;
    }>;
    resourcesUsed: {
      spellSlots: Record<number, number>;
      dailySpellsUsed: Record<string, number>;
      abilityUses: Record<string, number>;
    };
  }>;
}

export interface BatchStatistics {
  totalRuns: number;
  allyWinRate: number;
  averageRounds: number;
  averageTurns: number;
  resourceModeBreakdown: Record<ResourceMode, BatchStatistics>;
  perCombatantStats: Array<{
    name: string;
    team: Team;
    avgDamageDealt: number;
    avgDamageTaken: number;
    killRate: number;
    deathRate: number;
  }>;
}

export interface SimulationRun {
  seed: string;
  config: SimulationConfig;
  result: SimulationResult;
}

export interface SimulationBatch {
  batchId: string;
  created: number;
  runs: SimulationRun[];
  aggregatedStats: BatchStatistics;
}

export interface Hazard {
  type: HazardType;
  position: { x: number; y: number };
  radius: number;
  /** Damage expression (e.g. '3d6'). Null for non-damaging hazards. */
  damageExpression?: string;
  /** Save DC. Null if no save. */
  saveDC?: number;
  /** Save ability. Null if no save. */
  saveAbility?: 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';
  /** Duration in rounds. -1 = permanent until triggered/disposed. */
  duration?: number;
  /** Whether the hazard has been triggered/active this round. */
  triggered?: boolean;
  /** Trigger description. */
  triggerText?: string;
}

export interface MoraleCheck {
  combatantName: string;
  roll: number;
  modifier: number;
  total: number;
  result: MoraleState;
  fled: boolean;
  reason: string;
}

export interface MoraleCheck {
  combatantName: string;
  roll: number;
  modifier: number;
  total: number;
  result: MoraleState;
  fled: boolean;
  reason: string;
}

export interface HazardResult {
  name: string;
  damageDealt: number;
  targetsAffected: string[];
  saveResult?: { succeeded: boolean; failed: boolean };
  triggerDescription: string;
}

export interface MoraleResult {
  checks: MoraleCheck[];
  fledCount: number;
  routTriggered: boolean;
}

export interface AoESpellTargetResult {
  spellName: string;
  aoeType: 'sphere' | 'cone' | 'line' | 'burst' | 'blob';
  centerPosition: Position;
  radius: number;
  damageDealt: number;
  targetsAffected: string[];
  saveResult?: { succeeded: number; failed: number };
}

export interface OpportunityAttackResult {
  triggered: boolean;
  isHit: boolean;
  finalDamage: number;
  combatantName: string;
  targetName: string;
}

export interface HitDiceHealResult {
  hitDiceRolled: number;
  conMod: number;
  totalHealed: number;
  currentHp: number;
  hitDiceRemaining: number;
}

export interface SpellSaveResult {
  targetName: string;
  dc: number;
  rolled: number;
  ability: string;
  succeeded: boolean;
  halfDamageOnSuccess: boolean;
  baseDamage: number;
  finalDamage: number;
  conditionApplied?: string;
}

// ============================================================================
// OOP CLASSES
// ============================================================================

/**
 * Represents a position on the tactical grid.
 */
export class Position {
  public x: number;
  public y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  clone(): Position {
    return new Position(this.x, this.y);
  }

  equals(other: Position): boolean {
    return this.x === other.x && this.y === other.y;
  }

  distanceTo(other: Position): number {
    return Math.max(Math.abs(this.x - other.x), Math.abs(this.y - other.y));
  }

  toString(): string {
    return `(${this.x}, ${this.y})`;
  }
}

/**
 * Represents a cell on the game map.
 */
export class GameMapCell {
  public position: Position;
  public type: CellType;
  public elevation: number = 0;

  constructor(position: Position, type: CellType) {
    this.position = position;
    this.type = type;
  }

  isPassable(): boolean {
    return this.type !== 'wall';
  }

  getMovementCost(): number {
    return this.type === 'difficult_terrain' ? 2 : 1;
  }

  clone(): GameMapCell {
    const cell = new GameMapCell(this.position.clone(), this.type);
    cell.elevation = this.elevation;
    return cell;
  }
}

/**
 * Represents the tactical game map.
 */
export class GameMap {
  public width: number;
  public height: number;
  public cellSize: number;
  private cellMap: Map<string, GameMapCell> = new Map();

  constructor(width: number, height: number, cellSize: number = 5) {
    this.width = width;
    this.height = height;
    this.cellSize = cellSize;
  }

  private getKey(pos: Position): string {
    return `${pos.x},${pos.y}`;
  }

  isInBounds(pos: Position): boolean {
    return pos.x >= 0 && pos.x < this.width && pos.y >= 0 && pos.y < this.height;
  }

  setCell(pos: Position, type: CellType, elevation?: number): void {
    if (!this.isInBounds(pos)) return;
    const cell = new GameMapCell(pos.clone(), type);
    if (elevation !== undefined) {
      cell.elevation = elevation;
    }
    this.cellMap.set(this.getKey(pos), cell);
  }

  getCell(pos: Position): GameMapCell | undefined {
    return this.cellMap.get(this.getKey(pos));
  }

  getAllCells(): GameMapCell[] {
    return Array.from(this.cellMap.values());
  }

  clear(): void {
    this.cellMap.clear();
  }

  clone(): GameMap {
    const newMap = new GameMap(this.width, this.height, this.cellSize);
    for (const cell of this.getAllCells()) {
      newMap.cellMap.set(this.getKey(cell.position), cell.clone());
    }
    return newMap;
  }
}

/**
 * Represents a condition affecting a combatant.
 */
export class Condition {
  public type: string;
  public duration: number;
  public source: string | undefined;

  constructor(type: string, duration: number, source?: string) {
    this.type = type;
    this.duration = duration;
    this.source = source;
  }

  decrementDuration(): boolean {
    if (this.duration > 0) {
      this.duration--;
      return this.duration > 0;
    }
    return true;
  }

  isExpired(): boolean {
    return this.duration === 0;
  }

  clone(): Condition {
    return new Condition(this.type, this.duration, this.source);
  }
}

/**
 * Describes the mechanical effect a condition has on a combatant.
 */
export interface ConditionEffect {
  /** Penalty to attack rolls (-2 for poisoned, etc.) */
  attackRollPenalty?: number;
  /** Penalty to AC (applied on top of cover). */
  acPenalty?: number;
  /** Whether the combatant is incapacitated (can't take actions). */
  incapacitated?: boolean;
  /** Whether the combatant is stunned (can't act, auto-fails str/dex saves). */
  stunned?: boolean;
  /** Whether the combatant is frightened (must move away if possible). */
  frightened?: boolean;
}

/**
 * Represents a combatant in combat (OOP wrapper around Monster).
 */
export class SimulatorCombatant {
  public currentHp: number;
  public tempHp: number = 0;
  public initiative: number = 0;
  public position: Position;
  public role: CompositeRole;
  public team: Team;
  public conditions: Condition[] = [];
  public concentratingOn: SpellReference | null = null;
  public deathSaves: { successes: number; failures: number } = { successes: 0, failures: 0 };
  public isConscious: boolean = true;
  public actionTaken: boolean = false;
  public bonusActionTaken: boolean = false;
  public reactionUsed: boolean = false;
  public disengage: boolean = false;

  public spellSlots: Record<number, { max: number; used: number }> = {};
  public dailySpellUses: Record<string, { max: number; used: number }> = {};
  public abilityRecharges: Record<string, number> = {};
  public weaponCharges: Record<string, number> = {};

  public totalDamageDealt: number = 0;
  public totalDamageTaken: number = 0;
  public killCount: number = 0;
  public hitCount: number = 0;
  public missCount: number = 0;
  public critCount: number = 0;
  public profile: ParsedMonsterProfile | null = null;
  public actionLog: Array<{ type: ActionType; count: number }> = [];

  public monster: Monster;
  public applyDeathSaves: boolean;
  public allowSurrender: boolean;
  public surrenderHpThreshold: number;

  constructor(
    monster: Monster,
    position: Position,
    team: Team,
    role: CompositeRole,
    applyDeathSaves: boolean = false,
    allowSurrender: boolean = false,
    surrenderHpThreshold: number = 0.3
  ) {
    this.monster = monster;
    this.applyDeathSaves = applyDeathSaves;
    this.allowSurrender = allowSurrender;
    this.surrenderHpThreshold = surrenderHpThreshold;
    this.position = position.clone();
    this.team = team;
    this.role = role;
    this.currentHp = this.getMaxHp();
  }

  getMaxHp(): number {
    if (typeof this.monster.hp === 'number') {
      return this.monster.hp;
    }
    if (typeof this.monster.hp === 'object' && this.monster.hp.average) {
      return this.monster.hp.average;
    }
    return 1;
  }

  getName(): string {
    return this.monster.name;
  }

  getAc(): number {
    const monsterAc = this.monster.ac;
    if (typeof monsterAc === 'number') return monsterAc;
    if (Array.isArray(monsterAc) && monsterAc.length > 0) {
      const firstAc = monsterAc[0];
      if (typeof firstAc === 'number') return firstAc;
      if (typeof firstAc === 'object' && firstAc && 'ac' in firstAc) {
        return (firstAc as any).ac ?? 10;
      }
    }
    return 10;
  }

  getSpeed(): number {
    const speed = this.monster.speed;
    if (!speed) return 0;
    return speed.walk ?? 0;
  }

  initializeResources(resourceMode: ResourceMode): void {
    if (this.monster.spellcasting && Array.isArray(this.monster.spellcasting)) {
      for (const sc of this.monster.spellcasting) {
        // Slot-based spellcasting
        if (sc.spells) {
          for (let level = 0; level <= 9; level++) {
            const key = level as keyof typeof sc.spells;
            if (sc.spells[key]) {
              const slots = sc.spells[key]?.slots ?? 0;
              let maxSlots = slots;
              if (resourceMode === 'low') {
                maxSlots = Math.max(0, Math.floor(slots / 3));
              } else if (resourceMode === 'max') {
                maxSlots = slots;
              }
              this.spellSlots[level] = { max: maxSlots, used: 0 };
            }
          }
        }
        // Daily innate spells — tracked separately, not as spell slots
        if (sc.daily) {
          for (const [key, spellList] of Object.entries(sc.daily)) {
            if (!Array.isArray(spellList)) continue;
            const timesPerDay = parseInt(key, 10) || 1;
            let maxUses = timesPerDay;
            if (resourceMode === 'low') maxUses = Math.max(0, Math.floor(timesPerDay / 3));
            for (const spell of spellList) {
              this.dailySpellUses[spell] = { max: maxUses, used: 0 };
            }
          }
        }
      }
    }
  }

  consumeSpellSlot(level: number): boolean {
    if (!this.spellSlots[level]) return false;
    if (this.spellSlots[level].used < this.spellSlots[level].max) {
      this.spellSlots[level].used++;
      return true;
    }
    return false;
  }

  hasSpellSlot(level: number): boolean {
    const slots = this.spellSlots[level];
    return slots ? slots.used < slots.max : false;
  }

  hasDailyUse(spellName: string): boolean {
    const uses = this.dailySpellUses[spellName];
    return uses ? uses.used < uses.max : false;
  }

  consumeDailyUse(spellName: string): boolean {
    const uses = this.dailySpellUses[spellName];
    if (!uses || uses.used >= uses.max) return false;
    uses.used++;
    return true;
  }

  addCondition(condition: Condition): void {
    this.conditions.push(condition);
  }

  removeCondition(index: number): void {
    this.conditions.splice(index, 1);
  }

  hasCondition(type: string): boolean {
    return this.conditions.some(c => c.type === type);
  }

  takeDamage(amount: number, _source?: string): void {
    const tempReduction = Math.min(this.tempHp, amount);
    this.tempHp -= tempReduction;
    const remaining = amount - tempReduction;

    if (remaining > 0) {
      this.currentHp = Math.max(-this.getMaxHp(), this.currentHp - remaining);
      this.totalDamageTaken += amount;

      if (this.currentHp <= 0) {
        this.isConscious = false;
      }
    }
  }

  heal(amount: number): void {
    this.currentHp = Math.min(this.getMaxHp(), this.currentHp + amount);
    this.isConscious = this.currentHp > 0;
  }

  addTempHp(amount: number): void {
    this.tempHp = Math.max(this.tempHp, amount);
  }

  resetTurnState(): void {
    this.actionTaken = false;
    this.bonusActionTaken = false;
    this.reactionUsed = false;
    this.disengage = false;
  }

  recordAction(action: ActionType): void {
    const existing = this.actionLog.find(a => a.type === action);
    if (existing) {
      existing.count++;
    } else {
      this.actionLog.push({ type: action, count: 1 });
    }
  }

  clone(): SimulatorCombatant {
    const clone = new SimulatorCombatant(
      this.monster,
      this.position.clone(),
      this.team,
      this.role,
      this.applyDeathSaves,
      this.allowSurrender,
      this.surrenderHpThreshold
    );
    clone.currentHp = this.currentHp;
    clone.tempHp = this.tempHp;
    clone.initiative = this.initiative;
    clone.isConscious = this.isConscious;
    clone.spellSlots = JSON.parse(JSON.stringify(this.spellSlots));
    clone.dailySpellUses = JSON.parse(JSON.stringify(this.dailySpellUses));
    clone.abilityRecharges = { ...this.abilityRecharges };
    clone.weaponCharges = { ...this.weaponCharges };
    clone.conditions = this.conditions.map(c => c.clone());
    if (this.concentratingOn) {
      clone.concentratingOn = { ...this.concentratingOn };
    }
    clone.deathSaves = { ...this.deathSaves };
    clone.totalDamageDealt = this.totalDamageDealt;
    clone.totalDamageTaken = this.totalDamageTaken;
    clone.killCount = this.killCount;
    clone.hitCount = this.hitCount;
    clone.missCount = this.missCount;
    clone.critCount = this.critCount;
    clone.profile = this.profile;
    clone.actionLog = JSON.parse(JSON.stringify(this.actionLog));
    return clone;
  }

  /**
   * Check if this combatant is adjacent to the given target in a flanking position
   * relative to the attacker. A flanking position is a side-opposite position
   * (both x and y differ from the target).
   */
  isAdjacentToFlanking(target: SimulatorCombatant, attacker: SimulatorCombatant): boolean {
    const dx = target.position.x - this.position.x;
    const dy = target.position.y - this.position.y;
    // Flanking: on a diagonal corner relative to the target (both axes differ)
    if (Math.abs(dx) <= 1 && Math.abs(dy) <= 1 && dx !== 0 && dy !== 0) {
      // Verify attacker is roughly on the opposite side
      const attackerDx = attacker.position.x - this.position.x;
      const attackerDy = attacker.position.y - this.position.y;
      // Flanking is confirmed when attacker and this ally are on opposite sides
      // of the target (dot product of position vectors is negative)
      if (attackerDx * dx < 0 || attackerDy * dy < 0) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check if the target is flanked by any of this combatant's allies.
   * Flanking grants advantage on melee attacks.
   */
  checkFlanking(target: SimulatorCombatant): boolean {
    return target.conditions.some(c => c.type === 'flanked' && c.duration > 0);
  }

  /**
   * Perform a concentration check when taking damage.
   * DC = max(10, Math.floor(damageTaken / 2)).
   * Returns true if concentration is maintained, false if broken.
   */
  checkConcentration(damageTaken: number, prng: () => number): boolean {
    if (!this.concentratingOn) return true;

    const dc = Math.max(10, Math.floor(damageTaken / 2));
    const saveRoll = Math.floor(prng() * 20) + 1;
    const conMod = Math.floor(((this.monster.con ?? 10) - 10) / 2);

    if (saveRoll === 1) {
      // Auto-fail
      this.concentratingOn = null;
      return false;
    }

    if (saveRoll + conMod >= dc) {
      // Success - maintain concentration
      return true;
    }

    // Failure - concentration broken
    this.concentratingOn = null;
    return false;
  }

  /**
   * Get all active condition effects affecting this combatant.
   * Returns combined modifiers from all active conditions.
   */
  getActiveConditionEffects(): ConditionEffect {
    let effect: ConditionEffect = {};

    for (const condition of this.conditions) {
      if (condition.duration <= 0) continue;

      switch (condition.type) {
        case 'poisoned':
          effect.attackRollPenalty = (effect.attackRollPenalty ?? 0) - 2;
          break;
        case 'frightened':
          effect.frightened = true;
          break;
        case 'stunned':
          effect.stunned = true;
          break;
        case 'incapacitated':
          effect.incapacitated = true;
          break;
        case 'paralyzed':
          effect.stunned = true;
          effect.incapacitated = true;
          break;
        case 'blinded':
          effect.attackRollPenalty = (effect.attackRollPenalty ?? 0) - 2;
          break;
        case 'deafened':
          // No mechanical penalty in 5e for deafened
          break;
        case 'grappled':
          // Movement speed reduced to 0, not attack penalty
          break;
        case 'restrained':
          effect.attackRollPenalty = (effect.attackRollPenalty ?? 0) - 2;
          break;
        case 'invisible':
          // Grants advantage on attacks, disadvantage on being targeted
          break;
      }
    }

    return effect;
  }
}

/**
 * Represents the current state of the simulation.
 */
export class SimulationState {
  public round: number = 1;
  public turnCount: number = 0;
  public activeParticipantIndex: number = 0;
  public combatants: SimulatorCombatant[] = [];
  public isActive: boolean = true;
  public endReason: SimulationOutcome | undefined;

  public map: GameMap;

  constructor(
    map: GameMap,
    combatantsData: Array<{
      monster: Monster;
      team: Team;
      role: CompositeRole;
      position: Position;
      applyDeathSaves?: boolean;
      allowSurrender?: boolean;
    }>
  ) {
    this.map = map;
    for (const data of combatantsData) {
      const combatant = new SimulatorCombatant(
        data.monster,
        data.position,
        data.team,
        data.role,
        data.applyDeathSaves ?? false,
        data.allowSurrender ?? false
      );
      this.combatants.push(combatant);
    }
  }

  getActiveCombatant(): SimulatorCombatant {
    const combatant = this.combatants[this.activeParticipantIndex];
    if (!combatant) {
      throw new Error('No active combatant found');
    }
    return combatant;
  }

  getTeam(team: Team): SimulatorCombatant[] {
    return this.combatants.filter(c => c.team === team);
  }

  advanceTurn(): void {
    this.activeParticipantIndex = (this.activeParticipantIndex + 1) % this.combatants.length;
    if (this.activeParticipantIndex === 0) {
      this.round++;
    }
    this.turnCount++;

    const activeCombatant = this.getActiveCombatant();
    if (activeCombatant) {
      activeCombatant.resetTurnState();
    }

    for (const combatant of this.combatants) {
      for (let i = combatant.conditions.length - 1; i >= 0; i--) {
        const condition = combatant.conditions[i];
        if (condition && condition.isExpired()) {
          combatant.removeCondition(i);
        } else if (condition) {
          condition.decrementDuration();
        }
      }
    }
  }

  isTeamEliminated(team: Team): boolean {
    const teamMembers = this.getTeam(team);
    return teamMembers.every(c => !c.isConscious || c.currentHp <= 0);
  }

  clone(): SimulationState {
    const newState = new SimulationState(this.map.clone(), []);
    newState.combatants = this.combatants.map(c => c.clone());
    newState.round = this.round;
    newState.turnCount = this.turnCount;
    newState.activeParticipantIndex = this.activeParticipantIndex;
    newState.isActive = this.isActive;
    newState.endReason = this.endReason;
    return newState;
  }
}

/**
 * Role definitions with weights for AI decision-making.
 */
export const ROLE_DEFINITIONS: Record<CombatantRoleType, RoleDefinition> = {
  Tank: {
    type: 'Tank',
    actionWeights: { defend: 20, attack: 5, move: 8 },
    targetPriorities: { nearest_to_ally: 15, damage_output: 8 },
    resourcePreference: 'balanced',
  },
  Healer: {
    type: 'Healer',
    actionWeights: { heal: 20, attack: 2, move: 5 },
    targetPriorities: { ally_low_hp: 25, ally_in_danger: 15 },
    resourcePreference: 'balanced',
  },
  DamageDealer: {
    type: 'DamageDealer',
    actionWeights: { attack: 20, move: 5, defend: 2 },
    targetPriorities: { boss: 15, highest_damage: 12, weak: 5 },
    resourcePreference: 'spend',
  },
  Controller: {
    type: 'Controller',
    actionWeights: { crowd_control: 18, attack: 5, move: 6 },
    targetPriorities: { group: 18, boss: 12, isolated: 10 },
    resourcePreference: 'balanced',
  },
  Boss: {
    type: 'Boss',
    actionWeights: { attack: 18, move: 5, coordinate: 10 },
    targetPriorities: { weakest: 12, threatening_all: 15 },
    resourcePreference: 'spend',
  },
  Coward: {
    type: 'Coward',
    actionWeights: { retreat: 20, disengage: 15, attack: 3 },
    targetPriorities: { escape_route: 25, nearest: 5 },
    resourcePreference: 'save',
  },
  Scout: {
    type: 'Scout',
    actionWeights: { flanking: 18, move: 12, attack: 15 },
    targetPriorities: { isolated: 20, flanked: 15, low_ac: 8 },
    resourcePreference: 'balanced',
  },
  Support: {
    type: 'Support',
    actionWeights: { buff: 18, heal: 12, attack: 5 },
    targetPriorities: { ally_preparing: 15, ally_at_risk: 12 },
    resourcePreference: 'balanced',
  },
};
