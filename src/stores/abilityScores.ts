import type { AbilityScoreValues } from '../types';

export const suggestedAbilityScores: Record<string, AbilityScoreValues> = {
  artificer: { str: 8, dex: 14, con: 15, int: 15, wis: 10, cha: 12 },
  barbarian: { str: 15, dex: 14, con: 15, int: 8, wis: 10, cha: 12 },
  bard: { str: 8, dex: 14, con: 10, int: 12, wis: 10, cha: 15 },
  cleric: { str: 10, dex: 8, con: 14, int: 12, wis: 15, cha: 13 },
  druid: { str: 8, dex: 10, con: 14, int: 12, wis: 15, cha: 13 },
  fighter: { str: 15, dex: 14, con: 15, int: 8, wis: 10, cha: 12 },
  monk: { str: 10, dex: 15, con: 14, int: 8, wis: 15, cha: 12 },
  paladin: { str: 15, dex: 8, con: 14, int: 10, wis: 10, cha: 15 },
  ranger: { str: 10, dex: 15, con: 14, int: 8, wis: 15, cha: 12 },
  rogue: { str: 8, dex: 15, con: 14, int: 12, wis: 10, cha: 13 },
  sorcerer: { str: 8, dex: 14, con: 14, int: 10, wis: 10, cha: 15 },
  warlock: { str: 8, dex: 14, con: 14, int: 10, wis: 10, cha: 15 },
  wizard: { str: 8, dex: 14, con: 14, int: 15, wis: 10, cha: 12 },
};

export const standardArray: number[] = [15, 14, 13, 12, 10, 8];

// map for shorthand to pretty names
export const abilityScoreNames: Record<string, string> = {
  str: 'Strength',
  dex: 'Dexterity',
  con: 'Constitution',
  int: 'Intelligence',
  wis: 'Wisdom',
  cha: 'Charisma',
};
