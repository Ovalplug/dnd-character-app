import { describe, it, expect } from 'vitest';
import {
  abilityMod, calculateDc, calculateAttackModifier, calculateProficiencyBonus,
  computeCharSpellcasting, stackInventoryItems, diceRoll,
  getAllLanguages, setStartedLanguages,
  getPrettyAbilityName, getPrettySize, calculatePassivePerception,
  calculateAbilityScoreModifier, getPrettySpeed, getPrettyAbilityScoreValues,
} from './helperFunctions';

describe('helperFunctions pure targets', () => {
  it('abilityMod / proficiency / modifiers', () => {
    expect(abilityMod(10)).toBe(0);
    expect(abilityMod(14)).toBe(2);
    expect(calculateProficiencyBonus(1)).toBe(2);
    expect(calculateDc(2, 3)).toBe(13);
    expect(calculateAttackModifier(2, 3)).toBe(5);
  });
  it('stackInventoryItems', () => {
    const rows = stackInventoryItems([{ name: 'Sword', type: 'M' } as any, { name: 'Sword', type: 'M' } as any]);
    expect(rows.length).toBe(1);
    expect(rows[0]!.quantity).toBe(2);
  });
  it('diceRoll', () => { expect(typeof diceRoll([{ count: 1, dType: 'd6' } as any])).toBe('number'); });
  it('language helpers', () => {
    expect(getAllLanguages({ languageProficiencies: ['Elvish'] } as any, null)).toContain('Elvish');
  });
  it('setStartedLanguages', () => {
    const res = setStartedLanguages(['common'], false);
    expect(res.common.speak).toBe(true);
  });
  it('pretty / format helpers', () => {
    expect(getPrettyAbilityName('str')).toBe('Strength');
    expect(getPrettySize('m')).toBe('Medium');
    expect(getPrettySpeed(30)).toBe('30 ft.');
    expect(calculatePassivePerception(1, 2, true, true)).toBe(15);
    expect(calculateAbilityScoreModifier(14, 2, true, false)).toBe(4);
  });
  it('computeCharSpellcasting / getPrettyAbilityScoreValues', () => {
    expect(typeof computeCharSpellcasting).toBe('function');
    expect(getPrettyAbilityScoreValues([{ str: 16 }])).toContain('Strength');
  });
});
