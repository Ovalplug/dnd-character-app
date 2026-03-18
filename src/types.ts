import type { Component } from 'vue';

export type AppRoute = {
  path: string;
  name: string;
  component: Component;
};

export type Routes = AppRoute[];

export type playerCharacter = {
  name: string;
  level: number;
  classes: Classes;
  race: Race | null;
  background?: Background | null;
  alignment?: string;
  xp?: number;
  inspiration?: boolean;
  feats: Feat[];
  languages: string[];
  abilityScores: Ability;
  proficiencyModifier: number;
  inventory: any[];
  maxHp: number;
  currHp: number;
  ac: number;
  speed: number;
  size: 'tiny' | 'small' | 'medium' | 'large' | 'huge' | 'gargantuan';
  skillProficiencies: SkillProficiencies;
  image?: string;

  // D&D 5e essentials
  hitDice?: string; // e.g. "1d8"
  currentHitDice?: number;
  deathSaves?: { successes: number; failures: number };
  currency?: { cp: number; sp: number; ep: number; gp: number; pp: number };
  passivePerception?: number;
  personalityTraits?: string[];
  ideals?: string[];
  bonds?: string[];
  flaws?: string[];
  featuresAndTraits?: string[];
  attacks?: Array<{
    name: string;
    attackBonus: number;
    damage: string;
    damageType?: string;
    notes?: string;
  }>;
  spellcasting?: {
    spellCaster: boolean;
    spellSlots?: Record<number, { max: number; used: number }>;
    knownSpells?: Spells;
    preparedSpells?: Spells;
    spellSaveDC?: number;
    spellAttackBonus?: number;
  };
  notes?: string;
  alliesAndOrganizations?: string[];
  backstory?: string;
  attunedItems?: any[];
  createdAt: number;
  updatedAt: number;
};

export type PlayerCharacters = playerCharacter[];

export type Feat = {
  name: string;
  description?: string;
  source?: string;
  otherSources?: object[];
  level?: number;
  page?: number;
  prerequisite?: string[];
  entries?: Entries;
};

export type EntryBase = {
  type: string;
  name?: string;
  style?: string;
  entries?: Entry[];
  items?: Entry[];
};

export type EntryItem = {
  type: 'item';
  name?: string;
  entries: Entry[];
  entry?: Entry;
};

export type EntryList = {
  type: 'list';
  style?: string;
  items: (EntryItem | string)[];
  entries?: Entry[];
};

export type EntryTable = {
  type: 'table';
  caption?: string;
  head?: string[];
  rows: (string[] | Entry[])[];
  entries?: Entry[];
  colStyles?: string[];
  colLabels?: string[];
  title?: string;
  haveLevels?: boolean;
};

export type EntrySection = {
  type: 'section';
  title?: string;
  entries?: Entry[];
};

export type Entry = string | EntryItem | EntryList | EntryTable | EntrySection;

export type Entries = Entry[];

export type Feats = Feat[];

export type Ability = Partial<Record<'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha', number>>;

export type LanguageProficiency = Record<string, boolean | number>;

export type SkillProficiencies = Record<string, boolean>;

export type ImageHref = {
  type: string;
  path?: string;
  href?: string;
};

export type Image = {
  type: 'image';
  href: ImageHref;
  title?: string;
};

export type Race = {
  name: string;
  source?: string;
  page?: number;
  size?: string;
  speed?: number;
  ability?: Ability[] | Ability;
  traitTags?: string[];
  languageProficiencies?: LanguageProficiency[];
  skillProficiencies?: SkillProficiencies[];
  entries?: Entries;
  images?: Image[];
};

export type Races = Race[];

export type RaceFluff = {
  name: string;
  source?: string;
  entries?: Entries;
  images?: Image[];
};

export type RaceFluffs = RaceFluff[];

export type Background = {
  name: string;
  source?: string;
  page?: number;
  entries?: Entries;
  // Some JSON uses `desc` as string or array
  desc?: string | Entries;
  skillProficiencies?: string[] | SkillProficiencies;
  languageProficiencies?: string[] | LanguageProficiency[] | LanguageProficiency;
  toolProficiencies?: string[] | any[];
  images?: Image[];
  hasFluff?: boolean;
  hasFluffImages?: boolean;
  // allow other unknown fields from the source data
} & Record<string, any>;
export type Backgrounds = Background[];

export type BackgroundFluff = {
  name?: string;
  source?: string;
  entries?: Entries;
  images?: Image[];
  hasFluffImages?: boolean;
} & Record<string, any>;
export type BackgroundFluffs = BackgroundFluff[];

export type Invocation = {
  name: string;
  source?: string;
  page?: number;
  // Entries or description field used by many resource objects
  entries?: Entries;
  desc?: string | Entries;
  // allow other unknown fields from the source data
} & Record<string, any>;
export type Invocations = Invocation[];

export type Prerequisite = {
  type: string;
  feat?: string;
  spell?: string;
  invocation?: string;
  ability?: Partial<Record<'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha', number>>;
  level?: number;
};

export type Prerequisites = Prerequisite[];

export type CharClass = {
  name: string;
  source: string;
  hd: string;
  proficiency: string;
  classTableGroups: Array<{
    colLabels: string[];
    rows: (string | number)[][];
    title?: string;
  }>;
  startingProficiencies: string;
  startingEquipment: string;
  classFeatures: any[];
  subclasses: Subclass[];
  featureList: Record<string, any[]>;
  spellcastingAbility?: string;
  spellcastingProgression?: string;
  additionalSpells?: any[];
  fluff?: any;
};

export type Subclass = {
  name: string;
  shortName?: string;
  source: string;
  className: string;
  classSource: string;
  page?: number;
  spellcastingAbility?: string;
  additionalSpells?: any[];
  subclassFeatures?: any[];
};
export type Classes = CharClass[];
export type Subclasses = Record<string, Subclass[]>;

export type SpellSchools = 'a' | 'c' | 'd' | 'e' | 'v' | 'i' | 'n' | 't';

export type SpellClass =
  | 'bard'
  | 'cleric'
  | 'druid'
  | 'paladin'
  | 'ranger'
  | 'sorcerer'
  | 'warlock'
  | 'wizard';
export type SpellClasses = SpellClass[];
export type Spell = {
  name: string;
  source?: string;
  page?: number;
  level: number;
  school: SpellSchools;
  time?: any[];
  range?: Record<string, any>;
  components?: Record<string, any>;
  duration?: any[];
  entries?: Entries;
  entriesHigherLevel?: Entries;
  conditionInflict?: string[];
  savingThrow?: string[];
  affectsCreatureType?: string[];
  miscTags?: string[];
  areaTags?: string[];
  damageInflict?: string[];
  spellAttack?: string[];
  classes: Record<string, any>;
  images?: any[];
  [key: string]: any;
};
export type Spells = Spell[];
