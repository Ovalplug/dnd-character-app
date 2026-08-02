import type {
  SimulationConfig,
  SimulationResult,
  ActionCandidate,
  TurnResult,
  TurnEvent,
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
  private turnEvents: TurnEvent[];
  private currentRound: number;

  constructor(config: SimulationConfig, prng: () => number) {
    this.config = config;
    this.diceRoller = new DiceRoller(prng);
    this.combatResolver = new CombatResolver(prng);
    this.roundLog = [];
    this.turnEvents = [];
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
        turnLog: this.turnEvents,
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

    // Build action candidates
    const candidates = this.buildActionCandidates(combatant, enemies);
    if (candidates.length === 0) {
      return;
    }

    // Score and select best candidate
    const selectedCandidate = this.selectBestAction(candidates);
    if (!selectedCandidate) {
      return;
    }

    // Execute the selected action
    let turnResult: TurnResult;
    if (selectedCandidate.type === 'cast_spell') {
      turnResult = this.executeCastSpell(combatant, selectedCandidate, enemies);
    } else {
      turnResult = this.executeAttack(combatant, selectedCandidate);
    }

    this.recordTurnLog(combatant, selectedCandidate, turnResult);
  }

  private buildActionCandidates(combatant: SimulatorCombatant, enemies: SimulatorCombatant[]): ActionCandidate[] {
    const candidates: ActionCandidate[] = [];

    // Add attack candidates
    for (const enemy of enemies) {
      const strMod = (combatant.monster.str || 10) - 10;
      const attackResult = this.combatResolver.resolveAttack(
        combatant,
        enemy,
        strMod,
        '1d8+0',
        false,
        false
      );
      
      candidates.push({
        type: 'attack',
        name: `Attack ${enemy.getName()}`,
        targetIndex: this.state.combatants.indexOf(enemy),
        expectedDamage: attackResult.finalDamage,
        score: attackResult.isHit ? 10 : 0,
      });
    }

    // Add spell candidates if available
    if (combatant.monster.spellcasting) {
      const spellcasting = Array.isArray(combatant.monster.spellcasting)
        ? combatant.monster.spellcasting[0]
        : combatant.monster.spellcasting;

      if (spellcasting?.spells) {
        for (let level = 1; level <= 9; level++) {
          const key = level as keyof typeof spellcasting.spells;
          const spellsAtLevel = spellcasting.spells[key]?.spells;
          
          if (Array.isArray(spellsAtLevel) && spellsAtLevel.length > 0) {
            const availableSlots = (combatant.spellSlots[level]?.max ?? 0) - (combatant.spellSlots[level]?.used ?? 0);
            
            if (availableSlots > 0) {
              const spell = spellsAtLevel[0];
              candidates.push({
                type: 'cast_spell',
                name: `Cast ${spell}`,
                targetIndex: 0,
                expectedDamage: level * 3, // Simple heuristic
                resourceCost: { spellSlot: level },
                score: level * 2 + 5,
              });
            }
          }
        }
      }
    }

    return candidates;
  }

  private selectBestAction(candidates: ActionCandidate[]): ActionCandidate | null {
    if (candidates.length === 0) return null;

    // Prefer spells if available, otherwise attacks
    const spells = candidates.filter(c => c.type === 'cast_spell').sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
    if (spells.length > 0) {
      const selected = spells[0];
      return selected || null;
    }

    const attacks = candidates.filter(c => c.type === 'attack').sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
    return attacks[0] || null;
  }

  private executeAttack(combatant: SimulatorCombatant, action: ActionCandidate): TurnResult {
    if (action.targetIndex === undefined) {
      return { events: ['No target found'], combatantUpdates: [], actionExecuted: false };
    }

    const target = this.state.combatants[action.targetIndex];
    if (!target || !this.combatResolver.isAlive(target)) {
      return { events: ['Target is no longer alive'], combatantUpdates: [], actionExecuted: false };
    }

    const strMod = (combatant.monster.str || 10) - 10;
    const result = this.combatResolver.resolveAttack(
      combatant,
      target,
      strMod,
      '1d8+0',
      false,
      false
    );

    return {
      events: result.isHit
        ? [`${combatant.getName()} hits ${target.getName()} for ${result.finalDamage} damage`]
        : [`${combatant.getName()} misses ${target.getName()}`],
      combatantUpdates: [],
      actionExecuted: result.isHit,
    };
  }

  private executeCastSpell(combatant: SimulatorCombatant, action: ActionCandidate, enemies: SimulatorCombatant[]): TurnResult {
    const spellLevel = action.resourceCost?.spellSlot ?? 1;
    
    // Check if spell slot available
    const slots = combatant.spellSlots[spellLevel];
    if (!slots || slots.used >= slots.max) {
      return { events: [`${combatant.getName()} has no spell slots of level ${spellLevel}`], combatantUpdates: [], actionExecuted: false };
    }

    // Use spell slot
    slots.used++;

    // Simple spell effect: target takes spell level * 4 damage
    const target = enemies[0];
    if (!target) {
      return { events: [`No valid target for spell`], combatantUpdates: [], actionExecuted: false };
    }

    const damage = spellLevel * 4;
    target.currentHp -= damage;
    combatant.totalDamageDealt += damage;
    target.totalDamageTaken += damage;

    return {
      events: [`${combatant.getName()} casts a level-${spellLevel} spell on ${target.getName()} for ${damage} damage`],
      combatantUpdates: [],
      actionExecuted: true,
    };
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

    // Also log as TurnEvent for replay
    const turnEvent: TurnEvent = {
      round: this.currentRound,
      turnIndex: this.state.turnCount,
      combatantName: actor.getName(),
      combatantTeam: actor.team,
      actionTaken: {
        type: action.type,
        name: action.name,
        description: `${actor.getName()} used ${action.name}`,
      },
      outcome: {
        success: result.actionExecuted,
        hpBefore: actor.currentHp + (actor.totalDamageTaken - actor.totalDamageTaken),
        hpAfter: actor.currentHp,
        damageDealt: actor.totalDamageDealt,
        damageTaken: actor.totalDamageTaken,
        events: result.events,
      },
    };
    this.turnEvents.push(turnEvent);
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
