import { defineStore } from 'pinia';
import { v4 as uuidv4 } from 'uuid';
import { db, type Character } from '../database/db';

export const useCharacterStore = defineStore('characters', {
  state: () => ({
    characters: [] as Character[],
    loaded: false,
  }),

  actions: {
    async loadCharacters() {
      this.characters = await db.characters.toArray();
      this.loaded = true;
    },

    async createCharacter(charName: string) {
      const newChar: Character = {
        id: uuidv4(),
        name: charName,
        level: 1,
        inventory: [],
        resources: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await db.characters.add(newChar);
      this.characters.push(newChar);

      return newChar.id;
    },

    async updateCharacter(character: Character) {
      character.updatedAt = Date.now();
      await db.characters.put(character);
    },

    async deleteCharacter(id: string) {
      await db.characters.delete(id);
      this.characters = this.characters.filter(c => c.id !== id);
    },
  },
});
