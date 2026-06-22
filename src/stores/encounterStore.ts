import { defineStore } from 'pinia';
// import { v4 as uuidv4 } from 'uuid';
import { addEncounter, db } from '../database/db';

export const useEncounterStore = defineStore('encounter', {
  state: () => ({
    loaded: false,
    encounters: [] as any[],
  }),
  actions: {
    async loadEncounters() {
      if (this.loaded) return;
      const encounters = await db.encounters.toArray();
      this.encounters = encounters;
      this.loaded = true;
    },
    async addEncounter(encounter: any) {
        await addEncounter(encounter);
        await this.loadEncounters(); // Refresh the list after adding
    }
  },
});
