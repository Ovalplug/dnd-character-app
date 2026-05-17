export const APP_VERSION = '2.7.0';
// character creator v2.7.0

import type { PlayerSkills, SavingThrow, AbilityScoreValues } from './types';

export type ActionType = 'Action' | 'Reaction' | 'Special' | 'Bonus Action';

export type CombatAction = {
  name: string;
  type: ActionType;
};

export const SAVE_ABBRS: { key: SavingThrow; abbr: string }[] = [
  { key: 'str', abbr: 'STR' },
  { key: 'dex', abbr: 'DEX' },
  { key: 'con', abbr: 'CON' },
  { key: 'int', abbr: 'INT' },
  { key: 'wis', abbr: 'WIS' },
  { key: 'cha', abbr: 'CHA' },
];

export const BASIC_ACTIONS: CombatAction[] = [
  { name: 'Attack', type: 'Action' },
  { name: 'Cast a Spell', type: 'Action' },
  { name: 'Dash', type: 'Action' },
  { name: 'Disengage', type: 'Action' },
  { name: 'Dodge', type: 'Action' },
  { name: 'Help', type: 'Action' },
  { name: 'Hide', type: 'Action' },
  { name: 'Ready', type: 'Action' },
  { name: 'Search', type: 'Action' },
  { name: 'Use Object', type: 'Action' },
  { name: 'Grapple', type: 'Special' },
  { name: 'Shove', type: 'Special' },
  { name: 'Opportunity Attack', type: 'Reaction' },
  { name: 'Cast a Spell', type: 'Reaction' },
];

// Replace with your actual GitHub raw URL:
// https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO/main/version.json
export const UPDATE_MANIFEST_URL =
  'https://raw.githubusercontent.com/Ovalplug/dnd-character-app/main/version.json';

export const SKILL_NAME_MAP: Record<string, keyof PlayerSkills> = {
  acrobatics: 'acrobatics',
  'animal handling': 'animalHandling',
  animalhandling: 'animalHandling',
  arcana: 'arcana',
  athletics: 'athletics',
  deception: 'deception',
  history: 'history',
  insight: 'insight',
  intimidation: 'intimidation',
  investigation: 'investigation',
  medicine: 'medicine',
  nature: 'nature',
  perception: 'perception',
  performance: 'performance',
  persuasion: 'persuasion',
  religion: 'religion',
  'sleight of hand': 'sleightOfHand',
  sleightofhand: 'sleightOfHand',
  stealth: 'stealth',
  survival: 'survival',
};

export const SAVING_THROW_MAP: Record<string, SavingThrow> = {
  strength: 'str',
  dexterity: 'dex',
  constitution: 'con',
  intelligence: 'int',
  wisdom: 'wis',
  charisma: 'cha',
  str: 'str',
  dex: 'dex',
  con: 'con',
  int: 'int',
  wis: 'wis',
  cha: 'cha',
};

export const SAVE_PRETTY: Record<SavingThrow, string> = {
  str: 'Strength',
  dex: 'Dexterity',
  con: 'Constitution',
  int: 'Intelligence',
  wis: 'Wisdom',
  cha: 'Charisma',
};

export const SKILL_ABILITY: Record<keyof PlayerSkills, keyof AbilityScoreValues> = {
  acrobatics: 'dex',
  animalHandling: 'wis',
  arcana: 'int',
  athletics: 'str',
  deception: 'cha',
  history: 'int',
  insight: 'wis',
  intimidation: 'cha',
  investigation: 'int',
  medicine: 'wis',
  nature: 'int',
  perception: 'wis',
  performance: 'cha',
  persuasion: 'cha',
  religion: 'int',
  sleightOfHand: 'dex',
  stealth: 'dex',
  survival: 'wis',
};

export const SKILL_PRETTY: Record<keyof PlayerSkills, string> = {
  acrobatics: 'Acrobatics',
  animalHandling: 'Animal Handling',
  arcana: 'Arcana',
  athletics: 'Athletics',
  deception: 'Deception',
  history: 'History',
  insight: 'Insight',
  intimidation: 'Intimidation',
  investigation: 'Investigation',
  medicine: 'Medicine',
  nature: 'Nature',
  perception: 'Perception',
  performance: 'Performance',
  persuasion: 'Persuasion',
  religion: 'Religion',
  sleightOfHand: 'Sleight of Hand',
  stealth: 'Stealth',
  survival: 'Survival',
};
