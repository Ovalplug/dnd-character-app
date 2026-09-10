/**
 * Combat Resolution Rules Engine (OOP)
 * Handles attack rolls, spell saves, damage resolution, death saves,
 * condition application, concentration conflict resolution, and cover.
 */

import type { PRNG } from './diceRollFunctions';
import { DiceRoller } from './diceRollFunctions';
import type { SimulatorCombatant, DamageRoll, SpellSaveResult } from './emulatorTyping';
import { Condition } from './emulatorTyping';
import type { Monster } from '../../types';
import { MovementResolver } from './movement';

/**
 * Result of an attack roll.
 */
export interface AttackResult {
  rolled: number;
  isCrit: boolean;
  isHit: boolean;
  damageDice?: Array<{ count: number; type: 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20' }>;
  damageModifier?: number;
  finalDamage: number;
  totalDamageDealt: number;
  resistanceApplied?: 'immune' | 'resist' | 'vulnerable' | 'normal';
  damageBreakdown?: DamageRoll;
  /** Bonus to hit from flanking (advantage), cover, or condition penalties. */
  hitPenalty?: number;
  /** Bonus to hit from flanking (advantage). */
  hitAdvantage?: boolean;
}

/**
 * Result of a saving throw.
 */
export interface SaveResult {
  targetName: string;
  dc: number;
  rolled: number;
  succeeded: boolean;
  damageHalfOnSuccess: boolean;
  baseDamage: number;
  finalDamage: number;
}

/**
 * Result of a death save.
 */
export interface DeathSaveResult {
  rolled: number;
  isCrit: boolean;
  isSuccess: boolean;
  successCount: number;
  failureCount: number;
  isDead: boolean;
}

/**
 * Resolves all combat mechanics.
 */
export class CombatResolver {
  private roller: DiceRoller;
  private movementResolver: MovementResolver;

  constructor(rng: PRNG) {
    this.roller = new DiceRoller(rng);
    this.movementResolver = new MovementResolver(rng);
  }

  /**
   * Resolve an attack roll.
   * Returns hit/miss result and applies damage if hit.
   */
  resolveAttack(
    attacker: SimulatorCombatant,
    target: SimulatorCombatant,
    weaponModifier: number = 0,
    damageExpression: string = '1d4',
    advantage: boolean = false,
    disadvantage: boolean = false,
    damageType: string = 'bludgeoning',
    isRanged: boolean = false,
    map?: any
  ): AttackResult {
    // Check for flanking advantage
    const flankingAdvantage = attacker.checkFlanking(target);
    const finalAdvantage = advantage || flankingAdvantage;

    // Check for cover against this attacker
    let coverAmount = 0;

    if (map && isRanged) {
      const cover = this.movementResolver.getCover(attacker.position, target.position, map);
      if (cover !== 0) {
        if (cover === 2) coverAmount = 2; // Half cover
        else if (cover === 5) coverAmount = 5; // Three-quarter cover
        else coverAmount = 0; // Total cover handled separately
      }
    }

    // Get condition effects on attacker
    const attackerEffects = attacker.getActiveConditionEffects();
    const attackRollPenalty = attackerEffects.attackRollPenalty ?? 0;

    // Attack roll
    const attackRoll = this.roller.rollD20(
      weaponModifier + attackRollPenalty,
      finalAdvantage,
      disadvantage
    );
    const targetAC = this.getEffectiveAC(target, { isRanged, coverAmount });
    const isHit = attackRoll >= targetAC;
    const isCrit = attackRoll === 20 + weaponModifier + attackRollPenalty;

    // Damage calculation — use detailed roll to capture individual die results
    let rawDamage = 0;
    let damageBreakdown: DamageRoll | undefined;
    if (isHit) {
      const rollResult = this.roller.parseDamageExpressionDetailed(damageExpression, isCrit);
      rawDamage = rollResult.total;
      damageBreakdown = {
        expression: isCrit ? `${damageExpression} (CRIT ×2 dice)` : damageExpression,
        groups: rollResult.groups,
        modifier: rollResult.modifier,
        rawTotal: rawDamage,
        total: rawDamage, // updated below after resistance
        damageType,
        isCrit,
      };
    }

    // Apply resistance / immunity / vulnerability
    let finalDamage = rawDamage;
    let resistance: 'immune' | 'resist' | 'vulnerable' | 'normal' = 'normal';

    if (isHit) {
      resistance = this.checkResistance(target.monster, damageType);
      if (resistance === 'immune') {
        finalDamage = 0;
      } else if (resistance === 'resist') {
        finalDamage = Math.floor(rawDamage / 2);
      } else if (resistance === 'vulnerable') {
        finalDamage = rawDamage * 2;
      }
    }

    if (damageBreakdown) damageBreakdown.total = finalDamage;

    // Apply damage
    if (isHit && finalDamage > 0) {
      const hpBefore = target.currentHp;
      target.takeDamage(finalDamage);
      attacker.totalDamageDealt += finalDamage;

      // Check concentration break if target was concentrating
      const damageTaken = hpBefore > 0 ? hpBefore - target.currentHp : finalDamage;
      if (damageTaken > 0 && target.concentratingOn) {
        target.checkConcentration(damageTaken, () => this.roller.rng());
      }
    }

    // Track hit / miss / crit on attacker
    if (!isHit) {
      attacker.missCount++;
    } else if (isCrit) {
      attacker.critCount++;
    } else {
      attacker.hitCount++;
    }

    return {
      rolled: attackRoll,
      isCrit,
      isHit,
      finalDamage: isHit ? finalDamage : 0,
      totalDamageDealt: attacker.totalDamageDealt,
      resistanceApplied: resistance,
      damageBreakdown,
      hitPenalty: attackRollPenalty,
      hitAdvantage: flankingAdvantage,
    };
  }

