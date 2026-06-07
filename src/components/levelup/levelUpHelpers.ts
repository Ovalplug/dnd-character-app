import type {
  CharClass,
  ClassLevels,
  Entries,
  playerCharacter,
  SpellcastingCastingMode,
} from '../../types';
import { computeCharSpellcasting } from '../../helperFunctions';

export type LevelTableChange = {
  label: string;
  oldValue: string;
  newValue: string;
};

export type LevelUpFeature = {
  name: string;
  entries?: Entries;
  gainSubclassFeature?: boolean;
};

export type LevelUpAnalysis = {
  /** The character's new level within the chosen class after this level-up. */
  newClassLevel: number;
  /** The character's current level within the chosen class (0 if multiclassing in). */
  currentClassLevel: number;
  /** True if the player is multiclassing INTO this class for the first time. */
  isNewClass: boolean;
  /** Features listed in classFeatures[newClassLevel - 1]. */
  featuresGained: LevelUpFeature[];
  /** True when one of the features is an Ability Score Improvement. */
  hasASI: boolean;
  /** True when this level unlocks the subclass AND the character hasn't already chosen one. */
  needsSubclass: boolean;
  /** Delta in Cantrips Known from this class's table (0 if not applicable). */
  cantripsDelta: number;
  /**
   * Delta in Spells Known from this class's table (known-casters).
   * For spellbook casters this is always 2 (the free per-level additions).
   * For prepared casters this is always 0 (they prepare each long rest).
   */
  spellsKnownDelta: number;
  /** Whether the character (at the new level) is a spellcaster at all. */
  isSpellcaster: boolean;
  /** Casting mode after the level-up. */
  castingMode: SpellcastingCastingMode;
  /** Human-readable label for spell slot changes, e.g. "1st: 2 → 3". */
  newSpellSlotsDescription: string[];
  /** All column changes across the class's classTableGroups at this level. */
  tableChanges: LevelTableChange[];
  /** Highest spell slot level available after the level-up (used to filter spell picker). */
  maxSpellSlotLevel: number;
};

// ─────────────────────────────────────────────────────────────────────────────

const ORDINALS = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th'];

function formatTableValue(v: unknown): string {
  if (v === null || v === undefined) return '—';
  if (typeof v === 'object' && v !== null && 'value' in v)
    return `+${(v as { value: number }).value}`;
  return String(v);
}

export function computeLevelUpAnalysis(
  character: playerCharacter,
  chosenClass: CharClass
): LevelUpAnalysis {
  const classKey = chosenClass.name.toLowerCase() as keyof ClassLevels;
  const currentClassLevel = character.classLevels[classKey] ?? 0;
  const newClassLevel = currentClassLevel + 1;
  const isNewClass = currentClassLevel === 0;

  // ── Features gained ──────────────────────────────────────────────────────
  const featuresGained: LevelUpFeature[] = (chosenClass.classFeatures[newClassLevel - 1] ?? []).map(
    f => ({
      name: f.name,
      entries: (f.entries ?? []) as Entries,
      gainSubclassFeature: f.gainSubclassFeature,
    })
  );

  const hasASI = featuresGained.some(
    f =>
      f.name.toLowerCase().includes('ability score improvement') ||
      f.name.toLowerCase().includes('ability score increase')
  );

  const needsSubclass =
    newClassLevel === chosenClass.subclassAtLvl &&
    !character.subclasses?.[chosenClass.name]?.length;

  // ── Table changes ─────────────────────────────────────────────────────────
  const tableChanges: LevelTableChange[] = [];
  let cantripsDelta = 0;
  let spellsKnownDelta = 0;

  (chosenClass.classTableGroups ?? []).forEach(group => {
    const oldRow = currentClassLevel > 0 ? group.rows[currentClassLevel - 1] : null;
    const newRow = group.rows[newClassLevel - 1];
    if (!newRow) return;

    group.colLabels.forEach((label: string, ci: number) => {
      const oldVal = oldRow ? oldRow[ci] : null;
      const newVal = newRow[ci];

      const oldStr = oldVal !== null ? formatTableValue(oldVal) : isNewClass ? '—' : '0';
      const newStr = formatTableValue(newVal);

      if (oldStr !== newStr) {
        tableChanges.push({ label, oldValue: oldStr, newValue: newStr });
      }

      if (label === 'Cantrips Known') {
        const oldCount = oldRow ? Number(oldVal) || 0 : 0;
        cantripsDelta = Math.max(0, (Number(newVal) || 0) - oldCount);
      }

      if (label === 'Spells Known') {
        const oldCount = oldRow ? Number(oldVal) || 0 : 0;
        spellsKnownDelta = Math.max(0, (Number(newVal) || 0) - oldCount);
      }
    });
  });

  // ── Spell slot delta ──────────────────────────────────────────────────────
  const newClassList = isNewClass ? [...character.classes, chosenClass] : character.classes;
  const newClassLevels = { ...character.classLevels, [classKey]: newClassLevel };

  const oldInfo = computeCharSpellcasting(character);
  const newInfo = computeCharSpellcasting({
    ...character,
    classes: newClassList,
    classLevels: newClassLevels,
  });

  const newSpellSlotsDescription: string[] = [];
  let maxSpellSlotLevel = 0;

  for (let slotLevel = 1; slotLevel <= 9; slotLevel++) {
    const oldMax = oldInfo.spellSlots[slotLevel]?.max ?? 0;
    const newMax = newInfo.spellSlots[slotLevel]?.max ?? 0;
    if (newMax > oldMax) {
      newSpellSlotsDescription.push(`${ORDINALS[slotLevel - 1]}: ${oldMax} → ${newMax}`);
    }
    if (newMax > 0) maxSpellSlotLevel = slotLevel;
  }

  const castingMode = newInfo.castingMode;
  const isSpellcaster = newInfo.isSpellcaster;

  // For spellbook casters (Wizard, Artificer) advancing: +2 free spells/level into spellbook
  if (castingMode === 'spellbook' && !isNewClass) {
    spellsKnownDelta = 2;
  }

  // Prepared casters (Cleric, Druid, Paladin) don't "learn" spells at level-up
  if (castingMode === 'prepared') {
    spellsKnownDelta = 0;
  }

  return {
    newClassLevel,
    currentClassLevel,
    isNewClass,
    featuresGained,
    hasASI,
    needsSubclass,
    cantripsDelta,
    spellsKnownDelta,
    isSpellcaster,
    castingMode,
    newSpellSlotsDescription,
    tableChanges,
    maxSpellSlotLevel,
  };
}
