import Dexie from 'dexie';
import type { Table } from 'dexie';
import type { EncounterCreature, playerCharacter, SpellBook } from '../types';

export type Character = playerCharacter;

export type CharacterNoteSectionId =
  | 'characterDescription'
  | 'campaignNotes'
  | 'backstory'
  | 'alliesAndOrganizations';

export interface CharacterNoteEntry {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

export interface CharacterNoteSection {
  id: CharacterNoteSectionId;
  entries: CharacterNoteEntry[];
}

export interface CharacterNotesRecord {
  characterId: string;
  sections: CharacterNoteSection[];
  createdAt: number;
  updatedAt: number;
}

export interface Encounter {
  id: string;
  name: string;
  monsters: EncounterCreature[];
  players: Character[];
  createdAt: number;
  updatedAt: number;
}

export class DndDatabase extends Dexie {
  characters!: Table<Character>;
  settings!: Table<Setting, string>;
  notes!: Table<CharacterNotesRecord, string>;
  encounters!: Table<Encounter, string>;
  spellBooks!: Table<SpellBook, string>;

  constructor() {
    super('DndDatabase');

    this.version(1).stores({
      characters: 'id, name, level, updatedAt',
    });

    // Add a key/value settings store in a new DB version so existing DBs migrate safely.
    this.version(2).stores({
      settings: 'key',
    });

    this.version(3).stores({
      characters: 'id, name, level, updatedAt',
      settings: 'key',
      notes: 'characterId, updatedAt',
    });

    this.version(4).stores({
      characters: '&id, name, level, updatedAt',
      settings: 'key',
      notes: '&characterId, updatedAt',
      encounters: '&id, name, updatedAt',
    });

    this.version(5).stores({
      characters: '&id, name, level, updatedAt',
      settings: 'key',
      notes: '&characterId, updatedAt',
      encounters: '&id, name, updatedAt',
      spellBooks: '&id, name',
    });
  }
}

export const db = new DndDatabase();

// Simple key/value setting record
export interface Setting {
  key: string; // primary key
  value: any;
  updatedAt?: number;
}

/**
 * Get a stored setting by `key`. Returns `defaultValue` when missing.
 */
export async function getSetting<T = any>(key: string, defaultValue?: T): Promise<T | undefined> {
  const rec = await db.settings.get(key);
  return rec ? (rec.value as T) : defaultValue;
}

/**
 * Set a stored setting by `key`.
 */
export async function setSetting(key: string, value: any): Promise<void> {
  await db.settings.put({ key, value, updatedAt: Date.now() });
}

/**
 * Convenience helpers for a boolean `debug` flag persisted to the DB.
 */
export async function getDebugSetting(): Promise<boolean> {
  const v = await getSetting<boolean>('debug', false);
  return !!v;
}

export async function setDebugSetting(enabled: boolean): Promise<void> {
  await setSetting('debug', !!enabled);
}

export async function addEncounter(encounter: Encounter): Promise<void> {
  await db.encounters.put(encounter);
}

export async function getEncounter(id: string): Promise<Encounter | undefined> {
  return await db.encounters.get(id);
}

export async function deleteEncounter(id: string): Promise<void> {
  await db.encounters.delete(id);
}

export async function getAllEncounters(): Promise<Encounter[]> {
  return await db.encounters.toArray();
}

export async function updateEncounter(encounter: Encounter): Promise<void> {
  encounter.updatedAt = Date.now();

  console.log('Saving encounter:', encounter);

  try {
    structuredClone(encounter);
    console.log('Encounter is cloneable');
  } catch (err) {
    console.error('Not cloneable:', err);
  }

  await db.encounters.put(encounter);
}

export async function addSpellBook(spellBook: SpellBook): Promise<void> {
  await db.spellBooks.put(spellBook);
}

export async function getSpellBook(id: string): Promise<SpellBook | undefined> {
  return await db.spellBooks.get(id);
}

export async function deleteSpellBook(id: string): Promise<void> {
  await db.spellBooks.delete(id);
}

export async function getAllSpellBooks(): Promise<SpellBook[]> {
  return await db.spellBooks.toArray();
}

export async function updateSpellBook(spellBook: SpellBook): Promise<void> {
  await db.spellBooks.put(spellBook);
}
