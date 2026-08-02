/**
 * Combat Resolution Rules Engine (OOP)
 * Handles attack rolls, spell saves, damage resolution, death saves, and condition application.
 */

import type { PRNG } from './diceRollFunctions';
import { DiceRoller } from './diceRollFunctions';
import type { SimulatorCombatant } from './emulatorTyping';
import type { Monster } from '../../types';

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

  constructor(rng: PRNG) {
    this.roller = new DiceRoller(rng);
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
    disadvantage: boolean = false
  ): AttackResult {
    // Attack roll
    const attackRoll = this.roller.rollD20(weaponModifier, advantage, disadvantage);
    const targetAC = target.getAc();
    const isHit = attackRoll >= targetAC;
    const isCrit = attackRoll === 20 + weaponModifier; // d20 was 20

    // Damage calculation
    let finalDamage = 0;
    if (isHit || isCrit) {
      if (isCrit) {
        // Critical hit: double damage dice
        finalDamage = this.roller.parseDamageExpression(damageExpression);
        finalDamage += this.roller.parseDamageExpression(damageExpression);
      } else {
        finalDamage = this.roller.parseDamageExpression(damageExpression);
      }
    }

    // Apply damage
    const totalDamageDealt = isHit ? finalDamage : 0;
    if (totalDamageDealt > 0) {
      target.takeDamage(totalDamageDealt);
      attacker.totalDamageDealt += totalDamageDealt;
    }

    return {
      rolled: attackRoll,
      isCrit,
      isHit,
      finalDamage: totalDamageDealt,
      totalDamageDealt: attacker.totalDamageDealt,
    };
  }

  /**
   * Resolve a spell save (e.g., Fireball, Cone of Cold).
   */
  resolveSave(
    caster: SimulatorCombatant,
    targets: SimulatorCombatant[],
    dc: number,
    damageExpression: string = '8d6',
    savingThrowAbility: 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha' = 'dex',
    halfDamageOnSuccess: boolean = true
  ): SaveResult[] {
    const results: SaveResult[] = [];

    for (const target of targets) {
      const abilityModifier = this.getAbilityModifier(target.monster, savingThrowAbility);
      const saveRoll = this.roller.rollD20(abilityModifier);
      const succeeded = saveRoll >= dc;

      let baseDamage = this.roller.parseDamageExpression(damageExpression);
      let finalDamage = succeeded && halfDamageOnSuccess ? Math.ceil(baseDamage / 2) : baseDamage;

      // Apply damage
      target.takeDamage(finalDamage);
      caster.totalDamageDealt += finalDamage;

      results.push({
        targetName: target.getName(),
        dc,
        rolled: saveRoll,
        succeeded,
        damageHalfOnSuccess: halfDamageOnSuccess,
        baseDamage,
        finalDamage,
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
    // Remove conflicting conditions
    if (type === 'prone' || type === 'grappled' || type === 'restrained') {
      target.conditions = target.conditions.filter(
        c => !['prone', 'grappled', 'restrained'].includes(c.type)
      );
    }

    // Create and add condition
    const condition = {
      type,
      duration,
      source: sourceName,
    };
    target.addCondition(condition as any);
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
   * Get AC against a specific attack type.
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
