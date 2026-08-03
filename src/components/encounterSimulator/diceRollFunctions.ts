/**
 * Dice Rolling and Damage Calculation (OOP with Seeded RNG)
 * All randomness uses seeded PRNG for deterministic replay.
 */

import type { DiceType } from './emulatorTyping';

/**
 * Seeded random number generator interface.
 * Typically from seedrandom package: PRNG.
 */
export type PRNG = () => number;

/**
 * Main dice rolling class with seeded RNG.
 */
export class DiceRoller {
  private rng: PRNG;

  constructor(rng: PRNG) {
    this.rng = rng;
  }

  /**
   * Get the max value for a dice type.
   */
  private getDiceValue(diceType: DiceType): number {
    switch (diceType) {
      case 'd4':
        return 4;
      case 'd6':
        return 6;
      case 'd8':
        return 8;
      case 'd10':
        return 10;
      case 'd12':
        return 12;
      case 'd20':
        return 20;
      case 'd100':
        return 100;
      default:
        return 0;
    }
  }

  /**
   * Roll a single die of the given type.
   */
  rollSingleDie(diceType: DiceType): number {
    return Math.floor(this.rng() * this.getDiceValue(diceType)) + 1;
  }

  /**
   * Roll a d20 with optional modifier and advantage/disadvantage.
   */
  rollD20(modifier: number = 0, advantage: boolean = false, disadvantage: boolean = false): number {
    const roll1 = this.rollSingleDie('d20');
    if (advantage) {
      const roll2 = this.rollSingleDie('d20');
      return Math.max(roll1, roll2) + modifier;
    }
    if (disadvantage) {
      const roll2 = this.rollSingleDie('d20');
      return Math.min(roll1, roll2) + modifier;
    }
    return roll1 + modifier;
  }

  /**
   * Roll multiple dice with a modifier (e.g., "2d6 + 3").
   * Modifier applies once to the total, not per die.
   */
  rollDice(count: number, diceType: DiceType, modifier: number = 0): number {
    let total = 0;
    for (let i = 0; i < count; i++) {
      total += this.rollSingleDie(diceType);
    }
    return total + modifier;
  }

  /**
   * Roll damage with multiple dice groups (e.g., "2d6 + 3d4 + 5").
   * Input: array of { count, type, modifier? }.
   */
  rollDamage(diceGroups: Array<{ count: number; type: DiceType; modifier?: number }>): number {
    let total = 0;
    for (const group of diceGroups) {
      total += this.rollDice(group.count, group.type, group.modifier ?? 0);
    }
    return total;
  }

  /**
   * Roll critical damage (double the number of dice, same modifiers).
   */
  rollCritDamage(diceGroups: Array<{ count: number; type: DiceType; modifier?: number }>): number {
    const crittedGroups = diceGroups.map(g => ({
      count: g.count * 2,
      type: g.type,
      modifier: g.modifier ?? 0,
    }));
    return this.rollDamage(crittedGroups);
  }

  /**
   * Roll an attack: d20 + modifier.
   * Returns { roll, isCrit }.
   */
  rollAttack(
    modifier: number = 0,
    advantage: boolean = false,
    disadvantage: boolean = false
  ): { roll: number; isCrit: boolean } {
    const d20 = this.rollD20(0, advantage, disadvantage); // roll without modifier first to detect crit
    return {
      roll: d20 + modifier,
      isCrit: d20 === 20,
    };
  }

  /**
   * Roll a saving throw: d20 + ability modifier vs DC.
   * Returns true on success, false on fail.
   */
  rollSave(
    dc: number,
    abilityModifier: number,
    advantage: boolean = false,
    disadvantage: boolean = false
  ): boolean {
    const roll = this.rollD20(abilityModifier, advantage, disadvantage);
    return roll >= dc;
  }

  /**
   * Roll initiative: d20 + DEX modifier.
   */
  rollInitiative(dexModifier: number): number {
    return this.rollD20(dexModifier);
  }

