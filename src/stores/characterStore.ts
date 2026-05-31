import { defineStore } from 'pinia';
import { v4 as uuidv4 } from 'uuid';
import {
  db,
  type Character,
  type CharacterNoteEntry,
  type CharacterNoteSection,
  type CharacterNoteSectionId,
  type CharacterNotesRecord,
} from '../database/db';
import type {
  AbilityScoreValues,
  AllProficiencies,
  Background,
  CharClass,
  CharSpeed,
  ClassLevels,
  Currency,
  CurrencyWallet,
  DiceTypes,
  Feat,
  HitDice,
  Item,
  Languages,
  playerCharacter,
  PlayerSkills,
  Race,
  Subclass,
  Subrace,
  SpellcastingInfo,
} from '../types';
import {
  calculateAbilityScoreModifier,
  calculatePassivePerception,
  calculateProficiencyBonus,
  computeCharSpellcasting,
} from '../helperFunctions';

function syncAttunedItems(character: Character) {
  character.attunedItems = (character.inventory ?? [])
    .filter(item => item.attuned)
    .map(item => ({
      name: item.displayName || item.name,
      source: item.source,
    }));
}

type CharacterNotesInput = {
  sections: CharacterNoteSection[];
};

type LegacyCharacterNotesRecord = {
  characterId: string;
  campaignNotes?: string;
  backstory?: string;
  alliesAndOrganizations?: string[];
  createdAt?: number;
  updatedAt?: number;
};

const CHARACTER_NOTE_SECTION_IDS: CharacterNoteSectionId[] = [
  'characterDescription',
  'campaignNotes',
  'backstory',
  'alliesAndOrganizations',
];

