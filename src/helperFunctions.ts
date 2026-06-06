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
  ClassLevels,
  PlayerSkills,
  Feat,
  AllProficiencies,
  SavingThrow,
  Subclass,
  SpellcastingProfile,
  SpellcastingType,
  SpellSource,
  SpellcastingInfo,
  SpellcastingCastingMode,
  playerCharacter,
  Entry,
  Item,
  Items,
} from './types';
import { SKILL_NAME_MAP, SAVING_THROW_MAP } from './constants';
export type ItemFilterTag = 'attunement' | 'wondrous' | 'tattoo' | 'vehicle';
export type FeatPrerequisiteTag =
  | 'ability'
  | 'background'
  | 'class'
  | 'feat'
  | 'invocation'
  | 'item'
  | 'level'
  | 'pact'
  | 'proficiency'
  | 'psionics'
  | 'race'
  | 'special'
  | 'spell'
  | 'spellcasting';
export type FeatSpellTag = 'grants-spells';

const ITEM_RARITY_ORDER: Record<string, number> = {
  none: 0,
  common: 1,
  uncommon: 2,
  rare: 3,
  'very rare': 4,
  legendary: 5,
  artifact: 6,
  varies: 7,
  unknown: 8,
};

export type InventoryStackRow = {
  key: string;
  item: Item;
  quantity: number;
  indexes: number[];
};

