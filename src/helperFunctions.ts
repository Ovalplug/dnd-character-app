import type { SpellClass, SpellClasses, Spells, SpellSchools } from './types';

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
    const matchesSchool = schools.length === 0 || schools.includes(spell.school.toLowerCase() as SpellSchools);
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
