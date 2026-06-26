import { defineStore } from 'pinia';
import { type SpellBook } from '../types';
import { addSpellBook, getAllSpellBooks, getSpellBook, deleteSpellBook } from '../database/db';

export const useSpellBookStore = defineStore('spellbook', {
  state: () => ({
    loaded: false,
    spellbooks: [] as SpellBook[],
  }),
  actions: {
    async loadSpellbooks() {
      this.loaded = false;
      const spellbooks = await getAllSpellBooks();
      this.spellbooks = spellbooks;
      this.loaded = true;
    },
    async addSpellbook(spellbook: SpellBook) {
      await addSpellBook(spellbook);
      await this.loadSpellbooks(); // Refresh the list after adding
    },
    async getSpellbookById(id: string) {
      await this.loadSpellbooks(); // Ensure spellbooks are loaded
      const spellbook = await getSpellBook(id); // Fetch the spellbook from the database
      return spellbook;
    },
    async deleteSpellbook(id: string) {
      await deleteSpellBook(id);
      await this.loadSpellbooks(); // Refresh the list after deleting
    },
  },
});