  /**
   * Resolve a spell save (e.g., Fireball, Cone of Cold).
   * Handles damage, resistance, and condition application.
   */
  resolveSave(
    caster: SimulatorCombatant,
    targets: SimulatorCombatant[],
    dc: number,
    damageExpression: string = '8d6',
    savingThrowAbility: 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha' = 'dex',
    halfDamageOnSuccess: boolean = true,
    conditionOnFail?: string,
    conditionDuration?: number
  ): SpellSaveResult[] {
    const results: SpellSaveResult[] = [];

    for (const target of targets) {
      const abilityModifier = this.getAbilityModifier(target.monster, savingThrowAbility);
      const saveRoll = this.roller.rollD20(abilityModifier);
      const succeeded = saveRoll >= dc;

      // Auto-fail on 1, auto-success on 20

      const isAutoSuccess = saveRoll === 20;

      let baseDamage = this.roller.parseDamageExpression(damageExpression);
      let finalDamage = baseDamage;
      let conditionApplied: string | undefined;

      if (isAutoSuccess || (succeeded && halfDamageOnSuccess)) {
        // Success: take half damage (or full if halfDamageOnSuccess is false)
        if (halfDamageOnSuccess) {
          const resistance = this.checkResistance(target.monster, 'untyped');
          if (resistance === 'immune') {
            finalDamage = 0;
          } else if (resistance === 'resist') {
            finalDamage = Math.ceil(baseDamage / 4); // half of half
          } else {
            finalDamage = Math.ceil(baseDamage / 2);
          }
        }
      } else {
        // Failed save: take full damage
        const resistance = this.checkResistance(target.monster, 'untyped');
        if (resistance === 'immune') {
          finalDamage = 0;
        } else if (resistance === 'resist') {
          finalDamage = Math.floor(baseDamage / 2);
        }
        // Apply condition on failed save
        if (conditionOnFail) {
          // Remove flanking condition if target was flanked
          const idx = target.conditions.findIndex(c => c.type === 'flanked' && c.duration > 0);
          if (idx !== -1) {
            target.removeCondition(idx);
          }
          target.addCondition(
            new Condition(conditionOnFail, conditionDuration ?? 1, caster.getName())
          );
          conditionApplied = conditionOnFail;
        }
      }

      // Apply damage
      target.takeDamage(finalDamage);
      caster.totalDamageDealt += finalDamage;

      // Check concentration break if target was concentrating
      if (finalDamage > 0 && target.concentratingOn) {
        target.checkConcentration(finalDamage, () => this.roller.rng());
      }

      results.push({
        targetName: target.getName(),
        dc,
        rolled: saveRoll,
        ability: savingThrowAbility,
        succeeded: isAutoSuccess || succeeded,
        halfDamageOnSuccess,
        baseDamage,
        finalDamage,
        conditionApplied,
      });
    }

    return results;
  }

  /**
   * Resolve a death saving throw (3 successes to stabilize, 3 failures to die).
   */
  resolveDeathSave(combatant: SimulatorCombatant): DeathSaveResult {
    const roll = this.roller.rollD20();
    const isCrit = roll === 20;
    const isFumble = roll === 1;

    let isSuccess: boolean;
    if (isCrit) {
      isSuccess = true;
      combatant.deathSaves.successes += 2;
    } else if (isFumble) {
      isSuccess = false;
      combatant.deathSaves.failures += 2;
    } else {
      isSuccess = roll >= 10;
      if (isSuccess) {
        combatant.deathSaves.successes++;
      } else {
        combatant.deathSaves.failures++;
      }
    }

    const isDead = combatant.deathSaves.successes >= 3 || combatant.deathSaves.failures >= 3;

    if (combatant.deathSaves.successes >= 3) {
      combatant.isConscious = true;
      combatant.currentHp = 1;
    } else if (combatant.deathSaves.failures >= 3) {
      combatant.currentHp = -combatant.getMaxHp();
    }

    return {
      rolled: roll,
      isCrit,
      isSuccess,
      successCount: combatant.deathSaves.successes,
      failureCount: combatant.deathSaves.failures,
      isDead,
    };
  }

