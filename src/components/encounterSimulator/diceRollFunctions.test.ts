import { describe, it, expect } from 'vitest';
import { DiceRoller, calculateAverageRoll, rollDice } from './diceRollFunctions';

describe('diceRollFunctions pure targets', () => {
  it('DiceRoller constructor + rollSingleDie', () => {
    const dr = new DiceRoller(() => 0.5);
    expect(dr.rng).toBeDefined();
    expect(typeof dr.rollSingleDie('d20')).toBe('number');
  });
  it('rollD20 with modifier/adv/disadv', () => {
    const dr = new DiceRoller(() => 0.99);
    expect(dr.rollD20(2)).toBeGreaterThanOrEqual(3);
    expect(dr.rollD20(0, true)).toBe(20);
    expect(dr.rollD20(0, false, true)).toBe(20);
  });
  it('rollDice / rollDamage / rollCritDamage', () => {
    const dr = new DiceRoller(() => 0.5);
    expect(dr.rollDice(2, 'd6', 3)).toBeGreaterThanOrEqual(9);
    const groups = [{ count: 1, type: 'd8' as const, modifier: 2 }];
    expect(dr.rollDamage(groups)).toBeGreaterThanOrEqual(6);
    expect(dr.rollCritDamage(groups)).toBeGreaterThanOrEqual(9);
  });
  it('rollAttack / rollInitiative / rollSave', () => {
    const dr = new DiceRoller(() => 0.2);
    expect(dr.rollAttack(3).roll).toBeGreaterThanOrEqual(1);
    expect(dr.rollInitiative(2)).toBeGreaterThanOrEqual(1);
    expect(typeof dr.rollSave(10, 1)).toBe('boolean');
  });
  it('parseDamageExpression + parseDamageExpressionDetailed', () => {
    const dr = new DiceRoller(() => 0.5);
    expect(dr.parseDamageExpression('2d6+3')).toBeGreaterThanOrEqual(5);
    const det = dr.parseDamageExpressionDetailed('1d8');
    expect(det.total).toBeGreaterThanOrEqual(1);
  });
  it('averageDamage + calculateAverageDamage', () => {
    const dr = new DiceRoller(() => 0);
    expect(dr.averageDamage('2d6+3')).toBe(10);
    expect(dr.calculateAverageDamage([{ count: 1, type: 'd6' as const, modifier: 2 }])).toBe(5.5);
  });
  it('calculateAverageRoll', () => {
    expect(calculateAverageRoll('d6', 2, 1)).toBe(8);
  });
  it('rollDice legacy', () => {
    expect(typeof rollDice([] as any)).toBe('number');
  });
});
