import type { AbilityScoreValues } from '../types';
export const standardArray: number[] = [15, 14, 13, 12, 10, 8];

export const suggestedAbilityScores: Record<string, AbilityScoreValues> = {
  artificer: {
    str: standardArray[5]!,
    dex: standardArray[3]!,
    con: standardArray[2]!,
    int: standardArray[0]!,
    wis: standardArray[4]!,
    cha: standardArray[1]!,
  },
  barbarian: {
    str: standardArray[0]!,
    dex: standardArray[3]!,
    con: standardArray[2]!,
    int: standardArray[5]!,
    wis: standardArray[4]!,
    cha: standardArray[1]!,
  },
  bard: {
    str: standardArray[5]!,
    dex: standardArray[3]!,
    con: standardArray[4]!,
    int: standardArray[1]!,
    wis: standardArray[4]!,
    cha: standardArray[0]!,
  },
  cleric: {
    str: standardArray[4]!,
    dex: standardArray[5]!,
    con: standardArray[3]!,
    int: standardArray[1]!,
    wis: standardArray[0]!,
    cha: standardArray[2]!,
  },
  druid: {
    str: standardArray[5]!,
    dex: standardArray[4]!,
    con: standardArray[3]!,
    int: standardArray[1]!,
    wis: standardArray[0]!,
    cha: standardArray[2]!,
  },
  fighter: {
    str: standardArray[0]!,
    dex: standardArray[3]!,
    con: standardArray[2]!,
    int: standardArray[5]!,
    wis: standardArray[4]!,
    cha: standardArray[1]!,
  },
  monk: {
    str: standardArray[4]!,
    dex: standardArray[0]!,
    con: standardArray[2]!,
    int: standardArray[5]!,
    wis: standardArray[1]!,
    cha: standardArray[3]!,
  },
  paladin: {
    str: standardArray[0]!,
    dex: standardArray[5]!,
    con: standardArray[2]!,
    int: standardArray[4]!,
    wis: standardArray[4]!,
    cha: standardArray[0]!,
  },
  ranger: {
    str: standardArray[4]!,
    dex: standardArray[0]!,
    con: standardArray[2]!,
    int: standardArray[5]!,
    wis: standardArray[1]!,
    cha: standardArray[3]!,
  },
  rogue: {
    str: standardArray[5]!,
    dex: standardArray[0]!,
    con: standardArray[2]!,
    int: standardArray[1]!,
    wis: standardArray[4]!,
    cha: standardArray[3]!,
  },
  sorcerer: {
    str: standardArray[5]!,
    dex: standardArray[3]!,
    con: standardArray[2]!,
    int: standardArray[4]!,
    wis: standardArray[4]!,
    cha: standardArray[0]!,
  },
  warlock: {
    str: standardArray[5]!,
    dex: standardArray[3]!,
    con: standardArray[2]!,
    int: standardArray[4]!,
    wis: standardArray[4]!,
    cha: standardArray[0]!,
  },
  wizard: {
    str: standardArray[5]!,
    dex: standardArray[3]!,
    con: standardArray[2]!,
    int: standardArray[0]!,
    wis: standardArray[4]!,
    cha: standardArray[1]!,
  },
};

export const abilityNameArray: string[] = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

// map for shorthand to pretty names
export const abilityScoreNames: Record<string, string> = {
  str: 'Strength',
  dex: 'Dexterity',
  con: 'Constitution',
  int: 'Intelligence',
  wis: 'Wisdom',
  cha: 'Charisma',
};
