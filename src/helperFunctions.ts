import type {
  DiceRoll,
  SpellClass,
  SpellClasses,
  Spells,
  SpellSchools,
  DiceTypes,
  Race,
  Background,
  Languages,
  CharClass,
  ClassFeature,
  ClassFeatures,
  PlayerSkills,
  Feat,
  AllProficiencies,
  SavingThrow,
} from './types';
import { SKILL_NAME_MAP, SAVING_THROW_MAP } from './constants';

export function getPrettyAbilityName(shorthand: string): string {
  switch (shorthand) {
    case 'int':
      return 'Intelligence';
    case 'str':
      return 'Strength';
    case 'dex':
      return 'Dexterity';
    case 'con':
      return 'Constitution';
    case 'wis':
      return 'Wisdom';
    case 'cha':
      return 'Charisma';
    default:
      return shorthand;
  }
}

export function getPrettySize(size: string): string {
  switch (size.toLowerCase()) {
    case 't':
      return 'Tiny';
    case 's':
      return 'Small';
    case 'm':
      return 'Medium';
    case 'l':
      return 'Large';
    case 'h':
      return 'Huge';
    case 'g':
      return 'Gargantuan';
    default:
      return size;
  }
}

export function getPrettySpellSchool(school: string): string {
  switch (school.toLowerCase()) {
    case 'a':
      return 'Abjuration';
    case 'c':
      return 'Conjuration';
    case 'd':
      return 'Divination';
    case 'e':
      return 'Enchantment';
    case 'v':
      return 'Evocation';
    case 'i':
      return 'Illusion';
    case 'n':
      return 'Necromancy';
    case 't':
      return 'Transmutation';
    default:
      return school;
  }
}

export function getPrettySpellLevel(level: number): string {
  if (level === 0) return 'Cantrip';
  if (level === 1) return '1st-level';
  if (level === 2) return '2nd-level';
  if (level === 3) return '3rd-level';
  return `${level}th-level`;
}

export function getPrettySpellClassList(classes: { name: string }[]): string {
  if (classes.length === 0) return 'No class';
  if (classes.length === 1) return classes[0]?.name || '';
  if (classes.length === 2) return `${classes[0]?.name} and ${classes[1]?.name}`;
  return `${classes
    .slice(0, -1)
    .map(c => c.name)
    .join(', ')}, and ${classes[classes.length - 1]?.name}`;
}

export function calculateDc(proficiency: number, modifier: number): number {
  return 8 + proficiency + modifier;
}

export function calculateAttackModifier(proficiency: number, modifier: number): number {
  return proficiency + modifier;
}

export function getRefinedSpellsList(
  spells: Spells,
  schools: SpellSchools[],
  levels: number[],
  classes: SpellClasses,
  orderBy: 'name' | 'level' = 'name',
  searchVal?: string
): Spells {
  let refinedSpells = spells.filter(spell => {
    const matchesSchool =
      schools.length === 0 || schools.includes(spell.school.toLowerCase() as SpellSchools);
    const matchesLevel = levels.length === 0 || levels.includes(spell.level);
    const matchesClass =
      classes.length === 0 ||
      (spell.classes?.fromClassList ?? []).some((c: { name: string }) =>
        classes.includes(c.name.toLowerCase() as SpellClass)
      );
    const matchesSearch = !searchVal || spell.name.toLowerCase().includes(searchVal.toLowerCase());
    return matchesSchool && matchesLevel && matchesClass && matchesSearch;
  });

  if (orderBy === 'name') {
    refinedSpells.sort((a, b) => a.name.localeCompare(b.name));
  } else if (orderBy === 'level') {
    refinedSpells.sort((a, b) => a.level - b.level);
  }
  return refinedSpells;
}

export function getPrettySpeed(speed: number | Record<string, any>): string {
  if (typeof speed === 'number') {
    return `${speed} ft.`;
  } else if (typeof speed === 'object') {
    const parts: string[] = [];
    for (const [key, value] of Object.entries(speed)) {
      if (key === 'walk') {
        parts.push(`${value} ft. walking`);
      } else if (key === 'fly') {
        parts.push(`${value} ft. flying`);
      } else if (key === 'swim') {
        parts.push(`${value} ft. swimming`);
      } else if (key === 'climb') {
        parts.push(`${value} ft. climbing`);
      } else {
        parts.push(`${value} ft. ${key}`);
      }
    }
    return parts.join(', ');
  }
  return '';
}

