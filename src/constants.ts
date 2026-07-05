export const APP_VERSION = '4.6.2';
// character creator v4.6.2

import type { PlayerSkills, SavingThrow, AbilityScoreValues } from './types';

export type ActionType = 'Action' | 'Reaction' | 'Special' | 'Bonus Action';

export type CombatAction = {
  name: string;
  type: ActionType;
  summary: string;
  rules: string[];
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
  {
    name: 'Attack',
    type: 'Action',
    summary: 'Make one melee or ranged attack with a weapon or unarmed strike.',
    rules: [
      'Choose a target within your weapon or unarmed strike range.',
      "Roll an attack using the correct modifier and compare it against the target's AC.",
      'On a hit, roll damage and apply any extra effects from the weapon, class features, or spells.',
    ],
  },
  {
    name: 'Cast a Spell',
    type: 'Action',
    summary: 'Cast a spell whose casting time is 1 action.',
    rules: [
      'You can cast a spell on your turn if its casting time is 1 action and you have the required components.',
      "Follow the spell's range, target, duration, and saving throw or attack rules exactly as written.",
      'If you cast a bonus action spell on the same turn, the only other spell you can cast that turn is a cantrip with a casting time of 1 action.',
    ],
  },
  {
    name: 'Dash',
    type: 'Action',
    summary: 'Gain extra movement equal to your speed for the turn.',
    rules: [
      'When you Dash, you gain extra movement for the current turn equal to your speed after modifiers are applied.',
      'That extra movement can be used immediately or later in the turn.',
      'Any increase or reduction to your speed changes the total movement you get from Dash as well.',
    ],
  },
  {
    name: 'Disengage',
    type: 'Action',
    summary: 'Your movement does not provoke opportunity attacks for the rest of the turn.',
    rules: [
      'After you take the Disengage action, your movement no longer provokes opportunity attacks for the rest of the turn.',
      'This protection only lasts until your turn ends.',
      'Disengage does not prevent other reactions or special movement-triggered effects unless they specifically rely on opportunity attacks.',
    ],
  },
  {
    name: 'Dodge',
    type: 'Action',
    summary: 'Focus entirely on avoiding attacks until the start of your next turn.',
    rules: [
      'Until the start of your next turn, attacks against you have disadvantage if you can see the attacker.',
      'You also make Dexterity saving throws with advantage during that time.',
      'The benefit ends early if you are incapacitated or if your speed drops to 0.',
    ],
  },
  {
    name: 'Help',
    type: 'Action',
    summary: 'Assist an ally with a task or distract a foe to aid an attack.',
    rules: [
      'To help with an ability check, your ally must make the check before the start of your next turn and you must be able to meaningfully assist.',
      'To help an attack, choose a creature within 5 feet of you and distract it.',
      'The first ally who attacks that creature before your next turn gains advantage if the target remains within 5 feet of you.',
    ],
  },
  {
    name: 'Hide',
    type: 'Action',
    summary: 'Attempt to become hidden from creatures that cannot clearly perceive you.',
    rules: [
      'You make a Dexterity (Stealth) check when the DM agrees that conditions allow you to hide.',
      'Your check is contested by passive Perception or active Perception checks from creatures trying to find you.',
      'If you are hidden, creatures do not know your location precisely until you are found or reveal yourself.',
    ],
  },
  {
    name: 'Ready',
    type: 'Action',
    summary: 'Prepare a trigger and respond with an action or movement as a reaction.',
    rules: [
      'Describe a perceivable trigger and the action or movement you will take in response.',
      'When the trigger happens before your next turn, you can use your reaction to perform the readied option.',
      'If you ready a spell, you cast it now, hold its energy with concentration, and release it with your reaction when the trigger occurs.',
    ],
  },
  {
    name: 'Search',
    type: 'Action',
    summary: 'Look carefully for something hidden or hard to notice.',
    rules: [
      'The DM may call for a Wisdom (Perception) check or an Intelligence (Investigation) check depending on what you are examining.',
      'Search is used to spot hidden creatures, clues, traps, or other concealed details.',
      'Exactly what you learn depends on where you search and how successful the check is.',
    ],
  },
  {
    name: 'Use Object',
    type: 'Action',
    summary:
      'Interact with an object when the interaction takes more than your free object interaction.',
    rules: [
      'Many simple interactions are free once per turn, but complex interactions can require the Use Object action.',
      'Examples include activating certain items, manipulating mechanisms, or handling objects that take more time or care.',
      'Magic items often have their own activation rules and may not use this action unless the item says so.',
    ],
  },
  {
    name: 'Grapple',
    type: 'Special',
    summary: 'Use the Attack action to try to seize a creature with a free hand.',
    rules: [
      'A grapple replaces one attack in the Attack action and requires a free hand and a target no more than one size larger than you within reach.',
      "Make a Strength (Athletics) check contested by the target's Strength (Athletics) or Dexterity (Acrobatics).",
      'On a success, the target is grappled and its speed becomes 0 until the grapple ends.',
    ],
  },
  {
    name: 'Shove',
    type: 'Special',
    summary: 'Use the Attack action to push a creature or knock it prone.',
    rules: [
      'A shove replaces one attack in the Attack action and targets a creature within reach no more than one size larger than you.',
      "Make a Strength (Athletics) check contested by the target's Strength (Athletics) or Dexterity (Acrobatics).",
      'On a success, you either push the target 5 feet away or knock it prone.',
    ],
  },
  {
    name: 'Opportunity Attack',
    type: 'Reaction',
    summary: 'Make one melee attack when a creature you can see leaves your reach.',
    rules: [
      'You can use your reaction to make one melee attack against a creature that willingly leaves your reach.',
      'The attack happens right before the creature leaves your reach.',
      "Forced movement, teleportation, or movement taken without using the creature's movement, action, or reaction does not trigger an opportunity attack.",
    ],
  },
  {
    name: 'Cast a Spell',
    type: 'Reaction',
    summary: 'Cast a spell whose casting time is 1 reaction when its trigger occurs.',
    rules: [
      'A reaction spell can only be cast when the specific trigger described by the spell happens.',
      'You still need any required components, free hands, or concentration as normal.',
      'Examples include Counterspell, Shield, or a readied spell released with your reaction.',
    ],
  },
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

export const CR_TO_XP: Record<string, number> = {
  '0': 10,
  '1/8': 25,
  '1/4': 50,
  '1/2': 100,
  '1': 200,
  '2': 450,
  '3': 700,
  '4': 1100,
  '5': 1800,
  '6': 2300,
  '7': 2900,
  '8': 3900,
  '9': 5000,
  '10': 5900,
  '11': 7200,
  '12': 8400,
  '13': 10000,
  '14': 11500,
  '15': 13000,
  '16': 15000,
  '17': 18000,
  '18': 20000,
  '19': 22000,
  '20': 25000,
  '21': 33000,
  '22': 41000,
  '23': 50000,
  '24': 62000,
  '25': 75000,
  '26': 90000,
  '27': 105000,
  '28': 120000,
  '29': 135000,
  '30': 155000,
};

export const CR_VALUES = [
  0, 0.125, 0.25, 0.5, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21,
  22, 23, 24, 25, 26, 27, 28, 29, 30,
];

export const SPELL_CLASS_LIST = [
  'artificer',
  'bard',
  'cleric',
  'druid',
  'paladin',
  'ranger',
  'sorcerer',
  'warlock',
  'wizard',
];