  /**
   * Parse and roll a damage expression like "2d6 + 3".
   * Returns the total damage.
   */
  parseDamageExpression(expression: string): number {
    // Simple regex parser: handles "XdY + Z" patterns
    // Example: "2d6 + 3" or "3d8" or "1d20 + 5"
    const regex = /(\d+)d(\d+)\s*([+-]\s*\d+)?/gi;
    const groups: Array<{ count: number; type: DiceType; modifier?: number }> = [];
    let totalModifier = 0;

    let match: RegExpExecArray | null;
    const regexGlobal = new RegExp(regex.source, 'gi');
    while ((match = regexGlobal.exec(expression)) !== null) {
      const count = parseInt(match[1] ?? '0', 10);
      const diceSize = parseInt(match[2] ?? '0', 10);
      let diceType: DiceType = 'd6'; // default

      if (diceSize === 4) diceType = 'd4';
      else if (diceSize === 6) diceType = 'd6';
      else if (diceSize === 8) diceType = 'd8';
      else if (diceSize === 10) diceType = 'd10';
      else if (diceSize === 12) diceType = 'd12';
      else if (diceSize === 20) diceType = 'd20';
      else if (diceSize === 100) diceType = 'd100';

      groups.push({ count, type: diceType });

      // Parse modifier if present
      if (match[3]) {
        const mod = parseInt(match[3].replace(/\s/g, '') || '0', 10);
        totalModifier += mod;
      }
    }

    if (groups.length === 0) return 0;

    return this.rollDamage(groups.map(g => ({ ...g, modifier: 0 }))) + totalModifier;
  }

  /**
   * Calculate average damage for a string expression like "2d6 + 3" (no RNG).
   */
  averageDamage(expression: string): number {
    const re = /(\d+)d(\d+)/gi;
    let total = 0;
    let match: RegExpExecArray | null;
    const r = new RegExp(re.source, 'gi');
    while ((match = r.exec(expression)) !== null) {
      const count = parseInt(match[1] ?? '0', 10);
      const sides = parseInt(match[2] ?? '0', 10);
      total += (count * (sides + 1)) / 2;
    }
    // Sum any flat modifiers (e.g. +6 or -1) after stripping dice notation
    const stripped = expression.replace(/\d+d\d+/gi, '');
    const modMatches = stripped.match(/[+-]\s*\d+/g);
    if (modMatches) {
      for (const m of modMatches) {
        total += parseInt(m.replace(/\s/g, ''), 10);
      }
    }
    // Fallback: plain integer with no dice
    if (total === 0) {
      const flat = parseInt(expression.trim(), 10);
      if (!isNaN(flat)) total = flat;
    }
    return Math.max(0, total);
  }

  /**
   * Calculate average damage for an expression (no RNG).
   * Used for AI threat assessment.
   */
  calculateAverageDamage(
    diceGroups: Array<{ count: number; type: DiceType; modifier?: number }>
  ): number {
    let total = 0;
    for (const group of diceGroups) {
      const diceMax = this.getDiceValue(group.type);
      const avgPerDie = (diceMax + 1) / 2;
      total += group.count * avgPerDie + (group.modifier ?? 0);
    }
    return total;
  }
}

/**
 * Legacy function for backward compatibility.
 * @deprecated Use DiceRoller class instead.
 */
export function calculateAverageRoll(
  diceType: DiceType,
  numberToRoll: number,
  modifier: number
): number {
  const diceValues: Record<DiceType, number> = {
    d4: 4,
    d6: 6,
    d8: 8,
    d10: 10,
    d12: 12,
    d20: 20,
    d100: 100,
  };
  return ((diceValues[diceType] + 1) / 2) * numberToRoll + modifier;
}

/**
 * Legacy function for backward compatibility - no longer used in simulator.
 * Handles old signature: rollDice([{ dice: 'd6', number: 6, modifier?: 2 }])
 * @deprecated Use DiceRoller class instead.
 */
export function rollDice(
  diceRollsOrCount: unknown[],
  _diceType?: DiceType,
  _modifier?: number
): number {
  // Support old signature: rollDice([{ dice: 'd6', number: 6 }])
  if (Array.isArray(diceRollsOrCount) && diceRollsOrCount.length > 0) {
    const firstItem = diceRollsOrCount[0];
    if (typeof firstItem === 'object' && firstItem !== null && 'dice' in firstItem) {
      // Old signature with array of dice roll objects
      let total = 0;
      for (const roll of diceRollsOrCount as Array<{
        dice: DiceType;
        number: number;
        modifier?: number;
      }>) {
        function getDiceValue(type: DiceType): number {
          const values: Record<DiceType, number> = {
            d4: 4,
            d6: 6,
            d8: 8,
            d10: 10,
            d12: 12,
            d20: 20,
            d100: 100,
          };
          return values[type] || 6;
        }
        for (let i = 0; i < roll.number; i++) {
          total += Math.floor(Math.random() * getDiceValue(roll.dice)) + 1;
          if (roll.modifier) {
            total += roll.modifier;
          }
        }
      }
      return total;
    }
  }

  return 0;
}