export function getPrettyAbilityScoreValues(scores: any[] | Record<string, any>): string {
  if (!Array.isArray(scores)) {
    scores = [scores];
  }

  return scores
    .map((scoreObj: Record<string, any>) => {
      if (scoreObj.choose) {
        const { from, count } = scoreObj.choose;
        return `Choose ${count} from: ${from.map(getPrettyAbilityName).join(', ')}`;
      }

      return Object.entries(scoreObj)
        .map(([key, value]) => {
          if (typeof value === 'number') {
            return `${getPrettyAbilityName(key)}: ${value >= 0 ? '+' : ''}${value}`;
          }
          return `${getPrettyAbilityName(key)}: Invalid`; // Handle non-number values gracefully
        })
        .join(', ');
    })
    .join('; ');
}

export function diceRoll(
  rolls: DiceRoll[],
  dropLowest: boolean = false,
  rerollValues: number[] = []
): number {
  const diceValues: DiceTypes = {
    d4: 4,
    d6: 6,
    d8: 8,
    d10: 10,
    d12: 12,
    d20: 20,
  };

  let total = 0;

  rolls.forEach(({ count, dType, modifier }) => {
    const diceMax = diceValues[dType]; // Ensure dType is valid
    if (!diceMax) {
      throw new Error(`Invalid dice type: ${dType}`);
    }

    const rollResults: number[] = [];
    for (let i = 0; i < count; i++) {
      let roll = Math.floor(Math.random() * diceMax) + 1;
      while (rerollValues.includes(roll)) {
        roll = Math.floor(Math.random() * diceMax) + 1; // Reroll if value is in rerollValues
      }
      rollResults.push(roll);
    }

    if (dropLowest && rollResults.length > 1) {
      rollResults.sort((a, b) => a - b); // Sort rolls to drop the lowest
      rollResults.shift(); // Remove the lowest roll
    }

    total += rollResults.reduce((sum, roll) => sum + roll, 0); // Sum the rolls
    total += modifier ?? 0; // Add modifier if provided
  });

  return total;
}

export function getLanguagesFromRace(race: Race | null): string[] {
  if (!race) return [];
  if (!race.languageProficiencies) return [];
  return JSON.parse(JSON.stringify(race.languageProficiencies));
}

export function getLanguagesFromBackground(background: Background | null): string[] {
  if (!background) return [];
  const prof = background.languageProficiencies;
  if (!prof) return [];
  return JSON.parse(JSON.stringify(prof));
}

export function getAllLanguages(race: Race | null, background: Background | null): string[] {
  const raceLanguages = getLanguagesFromRace(race);
  const backgroundLanguages = getLanguagesFromBackground(background);
  return [...new Set([...raceLanguages, ...backgroundLanguages])];
}

export function setStartedLanguages(languages: string[], isRogue: boolean): Languages {
  const languageAbilities: Languages = {
    common: { speak: false, read: false, write: false },
    elvish: { speak: false, read: false, write: false },
    dwarvish: { speak: false, read: false, write: false },
    giant: { speak: false, read: false, write: false },
    gnomish: { speak: false, read: false, write: false },
    goblin: { speak: false, read: false, write: false },
    halfling: { speak: false, read: false, write: false },
    orc: { speak: false, read: false, write: false },
    abyssal: { speak: false, read: false, write: false },
    celestial: { speak: false, read: false, write: false },
    draconic: { speak: false, read: false, write: false },
    deepSpeech: { speak: false, read: false, write: false },
    infernal: { speak: false, read: false, write: false },
    primordial: { speak: false, read: false, write: false },
    sylvan: { speak: false, read: false, write: false },
    undercommon: { speak: false, read: false, write: false },
    thievesCant: { speak: false, read: false, write: false },
  };

  languages.forEach(lang => {
    if (languageAbilities[lang]) {
      languageAbilities[lang].speak = true;
      languageAbilities[lang].read = true;
      languageAbilities[lang].write = true;
    }
  });

  if (isRogue) {
    languageAbilities.thievesCant.speak = true;
    languageAbilities.thievesCant.read = true;
    languageAbilities.thievesCant.write = true;
  }

  return languageAbilities;
}

// ---------------------------------------------------------------------------
// Skill name normalisation helpers
// ---------------------------------------------------------------------------