function createNoteEntry(content = '', timestamp = Date.now(), title = ''): CharacterNoteEntry {
  return {
    id: crypto.randomUUID(),
    title,
    content,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function createEmptyNoteSections(): CharacterNoteSection[] {
  return CHARACTER_NOTE_SECTION_IDS.map(id => ({
    id,
    entries: [],
  }));
}

function normalizeNoteEntries(entries: CharacterNoteEntry[]): CharacterNoteEntry[] {
  return entries.map(entry => ({
    id: entry.id || crypto.randomUUID(),
    title: entry.title?.trimEnd() || '',
    content: entry.content.trimEnd(),
    createdAt: entry.createdAt || Date.now(),
    updatedAt: Date.now(),
  }));
}

function normalizeNoteSections(sections: CharacterNoteSection[]): CharacterNoteSection[] {
  const sectionMap = new Map<CharacterNoteSectionId, CharacterNoteSection>();

  sections.forEach(section => {
    if (!CHARACTER_NOTE_SECTION_IDS.includes(section.id)) return;
    sectionMap.set(section.id, {
      id: section.id,
      entries: normalizeNoteEntries(section.entries || []),
    });
  });

  return CHARACTER_NOTE_SECTION_IDS.map(
    id =>
      sectionMap.get(id) ?? {
        id,
        entries: [],
      }
  );
}

function buildLegacyNoteSections(character: Character): CharacterNoteSection[] {
  const timestamp = character.updatedAt || character.createdAt || Date.now();
  const sections = createEmptyNoteSections();

  const characterDescriptionSection = sections.find(
    section => section.id === 'characterDescription'
  );
  const campaignSection = sections.find(section => section.id === 'campaignNotes');
  const backstorySection = sections.find(section => section.id === 'backstory');
  const alliesSection = sections.find(section => section.id === 'alliesAndOrganizations');

  if (characterDescriptionSection && character.personality?.trim()) {
    characterDescriptionSection.entries = [createNoteEntry(character.personality, timestamp)];
  }

  if (campaignSection && character.notes?.trim()) {
    campaignSection.entries = [createNoteEntry(character.notes, timestamp)];
  }

  if (backstorySection && character.backstory?.trim()) {
    backstorySection.entries = [createNoteEntry(character.backstory, timestamp)];
  }

  if (alliesSection) {
    alliesSection.entries = (character.alliesAndOrganizations || [])
      .filter(ally => ally.trim().length > 0)
      .map(ally => createNoteEntry(ally, timestamp));
  }

  return sections;
}

function buildStoredNoteSections(
  record: CharacterNotesRecord | LegacyCharacterNotesRecord
): CharacterNoteSection[] {
  if ('sections' in record && Array.isArray(record.sections)) {
    return normalizeNoteSections(record.sections);
  }

  const legacyRecord = record as LegacyCharacterNotesRecord;
  const timestamp = record.updatedAt || record.createdAt || Date.now();
  return normalizeNoteSections([
    {
      id: 'characterDescription',
      entries: [],
    },
    {
      id: 'campaignNotes',
      entries: legacyRecord.campaignNotes?.trim()
        ? [createNoteEntry(legacyRecord.campaignNotes, timestamp)]
        : [],
    },
    {
      id: 'backstory',
      entries: legacyRecord.backstory?.trim()
        ? [createNoteEntry(legacyRecord.backstory, timestamp)]
        : [],
    },
    {
      id: 'alliesAndOrganizations',
      entries: (legacyRecord.alliesAndOrganizations || []).map((ally: string) =>
        createNoteEntry(ally, timestamp)
      ),
    },
  ]);
}

function sectionTextList(
  sections: CharacterNoteSection[],
  sectionId: CharacterNoteSectionId
): string[] {
  const section = sections.find(currentSection => currentSection.id === sectionId);
  if (!section) return [];
  return section.entries.map(entry => entry.content.trim()).filter(Boolean);
}

export const useCharacterStore = defineStore('characters', {
  state: () => ({
    characters: [] as Character[],
    loaded: false,
    currNewCharacter: null as playerCharacter | null,
  }),

  actions: {
    async loadCharacters() {
      this.characters = await db.characters.toArray();
      this.loaded = true;
    },

    /**
     * Start a new character creation process.
     * Initializes currNewCharacter.
     */
    startNewCharacterCreation() {
      this.currNewCharacter = {
        id: uuidv4(),
        name: '',
        level: 1,
        classes: [],
        classLevels: {
          artificer: 0,
          barbarian: 0,
          bard: 0,
          cleric: 0,
          druid: 0,
          fighter: 0,
          monk: 0,
          paladin: 0,
          ranger: 0,
          rogue: 0,
          sorcerer: 0,
          warlock: 0,
          wizard: 0,
        },
        subclasses: {},
        race: null,
        subrace: null,
        background: null,
        alignment: undefined,
        xp: undefined,
        inspiration: undefined,
        feats: [],
        languages: {
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
        },
        abilityScores: {
          str: 10,
          dex: 10,
          con: 10,
          int: 10,
          wis: 10,
          cha: 10,
        },
        proficiencyModifier: 2,
        inventory: [],
        maxHp: 0,
        currHp: 0,
        tempHp: 0,
        ac: 0,
        speed: { base: 30 },
        size: 'medium',
        skillProficiencies: {
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
        },
        image: undefined,
        hitDice: [],
        deathSaves: undefined,
        currency: { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 },
        passivePerception: undefined,
        initiativeBonus: 0,
        personalityTraits: [],
        ideals: [],
        bonds: [],
        flaws: [],
        featuresAndTraits: [],
        attacks: [],
        spellcasting: {
          spellCaster: 'None',
          spellSlots: undefined,
          cantrips: undefined,
          knownSpells: undefined,
          preparedSpells: undefined,
          spellSaveDC: 0,
          spellAttackBonus: 0,
        },
        notes: undefined,
        alliesAndOrganizations: [],
        backstory: undefined,
        attunedItems: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
    },

    /**
     * Save the current new character to the DB and characters list.
     * Resets currNewCharacter.
     */
    async finalizeCharacterCreation() {
      if (!this.currNewCharacter) return;
      // Deep-clone via JSON round-trip to strip Vue reactive Proxy wrappers,
      // which cannot be serialized by IndexedDB's structured clone algorithm.
      const newChar: Character = JSON.parse(
        JSON.stringify({
          ...this.currNewCharacter,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      );
      await db.characters.add(newChar);
      this.characters.push(newChar);
      await this.touchUpCharacter(newChar.id);
      this.currNewCharacter = null;
      return newChar.id;
    },

    async updateCharacter(character: Character) {
      character.updatedAt = Date.now();
      const serialized: Character = JSON.parse(JSON.stringify(character));
      await db.characters.put(serialized);
      const idx = this.characters.findIndex(c => c.id === character.id);
      if (idx !== -1) this.characters[idx] = serialized;
    },

    async deleteCharacter(id: string) {
      await db.characters.delete(id);
      await db.notes.delete(id);
      this.characters = this.characters.filter(c => c.id !== id);
    },

    async getCharacterNotes(id: string): Promise<CharacterNotesRecord | null> {
      const storedNotes = (await db.notes.get(id)) as
        | CharacterNotesRecord
        | LegacyCharacterNotesRecord
        | undefined;
      if (storedNotes) {
        return {
          characterId: id,
          sections: buildStoredNoteSections(storedNotes),
          createdAt: storedNotes.createdAt ?? Date.now(),
          updatedAt: storedNotes.updatedAt ?? Date.now(),
        };
      }

      const character = await db.characters.get(id);
      if (!character) return null;

      const migratedSections = buildLegacyNoteSections(character);
      const hasLegacyNotes = migratedSections.some(section =>
        section.entries.some(entry => entry.content.trim().length > 0)
      );

      if (!hasLegacyNotes) return null;

      return {
        characterId: id,
        sections: migratedSections,
        createdAt: character.createdAt,
        updatedAt: character.updatedAt,
      };
    },

    async saveCharacterNotes(
      id: string,
      notes: CharacterNotesInput
    ): Promise<CharacterNotesRecord | null> {
      const character = await db.characters.get(id);
      if (!character) return null;

      const existingNotes = await db.notes.get(id);
      const normalizedSections = normalizeNoteSections(notes.sections);
      const characterDescriptions = sectionTextList(normalizedSections, 'characterDescription');
      const campaignNotes = sectionTextList(normalizedSections, 'campaignNotes');
      const backstoryEntries = sectionTextList(normalizedSections, 'backstory');
      const alliesAndOrganizations = sectionTextList(normalizedSections, 'alliesAndOrganizations');
      const normalizedNotes: CharacterNotesRecord = {
        characterId: id,
        sections: normalizedSections,
        createdAt: existingNotes?.createdAt ?? character.createdAt ?? Date.now(),
        updatedAt: Date.now(),
      };

      const updatedCharacter: Character = JSON.parse(
        JSON.stringify({
          ...character,
          personality: characterDescriptions.join('\n\n') || undefined,
          notes: campaignNotes.join('\n\n') || undefined,
          backstory: backstoryEntries.join('\n\n') || undefined,
          alliesAndOrganizations,
          updatedAt: normalizedNotes.updatedAt,
        })
      );

      await db.characters.put(updatedCharacter);
      await db.notes.put(normalizedNotes);

      const idx = this.characters.findIndex(currCharacter => currCharacter.id === id);
      if (idx !== -1) this.characters[idx] = updatedCharacter;

      return normalizedNotes;
    },

    updateCharacterName(newName: string) {
      if (this.currNewCharacter) {
        this.currNewCharacter.name = newName;
      }
    },

    async editCharacterName(id: string, newName: string) {
      if (!id || !newName) return;
      const character = await db.characters.get(id);
      if (!character) return;
      character.name = newName;
      await this.updateCharacter(character);
    },

    async updateCharacterLanguagesById(id: string, languages: Languages) {
      const character = await db.characters.get(id);
      if (!character) return;
      character.languages = languages;
      await this.updateCharacter(character);
    },

    async updateCharacterMoney(
      id: string,
      currency: Currency,
      additionalCurrency?: CurrencyWallet[] | Currency
    ) {
      const character = await db.characters.get(id);
      if (!character) return;
      character.currency = currency;
      character.additionalCurrency = additionalCurrency;
      await this.updateCharacter(character);
    },

    async replaceCharacterInventory(id: string, inventory: Item[]) {
      const character = await db.characters.get(id);
      if (!character) return;
      character.inventory = JSON.parse(JSON.stringify(inventory ?? []));
      syncAttunedItems(character);
      await this.updateCharacter(character);
    },

    async addCharacterItem(id: string, item: Item) {
      const character = await db.characters.get(id);
      if (!character) return;
      const nextItem = JSON.parse(JSON.stringify(item));
      nextItem.equipped = false;
      nextItem.attuned = false;
      character.inventory = [...(character.inventory ?? []), nextItem];
      await this.updateCharacter(character);
    },

    async removeCharacterItemAt(id: string, index: number) {
      const character = await db.characters.get(id);
      if (!character) return;
      if (!Number.isInteger(index) || index < 0 || index >= (character.inventory?.length ?? 0)) {
        return;
      }
      character.inventory = character.inventory.filter((_, itemIndex) => itemIndex !== index);
      syncAttunedItems(character);
      await this.updateCharacter(character);
    },

    async toggleCharacterItemEquipped(id: string, index: number) {
      const character = await db.characters.get(id);
      if (!character) return;
      const item = character.inventory?.[index];
      if (!item) return;
      item.equipped = !item.equipped;
      await this.updateCharacter(character);
    },

    async toggleCharacterItemAttuned(id: string, index: number) {
      const character = await db.characters.get(id);
      if (!character) return;
      const item = character.inventory?.[index];
      if (!item || item.reqAttune === undefined || item.reqAttune === false) return;
      item.attuned = !item.attuned;
      syncAttunedItems(character);
      await this.updateCharacter(character);
    },

    async addCharacterFeat(id: string, feat: Feat) {
      const character = await db.characters.get(id);
      if (!character) return;
      const hasFeat = character.feats.some(
        existing => existing.name === feat.name && existing.source === feat.source
      );
      if (hasFeat) return;
      character.feats = [...character.feats, feat];
      await this.updateCharacter(character);
    },

    async removeCharacterFeat(id: string, featName: string, featSource?: string) {
      const character = await db.characters.get(id);
      if (!character) return;
      character.feats = character.feats.filter(
        feat =>
          !(feat.name === featName && (featSource === undefined || feat.source === featSource))
      );
      await this.updateCharacter(character);
    },

    async takeShortRest(id: string, healing = 0) {
      const character = await db.characters.get(id);
      if (!character) return;
      const recoveredHp = Number.isFinite(healing) ? Math.max(0, Math.floor(healing)) : 0;
      if (recoveredHp > 0) {
        character.currHp = Math.min(character.currHp + recoveredHp, character.maxHp);
      }
      if (character.currHp > 0) {
        character.deathSaves = undefined;
      }
      await this.updateCharacter(character);
    },

    async takeLongRest(id: string) {
      const character = await db.characters.get(id);
      if (!character) return;

      const computedSpellcasting = computeCharSpellcasting(character);
      const resetSlots: Record<number, { max: number; used: number }> = {};
      for (const [lvlStr, slot] of Object.entries(computedSpellcasting.spellSlots)) {
        resetSlots[Number(lvlStr)] = { max: slot.max, used: 0 };
      }

      character.currHp = character.maxHp;
      character.tempHp = 0;
      character.deathSaves = undefined;
      character.spellcasting = {
        ...character.spellcasting,
        spellSlots: resetSlots,
      };

      await this.updateCharacter(character);
    },

    updateCharacterRace(newRace: Race) {
      if (this.currNewCharacter) {
        this.currNewCharacter.race = newRace;
        this.currNewCharacter.subrace = null;
      }
    },

    updateCharacterSubrace(subrace: Subrace | null) {
      if (this.currNewCharacter) {
        this.currNewCharacter.subrace = subrace;
      }
    },

    updateCharacterBackground(newBackground: Background) {
      if (this.currNewCharacter) {
        this.currNewCharacter.background = newBackground;
      }
    },

    updateCharacterClasses(newClass: CharClass) {
      if (this.currNewCharacter) {
        const resetClassLevels = Object.fromEntries(
          Object.keys(this.currNewCharacter.classLevels).map(className => [className, 0])
        ) as ClassLevels;

        resetClassLevels[newClass.name.toLowerCase() as keyof ClassLevels] = 1;
        this.currNewCharacter.classes = [newClass];
        this.currNewCharacter.classLevels = resetClassLevels;
        this.currNewCharacter.subclasses = {};
      }
    },

    updateCharacterSubclasses(className: string, subclass: Subclass) {
      if (this.currNewCharacter) {
        this.currNewCharacter.subclasses = {
          ...(this.currNewCharacter.subclasses || {}),
          [className]: [subclass],
        };
      }
    },

    getCharLevel() {
      if (!this.currNewCharacter) return 0;
      return Object.values(this.currNewCharacter.classLevels).reduce((sum, lvl) => sum + lvl, 0);
    },

    getCharClasses() {
      if (!this.currNewCharacter) return [];
      return Object.entries(this.currNewCharacter.classLevels)
        .filter(([_, lvl]) => lvl > 0)
        .map(([className, lvl]) => ({ name: className, level: lvl }));
    },

    getCharFullClasses(): CharClass[] {
      return this.currNewCharacter?.classes || [];
    },

    isRogue() {
      if (!this.currNewCharacter) return false;
      return this.currNewCharacter.classes.some(c => c.name.toLowerCase() === 'rogue');
    },

    getRaceAbilityScoreIncreases() {
      if (!this.currNewCharacter || !this.currNewCharacter.race) return {};
      // return this.currNewCharacter.race.abilityScoreIncreases || {};
      return [];
    },

    setNewCharAbilityScores(abilityScores: AbilityScoreValues) {
      if (this.currNewCharacter) {
        this.currNewCharacter.abilityScores = abilityScores;
      }
    },

    getCharLanguages() {
      if (!this.currNewCharacter) return {};
      return this.currNewCharacter.languages || {};
    },

    updateCharacterLanguages(languages: Languages) {
      if (this.currNewCharacter) {
        this.currNewCharacter.languages = languages;
      }
    },

    getCharRace() {
      return this.currNewCharacter?.race || null;
    },

    getCharBackground() {
      return this.currNewCharacter?.background || null;
    },

    getCharFeats() {
      return this.currNewCharacter?.feats || [];
    },

    updateAllProficiencies(proficiencies: AllProficiencies) {
      if (this.currNewCharacter) {
        this.currNewCharacter.allProficiencies = proficiencies;
        // Also sync skillProficiencies for backwards compat
        this.currNewCharacter.skillProficiencies = proficiencies.skills;
      }
    },

    setCreationStartingLoadout(inventory: Item[], currency: Currency) {
      if (!this.currNewCharacter) return;
      this.currNewCharacter.inventory = inventory;
      this.currNewCharacter.currency = currency;
    },

    /**
     * Compute the spellcasting info for the current new character and return it.
     */
    getSpellcastingInfo(): SpellcastingInfo | null {
      if (!this.currNewCharacter) return null;
      return computeCharSpellcasting(this.currNewCharacter);
    },

    getStartingHp(character: playerCharacter): number {
      const hd = character.classes[0]?.hd;
      const hdValue = hd ? parseInt(hd.substring(1)) : 8; // Default to d8 if no class or hd found
      const conMod = calculateAbilityScoreModifier(
        character.abilityScores.con,
        character.proficiencyModifier,
        false,
        false
      );
      return hdValue + conMod;
    },

    //this can be positive or negative damage (eg healing)
    // it should never go above max hp or below 0
    async applyDamage(id: string, damage: number) {
      const character = await db.characters.get(id);
      if (!character) return;
      if (damage < 0) {
        // Healing: ignore tempHp, restore currHp without exceeding maxHp
        character.currHp = Math.min(character.currHp - damage, character.maxHp);
      } else {
        // Damage: drain tempHp first, then spill into currHp
        const tempHpDamage = Math.min(character.tempHp, damage);
        character.tempHp -= tempHpDamage;
        const remainingDamage = damage - tempHpDamage;
        character.currHp = Math.max(character.currHp - remainingDamage, 0);
      }
      await this.updateCharacter(character);
    },

    async updateAc(id: string, newAc: number) {
      //eventually this will have functionality to take in items and calculate from that
      //but for now it'll just be to manually set based on input

      //TODO: add functionality to update ac based on equipped items, similar to how hp is calculated from class and con mod
      const character = await db.characters.get(id);
      if (!character) return;
      character.ac = newAc;
      await this.updateCharacter(character);
    },

    async applyTempHp(id: string, tempHp: number) {
      const character = await db.characters.get(id);
      if (!character) return;
      character.tempHp = tempHp;
      await this.updateCharacter(character);
    },

    async toggleInspiration(id: string) {
      const character = await db.characters.get(id);
      if (!character) return;
      character.inspiration = !character.inspiration;
      await this.updateCharacter(character);
    },

    async updateDeathSaves(id: string, successes: number, failures: number) {
      const character = await db.characters.get(id);
      if (!character) return;
      character.deathSaves = { successes, failures };
      await this.updateCharacter(character);
    },

    async updateSpeed(id: string, newSpeed: CharSpeed) {
      const character = await db.characters.get(id);
      if (!character) return;
      character.speed = newSpeed;
      await this.updateCharacter(character);
    },

    async updateSkillProficiencies(id: string, newProficiencies: PlayerSkills) {
      const character = await db.characters.get(id);
      if (!character) return;
      character.skillProficiencies = newProficiencies;
      await this.updateCharacter(character);
    },

    async toggleSpellSlot(id: string, level: number, n: number, max: number) {
      const character = await db.characters.get(id);
      if (!character) return;
      const slots = { ...(character.spellcasting?.spellSlots ?? {}) };
      const currentUsed = slots[level]?.used ?? 0;
      const newUsed = n <= currentUsed ? n - 1 : n;
      slots[level] = { max, used: Math.max(0, Math.min(max, newUsed)) };
      character.spellcasting = { ...character.spellcasting, spellSlots: slots };
      await this.updateCharacter(character);
    },

    async resetSpellSlots(id: string, maxSlots: Record<number, number>) {
      const character = await db.characters.get(id);
      if (!character) return;
      const resetSlots: Record<number, { max: number; used: number }> = {};
      for (const [lvlStr, max] of Object.entries(maxSlots)) {
        resetSlots[Number(lvlStr)] = { max, used: 0 };
      }
      character.spellcasting = { ...character.spellcasting, spellSlots: resetSlots };
      await this.updateCharacter(character);
    },

    async touchUpCharacter(id: string) {
      // this function can be used at any time to recalculate and update any derived fields on the character, such as proficiency bonus or passive perception, based on their current state. This is useful to ensure all fields are up-to-date before saving or displaying the character.
      const character = await db.characters.get(id);
      if (!character) return;

      const normalizeCurrency = (currency?: Partial<Currency> | null): Currency => ({
        pp: Math.max(0, Math.floor(currency?.pp ?? 0)),
        gp: Math.max(0, Math.floor(currency?.gp ?? 0)),
        ep: 0,
        sp: Math.max(0, Math.floor(currency?.sp ?? 0)),
        cp: Math.max(0, Math.floor(currency?.cp ?? 0)),
      });

      const normalizeAdditionalCurrency = (
        additionalCurrency?: CurrencyWallet[] | Currency
      ): CurrencyWallet[] | undefined => {
        if (!additionalCurrency) return undefined;
        if (Array.isArray(additionalCurrency)) {
          return additionalCurrency.map((wallet, index) => ({
            id: wallet.id || uuidv4(),
            name: wallet.name?.trim() || `Wallet ${index + 1}`,
            currency: normalizeCurrency(wallet.currency),
          }));
        }

        return [
          {
            id: uuidv4(),
            name: 'Additional wallet',
            currency: normalizeCurrency(additionalCurrency),
          },
        ];
      };

      const slugify = (value: string): string =>
        value
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');

      const extractBackgroundEquipmentText = (entries: any[] | undefined): string[] => {
        if (!Array.isArray(entries)) return [];

        const results: string[] = [];

        const visit = (node: any) => {
          if (!node) return;
          if (Array.isArray(node)) {
            node.forEach(visit);
            return;
          }
          if (typeof node === 'string') return;
          if (typeof node !== 'object') return;

          if (node.type === 'item' && typeof node.name === 'string') {
            if (node.name.trim().toLowerCase() === 'equipment') {
              if (typeof node.entry === 'string') results.push(node.entry);
              if (Array.isArray(node.entries)) {
                node.entries.forEach((entry: any) => {
                  if (typeof entry === 'string') results.push(entry);
                });
              }
            }
            if (node.entry) visit(node.entry);
          }

          if (Array.isArray(node.items)) visit(node.items);
          if (Array.isArray(node.entries)) visit(node.entries);
        };

        visit(entries);
        return results;
      };

      const parseCurrencyFromText = (text: string): Currency => {
        const parsed = normalizeCurrency();
        const matches = text.matchAll(/(?<!worth\s)(\d+)\s*(pp|gp|sp|cp)\b/gi);
        for (const match of matches) {
          const amount = Number.parseInt(match[1] ?? '0', 10);
          const coinType = (match[2] ?? '').toLowerCase() as keyof Currency;
          if (!Number.isFinite(amount) || amount <= 0) continue;
          if (coinType === 'pp' || coinType === 'gp' || coinType === 'sp' || coinType === 'cp') {
            parsed[coinType] += amount;
          }
        }
        parsed.ep = 0;
        return parsed;
      };

      const hasCurrency = (currency: Currency): boolean =>
        currency.pp > 0 || currency.gp > 0 || currency.sp > 0 || currency.cp > 0;

      const syncBackgroundCurrencyWallet = (
        wallets: CurrencyWallet[] | undefined,
        background: Background | null | undefined
      ): CurrencyWallet[] | undefined => {
        const normalizedWallets = [...(wallets ?? [])];
        const backgroundName = background?.name?.trim();
        if (!backgroundName) return normalizedWallets.length > 0 ? normalizedWallets : undefined;

        const walletId = `background-${slugify(backgroundName)}-wallet`;
        const equipmentTexts = extractBackgroundEquipmentText(background?.entries);
        const parsedCurrency = equipmentTexts.reduce((sum, text) => {
          const parsed = parseCurrencyFromText(text);
          sum.pp += parsed.pp;
          sum.gp += parsed.gp;
          sum.sp += parsed.sp;
          sum.cp += parsed.cp;
          return sum;
        }, normalizeCurrency());

        const existingIndex = normalizedWallets.findIndex(wallet => wallet.id === walletId);

        if (!hasCurrency(parsedCurrency)) {
          if (existingIndex !== -1) normalizedWallets.splice(existingIndex, 1);
          return normalizedWallets.length > 0 ? normalizedWallets : undefined;
        }

        const backgroundWallet: CurrencyWallet = {
          id: walletId,
          name: `${backgroundName} funds`,
          currency: parsedCurrency,
        };

        if (existingIndex === -1) {
          normalizedWallets.push(backgroundWallet);
        } else {
          normalizedWallets[existingIndex] = {
            id: normalizedWallets[existingIndex]?.id || backgroundWallet.id,
            name: backgroundWallet.name,
            currency: backgroundWallet.currency,
          };
        }

        return normalizedWallets;
      };

      // Recalculate proficiency bonus based on level
      const level = Object.values(character.classLevels).reduce((sum, lvl) => sum + lvl, 0);
      const proficiencyModifier = calculateProficiencyBonus(level);
      const wisMod = Math.floor((character.abilityScores.wis - 10) / 2);
      const passivePerception = calculatePassivePerception(
        wisMod,
        proficiencyModifier,
        character.skillProficiencies.perception.proficient,
        character.skillProficiencies.perception.expertise
      );
      const maxHp = character.maxHp !== 0 ? character.maxHp : this.getStartingHp(character);
      const ac =
        10 +
        calculateAbilityScoreModifier(
          character.abilityScores.dex,
          character.proficiencyModifier,
          false,
          false
        );
      const tempHp = character.tempHp || 0;
      const hitDice: HitDice[] = [];
      character.classes.forEach(charClass => {
        if (charClass.hd) {
          const dieType = charClass.hd.substring(1) as keyof DiceTypes;
          const classLevel =
            character.classLevels[charClass.name.toLowerCase() as keyof ClassLevels];
          const current = classLevel; // Assuming all hit dice are available at the start of the day
          hitDice.push({ total: classLevel, current: current, dieType: dieType });
        }
      });
      const resolveSpeed = (
        rawSpeed:
          | number
          | { walk?: number; fly?: number; swim?: number; climb?: number; burrow?: number }
          | undefined
      ): Partial<CharSpeed> => {
        if (rawSpeed === undefined) return {};
        if (typeof rawSpeed === 'number') return { base: rawSpeed };
        return {
          ...(rawSpeed.walk !== undefined ? { base: rawSpeed.walk } : {}),
          ...(rawSpeed.fly !== undefined ? { fly: rawSpeed.fly } : {}),
          ...(rawSpeed.swim !== undefined ? { swim: rawSpeed.swim } : {}),
          ...(rawSpeed.climb !== undefined ? { climb: rawSpeed.climb } : {}),
          ...(rawSpeed.burrow !== undefined ? { burrow: rawSpeed.burrow } : {}),
        };
      };
      let speed: CharSpeed = { base: 30, ...resolveSpeed(character.race?.speed) };
      if (character.subrace?.speed !== undefined) {
        speed = { ...speed, ...resolveSpeed(character.subrace.speed) };
      }
      const initiativeBonus =
        character.initiativeBonus > 0
          ? character.initiativeBonus
          : calculateAbilityScoreModifier(character.abilityScores.dex, 0, false, false);
      character.level = level;
      character.proficiencyModifier = proficiencyModifier;
      character.passivePerception = passivePerception;
      character.maxHp = maxHp;
      character.currHp = maxHp;
      character.ac = ac;
      character.tempHp = tempHp;
      character.hitDice = hitDice;
      character.speed = speed;
      character.initiativeBonus = initiativeBonus;
      character.currency = normalizeCurrency(character.currency);
      character.additionalCurrency = syncBackgroundCurrencyWallet(
        normalizeAdditionalCurrency(character.additionalCurrency),
        character.background
      );
      // After updating derived fields, save the character to the database
      await this.updateCharacter(character);
    },
  },
});