function normalizeSearchFragment(value: string): string {
  return value
    .toLowerCase()
    .replace(/[|/_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

type ItemSearchScore = {
  bucket: number;
  position: number;
  length: number;
};

function getSearchFieldScore(value: string | undefined, query: string): ItemSearchScore | null {
  if (!value) return null;

  const normalizedValue = normalizeSearchFragment(value);
  if (!normalizedValue) return null;

  if (normalizedValue === query) {
    return { bucket: 0, position: 0, length: normalizedValue.length };
  }

  if (normalizedValue.startsWith(query)) {
    return { bucket: 1, position: 0, length: normalizedValue.length };
  }

  const wordStartIndex = normalizedValue.split(' ').findIndex(part => part.startsWith(query));
  if (wordStartIndex !== -1) {
    return { bucket: 2, position: wordStartIndex, length: normalizedValue.length };
  }

  const includesIndex = normalizedValue.indexOf(query);
  if (includesIndex !== -1) {
    return { bucket: 3, position: includesIndex, length: normalizedValue.length };
  }

  return null;
}

function compareSearchScores(left: ItemSearchScore | null, right: ItemSearchScore | null): number {
  if (!left && !right) return 0;
  if (!left) return 1;
  if (!right) return -1;

  if (left.bucket !== right.bucket) return left.bucket - right.bucket;
  if (left.position !== right.position) return left.position - right.position;
  if (left.length !== right.length) return left.length - right.length;
  return 0;
}

function compareItemsBySearchRelevance(
  left: Item,
  right: Item,
  query: string,
  orderBy: 'name' | 'rarity'
): number {
  const leftNameScore =
    getSearchFieldScore(left.displayName, query) ?? getSearchFieldScore(left.name, query);
  const rightNameScore =
    getSearchFieldScore(right.displayName, query) ?? getSearchFieldScore(right.name, query);
  const nameCompare = compareSearchScores(leftNameScore, rightNameScore);
  if (nameCompare !== 0) return nameCompare;

  const leftTypeScore =
    getSearchFieldScore(getPrettyItemType(left.type), query) ??
    getSearchFieldScore(left.type, query);
  const rightTypeScore =
    getSearchFieldScore(getPrettyItemType(right.type), query) ??
    getSearchFieldScore(right.type, query);
  const typeCompare = compareSearchScores(leftTypeScore, rightTypeScore);
  if (typeCompare !== 0) return typeCompare;

  if (orderBy === 'rarity') {
    const rarityRankLeft = ITEM_RARITY_ORDER[left.rarity?.trim().toLowerCase() ?? 'unknown'] ?? 999;
    const rarityRankRight =
      ITEM_RARITY_ORDER[right.rarity?.trim().toLowerCase() ?? 'unknown'] ?? 999;
    if (rarityRankLeft !== rarityRankRight) return rarityRankLeft - rarityRankRight;
  }

  return left.name.localeCompare(right.name);
}

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

export function getRefinedItemsList(
  items: Items,
  rarities: string[],
  types: string[],
  tags: ItemFilterTag[],
  orderBy: 'name' | 'rarity' = 'name',
  searchVal?: string
): Items {
  const normalizedSearch = searchVal ? normalizeSearchFragment(searchVal) : undefined;
  const normalizedRarities = new Set(rarities.map(value => value.trim().toLowerCase()));
  const normalizedTypes = new Set(types.map(value => value.trim().toLowerCase()));

  const refinedItems = items.filter(item => {
    const itemRarity = item.rarity?.trim().toLowerCase() ?? '';
    const itemType = item.type?.trim().toLowerCase() ?? '';
    const itemTypeLabel = getPrettyItemType(item.type).trim().toLowerCase();
    const itemName = normalizeSearchFragment(item.name);
    const itemDisplayName = item.displayName ? normalizeSearchFragment(item.displayName) : '';
    const matchesRarity = normalizedRarities.size === 0 || normalizedRarities.has(itemRarity);
    const matchesType =
      normalizedTypes.size === 0 ||
      normalizedTypes.has(itemType) ||
      normalizedTypes.has(itemTypeLabel);
    const matchesTags =
      tags.length === 0 ||
      tags.every(tag => {
        switch (tag) {
          case 'attunement':
            return item.reqAttune !== undefined && item.reqAttune !== false;
          case 'wondrous':
            return item.wondrous === true;
          case 'tattoo':
            return item.tattoo === true;
          case 'vehicle':
            return (
              item.crew !== undefined ||
              item.vehAc !== undefined ||
              item.vehHp !== undefined ||
              item.vehSpeed !== undefined ||
              item.capCargo !== undefined
            );
          default:
            return true;
        }
      });
    const matchesSearch =
      !normalizedSearch ||
      itemName.includes(normalizedSearch) ||
      itemDisplayName.includes(normalizedSearch) ||
      itemType.includes(normalizedSearch) ||
      itemTypeLabel.includes(normalizedSearch);

    return matchesRarity && matchesType && matchesTags && matchesSearch;
  });

  if (normalizedSearch) {
    refinedItems.sort((a, b) => compareItemsBySearchRelevance(a, b, normalizedSearch, orderBy));
    return refinedItems;
  }

  if (orderBy === 'name') {
    refinedItems.sort((a, b) => a.name.localeCompare(b.name));
  } else {
    refinedItems.sort((a, b) => {
      const rarityRankA = ITEM_RARITY_ORDER[a.rarity?.trim().toLowerCase() ?? 'unknown'] ?? 999;
      const rarityRankB = ITEM_RARITY_ORDER[b.rarity?.trim().toLowerCase() ?? 'unknown'] ?? 999;
      const rarityCompare = rarityRankA - rarityRankB;
      if (rarityCompare !== 0) return rarityCompare;
      return a.name.localeCompare(b.name);
    });
  }

  return refinedItems;
}

const FEAT_ABILITY_FILTERS: SavingThrow[] = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

export function getFeatAbilityFilters(feat: Feat): SavingThrow[] {
  if (!feat.ability) return [];

  const bonuses = Array.isArray(feat.ability) ? feat.ability : [feat.ability];
  const abilities = new Set<SavingThrow>();

  bonuses.forEach(bonus => {
    if ('choose' in bonus) {
      bonus.choose.from.forEach(ability => {
        if (FEAT_ABILITY_FILTERS.includes(ability)) abilities.add(ability);
      });
      return;
    }

    Object.entries(bonus).forEach(([ability, value]) => {
      if (
        typeof value === 'number' &&
        FEAT_ABILITY_FILTERS.includes(ability as SavingThrow)
      ) {
        abilities.add(ability as SavingThrow);
      }
    });
  });

  return Array.from(abilities);
}

export function getFeatPrerequisiteTags(feat: Feat): FeatPrerequisiteTag[] {
  const prerequisites = feat.prerequisite ?? [];
  const tags = new Set<FeatPrerequisiteTag>();

  prerequisites.forEach(prerequisite => {
    if (typeof prerequisite === 'string') {
      tags.add('special');
      return;
    }

    if ('ability' in prerequisite) tags.add('ability');
    if ('background' in prerequisite) tags.add('background');
    if ('class' in prerequisite) tags.add('class');
    if ('feat' in prerequisite) tags.add('feat');
    if ('invocation' in prerequisite) tags.add('invocation');
    if ('level' in prerequisite) tags.add('level');
    if ('proficiency' in prerequisite) tags.add('proficiency');
    if ('psionics' in prerequisite) tags.add('psionics');
    if ('race' in prerequisite) tags.add('race');
    if ('spell' in prerequisite) tags.add('spell');
    if ('spellcasting' in prerequisite || 'spellcasting2020' in prerequisite) {
      tags.add('spellcasting');
    }

    switch (prerequisite.type) {
      case 'prereqItem':
        tags.add('item');
        break;
      case 'prereqLevel':
        tags.add('level');
        if (prerequisite.class) tags.add('class');
        break;
      case 'prereqPact':
        tags.add('pact');
        break;
      case 'prereqSpecial':
        tags.add('special');
        break;
      case 'prereqSpell':
        tags.add('spell');
        break;
      default:
        break;
    }
  });

  return Array.from(tags);
}

export function getPrettyFeatPrerequisiteTag(tag: FeatPrerequisiteTag): string {
  switch (tag) {
    case 'ability':
      return 'Ability';
    case 'background':
      return 'Background';
    case 'class':
      return 'Class';
    case 'feat':
      return 'Feat';
    case 'invocation':
      return 'Invocation';
    case 'item':
      return 'Item';
    case 'level':
      return 'Level';
    case 'pact':
      return 'Pact';
    case 'proficiency':
      return 'Proficiency';
    case 'psionics':
      return 'Psionics';
    case 'race':
      return 'Race';
    case 'special':
      return 'Special';
    case 'spell':
      return 'Spell';
    case 'spellcasting':
      return 'Spellcasting';
    default:
      return tag;
  }
}

function entryMentionsLearningSpells(entry: Entry): boolean {
  if (typeof entry === 'string') {
    const normalized = normalizeSearchFragment(entry);

    return (
      /\blearn\b.*\bspell(s)?\b/.test(normalized) ||
      /\byou know\b.*\bspell(s)?\b/.test(normalized) ||
      /\bcan cast\b.*\bspell(s)?\b/.test(normalized)
    );
  }

  if (Array.isArray(entry.entries) && entry.entries.some(entryMentionsLearningSpells)) {
    return true;
  }

  if ('items' in entry && Array.isArray(entry.items) && entry.items.some(entryMentionsLearningSpells)) {
    return true;
  }

  if (entry.type === 'item' && entry.entry) {
    return entryMentionsLearningSpells(entry.entry);
  }

  return false;
}

export function getFeatSpellTags(feat: Feat): FeatSpellTag[] {
  const hasAdditionalSpells = Array.isArray(feat.additionalSpells) && feat.additionalSpells.length > 0;
  const mentionsLearningSpells = Array.isArray(feat.entries) && feat.entries.some(entryMentionsLearningSpells);

  if (hasAdditionalSpells || mentionsLearningSpells) {
    return ['grants-spells'];
  }

  return [];
}

export function getPrettyFeatSpellTag(tag: FeatSpellTag): string {
  switch (tag) {
    case 'grants-spells':
      return 'Grants Spells';
    default:
      return tag;
  }
}

function compareFeatsBySearchRelevance(
  left: Feat,
  right: Feat,
  query: string,
  orderBy: 'name' | 'source'
): number {
  const leftNameScore = getSearchFieldScore(left.name, query);
  const rightNameScore = getSearchFieldScore(right.name, query);
  const nameCompare = compareSearchScores(leftNameScore, rightNameScore);
  if (nameCompare !== 0) return nameCompare;

  const leftSourceScore = getSearchFieldScore(left.source, query);
  const rightSourceScore = getSearchFieldScore(right.source, query);
  const sourceCompare = compareSearchScores(leftSourceScore, rightSourceScore);
  if (sourceCompare !== 0) return sourceCompare;

  const leftAbilityScore = compareSearchScores(
    getSearchFieldScore(getFeatAbilityFilters(left).map(getPrettyAbilityName).join(' '), query),
    getSearchFieldScore(getFeatAbilityFilters(right).map(getPrettyAbilityName).join(' '), query)
  );
  if (leftAbilityScore !== 0) return leftAbilityScore;

  const leftPrereqScore = compareSearchScores(
    getSearchFieldScore(
      getFeatPrerequisiteTags(left).map(getPrettyFeatPrerequisiteTag).join(' '),
      query
    ),
    getSearchFieldScore(
      getFeatPrerequisiteTags(right).map(getPrettyFeatPrerequisiteTag).join(' '),
      query
    )
  );
  if (leftPrereqScore !== 0) return leftPrereqScore;

  const spellTagCompare = compareSearchScores(
    getSearchFieldScore(getFeatSpellTags(left).map(getPrettyFeatSpellTag).join(' '), query),
    getSearchFieldScore(getFeatSpellTags(right).map(getPrettyFeatSpellTag).join(' '), query)
  );
  if (spellTagCompare !== 0) return spellTagCompare;

  if (orderBy === 'source') {
    const sourceOrder = (left.source ?? '').localeCompare(right.source ?? '');
    if (sourceOrder !== 0) return sourceOrder;
  }

  return left.name.localeCompare(right.name);
}

export function getRefinedFeatsList(
  feats: Feat[],
  sources: string[],
  abilities: SavingThrow[],
  prerequisiteTags: FeatPrerequisiteTag[],
  spellTags: FeatSpellTag[],
  orderBy: 'name' | 'source' = 'name',
  searchVal?: string
): Feat[] {
  const normalizedSearch = searchVal ? normalizeSearchFragment(searchVal) : undefined;
  const normalizedSources = new Set(sources.map(source => source.trim().toLowerCase()));
  const selectedAbilities = new Set(abilities);
  const selectedPrerequisites = new Set(prerequisiteTags);
  const selectedSpellTags = new Set(spellTags);

  const refinedFeats = feats.filter(feat => {
    const featSource = feat.source?.trim().toLowerCase() ?? '';
    const featAbilities = getFeatAbilityFilters(feat);
    const featPrerequisites = getFeatPrerequisiteTags(feat);
    const featSpellTags = getFeatSpellTags(feat);
    const matchesSource = normalizedSources.size === 0 || normalizedSources.has(featSource);
    const matchesAbility =
      selectedAbilities.size === 0 ||
      featAbilities.some(ability => selectedAbilities.has(ability));
    const matchesPrerequisite =
      selectedPrerequisites.size === 0 ||
      featPrerequisites.some(tag => selectedPrerequisites.has(tag));
    const matchesSpellTag =
      selectedSpellTags.size === 0 || featSpellTags.some(tag => selectedSpellTags.has(tag));

    const searchableText = [
      feat.name,
      feat.source,
      featAbilities.map(getPrettyAbilityName).join(' '),
      featPrerequisites.map(getPrettyFeatPrerequisiteTag).join(' '),
      featSpellTags.map(getPrettyFeatSpellTag).join(' '),
    ]
      .filter((value): value is string => Boolean(value))
      .join(' ');
    const matchesSearch =
      !normalizedSearch || normalizeSearchFragment(searchableText).includes(normalizedSearch);

    return (
      matchesSource &&
      matchesAbility &&
      matchesPrerequisite &&
      matchesSpellTag &&
      matchesSearch
    );
  });

  if (normalizedSearch) {
    refinedFeats.sort((a, b) => compareFeatsBySearchRelevance(a, b, normalizedSearch, orderBy));
    return refinedFeats;
  }

  if (orderBy === 'source') {
    refinedFeats.sort((a, b) => {
      const sourceCompare = (a.source ?? '').localeCompare(b.source ?? '');
      if (sourceCompare !== 0) return sourceCompare;
      return a.name.localeCompare(b.name);
    });
  } else {
    refinedFeats.sort((a, b) => a.name.localeCompare(b.name));
  }

  return refinedFeats;
}

export function getPrettyItemType(type?: string): string {
  switch (type?.toUpperCase()) {
    case '$':
      return 'Treasure';
    case '$A':
      return 'Treasure (Art Object)';
    case '$G':
      return 'Treasure (Gemstone)';
    case 'A':
      return 'Ammunition';
    case 'AF':
      return 'Ammunition (Firearm)';
    case 'AT':
      return 'Artisan Tool';
    case 'EM':
      return 'Eldritch Machine';
    case 'EXP':
      return 'Explosive';
    case 'G':
      return 'Adventuring Gear';
    case 'GV':
      return 'Generic Variant';
    case 'HA':
      return 'Heavy Armor';
    case 'INS':
      return 'Instrument';
    case 'LA':
      return 'Light Armor';
    case 'M':
      return 'Melee Weapon';
    case 'MA':
      return 'Medium Armor';
    case 'MNT':
      return 'Mount';
    case 'P':
      return 'Potion';
    case 'R':
      return 'Ranged Weapon';
    case 'RD':
      return 'Rod';
    case 'RG':
      return 'Ring';
    case 'S':
      return 'Shield';
    case 'SC':
      return 'Scroll';
    case 'SCF':
      return 'Spellcasting Focus';
    case 'SCF-D':
      return 'Spellcasting Focus (Druid)';
    case 'SCF-P':
      return 'Spellcasting Focus (Paladin)';
    case 'SCF-W':
      return 'Spellcasting Focus (Wizard)';
    case 'SPC':
      return 'Spelljamming Ship';
    case 'T':
      return 'Tool';
    case 'TAH':
      return 'Tack and Harness';
    case 'VEH':
      return 'Vehicle';
    case 'WD':
      return 'Wand';
    default:
      return type ?? 'Unknown';
  }
}

export function itemRequiresAttunement(item: Item): boolean {
  return item.reqAttune !== undefined && item.reqAttune !== false;
}

function titleCaseLabel(value: string): string {
  return value.replace(/\b\w/g, letter => letter.toUpperCase());
}

export function getInventoryItemDisplayName(item: Item): string {
  return item.displayName || item.name;
}

export function isWeaponItem(item: Item): boolean {
  return item.weapon === true || item.type === 'M' || item.type === 'R';
}

export function isShieldItem(item: Item): boolean {
  return item.type === 'S';
}

export function isArmorItem(item: Item): boolean {
  return (
    item.armor === true ||
    item.type === 'LA' ||
    item.type === 'MA' ||
    item.type === 'HA' ||
    isShieldItem(item)
  );
}

export function getInventoryItemCategory(item: Item): string {
  if (isShieldItem(item)) return 'Shield';
  if (isWeaponItem(item)) return item.type === 'R' ? 'Ranged Weapon' : 'Weapon';
  if (item.wondrous) return 'Wondrous Item';
  if (item.tattoo) return 'Magical Tattoo';
  return getPrettyItemType(item.type);
}

export function getInventoryItemBadges(item: Item): string[] {
  const badges = [getInventoryItemCategory(item)];

  if (typeof item.rarity === 'string' && item.rarity.trim()) {
    badges.push(titleCaseLabel(item.rarity.trim()));
  }

  if (item.equipped) badges.push('Equipped');
  if (item.attuned) badges.push('Attuned');
  else if (itemRequiresAttunement(item)) badges.push('Requires Attunement');

  return badges;
}

export function getInventoryItemFacts(item: Item): string[] {
  const facts: string[] = [];

  if (item.weaponCategory && isWeaponItem(item)) {
    facts.push(item.weaponCategory);
  }

  if (item.ac !== undefined && item.ac !== '') {
    facts.push(`AC ${item.ac}`);
  }

  if (typeof item.dmg1 === 'string' && item.dmg1) {
    const damage = item.dmg2 ? `${item.dmg1} / ${item.dmg2}` : item.dmg1;
    facts.push(`Damage ${damage}`);
  }

  if (typeof item.range === 'string' && item.range.trim()) {
    facts.push(`Range ${item.range}`);
  }

  if (typeof item.weight === 'number' && item.weight > 0) {
    facts.push(`${item.weight} lb${item.weight === 1 ? '' : 's'}`);
  }

  if (typeof item.charges === 'number' && item.charges > 0) {
    facts.push(`${item.charges} charge${item.charges === 1 ? '' : 's'}`);
  }

  return facts;
}

export function stackInventoryItems(items: Items): InventoryStackRow[] {
  const rows: InventoryStackRow[] = [];
  const rowIndexByKey = new Map<string, number>();

  items.forEach((item, index) => {
    const key = [
      item.name,
      item.source ?? '',
      item.displayName ?? '',
      item.equipped ? 'equipped' : 'unequipped',
      item.attuned ? 'attuned' : 'unattuned',
    ].join('::');
    const existingIndex = rowIndexByKey.get(key);

    if (existingIndex !== undefined) {
      rows[existingIndex]!.quantity += 1;
      rows[existingIndex]!.indexes.push(index);
      return;
    }

    rowIndexByKey.set(key, rows.length);
    rows.push({
      key,
      item,
      quantity: 1,
      indexes: [index],
    });
  });

  return rows;
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
  const key = raw
    .trim()
    .toLowerCase()
    .replace(/[.,;]+$/, '');
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

// ---------------------------------------------------------------------------
// Spellcasting computation
// ---------------------------------------------------------------------------

/**
 * Full-caster spell slot table indexed by [classLevel - 1][slotLevel - 1].
 * Covers levels 1-20 for 9 slot levels.
 */
const FULL_CASTER_SLOTS: number[][] = [
  [2, 0, 0, 0, 0, 0, 0, 0, 0],
  [3, 0, 0, 0, 0, 0, 0, 0, 0],
  [4, 2, 0, 0, 0, 0, 0, 0, 0],
  [4, 3, 0, 0, 0, 0, 0, 0, 0],
  [4, 3, 2, 0, 0, 0, 0, 0, 0],
  [4, 3, 3, 0, 0, 0, 0, 0, 0],
  [4, 3, 3, 1, 0, 0, 0, 0, 0],
  [4, 3, 3, 2, 0, 0, 0, 0, 0],
  [4, 3, 3, 3, 1, 0, 0, 0, 0],
  [4, 3, 3, 3, 2, 0, 0, 0, 0],
  [4, 3, 3, 3, 2, 1, 0, 0, 0],
  [4, 3, 3, 3, 2, 1, 0, 0, 0],
  [4, 3, 3, 3, 2, 1, 1, 0, 0],
  [4, 3, 3, 3, 2, 1, 1, 0, 0],
  [4, 3, 3, 3, 2, 1, 1, 1, 0],
  [4, 3, 3, 3, 2, 1, 1, 1, 0],
  [4, 3, 3, 3, 2, 1, 1, 1, 1],
  [4, 3, 3, 3, 3, 1, 1, 1, 1],
  [4, 3, 3, 3, 3, 2, 1, 1, 1],
  [4, 3, 3, 3, 3, 2, 2, 1, 1],
];

/** Half-caster slot table (Paladin, Ranger). Effective level = floor(charLevel / 2). */
const HALF_CASTER_SLOTS: number[][] = [
  [0, 0, 0, 0, 0, 0, 0, 0, 0], // char level 1 - no slots yet
  [2, 0, 0, 0, 0, 0, 0, 0, 0], // char level 2
  [3, 0, 0, 0, 0, 0, 0, 0, 0],
  [3, 0, 0, 0, 0, 0, 0, 0, 0],
  [4, 2, 0, 0, 0, 0, 0, 0, 0],
  [4, 2, 0, 0, 0, 0, 0, 0, 0],
  [4, 3, 0, 0, 0, 0, 0, 0, 0],
  [4, 3, 0, 0, 0, 0, 0, 0, 0],
  [4, 3, 2, 0, 0, 0, 0, 0, 0],
  [4, 3, 2, 0, 0, 0, 0, 0, 0],
  [4, 3, 3, 0, 0, 0, 0, 0, 0],
  [4, 3, 3, 0, 0, 0, 0, 0, 0],
  [4, 3, 3, 1, 0, 0, 0, 0, 0],
  [4, 3, 3, 1, 0, 0, 0, 0, 0],
  [4, 3, 3, 2, 0, 0, 0, 0, 0],
  [4, 3, 3, 2, 0, 0, 0, 0, 0],
  [4, 3, 3, 3, 1, 0, 0, 0, 0],
  [4, 3, 3, 3, 1, 0, 0, 0, 0],
  [4, 3, 3, 3, 2, 0, 0, 0, 0],
  [4, 3, 3, 3, 2, 0, 0, 0, 0],
];

/**
 * 1/3-caster slot table (Arcane Trickster, Eldritch Knight).
 * Effective level = floor(charLevel / 3); starts at char level 3.
 */
const THIRD_CASTER_SLOTS: number[][] = [
  [0, 0, 0, 0, 0, 0, 0, 0, 0], // 1
  [0, 0, 0, 0, 0, 0, 0, 0, 0], // 2
  [2, 0, 0, 0, 0, 0, 0, 0, 0], // 3
  [3, 0, 0, 0, 0, 0, 0, 0, 0], // 4
  [3, 0, 0, 0, 0, 0, 0, 0, 0], // 5
  [3, 0, 0, 0, 0, 0, 0, 0, 0], // 6
  [4, 2, 0, 0, 0, 0, 0, 0, 0], // 7
  [4, 2, 0, 0, 0, 0, 0, 0, 0], // 8
  [4, 2, 0, 0, 0, 0, 0, 0, 0], // 9
  [4, 3, 0, 0, 0, 0, 0, 0, 0], // 10
  [4, 3, 0, 0, 0, 0, 0, 0, 0], // 11
  [4, 3, 0, 0, 0, 0, 0, 0, 0], // 12
  [4, 3, 2, 0, 0, 0, 0, 0, 0], // 13
  [4, 3, 2, 0, 0, 0, 0, 0, 0], // 14
  [4, 3, 2, 0, 0, 0, 0, 0, 0], // 15
  [4, 3, 3, 0, 0, 0, 0, 0, 0], // 16
  [4, 3, 3, 0, 0, 0, 0, 0, 0], // 17
  [4, 3, 3, 0, 0, 0, 0, 0, 0], // 18
  [4, 3, 3, 1, 0, 0, 0, 0, 0], // 19
  [4, 3, 3, 1, 0, 0, 0, 0, 0], // 20
];

/**
 * Warlock pact magic: [slotCount, slotLevel (1-indexed)] indexed by [charLevel - 1].
 */
const PACT_MAGIC_TABLE: [number, number][] = [
  [1, 1],
  [2, 1],
  [2, 2],
  [2, 2],
  [2, 3],
  [2, 3],
  [2, 4],
  [2, 4],
  [2, 5],
  [2, 5],
  [3, 5],
  [3, 5],
  [3, 5],
  [3, 5],
  [3, 5],
  [3, 5],
  [4, 5],
  [4, 5],
  [4, 5],
  [4, 5],
];

function slotsFromRow(row: number[]): Record<number, { max: number; used: number }> {
  const slots: Record<number, { max: number; used: number }> = {};
  row.forEach((count, idx) => {
    if (count > 0) slots[idx + 1] = { max: count, used: 0 };
  });
  return slots;
}

function stripSpellTag(raw: string): string {
  // Spell names may have tags like "#c" (cantrip), "#level" etc. Strip them.
  return (raw.split('#')[0] ?? raw).trim();
}

/**
 * Given an `innate` or `known` block from additionalSpells, extract all spells
 * as flat entries with their required character level.
 */
function parseAdditionalSpells(
  additionalSpells: any[],
  mode: 'innate' | 'known' | 'prepared' | 'expanded',
  characterLevel: number
): Array<{ name: string; level: number; ability: string }> {
  const results: Array<{ name: string; level: number; ability: string }> = [];
  if (!Array.isArray(additionalSpells)) return results;

  for (const block of additionalSpells) {
    const ability: string =
      typeof block.ability === 'string'
        ? block.ability
        : Array.isArray(block.ability?.choose)
        ? block.ability.choose[0]
        : 'cha';

    const data = block[mode];
    if (!data || typeof data !== 'object') continue;

    for (const [reqLvlStr, spellList] of Object.entries(data)) {
      const reqLvl = parseInt(reqLvlStr, 10);
      if (isNaN(reqLvl) || reqLvl > characterLevel) continue;
      if (Array.isArray(spellList)) {
        for (const rawName of spellList as string[]) {
          results.push({ name: stripSpellTag(rawName), level: reqLvl, ability });
        }
      }
    }
  }
  return results;
}

/**
 * Compute the full spellcasting profile for a character under construction,
 * based on their classes, active subclass, race, and background.
 *
 * Rules:
 * - If the class has a "Spell Slots per Spell Level" table group → full caster
 * - Warlock has "Spell Slots" + "Slot Level" columns → pact magic caster
 * - Paladin/Ranger are half-casters (detected by name; no standard marker in data)
 * - A subclass with `spellcastingAbility` and `casterProgression` grants 1/3-caster
 * - Race/background `additionalSpells` grant innate spells only (canLearnSpells = false
 *   unless a class also grants spellcasting)
 */
export function computeSpellcasting(
  classes: CharClass[],
  activeSubclasses: Subclass[],
  race: Race | null,
  background: Background | null,
  characterLevel: number
): SpellcastingProfile {
  const sources: SpellSource[] = [];
  const innateSpells: SpellcastingProfile['innateSpells'] = [];
  const expandedSpellNames: string[] = [];

  let castingType: SpellcastingType = 'none';
  let spellcastingAbility: string | null = null;
  let canLearnSpells = false;
  let pactSlotLevel: number | undefined = undefined;

  // ---- Detect class-based spellcasting ----
  for (const cls of classes) {
    const tableGroups: any[] = (cls as any).classTableGroups ?? [];

    const hasFullSlotTable = tableGroups.some(
      (g: any) => g.title === 'Spell Slots per Spell Level'
    );
    const hasPactSlots = tableGroups.some(
      (g: any) =>
        Array.isArray(g.colLabels) &&
        g.colLabels.includes('Spell Slots') &&
        g.colLabels.includes('Slot Level')
    );
    const isHalfCaster =
      cls.name === 'Paladin' || cls.name === 'Ranger' || cls.name === 'Artificer';

    if (hasFullSlotTable && !isHalfCaster) {
      if (castingType === 'none') castingType = 'full';
      canLearnSpells = true;
      if (!sources.includes('class')) sources.push('class');
      if (!spellcastingAbility && cls.spellcastingAbility) {
        spellcastingAbility = cls.spellcastingAbility;
      }
    } else if (isHalfCaster && hasFullSlotTable) {
      if (castingType === 'none') castingType = 'half';
      canLearnSpells = true;
      if (!sources.includes('class')) sources.push('class');
      if (!spellcastingAbility && cls.spellcastingAbility) {
        spellcastingAbility = cls.spellcastingAbility;
      }
    } else if (hasPactSlots) {
      if (castingType === 'none') castingType = 'pact';
      canLearnSpells = true;
      if (!sources.includes('class')) sources.push('class');
      if (!spellcastingAbility && cls.spellcastingAbility) {
        spellcastingAbility = cls.spellcastingAbility;
      }
    }
  }

  // ---- Detect subclass-based spellcasting (e.g. Arcane Trickster, Eldritch Knight) ----
  for (const sub of activeSubclasses) {
    if (sub.spellcastingAbility) {
      const progression: string = (sub as any).casterProgression ?? '';
      if (castingType === 'none') {
        castingType = progression === '1/3' ? 'third' : 'full';
        canLearnSpells = true;
        spellcastingAbility = sub.spellcastingAbility;
        if (!sources.includes('subclass')) sources.push('subclass');
      }
    }
    // Subclass expanded/prepared spells
    if (Array.isArray(sub.additionalSpells)) {
      const prepared = parseAdditionalSpells(sub.additionalSpells, 'prepared', characterLevel);
      for (const s of prepared) {
        if (!expandedSpellNames.includes(s.name)) expandedSpellNames.push(s.name);
      }
    }
  }

  // ---- Race innate spells ----
  const raceAdditional: any[] = (race as any)?.additionalSpells ?? [];
  if (raceAdditional.length > 0) {
    const innate = parseAdditionalSpells(raceAdditional, 'innate', characterLevel);
    const known = parseAdditionalSpells(raceAdditional, 'known', characterLevel);
    const prepared = parseAdditionalSpells(raceAdditional, 'prepared', characterLevel);
    for (const s of [...innate, ...known, ...prepared]) {
      innateSpells.push({ name: s.name, level: s.level, ability: s.ability });
    }
    if (innate.length > 0 || known.length > 0 || prepared.length > 0) {
      if (!sources.includes('race')) sources.push('race');
      if (castingType === 'none') castingType = 'innate';
    }

    // Expanded spell lists from race
    const expanded = parseAdditionalSpells(raceAdditional, 'expanded', characterLevel);
    for (const s of expanded) {
      if (!expandedSpellNames.includes(s.name)) expandedSpellNames.push(s.name);
    }
  }

  // Subraces may also grant spells
  const subraceAdditional: any[] =
    (race as any)?.subraces?.flatMap((sr: any) => sr.additionalSpells ?? []) ?? [];
  if (subraceAdditional.length > 0) {
    const innate = parseAdditionalSpells(subraceAdditional, 'innate', characterLevel);
    const known = parseAdditionalSpells(subraceAdditional, 'known', characterLevel);
    for (const s of [...innate, ...known]) {
      innateSpells.push({ name: s.name, level: s.level, ability: s.ability });
    }
    if ((innate.length > 0 || known.length > 0) && !sources.includes('race')) {
      sources.push('race');
      if (castingType === 'none') castingType = 'innate';
    }
  }

  // ---- Background spells ----
  const bgAdditional: any[] = (background as any)?.additionalSpells ?? [];
  if (bgAdditional.length > 0) {
    const innate = parseAdditionalSpells(bgAdditional, 'innate', characterLevel);
    const known = parseAdditionalSpells(bgAdditional, 'known', characterLevel);
    const prepared = parseAdditionalSpells(bgAdditional, 'prepared', characterLevel);
    const expanded = parseAdditionalSpells(bgAdditional, 'expanded', characterLevel);
    for (const s of [...innate, ...known, ...prepared]) {
      innateSpells.push({ name: s.name, level: s.level, ability: s.ability });
    }
    for (const s of expanded) {
      if (!expandedSpellNames.includes(s.name)) expandedSpellNames.push(s.name);
    }
    if (innate.length > 0 || known.length > 0 || prepared.length > 0 || expanded.length > 0) {
      if (!sources.includes('background')) sources.push('background');
      if (castingType === 'none') castingType = 'innate';
    }
  }

  // ---- Build spell slots ----
  const idx = Math.max(0, Math.min(characterLevel - 1, 19));
  let spellSlots: Record<number, { max: number; used: number }> = {};

  if (castingType === 'full') {
    spellSlots = slotsFromRow(FULL_CASTER_SLOTS[idx]!);
  } else if (castingType === 'half') {
    spellSlots = slotsFromRow(HALF_CASTER_SLOTS[idx]!);
  } else if (castingType === 'third') {
    spellSlots = slotsFromRow(THIRD_CASTER_SLOTS[idx]!);
  } else if (castingType === 'pact') {
    const [count, slotLvl] = PACT_MAGIC_TABLE[idx]!;
    if (count > 0) {
      spellSlots[slotLvl] = { max: count, used: 0 };
      pactSlotLevel = slotLvl;
    }
  }
  // innate-only casters get no spell slots

  const isSpellcaster = castingType !== 'none';

  return {
    isSpellcaster,
    canLearnSpells,
    castingType,
    spellcastingAbility,
    spellSlots,
    innateSpells,
    expandedSpellNames,
    sources,
    pactSlotLevel,
  };
}

export function getPrettyCastingMode(mode: SpellcastingCastingMode): string {
  switch (mode) {
    case 'known':
      return 'Known Spells';
    case 'prepared':
      return 'Prepared';
    case 'spellbook':
      return 'Spellbook';
    case 'innate':
      return 'Innate';
    default:
      return '';
  }
}

export function computeCharSpellcasting(char: playerCharacter): SpellcastingInfo {
  const level = Math.max(
    1,
    Object.values(char.classLevels).reduce((s, v) => s + v, 0)
  );

  let castingMode: SpellcastingCastingMode = 'none';
  let spellcastingAbility: string | null = null;
  let cantripsKnown = 0;
  let spellsKnownCount = 0;
  const spellSlots: Record<number, { max: number; used: number }> = {};
  const innateSpells: SpellcastingInfo['innateSpells'] = [];
  const expandedSpellNames: string[] = [];

  // Recursively find the first abilityDc entry and return its ability
  function findAbilityFromEntries(entries: any[]): string | null {
    if (!Array.isArray(entries)) return null;
    for (const e of entries) {
      if (e?.type === 'abilityDc') return (e.attributes as string[])?.[0] ?? null;
      const found = findAbilityFromEntries(e?.entries ?? []);
      if (found) return found;
    }
    return null;
  }

  for (const cls of char.classes) {
    const clsKey = cls.name.toLowerCase() as keyof ClassLevels;
    const clsLevel = char.classLevels[clsKey] ?? 0;
    if (clsLevel <= 0) continue;

    const clsIdx = Math.min(clsLevel - 1, 19);
    const tableGroups = cls.classTableGroups ?? [];

    // Extract spellcasting ability by scanning all feature entries for abilityDc
    if (!spellcastingAbility) {
      for (const levelFeatures of cls.classFeatures) {
        const ability = findAbilityFromEntries(levelFeatures.flatMap(f => f.entries ?? []));
        if (ability) {
          spellcastingAbility = ability;
          break;
        }
      }
    }

    const cantripGroup = tableGroups.find(g => g.colLabels.includes('Cantrips Known'));
    const spellsKnownGroup = tableGroups.find(g => g.colLabels.includes('Spells Known'));
    const slotGroup = tableGroups.find(g => g.title === 'Spell Slots per Spell Level');
    const pactGroup = tableGroups.find(
      g => g.colLabels.includes('Spell Slots') && g.colLabels.includes('Slot Level')
    );

    // Cantrips known
    if (cantripGroup) {
      const colIdx = cantripGroup.colLabels.indexOf('Cantrips Known');
      const row = cantripGroup.rows[clsIdx];
      cantripsKnown += (row?.[colIdx] as number) ?? 0;
    }

    // Spell slots from full/half caster table
    if (slotGroup) {
      const row = slotGroup.rows[clsIdx] as number[];
      row?.forEach((count, i) => {
        if (count > 0) {
          const lvl = i + 1;
          if (spellSlots[lvl]) {
            spellSlots[lvl]!.max += count;
          } else {
            spellSlots[lvl] = { max: count, used: 0 };
          }
        }
      });
    }

    // Pact magic slots (Warlock)
    if (pactGroup) {
      const slotCountIdx = pactGroup.colLabels.indexOf('Spell Slots');
      const slotLvlIdx = pactGroup.colLabels.indexOf('Slot Level');
      const row = pactGroup.rows[clsIdx];
      const count = (row?.[slotCountIdx] as number) ?? 0;
      const slotLvl = (row?.[slotLvlIdx] as number) ?? 0;
      if (count > 0 && slotLvl > 0) {
        spellSlots[slotLvl] = { max: count, used: 0 };
      }
    }

    // Determine casting mode (first class wins for simple characters)
    if (castingMode === 'none') {
      const isSpellbookCaster = cls.name === 'Wizard' || cls.name === 'Artificer';
      const hasCastingData = !!(slotGroup || pactGroup || cantripGroup || spellsKnownGroup);

      if (hasCastingData) {
        if (isSpellbookCaster) {
          castingMode = 'spellbook';
          // 6 spells at level 1, +2 per level thereafter
          spellsKnownCount = 6 + 2 * (clsLevel - 1);
        } else if (spellsKnownGroup) {
          castingMode = 'known';
          const colIdx = spellsKnownGroup.colLabels.indexOf('Spells Known');
          const row = spellsKnownGroup.rows[clsIdx];
          spellsKnownCount = (row?.[colIdx] as number) ?? 0;
        } else {
          castingMode = 'prepared';
        }
      }
    }
  }

  // Calculate maximum prepared spells based on ability modifier + (class) level
  let maxPrepared = 0;
  if ((castingMode === 'prepared' || castingMode === 'spellbook') && spellcastingAbility) {
    const cls = char.classes[0];
    const clsKey = cls?.name?.toLowerCase() as keyof ClassLevels;
    const clsLevel = char.classLevels[clsKey] ?? 1;
    const abilityScore =
      char.abilityScores[spellcastingAbility as keyof typeof char.abilityScores] ?? 10;
    const abilityMod = Math.floor((abilityScore - 10) / 2);
    const clsName = cls?.name?.toLowerCase() ?? '';

    if (clsName === 'paladin' || clsName === 'artificer') {
      maxPrepared = Math.max(1, abilityMod + Math.floor(clsLevel / 2));
    } else {
      maxPrepared = Math.max(1, abilityMod + clsLevel);
    }
  }

  // Process innate / granted spells from race and background
  function parseInnate(additionalSpells: any[]): {
    innate: SpellcastingInfo['innateSpells'];
    expanded: string[];
  } {
    const innate: SpellcastingInfo['innateSpells'] = [];
    const expanded: string[] = [];
    for (const block of additionalSpells) {
      const ability: string =
        typeof block.ability === 'string'
          ? block.ability
          : Array.isArray(block.ability?.choose)
          ? (block.ability.choose[0] as string)
          : 'cha';

      for (const mode of ['innate', 'known', 'prepared'] as const) {
        const data = block[mode];
        if (!data || typeof data !== 'object') continue;
        for (const [reqLvlStr, spellList] of Object.entries(data)) {
          const reqLvl = parseInt(reqLvlStr, 10);
          if (isNaN(reqLvl) || reqLvl > level) continue;
          if (Array.isArray(spellList)) {
            for (const rawName of spellList as string[]) {
              const name = (rawName.split('#')[0] ?? rawName).trim();
              innate.push({ name, level: reqLvl, ability });
            }
          }
        }
      }
      const expandedData = block['expanded'];
      if (expandedData && typeof expandedData === 'object') {
        for (const [reqLvlStr, spellList] of Object.entries(expandedData)) {
          const reqLvl = parseInt(reqLvlStr, 10);
          if (isNaN(reqLvl) || reqLvl > level) continue;
          if (Array.isArray(spellList)) {
            for (const rawName of spellList as string[]) {
              const name = (rawName.split('#')[0] ?? rawName).trim();
              if (!expanded.includes(name)) expanded.push(name);
            }
          }
        }
      }
    }
    return { innate, expanded };
  }

  const raceAdditional: any[] = (char.race as any)?.additionalSpells ?? [];
  if (raceAdditional.length > 0) {
    const { innate, expanded } = parseInnate(raceAdditional);
    innateSpells.push(...innate);
    expanded.forEach(n => {
      if (!expandedSpellNames.includes(n)) expandedSpellNames.push(n);
    });
    if (innate.length > 0 && castingMode === 'none') castingMode = 'innate';
  }

  const bgAdditional: any[] = (char.background as any)?.additionalSpells ?? [];
  if (bgAdditional.length > 0) {
    const { innate, expanded } = parseInnate(bgAdditional);
    innateSpells.push(...innate);
    expanded.forEach(n => {
      if (!expandedSpellNames.includes(n)) expandedSpellNames.push(n);
    });
    if (innate.length > 0 && castingMode === 'none') castingMode = 'innate';
  }

  return {
    isSpellcaster: castingMode !== 'none',
    castingMode,
    spellcastingAbility,
    cantripsKnown,
    spellsKnownCount,
    maxPrepared,
    spellSlots,
    innateSpells,
    expandedSpellNames,
  };
}
