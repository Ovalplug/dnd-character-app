import type { Component } from 'vue';

export type AppRoute = {
  path: string;
  name: string;
  component: Component;
};

export type Routes = AppRoute[];

export type DiceTypes = {
  d4: 4;
  d6: 6;
  d8: 8;
  d10: 10;
  d12: 12;
  d20: 20;
};

export type DiceRoll = {
  dType: keyof DiceTypes;
  count: number;
  modifier?: number;
};

export type ClassLevels = {
  artificer: number;
  barbarian: number;
  bard: number;
  cleric: number;
  druid: number;
  fighter: number;
  monk: number;
  paladin: number;
  ranger: number;
  rogue: number;
  sorcerer: number;
  warlock: number;
  wizard: number;
};

export type LanguageAbility = {
  speak: boolean;
  read: boolean;
  write: boolean;
};

export type Languages = {
  common: LanguageAbility;
  elvish: LanguageAbility;
  dwarvish: LanguageAbility;
  giant: LanguageAbility;
  gnomish: LanguageAbility;
  goblin: LanguageAbility;
  halfling: LanguageAbility;
  orc: LanguageAbility;
  abyssal: LanguageAbility;
  celestial: LanguageAbility;
  draconic: LanguageAbility;
  deepSpeech: LanguageAbility;
  infernal: LanguageAbility;
  primordial: LanguageAbility;
  sylvan: LanguageAbility;
  undercommon: LanguageAbility;
  thievesCant: LanguageAbility;
  [key: string]: LanguageAbility; // Allow for additional languages
};

export type Proficiency = {
  proficient: boolean;
  expertise: boolean;
};

export type PlayerSkills = {
  acrobatics: Proficiency;
  animalHandling: Proficiency;
  arcana: Proficiency;
  athletics: Proficiency;
  deception: Proficiency;
  history: Proficiency;
  insight: Proficiency;
  intimidation: Proficiency;
  investigation: Proficiency;
  medicine: Proficiency;
  nature: Proficiency;
  perception: Proficiency;
  performance: Proficiency;
  persuasion: Proficiency;
  religion: Proficiency;
  sleightOfHand: Proficiency;
  stealth: Proficiency;
  survival: Proficiency;
};

export type SavingThrow = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';

export type AllProficiencies = {
  // Skills: fixed + how many more can be freely chosen
  skills: PlayerSkills;
  skillChoices: number; // number of additional free skill picks
  skillChoicePool: (keyof PlayerSkills)[]; // pool to pick from (empty = any)
  // Expertise: number of expertise picks the player still has to assign
  expertiseChoices: number;
  // Saving throws
  savingThrows: Partial<Record<SavingThrow, boolean>>;
  // Weapons / Armor / Tools: fixed grants + a count of free choices
  armorProficiencies: string[];
  weaponProficiencies: string[];
  toolProficiencies: string[];
  toolChoices: number; // number of additional tool choices
};

export type playerCharacter = {
  id: string;
  name: string;
  level: number;
  classes: Classes;
  classLevels: ClassLevels;
  subclasses?: Subclasses;
  race: Race | null;
  subrace?: Subrace | null;
  background?: Background | null;
  alignment?: string;
  xp?: number;
  inspiration?: boolean;
  feats: Feat[];
  languages: Languages | {};
  abilityScores: AbilityScoreValues;
  proficiencyModifier: number;
  inventory: Items;
  maxHp: number;
  currHp: number;
  tempHp: number;
  ac: number;
  acOverride?: number;
  speed: CharSpeed;
  size: 'tiny' | 'small' | 'medium' | 'large' | 'huge' | 'gargantuan';
  skillProficiencies: PlayerSkills;
  allProficiencies?: AllProficiencies;
  image?: string;

  // D&D 5e essentials
  hitDice: HitDice[];
  deathSaves?: { successes: number; failures: number };
  currency: Currency;
  additionalCurrency?: CurrencyWallet[] | Currency; // for other wallets (such as shared party funds)
  passivePerception?: number;
  initiativeBonus: number;
  // Optional additional fields for more detailed character sheets
  personality?: string;
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
  spellcasting: SpellCasting;
  notes?: string;
  alliesAndOrganizations?: string[];
  backstory?: string;
  attunedItems?: any[];
  createdAt: number;
  updatedAt: number;
};