  /**
   * Apply a condition to a combatant.
   */
  applyCondition(
    target: SimulatorCombatant,
    type: string,
    duration: number,
    sourceName?: string
  ): void {
    // Remove conflicting conditions (prone/grappled/restrained don't stack)
    if (type === 'prone' || type === 'grappled' || type === 'restrained') {
      target.conditions = target.conditions.filter(
        c => !['prone', 'grappled', 'restrained'].includes(c.type)
      );
    }

    // Create and add condition
    const condition = new Condition(type, duration, sourceName);
    target.addCondition(condition);
  }

  /**
   * Remove a condition from a combatant.
   */
  removeCondition(target: SimulatorCombatant, type: string): void {
    const idx = target.conditions.findIndex(c => c.type === type && c.duration > 0);
    if (idx !== -1) {
      target.removeCondition(idx);
    }
  }

  /**
   * Check if a condition is active.
   */
  hasCondition(target: SimulatorCombatant, type: string): boolean {
    return target.hasCondition(type);
  }

  /**
   * Get ability modifier from monster stats.
   */
  private getAbilityModifier(
    monster: Monster,
    ability: 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'
  ): number {
    const score = monster[ability];
    if (!score) return 0;
    return Math.floor((score - 10) / 2);
  }

  /**
   * Get AC against a specific attack type, accounting for cover.
   */
  getEffectiveAC(
    target: SimulatorCombatant,
    options: {
      isRanged?: boolean;
      isMelee?: boolean;
      hasCover?: boolean;
      coverAmount?: number;
    } = {}
  ): number {
    let ac = target.getAc();

    // Cover grants bonus AC
    if (options.hasCover && options.coverAmount) {
      ac += options.coverAmount;
    }

    return ac;
  }

  /**
   * Check resistance / immunity / vulnerability to a damage type.
   */
  private checkResistance(
    monster: Monster,
    damageType: string
  ): 'immune' | 'resist' | 'vulnerable' | 'normal' {
    const dt = damageType.toLowerCase();

    // Handle "damage" suffix variations (e.g. "fire damage" -> "fire")
    const cleanType = dt.replace(/\s+damage$/i, '');

    if (monster.immune) {
      for (const entry of monster.immune) {
        if (typeof entry === 'string' && entry.toLowerCase() === dt) return 'immune';
        if (typeof entry === 'string' && entry.toLowerCase() === cleanType) return 'immune';
        if (typeof entry === 'object' && entry !== null && 'immune' in entry) {
          const list = (entry as any).immune;
          if (Array.isArray(list) && list.some((i: string) => i.toLowerCase() === dt))
            return 'immune';
          if (Array.isArray(list) && list.some((i: string) => i.toLowerCase() === cleanType))
            return 'immune';
        }
      }
    }

    if (monster.resist) {
      for (const entry of monster.resist) {
        if (typeof entry === 'string' && entry.toLowerCase() === dt) return 'resist';
        if (typeof entry === 'string' && entry.toLowerCase() === cleanType) return 'resist';
        if (typeof entry === 'object' && entry !== null && 'resist' in entry) {
          const list = (entry as any).resist;
          if (Array.isArray(list) && list.some((r: string) => r.toLowerCase() === dt))
            return 'resist';
          if (Array.isArray(list) && list.some((r: string) => r.toLowerCase() === cleanType))
            return 'resist';
        }
      }
    }

    if (monster.vulnerable) {
      for (const entry of monster.vulnerable) {
        if (typeof entry === 'string' && entry.toLowerCase() === dt) return 'vulnerable';
        if (typeof entry === 'string' && entry.toLowerCase() === cleanType) return 'vulnerable';
      }
    }

    return 'normal';
  }

  /**
   * Roll damage for a given expression.
   */
  rollDamage(expression: string): number {
    return this.roller.parseDamageExpression(expression);
  }

  /**
   * Determine if combatant is alive and conscious.
   */
  isAlive(combatant: SimulatorCombatant): boolean {
    return combatant.currentHp > 0 && combatant.isConscious;
  }

  /**
   * Check if combatant is unconscious (hp <= 0).
   */
  isUnconscious(combatant: SimulatorCombatant): boolean {
    return combatant.currentHp <= 0;
  }
}
