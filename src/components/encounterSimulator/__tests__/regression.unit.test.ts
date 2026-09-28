import { describe, it, expect } from 'vitest';
import { DiceRoller } from '../diceRollFunctions';

describe('Regression (with fixtures)', () => {
  it('crit doubles dice correctly', () => {
    const dr = new DiceRoller(() => 0.99);
    const groups = [{ count: 1, type: 'd8' as const, modifier: 2 }];
    const crit = dr.rollCritDamage(groups);
    expect(crit).toBe(18); // 2*8+2 = 18 (max roll at 0.99 -> ~8 but method doubles count
    expect(crit).toBeGreaterThan(dr.rollDamage(groups));
  });

  it('save passes on 20', () => {
    const dr = new DiceRoller(() => 0.99); // ~20
    expect(dr.rollSave(15, 0)).toBe(true);
  });

  it('save fails on 1', () => {
    const dr = new DiceRoller(() => 0.01); // ~1
    expect(dr.rollSave(15, 0)).toBe(false);
  });

  it('damage never negative on min roll', () => {
    const dr = new DiceRoller(() => 0);
    const groups = [{ count: 2, type: 'd6' as const, modifier: -3 }];
    const result = dr.rollDamage(groups);
    expect(result).toBeGreaterThanOrEqual(0);
  });
});