export type Currency = { cp: number; sp: number; ep: number; gp: number; pp: number };

export type CurrencyWallet = {
  id: string;
  name: string;
  currency: Currency;
};

export type SpellCasting = {
  spellCaster: SpellCaster;
  spellSlots?: Record<number, { max: number; used: number }>;
  cantrips?: Spells;
  knownSpells?: Spells;
  preparedSpells?: Spells;
  spellSaveDC?: number;
  spellAttackBonus?: number;
};

export type SpellCaster = 'None' | 'Full Caster' | 'Half Caster' | 'Partial Caster';

export type CharSpeed = {
  base: number;
  fly?: number;
  swim?: number;
  climb?: number;
  burrow?: number;
};

export type HitDice = {
  total: number;
  current: number;
  dieType: keyof DiceTypes;
};

export type PlayerCharacters = playerCharacter[];

export type CharacterEditPanel = 'menu' | 'name' | 'rest' | 'feats' | 'languages' | 'items';

export type Feat = {
  name: string;
  description?: string;
  source?: string;
  otherSources?: JsonObject[];
  level?: number;
  page?: number;
  ability?: Ability[] | Ability;
  prerequisite?: Prerequisites;
  entries?: Entries;
  additionalSpells?: JsonObject[];
  hasFluffImages?: boolean;
} & JsonObject;

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

export type FixedAbilityBonus = Partial<
  Record<'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha', number>
>;
export type ChooseAbilityBonus = {
  choose: {
    from: SavingThrow[];
    amount?: number;
    count?: number;
    entry?: string;
  };
};
export type Ability = FixedAbilityBonus | ChooseAbilityBonus;

export type AbilityScoreValues = {
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
};

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

export type RaceSpeed =
  | number
  | { walk?: number; fly?: number; swim?: number; climb?: number; burrow?: number };

export type Subrace = {
  name: string;
  page?: number;
  ability?: Ability[] | Ability;
  entries?: Entries;
  speed?: RaceSpeed;
  traitTags?: string[];
  languageProficiencies?: LanguageProficiency[];
  skillProficiencies?: SkillProficiencies[];
};

