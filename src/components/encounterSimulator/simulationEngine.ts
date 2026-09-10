/**
 * Encounter Simulator Engine
 * Core simulation loop with support for spell saves, flanking, cover,
 * status effects, concentration, and LOS.
 */

import type {
  SimulationConfig,
  SimulationResult,
  ActionCandidate,
  TurnResult,
  SimSpell,
  DamageRoll,
} from './emulatorTyping';
import type { SimulatorCombatant, TurnEvent } from './emulatorTyping';
import { SimulationState, Condition, Position } from './emulatorTyping';
import { CoverType } from './movement';
import { CombatResolver } from './combatRules';
import { DiceRoller } from './diceRollFunctions';
import { MonsterParser } from './monsterParser';
import { MovementResolver } from './movement';

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
  private movementResolver: MovementResolver;
  private spellMap: Record<string, SimSpell>;
  private roundLog: RoundLog[];
  private turnEvents: TurnEvent[];
  private currentRound: number;
  constructor(config: SimulationConfig, prng: () => number) {
    this.config = config;
    this.diceRoller = new DiceRoller(prng);
    this.combatResolver = new CombatResolver(prng);
    this.parser = new MonsterParser();
    this.movementResolver = new MovementResolver(prng);
    this.spellMap = config.spellMap ?? {};
    this.roundLog = [];
    this.turnEvents = [];
    this.currentRound = 0;

    // Create simulation state
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
      const profile = combatant.profile;

      // Check for flanking: apply flanking conditions to enemies adjacent to allies
      this.applyFlanking(combatant);

      if (profile?.hasMultiattack && profile.multiattackSequence?.length) {
        // Sequence-based multiattack
        for (const seqItem of profile.multiattackSequence) {
          const seqAttack = profile.attacks.find(
            a => a.name.toLowerCase() === seqItem.attackName.toLowerCase()
          );

          for (let i = 0; i < seqItem.count; i++) {
            const liveEnemies = this.state.combatants.filter(
              c => c.team !== combatant.team && this.combatResolver.isAlive(c)
            );
            if (liveEnemies.length === 0) break;

            const origTarget =
              selectedCandidate.targetIndex !== undefined
                ? this.state.combatants[selectedCandidate.targetIndex] ?? null
                : null;
            const useTarget =
              origTarget && this.combatResolver.isAlive(origTarget) ? origTarget : liveEnemies[0]!;

            const attackAction: ActionCandidate = seqAttack
              ? {
                  type: 'attack',
                  name: seqAttack.name,
                  targetIndex: this.state.combatants.indexOf(useTarget),
                  damageExpression: seqAttack.damageExpression,
                  damageType: seqAttack.damageType,
                  attackBonus: seqAttack.attackBonus,
                  score: selectedCandidate.score,
                }
              : { ...selectedCandidate, targetIndex: this.state.combatants.indexOf(useTarget) };

            const turnResult = this.executeAttack(combatant, attackAction);
            this.recordTurnLog(combatant, attackAction, turnResult, actorHpBefore);
            if (this.isSimulationOver()) break;
          }
          if (this.isSimulationOver()) break;
        }
      } else {
        // Count-based multiattack or single attack
        const attackCount =
          profile?.hasMultiattack && profile.multiattackCount > 1 ? profile.multiattackCount : 1;

        for (let i = 0; i < attackCount; i++) {
          const liveEnemies = this.state.combatants.filter(
            c => c.team !== combatant.team && this.combatResolver.isAlive(c)
          );
          if (liveEnemies.length === 0) break;

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
  }

  /**
   * Apply flanking: check all enemies adjacent to this combatant's allies.
   * If a target is on opposite sides of two friendly combatants, mark flanked.
   */
  private applyFlanking(friendlyCombatant: SimulatorCombatant): void {
    const allies = this.state.combatants.filter(
      c =>
        c.team === friendlyCombatant.team &&
        this.combatResolver.isAlive(c) &&
        c !== friendlyCombatant
    );

    const enemies = this.state.combatants.filter(
      c => c.team !== friendlyCombatant.team && this.combatResolver.isAlive(c)
    );

    for (const enemy of enemies) {
      const adjacentAllies = allies.filter(ally =>
        ally.isAdjacentToFlanking(enemy, friendlyCombatant)
      );

      if (adjacentAllies.length > 0) {
        // Add flanking condition if not already present
        if (!enemy.hasCondition('flanked')) {
          enemy.addCondition(new Condition('flanked', 1, 'Flanking'));
        }
      } else {
        // Remove flanking condition if no adjacent allies
        const flankedIdx = enemy.conditions.findIndex(c => c.type === 'flanked' && c.duration > 0);
        if (flankedIdx !== -1) {
          enemy.removeCondition(flankedIdx);
        }
      }
    }
  }

  private buildActionCandidates(
    combatant: SimulatorCombatant,
    enemies: SimulatorCombatant[]
  ): ActionCandidate[] {
    const candidates: ActionCandidate[] = [];

    // Add attack candidates — score by expected damage, do NOT roll
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
      // Fallback: stat-based estimate
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
                  const dmg = this.spellDamageCandidate(spell);
                  if (!dmg) continue;
                  const avgDmg = this.diceRoller.averageDamage(dmg.expression);
                  const spellData = this.lookupSpellData(spell);

                  // If spell has a save DC, score higher (more reliable damage)
                  let score = avgDmg + level;
                  if (spellData?.saveDC) {
                    // Estimate save success rate (rough average ~50%)
                    const saveChance = 0.5;
                    const halfDmgAvg = avgDmg * saveChance + avgDmg * 0.5 * (1 - saveChance);
                    score = halfDmgAvg + level + 1;
                  }

                  candidates.push({
                    type: 'cast_spell',
                    name: `Cast ${spell}`,
                    targetIndex: 0,
                    expectedDamage: spellData?.saveDC ? avgDmg * 0.75 : avgDmg,
                    damageExpression: dmg.expression,
                    damageType: dmg.type,
                    resourceCost: { spellSlot: level },
                    score,
                    hasSave: !!spellData?.saveDC,
                    saveDC: spellData?.saveDC,
                    saveAbility: spellData?.saveAbility,
                  });
                }
              }
            }
          }
        }

        // Format 2: At-will innate spells
        if (spellcasting?.will && Array.isArray(spellcasting.will)) {
          for (const spell of spellcasting.will) {
            const dmg = this.spellDamageCandidate(spell);
            if (!dmg) continue;
            const avgDmg = this.diceRoller.averageDamage(dmg.expression);
            const spellData = this.lookupSpellData(spell);

            let score = avgDmg;
            if (spellData?.saveDC) {
              const saveChance = 0.5;
              const halfDmgAvg = avgDmg * saveChance + avgDmg * 0.5 * (1 - saveChance);
              score = halfDmgAvg + 1;
            }

            candidates.push({
              type: 'cast_spell',
              name: `Cast ${spell}`,
              targetIndex: 0,
              expectedDamage: spellData?.saveDC ? avgDmg * 0.75 : avgDmg,
              damageExpression: dmg.expression,
              damageType: dmg.type,
              resourceCost: { isAtWill: true },
              score,
              hasSave: !!spellData?.saveDC,
              saveDC: spellData?.saveDC,
              saveAbility: spellData?.saveAbility,
            });
          }
        }

        // Format 3: Daily innate spells
        if (spellcasting?.daily && typeof spellcasting.daily === 'object') {
          for (const dailyKey in spellcasting.daily) {
            const dailySpells = (spellcasting.daily as any)[dailyKey];
            if (!Array.isArray(dailySpells)) continue;
            for (const spell of dailySpells) {
              if (!combatant.hasDailyUse(spell)) continue;
              const dmg = this.spellDamageCandidate(spell);
              if (!dmg) continue;
              const avgDmg = this.diceRoller.averageDamage(dmg.expression);
              const spellData = this.lookupSpellData(spell);

              let score = avgDmg;
              if (spellData?.saveDC) {
                const saveChance = 0.5;
                const halfDmgAvg = avgDmg * saveChance + avgDmg * 0.5 * (1 - saveChance);
                score = halfDmgAvg + 1;
              }

              candidates.push({
                type: 'cast_spell',
                name: `Cast ${spell}`,
                targetIndex: 0,
                expectedDamage: spellData?.saveDC ? avgDmg * 0.75 : avgDmg,
                damageExpression: dmg.expression,
                damageType: dmg.type,
                resourceCost: { dailySpellKey: spell },
                score,
                hasSave: !!spellData?.saveDC,
                saveDC: spellData?.saveDC,
                saveAbility: spellData?.saveAbility,
              });
            }
          }
        }
      }
    }

    return candidates;
  }

  /**
   * Look up a spell by name (case-insensitive, strips "Cast " prefix).
   */
  private lookupSpell(name: string): SimSpell | null {
    const key = name.toLowerCase().replace(/^cast\s+/i, '');
    return this.spellMap[key] ?? null;
  }

  /**
   * Look up spell data including save DC and save ability.
   */
  private lookupSpellData(name: string): {
    saveDC?: number;
    saveAbility?: 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';
  } | null {
    const spell = this.lookupSpell(name);
    if (!spell) return null;

    if (spell.saveDC && spell.saveAbility) {
      return { saveDC: spell.saveDC, saveAbility: spell.saveAbility };
    }

    const text = spell.entries.map(e => (typeof e === 'string' ? e : JSON.stringify(e))).join(' ');
    const dcMatch = text.match(/DC (\d+)/i);
    if (dcMatch) {
      return { saveDC: parseInt(dcMatch[1] ?? '0', 10) };
    }
    const saveAbilityMatch = text.match(/(Str|Dex|Con|Int|Wis|Cha) Save/i);
    if (saveAbilityMatch) {
      const abilityMap: Record<string, 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'> = {
        Str: 'str',
        Dex: 'dex',
        Con: 'con',
        Int: 'int',
        Wis: 'wis',
        Cha: 'cha',
      };
      const ability = saveAbilityMatch[1] ? saveAbilityMatch[1].toLowerCase() : 'dex';
      return { saveAbility: abilityMap[ability] ?? 'dex' };
    }

    return null;
  }

  /**
   * Returns the damage expression + type for a spell, or null if the spell
   * deals no damage (control, utility, healing, etc.).
   */
  private spellDamageCandidate(spellName: string): { expression: string; type: string } | null {
    const spell = this.lookupSpell(spellName);
    if (!spell || !spell.damageInflict || spell.damageInflict.length === 0) return null;

    const damageType = spell.damageInflict[0] ?? 'untyped';
    const text = spell.entries.map(e => (typeof e === 'string' ? e : JSON.stringify(e))).join(' ');

    const tagMatch = text.match(/\{@(?:damage|dice)\s+([^}]+)\}/i);
    if (tagMatch) {
      return { expression: (tagMatch[1] ?? '1d6').replace(/\s+/g, ''), type: damageType };
    }

    const plainMatch = text.match(/(\d+d\d+(?:\s*[+-]\s*\d+)?)\s+(?:\w+\s+)?damage/i);
    if (plainMatch) {
      return { expression: (plainMatch[1] ?? '1d6').replace(/\s+/g, ''), type: damageType };
    }

    return { expression: `${spell.level}d6`, type: damageType };
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

    // Determine if this is a ranged attack
    const isRanged =
      combatant.profile?.attacks.some(
        a => a.name.toLowerCase() === (action.name ?? '').toLowerCase() && a.isRanged
      ) ?? false;

    // Line of sight check for ranged attacks
    if (isRanged && this.state.map) {
      const hasLos = this.movementResolver.hasLineOfSight(
        new Position(combatant.position.x, combatant.position.y),
        new Position(target.position.x, target.position.y),
        this.state.map
      );
      if (!hasLos) {
        return {
          events: [
            `${combatant.getName()} has no line of sight to ${target.getName()} (ranged attack blocked)`,
          ],
          combatantUpdates: [],
          actionExecuted: false,
        };
      }
    }

    // Apply cover to target AC for ranged attacks
    let coverACBonus = 0;
    if (isRanged && this.state.map) {
      const cover = this.movementResolver.getCover(
        new Position(combatant.position.x, combatant.position.y),
        new Position(target.position.x, target.position.y),
        this.state.map
      );
      if (cover === CoverType.Half) coverACBonus = 2;
      else if (cover === CoverType.ThreeQuarters) coverACBonus = 5;
    }

    const targetHpBefore = target.currentHp;
    const result = this.combatResolver.resolveAttack(
      combatant,
      target,
      attackBonus,
      damageExpr,
      false,
      false,
      damageType,
      isRanged,
      this.state.map
    );
    const targetHpAfter = target.currentHp;

    let eventMsg: string;
    if (!result.isHit) {
      eventMsg = `${combatant.getName()} misses ${target.getName()}`;
      if (coverACBonus > 0 && this.state.map) {
        eventMsg += ' [blocked by cover]';
      }
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
      const flankingStr = result.hitAdvantage ? ' [flanking]' : '';
      eventMsg = `${combatant.getName()} hits ${target.getName()} for ${
        result.finalDamage
      } ${damageType} damage${critStr}${resistStr}${flankingStr}`;
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
      damageBreakdown: result.damageBreakdown,
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

    // Consume the appropriate resource
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

    const dmgType = action.damageType ?? 'untyped';
    const damageExpr = action.damageExpression;
    const spellName = action.name.replace(/^Cast\s+/i, '');

    // PHASE 2: Spell save mechanics
    const hasSave = action.hasSave === true;

    if (hasSave && dmgType) {
      // Spell requires a saving throw — apply to all living enemies
      const saveDC =
        action.saveDC ??
        Math.max(
          8,
          spellLevel +
            Math.floor(combatant.monster.wis || 10) +
            (combatant.profile?.proficiencyBonus ?? 2)
        );
      const saveAbility = action.saveAbility ?? 'dex';

      const validTargets = enemies;

      if (validTargets.length === 0) {
        return {
          events: [`No valid target for ${spellName}`],
          combatantUpdates: [],
          actionExecuted: false,
        };
      }

      const saveResults = this.combatResolver.resolveSave(
        combatant,
        validTargets,
        saveDC,
        damageExpr || '1d6',
        saveAbility as 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha',
        true,
        undefined,
        undefined
      );

      const totalDamage = saveResults.reduce((sum, r) => sum + r.finalDamage, 0);
      combatant.totalDamageDealt += totalDamage;

      const events = saveResults.map(
        r =>
          `${combatant.getName()} casts ${spellName} on ${r.targetName}` +
          (r.succeeded ? ` [save succeeded]` : ` [save failed]`) +
          (r.conditionApplied ? ` [${r.conditionApplied}]` : '') +
          ` (${r.finalDamage} damage)`
      );

      // Use the first save result for single-target reporting
      const firstSaveResult = saveResults[0];
      return {
        events,
        combatantUpdates: [],
        actionExecuted: true,
        damageDealt: totalDamage,
        saveResult: firstSaveResult
          ? {
              targetName: firstSaveResult.targetName,
              dc: firstSaveResult.dc,
              rolled: firstSaveResult.rolled,
              ability: firstSaveResult.ability,
              succeeded: firstSaveResult.succeeded,
              halfDamageOnSuccess: firstSaveResult.halfDamageOnSuccess,
              baseDamage: firstSaveResult.baseDamage,
              finalDamage: firstSaveResult.finalDamage,
              conditionApplied: firstSaveResult.conditionApplied,
            }
          : undefined,
      };
    }

    // No save — direct damage to single target
    const target = enemies[0];
    if (!target) {
      return { events: [`No valid target for spell`], combatantUpdates: [], actionExecuted: false };
    }

    let damage = 0;
    let spellBreakdown: DamageRoll | undefined;
    if (damageExpr) {
      const shouldCrit = Math.random() < 0.05;
      const rollResult = this.diceRoller.parseDamageExpressionDetailed(damageExpr, shouldCrit);
      damage = rollResult.total;
      spellBreakdown = {
        expression: damageExpr,
        groups: rollResult.groups,
        modifier: rollResult.modifier,
        rawTotal: damage,
        total: damage,
        damageType: dmgType,
        isCrit: shouldCrit,
      };
    }
    const targetHpBefore = target.currentHp;
    target.takeDamage(damage);
    combatant.totalDamageDealt += damage;
    const targetHpAfter = target.currentHp;

    const eventMsg =
      damage > 0
        ? `${combatant.getName()} casts ${spellName} on ${target.getName()} for ${damage} ${dmgType} damage`
        : `${combatant.getName()} casts ${spellName} [no damage effect]`;
    return {
      events: [eventMsg],
      combatantUpdates: [],
      actionExecuted: true,
      damageDealt: damage,
      targetName: target.getName(),
      targetHpBefore,
      targetHpAfter,
      damageBreakdown: spellBreakdown,
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
        damageBreakdown: result.damageBreakdown,
        saveResult: result.saveResult,
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
