import type { DiceRoll, SpellClass, SpellClasses, Spells, SpellSchools, DiceTypes, Race, Background } from './types';

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