import Dexie from 'dexie';
import type { Table } from 'dexie';

export interface Character {
  id: string;
  name: string;
  level: number;
  class?: string;
  race?: string;
  background?: string;
  abilities?: Record<string, number>;
  inventory: any[];
  resources: any[];
  notes?: string;
  portraitPath?: string;
  createdAt: number;
  updatedAt: number;
}

export class DndDatabase extends Dexie {
  characters!: Table<Character>;
  settings!: Table<Setting, string>;

  constructor() {
    super('DndDatabase');

    this.version(1).stores({
      characters: 'id, name, level, class, race, updatedAt',
    });

    // Add a key/value settings store in a new DB version so existing DBs migrate safely.
    this.version(2).stores({
      settings: 'key',
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