export type Race = {
  name: string;
  source?: string;
  page?: number;
  size?: string;
  speed?: RaceSpeed;
  ability?: Ability[] | Ability;
  traitTags?: string[];
  languageProficiencies?: LanguageProficiency[];
  skillProficiencies?: SkillProficiencies[];
  entries?: Entries;
  images?: Image[];
  subraces?: Subrace[];
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

export type PrerequisiteAbility = Partial<Record<SavingThrow, number>>;

export type PrerequisiteClass = {
  name?: string;
  level?: number;
  visible?: boolean;
} & JsonObject;

export type PrerequisiteRace = {
  name?: string;
  subrace?: string;
  source?: string;
  displayEntry?: string;
} & JsonObject;

export type PrerequisiteBackground = {
  name?: string;
  displayEntry?: string;
} & JsonObject;

export type PrerequisiteProficiency = {
  weapon?: string;
  armor?: string;
  tool?: string;
  skill?: string;
} & JsonObject;

export type Prerequisite =
  | string
  | ({ type?: 'prerequisite'; feat: string } & JsonObject)
  | ({ ability: PrerequisiteAbility[] } & JsonObject)
  | ({ race: PrerequisiteRace[] } & JsonObject)
  | ({ class: PrerequisiteClass; level?: number } & JsonObject)
  | ({ type: 'prereqLevel'; level?: number; class?: PrerequisiteClass } & JsonObject)
  | ({ type: 'prereqPact'; entry?: string } & JsonObject)
  | ({ type: 'prereqSpecial'; entry?: string; entrySummary?: string } & JsonObject)
  | ({ type: 'prereqItem' | 'prereqSpell'; entries?: string[] } & JsonObject)
  | ({ background: PrerequisiteBackground } & JsonObject)
  | ({ proficiency: PrerequisiteProficiency[] } & JsonObject)
  | ({
      spellcasting?: boolean;
      spellcasting2020?: boolean;
      psionics?: boolean;
      feat?: string;
      spell?: string;
      invocation?: string;
      level?: number;
    } & JsonObject);

export type Prerequisites = Prerequisite[];

export type CharClass = {
  name: string;
  source: string;
  hd: string;
  subclassAtLvl: number | 3;
  proficiency: string;
  classTableGroups: Array<{
    colLabels: string[];
    rows: (string | number)[][];
    title?: string;
  }>;
  startingProficiencies: string;
  startingEquipment: string;
  classFeatures: ClassFeatures;
  subclasses: Subclass[];
  featureList: Record<string, any[]>;
  spellcastingAbility?: string;
  spellcastingProgression?: string;
  additionalSpells?: any[];
  fluff?: any;
};

export type ClassFeature = {
  name: string;
  entries?: Entries;
  gainSubclassFeature?: boolean;
};

/**
 * Outer array is indexed by level (index 0 = level 1).
 * Each inner array contains the features gained at that level.
 */
export type ClassFeatures = ClassFeature[][];

export type Subclass = {
  name: string;
  shortName?: string;
  source: string;
  className: string;
  classSource: string;
  page?: number;
  spellcastingAbility?: string;
  additionalSpells?: any[];
  subclassFeatures?: ClassFeatures;
};
export type Classes = CharClass[];
export type Subclasses = Record<string, Subclass[]>;

export type SpellSchools = 'a' | 'c' | 'd' | 'e' | 'v' | 'i' | 'n' | 't';

export type SpellClass =
  | 'artificer'
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

/**
 * Describes the full computed spellcasting profile for a character during creation.
 * Sources can be: 'class', 'subclass', 'race', or 'background'.
 */
export type SpellSource = 'class' | 'subclass' | 'race' | 'background';

export type SpellcastingType =
  | 'full' // Full casters: Bard, Cleric, Druid, Sorcerer, Wizard
  | 'half' // Half casters: Paladin, Ranger
  | 'third' // 1/3 casters via subclass: Arcane Trickster, Eldritch Knight
  | 'pact' // Warlock pact magic
  | 'innate' // Race/background-granted spells, no progression
  | 'none';

export type SpellcastingProfile = {
  /** Whether the character is a spellcaster in any form */
  isSpellcaster: boolean;
  /** Whether they can learn / prepare spells freely (class-based progression) */
  canLearnSpells: boolean;
  /** The main spellcasting type driving slot progression */
  castingType: SpellcastingType;
  /** The ability score used for spellcasting (null if innate-only) */
  spellcastingAbility: string | null;
  /** Spell slots at current character level, keyed 1-9 */
  spellSlots: Record<number, { max: number; used: number }>;
  /** Spells granted by race/background that are always available (innate) */
  innateSpells: Array<{ name: string; level: number; ability: string; usesPerDay?: number }>;
  /** Spells added to the spell list from race/background (expanded list) */
  expandedSpellNames: string[];
  /** The source(s) granting spellcasting */
  sources: SpellSource[];
  /** For warlock: pact magic slot level */
  pactSlotLevel?: number;
};

/**
 * How a class interacts with spells at character creation / level-up.
 */
export type SpellcastingCastingMode =
  | 'known' // Fixed number of spells known (Bard, Sorcerer, Warlock, Ranger)
  | 'prepared' // Prepare from full class spell list each day (Cleric, Druid, Paladin)
  | 'spellbook' // Learn spells into book first, then prepare from book (Wizard, Artificer)
  | 'innate' // Only race/background granted spells — no class casting
  | 'none';

/**
 * Computed spellcasting information for the current character — derived from
 * class table data and ability scores.  Not stored on the character; regenerated
 * on demand via computeCharSpellcasting().
 */
export type SpellcastingInfo = {
  isSpellcaster: boolean;
  castingMode: SpellcastingCastingMode;
  /** Ability score used for spellcasting (short form: 'int', 'wis', 'cha', …) */
  spellcastingAbility: string | null;
  /** How many cantrips the character may choose */
  cantripsKnown: number;
  /** How many leveled spells to learn ('known' / 'spellbook' modes); 0 for prepared-casters */
  spellsKnownCount: number;
  /** How many spells may be prepared ('prepared' / 'spellbook' modes) */
  maxPrepared: number;
  /** Spell slots available at this level */
  spellSlots: Record<number, { max: number; used: number }>;
  /** Spells automatically granted by race / background */
  innateSpells: Array<{ name: string; level: number; ability: string }>;
  /** Extra spells added to the class spell list (e.g. Strixhaven background) */
  expandedSpellNames: string[];
};

export type JsonObject = {
  [key: string]: unknown;
};

export type ItemOtherSource = {
  source: string;
  page?: number;
} & JsonObject;

export type ItemTypeCode =
  | '$'
  | 'A'
  | 'AF'
  | 'AT'
  | 'EXP'
  | 'G'
  | 'GS'
  | 'HA'
  | 'INS'
  | 'LA'
  | 'M'
  | 'MA'
  | 'MNT'
  | 'P'
  | 'R'
  | 'RD'
  | 'RG'
  | 'S'
  | 'SCF'
  | 'SCF-P'
  | 'SCF-D'
  | 'SCF-W'
  | 'TAH'
  | 'TG'
  | 'T'
  | 'VEH'
  | 'WD'
  | (string & {});

export type ItemRange = string | JsonObject;

export type ItemPackContent = {
  item?: string;
  quantity?: number;
} & JsonObject;

export type Item = {
  name: string;
  source: string;
  page?: number;
  displayName?: string;
  equipped?: boolean;
  attuned?: boolean;
  type?: ItemTypeCode;
  rarity?: string;
  value?: number;
  weight?: number;
  age?: string;
  ac?: number | string;
  armor?: boolean;
  weapon?: boolean;
  weaponCategory?: string;
  dmg1?: string;
  dmg2?: string;
  dmgType?: string;
  range?: ItemRange;
  property?: string[];
  packContents?: ItemPackContent[];
  entries?: Entries;
  images?: Image[];
  otherSources?: ItemOtherSource[];
  reqAttune?: boolean | string;
  wondrous?: boolean;
  tattoo?: boolean;
  hasFluff?: boolean;
  hasFluffImages?: boolean;
  attachedSpells?: string[];
  bonusWeapon?: string;
  recharge?: string;
  charges?: number;
  ammoType?: string;
  crew?: number;
  vehAc?: number;
  vehHp?: number;
  vehDmgThresh?: number;
  vehSpeed?: number;
  capCargo?: number;
  seeAlsoVehicle?: string[];
  seeAlsoDeck?: string[];
  lootTables?: string[];
  miscTags?: string[];
} & JsonObject;

export type Items = Item[];

export type SkillChoice =
  | 'acrobatics'
  | 'animalHandling'
  | 'arcana'
  | 'athletics'
  | 'deception'
  | 'history'
  | 'insight'
  | 'intimidation'
  | 'investigation'
  | 'medicine'
  | 'nature'
  | 'perception'
  | 'performance'
  | 'persuasion'
  | 'religion'
  | 'sleightOfHand'
  | 'stealth'
  | 'survival';

export type Monster = {
  name: string;
  source: string;
  page?: number;
  size: string | string[];
  type: MonsterType;
  alignment: string[];
  alignmentPrefix?: string;
  ac: MonsterAc[];
  hp: MonsterHp;
  speed: CreatureSpeed;
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
  save: Partial<Record<SavingThrow, string>>;
  skill: Record<SkillChoice, string>;
  senses?: string[];
  passive: number;
  languages: string[];
  cr: MonsterCR;
  resist?: MonsterDamageVulnerability[];
  immune?: MonsterDamageVulnerability[];
  conditionImmune?: MonsterDamageVulnerability[];
  vulnerable?: MonsterDamageVulnerability[];
  spellcasting?: MonsterSpellcasting[];
  trait?: Entries;
  action?: Entries;
  reaction?: Entries;
  legendary?: Entries;
  traitTags?: string[];
  actionTags?: string[];
  reactionTags?: string[];
  legendaryTags?: string[];
  senseTags?: string[];
  damageTags?: string[];
  miscTags?: string[];
  attachedItems?: string[];
  variant?: Entries;
  environment?: string[];
  hasFluff?: boolean;
  mythicHeader?: string[];
  mythic?: Entries;
};

export type MonsterCR = string | { cr: string; coven?: string; lair?: string };

export type MonsterFluff = {
  name: string;
  source: string;
  entries?: Entries;
  images?: Image[];
};

export type MonsterType = string | { type: string; tags?: string[] };

export type MonsterAc = string | number | MonsterAcFrom;

export type MonsterAcFrom = {
  ac?: number;
  from?: string[];
  condition?: string;
  braces?: boolean;
  special?: string;
};

export type MonsterHp = number | { formula: string; average: number; special?: string };

export type MonsterDamageVulnerability =
  | string
  | {
      immune?: string[];
      resist?: string[];
      vulnerable?: string[];
      conditionImmune?: string[];
      note: string;
    };

export type CreatureSpeed = {
  walk?: number;
  fly?: number;
  swim?: number;
  climb?: number;
  burrow?: number;
  hover?: boolean;
};

export type MonsterSpellcasting = {
  name: string;
  headerEntries: Entries;
  ability?: string;
  spells?: MonsterSpell;
  will?: string[];
  daily?: MonsterDailySpells;
};

export type MonsterSpell = {
  0?: MonsterSpellBreakdown;
  1?: MonsterSpellBreakdown;
  2?: MonsterSpellBreakdown;
  3?: MonsterSpellBreakdown;
  4?: MonsterSpellBreakdown;
  5?: MonsterSpellBreakdown;
  6?: MonsterSpellBreakdown;
  7?: MonsterSpellBreakdown;
  8?: MonsterSpellBreakdown;
  9?: MonsterSpellBreakdown;
};

export type MonsterSpellBreakdown = {
  slots?: number;
  spells: string[];
};

export type MonsterDailySpells = {
  1?: string[];
  2?: string[];
  3?: string[];
  4?: string[];
  5?: string[];
  6?: string[];
  7?: string[];
  8?: string[];
  9?: string[];
  '1e'?: string[];
  '2e'?: string[];
  '3e'?: string[];
  '4e'?: string[];
  '5e'?: string[];
  '6e'?: string[];
  '7e'?: string[];
  '8e'?: string[];
  '9e'?: string[];
};

export type Rules = {
  name: string;
  source: string;
  page?: number;
  entries?: Entries;
  images?: Image[];
  ruleType?: string;
};

export type Hazard = {
  name: string;
  source: string;
  page?: number;
  entries?: Entries;
  images?: Image[];
};

export type Boon = {
  name: string;
  source: string;
  page?: number;
  entries?: Entries;
  images?: Image[];
  type?: string;
};

// dise
export type Diseases = {
  name: string;
  source: string;
  entries?: Entries;
  images?: Image[];
  page?: number;
};

export type Trap = {
  name: string;
  source: string;
  page?: number;
  entries?: Entries;
  images?: Image[];
  srd?: boolean;
  trapHazType?: string; // double check
};

export type ActionRules = {
  name: string;
  source: string;
  page?: number;
  entries?: Entries;
  images?: Image[];
  srd?: boolean;
  time?: TimeRule[];
  seeAlsoAction?: string[];
  fromVariant?: string;
};

export type TimeRule = {
  number: number;
  unit: string;
};

export type PlayerOptions = {
  name: string;
  source: string;
  page?: number;
  entries?: Entries;
  images?: Image[];
  optionType?: string;
};

export type ConditionsRules = {
  name: string;
  source: string;
  page?: number;
  entries?: Entries;
  images?: Image[];
  srd?: boolean;
  hasFluff?: boolean;
  hasFluffImages?: boolean;
};