function normaliseSkillKey(raw: string): keyof PlayerSkills | null {
  const key = raw.trim().toLowerCase().replace(/[.,;]+$/, '');
  return SKILL_NAME_MAP[key] ?? null;
}

function emptySkills(): PlayerSkills {
  return {
    acrobatics: { proficient: false, expertise: false },
    animalHandling: { proficient: false, expertise: false },
    arcana: { proficient: false, expertise: false },
    athletics: { proficient: false, expertise: false },
    deception: { proficient: false, expertise: false },
    history: { proficient: false, expertise: false },
    insight: { proficient: false, expertise: false },
    intimidation: { proficient: false, expertise: false },
    investigation: { proficient: false, expertise: false },
    medicine: { proficient: false, expertise: false },
    nature: { proficient: false, expertise: false },
    perception: { proficient: false, expertise: false },
    performance: { proficient: false, expertise: false },
    persuasion: { proficient: false, expertise: false },
    religion: { proficient: false, expertise: false },
    sleightOfHand: { proficient: false, expertise: false },
    stealth: { proficient: false, expertise: false },
    survival: { proficient: false, expertise: false },
  };
}

/**
 * Parse the plain-text startingProficiencies string used by class data.
 * Returns structured sections keyed by section name (lower-cased).
 * e.g. { armor: 'light armor, medium armor', weapons: 'simple weapons', ... }
 */
function parseClassProficiencyText(text: string): Record<string, string> {
  const result: Record<string, string> = {};
  const sections = text.split('\n');
  for (const section of sections) {
    const colonIdx = section.indexOf(':');
    if (colonIdx === -1) continue;
    const key = section.slice(0, colonIdx).trim().toLowerCase();
    const value = section.slice(colonIdx + 1).trim();
    result[key] = value;
  }
  return result;
}

/**
 * Parse a Skills section string like:
 *   "Choose four from Acrobatics, Athletics, Deception, ..."
 *   "Perception, Stealth"
 * Returns { fixed: string[], choiceCount: number, pool: string[] }
 */
function parseSkillsSection(raw: string): {
  fixed: (keyof PlayerSkills)[];
  choiceCount: number;
  pool: (keyof PlayerSkills)[];
} {
  const fixed: (keyof PlayerSkills)[] = [];
  let choiceCount = 0;
  const pool: (keyof PlayerSkills)[] = [];

  // Handle "Choose N from X, Y, Z" or "Choose N skills"
  const chooseMatch = raw.match(/choose\s+(\w+)(?:\s+from\s+(.+))?/i);
  if (chooseMatch) {
    const numWord = (chooseMatch[1] ?? '').toLowerCase();
    const numMap: Record<string, number> = {
      one: 1,
      two: 2,
      three: 3,
      four: 4,
      five: 5,
      six: 6,
      '1': 1,
      '2': 2,
      '3': 3,
      '4': 4,
      '5': 5,
      '6': 6,
    };
    choiceCount = numMap[numWord] ?? (parseInt(numWord) || 0);
    if (chooseMatch[2]) {
      for (const part of chooseMatch[2].split(',')) {
        const normalised = normaliseSkillKey(part.replace(/\band\b/i, '').trim());
        if (normalised) pool.push(normalised);
      }
    }
  } else {
    // Fixed list of skills
    for (const part of raw.split(',')) {
      const normalised = normaliseSkillKey(part.replace(/\band\b/i, '').trim());
      if (normalised) fixed.push(normalised);
    }
  }

  return { fixed, choiceCount, pool };
}

/**
 * Compute the full set of proficiencies for the currently-being-built character
 * from all sources: classes, race, background, and feats.
 */
