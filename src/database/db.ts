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

  constructor() {
    super('DndDatabase');

    this.version(1).stores({
      characters: 'id, name, level, class, race, updatedAt',
    });
  }
}

export const db = new DndDatabase();
