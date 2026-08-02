import type {
  SimulationConfig,
  SimulationResult,
  ActionCandidate,
  TurnResult,
} from './emulatorTyping';
import { SimulatorCombatant, SimulationState } from './emulatorTyping';
import { CombatResolver } from './combatRules';
import { DiceRoller } from './diceRollFunctions';

export interface RoundLog {
  round: number;
  turn: number;
  combatantId: string;
  action: ActionCandidate | null;
  result: TurnResult;
}

export interface SimulationStatistics {
  roundsCompleted: number;
  winningTeam: string | null;
  totalRounds: number;
  combatantsAlive: number;
}

export class SimulationEngine {
  private state: SimulationState;
  private config: SimulationConfig;
  private combatResolver: CombatResolver;
  private diceRoller: DiceRoller;
  private roundLog: RoundLog[];
  private currentRound: number;

  constructor(config: SimulationConfig, prng: () => number) {
    this.config = config;
    this.diceRoller = new DiceRoller(prng);
    this.combatResolver = new CombatResolver(prng);
    this.roundLog = [];
    this.currentRound = 0;

    // Create simulation state - type assert combatants
    this.state = new SimulationState(config.map, config.combatants as any);

    // Apply resource scaling based on resource mode
    for (const combatant of this.state.combatants) {
      combatant.initializeResources(config.resourceMode);
    }
  }

  executeSimulation(): SimulationResult {
    try {
      // Roll initiative and sort
      for (const combatant of this.state.combatants) {
        const dexMod = (combatant.monster.dex || 10) - 10;
        combatant.initiative = this.diceRoller.rollInitiative(dexMod);
      }

      // Execute rounds
      while (!this.isSimulationOver()) {
        this.executeRound();
        this.currentRound++;
      }

      // Build finalCombatants from current state
      const finalCombatants = this.state.combatants.map(c => ({
        name: c.getName(),
        team: c.team,
        finalHp: c.currentHp,
        damageTaken: c.totalDamageTaken,
        damageDealt: c.totalDamageDealt,
        kills: c.killCount,
        died: !this.combatResolver.isAlive(c),
        actions: c.actionLog.map(a => ({ type: a.type as string, count: a.count })),
        resourcesUsed: {
          spellSlots: Object.fromEntries(
            Object.entries(c.spellSlots).map(([k, v]) => [k, v.used])
          ) as Record<number, number>,
          abilityUses: c.abilityRecharges
        }
      }));

      return {
        seed: 'sim-' + Date.now(),
        config: this.config,
        resourceMode: this.config.resourceMode,
        outcome: this.determineOutcome() as any,
        totalRounds: this.currentRound,
        totalTurns: this.state.turnCount,
        finalCombatants
      };
    } catch (error) {
      console.error('Simulation execution error:', error);
      throw error;
    }
  }

  private executeRound(): void {
    for (const combatant of this.state.combatants) {
      if (!this.combatResolver.isAlive(combatant)) {
        continue;
      }

      this.executeTurn(combatant);

      if (this.isSimulationOver()) {
        break;
      }
    }
  }

  private executeTurn(combatant: SimulatorCombatant): void {
    const enemies = this.state.combatants.filter(
      c => c.team !== combatant.team && this.combatResolver.isAlive(c)
    );

    if (enemies.length === 0) {
      return;
    }

    // Simple: attack first enemy in range
    const target = enemies[0];
    if (!target) return;
    const strMod = (combatant.monster.str || 10) - 10;

    const result = this.combatResolver.resolveAttack(
      combatant,
      target,
      strMod,
      '1d8+0',
      false,
      false
    );

    const turnResult: TurnResult = {
      events: result.isHit
        ? [`${combatant.getName()} hits ${target.getName()} for ${result.finalDamage} damage`]
        : [`${combatant.getName()} misses ${target.getName()}`],
      combatantUpdates: [],
      actionExecuted: result.isHit,
    };

    const action: ActionCandidate = {
      type: 'attack',
      name: `Attack ${target.getName()}`,
      expectedDamage: result.finalDamage,
      score: result.isHit ? 10 : 0,
    };

    this.recordTurnLog(combatant, action, turnResult);
  }

  private recordTurnLog(
    actor: SimulatorCombatant,
    action: ActionCandidate,
    result: TurnResult
  ): void {
    const log: RoundLog = {
      round: this.currentRound,
      turn: this.state.turnCount,
      combatantId: actor.getName(),
      action,
      result,
    };
    this.roundLog.push(log);
  }

  private isSimulationOver(): boolean {
    const alliesAlive = this.state.combatants.filter(
      c => c.team === 'allies' && this.combatResolver.isAlive(c)
    );
    const enemiesAlive = this.state.combatants.filter(
      c => c.team === 'enemies' && this.combatResolver.isAlive(c)
    );

    if (alliesAlive.length === 0 || enemiesAlive.length === 0) {
      return true;
    }

    if (this.currentRound >= this.config.roundLimit) {
      return true;
    }

    return false;
  }

  private determineOutcome(): string {
    const alliesAlive = this.state.combatants.filter(
      c => c.team === 'allies' && this.combatResolver.isAlive(c)
    );
    const enemiesAlive = this.state.combatants.filter(
      c => c.team === 'enemies' && this.combatResolver.isAlive(c)
    );

    if (alliesAlive.length > 0 && enemiesAlive.length === 0) return 'allies_win';
    if (enemiesAlive.length > 0 && alliesAlive.length === 0) return 'enemies_win';
    if (this.currentRound >= this.config.roundLimit) return 'round_limit';
    return 'tie';
  }

  getRoundLog(): RoundLog[] {
    return this.roundLog;
  }

  getState(): SimulationState {
    return this.state;
  }

  getCurrentRound(): number {
    return this.currentRound;
  }

  getStatistics(): SimulationStatistics {
    const alliesAlive = this.state.combatants.filter(
      c => c.team === 'allies' && this.combatResolver.isAlive(c)
    ).length;
    const enemiesAlive = this.state.combatants.filter(
      c => c.team === 'enemies' && this.combatResolver.isAlive(c)
    ).length;

    const winningTeam: string | null =
      alliesAlive > 0 && enemiesAlive === 0
        ? 'allies'
        : enemiesAlive > 0 && alliesAlive === 0
        ? 'enemies'
        : null;

    return {
      roundsCompleted: this.currentRound,
      winningTeam,
      totalRounds: this.currentRound,
      combatantsAlive: alliesAlive + enemiesAlive,
    };
  }
}