export function computeAllProficiencies(
  classes: CharClass[],
  race: Race | null,
  background: Background | null,
  _feats: Feat[]
): AllProficiencies {
  const skills = emptySkills();
  let skillChoices = 0;
  const skillChoicePoolSets: (keyof PlayerSkills)[][] = [];
  let expertiseChoices = 0;
  const savingThrows: Partial<Record<SavingThrow, boolean>> = {};
  const armorProficiencies: string[] = [];
  const weaponProficiencies: string[] = [];
  const toolProficiencies: string[] = [];
  let toolChoices = 0;

  // ---- helpers ----
  function grantSkill(key: keyof PlayerSkills) {
    skills[key].proficient = true;
  }

  function addArmor(val: string) {
    const v = val.trim().toLowerCase();
    if (v && v !== 'none' && !armorProficiencies.includes(v)) armorProficiencies.push(v);
  }
  function addWeapon(val: string) {
    const v = val.trim().toLowerCase();
    if (v && v !== 'none' && !weaponProficiencies.includes(v)) weaponProficiencies.push(v);
  }
  function addTool(val: string) {
    const v = val.trim().toLowerCase();
    if (v && v !== 'none' && !toolProficiencies.includes(v)) toolProficiencies.push(v);
  }

  // ---- process each class ----
  for (const cls of classes) {
    if (!cls.startingProficiencies) continue;
    const sections = parseClassProficiencyText(cls.startingProficiencies);

    // Saving throws
    if (sections['saving throws']) {
      for (const part of sections['saving throws'].split(',')) {
        const st = SAVING_THROW_MAP[part.trim().toLowerCase()];
        if (st) savingThrows[st] = true;
      }
    }

    // Armor
    if (sections['armor']) {
      for (const part of sections['armor'].split(',')) addArmor(part);
    }

    // Weapons
    if (sections['weapons']) {
      for (const part of sections['weapons'].split(',')) addWeapon(part);
    }

    // Tools — handle "one type of artisan's tools of your choice" style
    if (sections['tools']) {
      const toolSection = sections['tools'];
      // Count free choices phrased as "one type of ... of your choice"
      const choiceMatches = toolSection.match(/one type of [^,]+ of your choice/gi);
      if (choiceMatches) toolChoices += choiceMatches.length;
      // Extract fixed tools (everything that isn't a choice phrase)
      const withoutChoices = toolSection.replace(/,?\s*one type of [^,]+ of your choice/gi, '');
      for (const part of withoutChoices.split(',')) addTool(part);
    }

    // Skills
    if (sections['skills']) {
      const { fixed, choiceCount, pool } = parseSkillsSection(sections['skills']);
      for (const sk of fixed) grantSkill(sk);
      skillChoices += choiceCount;
      if (pool.length > 0) skillChoicePoolSets.push(pool);
    }
  }

  // ---- process race structured skillProficiencies ----
  if (race?.skillProficiencies) {
    for (const obj of race.skillProficiencies) {
      for (const [key, val] of Object.entries(obj)) {
        if (key === 'any' && typeof val === 'number') {
          skillChoices += val;
        } else if (val === true) {
          const sk = normaliseSkillKey(key);
          if (sk) grantSkill(sk);
        }
      }
    }
  }

  // ---- process background ----
  if (background) {
    // Skills
    const bgSkills = background.skillProficiencies;
    if (Array.isArray(bgSkills)) {
      for (const obj of bgSkills) {
        if (typeof obj === 'string') {
          const sk = normaliseSkillKey(obj);
          if (sk) grantSkill(sk);
        } else if (typeof obj === 'object') {
          for (const [key, val] of Object.entries(obj as Record<string, any>)) {
            if (key === 'any' && typeof val === 'number') skillChoices += val;
            else if (val === true) {
              const sk = normaliseSkillKey(key);
              if (sk) grantSkill(sk);
            }
          }
        }
      }
    } else if (typeof bgSkills === 'object' && bgSkills !== null) {
      for (const [key, val] of Object.entries(bgSkills as Record<string, any>)) {
        if (key === 'any' && typeof val === 'number') skillChoices += val;
        else if (val === true) {
          const sk = normaliseSkillKey(key);
          if (sk) grantSkill(sk);
        }
      }
    }

    // Tools
    const bgTools = background.toolProficiencies;
    if (Array.isArray(bgTools)) {
      for (const obj of bgTools) {
        if (typeof obj === 'string') addTool(obj);
        else if (typeof obj === 'object') {
          for (const [key, val] of Object.entries(obj as Record<string, any>)) {
            if (key === 'any' && typeof val === 'number') toolChoices += val;
            else if (val === true) addTool(key);
          }
        }
      }
    }
  }

  // ---- Merge skill choice pools ----
  // If there are multiple pools, use the intersection so only valid choices are shown.
  // If no pool was specified, any skill can be chosen (represented as empty array).
  let skillChoicePool: (keyof PlayerSkills)[] = [];
  if (skillChoicePoolSets.length === 1) {
    skillChoicePool = skillChoicePoolSets[0] ?? [];
  } else if (skillChoicePoolSets.length > 1) {
    // Union of all pools (generous interpretation for multi-class)
    const union = new Set<keyof PlayerSkills>();
    for (const pool of skillChoicePoolSets) pool.forEach(s => union.add(s));
    skillChoicePool = Array.from(union);
  }

  return {
    skills,
    skillChoices,
    skillChoicePool,
    expertiseChoices,
    savingThrows,
    armorProficiencies,
    weaponProficiencies,
    toolProficiencies,
    toolChoices,
  };
}

