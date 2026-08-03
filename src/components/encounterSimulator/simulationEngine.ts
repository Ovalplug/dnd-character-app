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
import { MonsterParser } from './monsterParser';

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
  private parser: MonsterParser;
  private roundLog: RoundLog[];
  private turnEvents: TurnEvent[];
  private currentRound: number;

  constructor(config: SimulationConfig, prng: () => number) {
    this.config = config;
    this.diceRoller = new DiceRoller(prng);
    this.combatResolver = new CombatResolver(prng);
    this.parser = new MonsterParser();
    this.roundLog = [];
    this.turnEvents = [];
    this.currentRound = 0;

    // Create simulation state - type assert combatants
    this.state = new SimulationState(config.map, config.combatants as any);

    // Apply resource scaling and parse stat block profiles
    for (const combatant of this.state.combatants) {
      combatant.initializeResources(config.resourceMode);
      combatant.profile = this.parser.parseMonsterProfile(combatant.monster);
    }
  }

  executeSimulation(): SimulationResult {
    try {
      // Roll initiative and sort descending
      for (const combatant of this.state.combatants) {
        const dexMod = Math.floor(((combatant.monster.dex || 10) - 10) / 2);
        combatant.initiative = this.diceRoller.rollInitiative(dexMod);
      }
      this.state.combatants.sort((a, b) => b.initiative - a.initiative);

      // Execute rounds
      while (!this.isSimulationOver()) {
        this.executeRound();
        this.currentRound++;
      }

      // Build finalCombatants from current state
      const finalCombatants = this.state.combatants.map(c => ({
        name: c.getName(),
        team: c.team,
        maxHp: c.getMaxHp(),
        finalHp: c.currentHp,
        initiative: c.initiative,
        damageTaken: c.totalDamageTaken,
        damageDealt: c.totalDamageDealt,
        kills: c.killCount,
        died: !this.combatResolver.isAlive(c),
        hitCount: c.hitCount,
        missCount: c.missCount,
        critCount: c.critCount,
        actions: c.actionLog.map(a => ({ type: a.type as string, count: a.count })),
        resourcesUsed: {
          spellSlots: Object.fromEntries(
            Object.entries(c.spellSlots).map(([k, v]) => [k, v.used])
          ) as Record<number, number>,
          dailySpellsUsed: Object.fromEntries(
            Object.entries(c.dailySpellUses).map(([k, v]) => [k, v.used])
          ) as Record<string, number>,
          abilityUses: c.abilityRecharges,
        },
      }));

      return {
        seed: 'sim-' + Date.now(),
        config: this.config,
        resourceMode: this.config.resourceMode,
        outcome: this.determineOutcome() as any,
        totalRounds: this.currentRound,
        totalTurns: this.state.turnCount,
        turnLog: this.turnEvents,
        finalCombatants,
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
    if (enemies.length === 0) return;

    const candidates = this.buildActionCandidates(combatant, enemies);
    if (candidates.length === 0) return;

    const selectedCandidate = this.selectBestAction(candidates);
    if (!selectedCandidate) return;

    this.state.turnCount++;
    combatant.recordAction(selectedCandidate.type);
    const actorHpBefore = combatant.currentHp;

    if (selectedCandidate.type === 'cast_spell') {
      const liveEnemies = this.state.combatants.filter(
        c => c.team !== combatant.team && this.combatResolver.isAlive(c)
      );
      const turnResult = this.executeCastSpell(combatant, selectedCandidate, liveEnemies);
      this.recordTurnLog(combatant, selectedCandidate, turnResult, actorHpBefore);
    } else {
      // Multiattack: use profile count when available
      const attackCount =
        combatant.profile?.hasMultiattack && combatant.profile.multiattackCount > 1
          ? combatant.profile.multiattackCount
          : 1;

      for (let i = 0; i < attackCount; i++) {
        const liveEnemies = this.state.combatants.filter(
          c => c.team !== combatant.team && this.combatResolver.isAlive(c)
        );
        if (liveEnemies.length === 0) break;

        // Re-target if original target died
        let attackAction = selectedCandidate;
        const origTarget =
          selectedCandidate.targetIndex !== undefined
            ? this.state.combatants[selectedCandidate.targetIndex] ?? null
            : null;
        const origTargetDead = origTarget === null || !this.combatResolver.isAlive(origTarget);
        if (origTargetDead) {
          const fallback = liveEnemies[0];
          if (!fallback) break;
          attackAction = {
            ...selectedCandidate,
            targetIndex: this.state.combatants.indexOf(fallback),
          };
        }

        const turnResult = this.executeAttack(combatant, attackAction);
        this.recordTurnLog(combatant, attackAction, turnResult, actorHpBefore);
        if (this.isSimulationOver()) break;
      }
    }
  }

  private buildActionCandidates(
    combatant: SimulatorCombatant,
    enemies: SimulatorCombatant[]
  ): ActionCandidate[] {
    const candidates: ActionCandidate[] = [];

    // Add attack candidates — score by expected damage, do NOT roll (avoids double-apply)
    if (combatant.profile && combatant.profile.attacks.length > 0) {
      for (const attack of combatant.profile.attacks) {
        for (const enemy of enemies) {
          const targetAC = enemy.getAc();
          const hitChance = Math.max(
            0.05,
            Math.min(0.95, (21 - Math.max(0, targetAC - attack.attackBonus)) / 20)
          );
          const avgDmg = this.diceRoller.averageDamage(attack.damageExpression);
          const expectedDmg = hitChance * avgDmg;
          candidates.push({
            type: 'attack',
            name: attack.name,
            targetIndex: this.state.combatants.indexOf(enemy),
            expectedDamage: expectedDmg,
            damageExpression: attack.damageExpression,
            damageType: attack.damageType,
            attackBonus: attack.attackBonus,
            score: expectedDmg,
          });
        }
      }
    } else {
      // Fallback: stat-based estimate when no profile attacks parsed
      for (const enemy of enemies) {
        const strMod = Math.floor(((combatant.monster.str || 10) - 10) / 2);
        const dexMod = Math.floor(((combatant.monster.dex || 10) - 10) / 2);
        const pb = combatant.profile?.proficiencyBonus ?? 2;
        const attackBonus = Math.max(strMod, dexMod) + pb;
        const targetAC = enemy.getAc();
        const hitChance = Math.max(
          0.05,
          Math.min(0.95, (21 - Math.max(0, targetAC - attackBonus)) / 20)
        );
        const avgDmg = this.diceRoller.averageDamage('1d6');
        const expectedDmg = hitChance * avgDmg;
        candidates.push({
          type: 'attack',
          name: `Strike`,
          targetIndex: this.state.combatants.indexOf(enemy),
          expectedDamage: expectedDmg,
          damageExpression: '1d6',
          damageType: 'bludgeoning',
          attackBonus,
          score: expectedDmg,
        });
      }
    }

    // Add spell candidates if available
    if (combatant.monster.spellcasting) {
      const spellcastingList = Array.isArray(combatant.monster.spellcasting)
        ? combatant.monster.spellcasting
        : [combatant.monster.spellcasting];

      for (const spellcasting of spellcastingList) {
        // Format 1: Standard spellcasting (slots by level)
        if (spellcasting?.spells && typeof spellcasting.spells === 'object') {
          for (let level = 1; level <= 9; level++) {
            const key = level as keyof typeof spellcasting.spells;
            const spellsAtLevel = spellcasting.spells[key]?.spells;

            if (Array.isArray(spellsAtLevel) && spellsAtLevel.length > 0) {
              const availableSlots =
                (combatant.spellSlots[level]?.max ?? 0) - (combatant.spellSlots[level]?.used ?? 0);

              if (availableSlots > 0) {
                for (const spell of spellsAtLevel) {
                  candidates.push({
                    type: 'cast_spell',
                    name: `Cast ${spell}`,
                    targetIndex: 0,
                    expectedDamage: level * 3,
                    resourceCost: { spellSlot: level },
                    score: level * 2 + 5,
                  });
                }
              }
            }
          }
        }

        // Format 2: At-will innate spells (unlimited, no resource cost)
        if (spellcasting?.will && Array.isArray(spellcasting.will)) {
          for (const spell of spellcasting.will) {
            candidates.push({
              type: 'cast_spell',
              name: `Cast ${spell}`,
              targetIndex: 0,
              expectedDamage: 6,
              resourceCost: { isAtWill: true },
              score: 8,
            });
          }
        }

        // Format 3: Daily innate spells — check use tracker set up by initializeResources
        if (spellcasting?.daily && typeof spellcasting.daily === 'object') {
          for (const dailyKey in spellcasting.daily) {
            const dailySpells = (spellcasting.daily as any)[dailyKey];
            if (!Array.isArray(dailySpells)) continue;
            const timesPerDay = parseInt(dailyKey, 10) || 1;
            for (const spell of dailySpells) {
              if (combatant.hasDailyUse(spell)) {
                candidates.push({
                  type: 'cast_spell',
                  name: `Cast ${spell}`,
                  targetIndex: 0,
                  expectedDamage: timesPerDay * 3,
                  resourceCost: { dailySpellKey: spell },
                  score: timesPerDay * 3 + 5,
                });
              }
            }
          }
        }
      }
    }

    return candidates;
  }

  private selectBestAction(candidates: ActionCandidate[]): ActionCandidate | null {
    if (candidates.length === 0) return null;
    return [...candidates].sort((a, b) => (b.score ?? 0) - (a.score ?? 0))[0] ?? null;
  }

  private executeAttack(combatant: SimulatorCombatant, action: ActionCandidate): TurnResult {
    if (action.targetIndex === undefined) {
      return { events: ['No target found'], combatantUpdates: [], actionExecuted: false };
    }

    const target = this.state.combatants[action.targetIndex];
    if (!target || !this.combatResolver.isAlive(target)) {
      return { events: ['Target is no longer alive'], combatantUpdates: [], actionExecuted: false };
    }

    const attackBonus =
      action.attackBonus ??
      Math.max(
        Math.floor(((combatant.monster.str || 10) - 10) / 2),
        Math.floor(((combatant.monster.dex || 10) - 10) / 2)
      ) + (combatant.profile?.proficiencyBonus ?? 2);
    const damageExpr = action.damageExpression ?? '1d6';
    const damageType = action.damageType ?? 'bludgeoning';

    const targetHpBefore = target.currentHp;
    const result = this.combatResolver.resolveAttack(
      combatant,
      target,
      attackBonus,
      damageExpr,
      false,
      false,
      damageType
    );
    const targetHpAfter = target.currentHp;

    let eventMsg: string;
    if (!result.isHit) {
      eventMsg = `${combatant.getName()} misses ${target.getName()}`;
    } else {
      const critStr = result.isCrit ? ' (CRIT!)' : '';
      const resistStr =
        result.resistanceApplied === 'immune'
          ? ' [IMMUNE]'
          : result.resistanceApplied === 'resist'
          ? ' [resist]'
          : result.resistanceApplied === 'vulnerable'
          ? ' [VULNERABLE]'
          : '';
      eventMsg = `${combatant.getName()} hits ${target.getName()} for ${
        result.finalDamage
      } ${damageType} damage${critStr}${resistStr}`;
    }

    return {
      events: [eventMsg],
      combatantUpdates: [],
      actionExecuted: result.isHit,
      damageDealt: result.finalDamage,
      targetName: target.getName(),
      targetHpBefore,
      targetHpAfter,
      isCrit: result.isCrit,
    };
  }

  private executeCastSpell(
    combatant: SimulatorCombatant,
    action: ActionCandidate,
    enemies: SimulatorCombatant[]
  ): TurnResult {
    const isAtWill = action.resourceCost?.isAtWill === true;
    const dailySpellKey = action.resourceCost?.dailySpellKey;
    const spellLevel = action.resourceCost?.spellSlot ?? 0;

    // Consume the appropriate resource (or none for at-will)
    if (!isAtWill) {
      if (dailySpellKey) {
        if (!combatant.consumeDailyUse(dailySpellKey)) {
          return {
            events: [`${combatant.getName()} has no daily uses left of ${dailySpellKey}`],
            combatantUpdates: [],
            actionExecuted: false,
          };
        }
      } else if (spellLevel > 0) {
        const slots = combatant.spellSlots[spellLevel];
        if (!slots || slots.used >= slots.max) {
          return {
            events: [`${combatant.getName()} has no spell slots of level ${spellLevel}`],
            combatantUpdates: [],
            actionExecuted: false,
          };
        }
        slots.used++;
      }
    }

    const target = enemies[0];
    if (!target) {
      return { events: [`No valid target for spell`], combatantUpdates: [], actionExecuted: false };
    }

    const damage = isAtWill || dailySpellKey ? action.expectedDamage ?? 6 : spellLevel * 4;
    const targetHpBefore = target.currentHp;
    target.takeDamage(damage);
    combatant.totalDamageDealt += damage;
    const targetHpAfter = target.currentHp;

    const spellDesc =
      dailySpellKey ?? (isAtWill ? action.name.replace('Cast ', '') : `level-${spellLevel} spell`);
    return {
      events: [
        `${combatant.getName()} casts ${spellDesc} on ${target.getName()} for ${damage} damage`,
      ],
      combatantUpdates: [],
      actionExecuted: true,
      damageDealt: damage,
      targetName: target.getName(),
      targetHpBefore,
      targetHpAfter,
    };
  }

  private recordTurnLog(
    actor: SimulatorCombatant,
    action: ActionCandidate,
    result: TurnResult,
    actorHpBefore: number
  ): void {
    const log: RoundLog = {
      round: this.currentRound,
      turn: this.state.turnCount,
      combatantId: actor.getName(),
      action,
      result,
    };
    this.roundLog.push(log);

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
        damageDealt: result.damageDealt,
        isCrit: result.isCrit,
        targetName: result.targetName,
        targetHpBefore: result.targetHpBefore,
        targetHpAfter: result.targetHpAfter,
        hpBefore: actorHpBefore,
        hpAfter: actor.currentHp,
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