export function setStartingSkillProficiencies(
  charClass: CharClass | null,
  race: Race | null,
  background: Background | null
): { skills: PlayerSkills; additionalChoices: { basic: number; expert: number } } {
  let skills: PlayerSkills = {
    acrobatics: { proficient: false, expertise: false },
    animalHandling: { proficient: false, expertise: false },
    arcana: { proficient: false, expertise: false },
    athletics: { proficient: false, expertise: false },
    deception: { proficient: false, expertise: false },
    history: { proficient: false, expertise: false },
    insight: { proficient: false, expertise: false },
    intimidation: { proficient: false, expertise: false },
    investigation: { proficient: false, expertise: false },
    medicine: { proficient: false, expertise: false },
    nature: { proficient: false, expertise: false },
    perception: { proficient: false, expertise: false },
    performance: { proficient: false, expertise: false },
    persuasion: { proficient: false, expertise: false },
    religion: { proficient: false, expertise: false },
    sleightOfHand: { proficient: false, expertise: false },
    stealth: { proficient: false, expertise: false },
    survival: { proficient: false, expertise: false },
  };

  let basic = 0;
  let expert = 0;

  function applyProficiencies(source: any) {
    if (!source) return;
    let profs = source.skillProficiencies || source.startingProficiencies;
    if (!profs) return;
    if (Array.isArray(profs)) {
      profs.forEach((item: any) => {
        if (typeof item === 'string') {
          const key = item.charAt(0).toLowerCase() + item.slice(1).replace(/\s/g, '');
          if (skills[key as keyof PlayerSkills])
            skills[key as keyof PlayerSkills].proficient = true;
        } else if (typeof item === 'object') {
          Object.entries(item).forEach(([key, val]) => {
            if (key === 'any' && typeof val === 'number') basic += val;
            else if (key === 'expertise' && typeof val === 'number') expert += val;
            else if (val === true && skills[key as keyof PlayerSkills]) {
              skills[key as keyof PlayerSkills].proficient = true;
            }
          });
        }
      });
    } else if (typeof profs === 'object') {
      Object.entries(profs).forEach(([key, val]) => {
        if (key === 'any' && typeof val === 'number') basic += val;
        else if (key === 'expertise' && typeof val === 'number') expert += val;
        else if (val === true && skills[key as keyof PlayerSkills]) {
          skills[key as keyof PlayerSkills].proficient = true;
        }
      });
    }
  }

  applyProficiencies(charClass);
  applyProficiencies(race);
  applyProficiencies(background);

  return { skills, additionalChoices: { basic, expert } };
}

export function getFeaturesForLevel(classFeatures: ClassFeatures, level: number): ClassFeature[] {
  const index = level - 1;
  if (index < 0 || index >= classFeatures.length) return [];
  return classFeatures[index] ?? [];
}

export function abilityMod(score: number): number {
  return Math.floor((score - 10) / 2);
}

export function calculateProficiencyBonus(level: number): number {
  if (level >= 17) return 6;
  if (level >= 13) return 5;
  if (level >= 9) return 4;
  if (level >= 5) return 3;
  return 2;
}

export function calculatePassivePerception(
  wisMod: number,
  proficiencyBonus: number,
  isProficient: boolean,
  isExpert: boolean
): number {
  return 10 + wisMod + (isProficient ? proficiencyBonus : 0) + (isExpert ? proficiencyBonus : 0);
}

export function calculateAbilityScoreModifier(
  score: number,
  proficiencyBonus: number,
  isProficient: boolean,
  isExpert: boolean
): number {
  const baseMod = Math.floor((score - 10) / 2);
  return baseMod + (isProficient ? proficiencyBonus : 0) + (isExpert ? proficiencyBonus : 0);
}
