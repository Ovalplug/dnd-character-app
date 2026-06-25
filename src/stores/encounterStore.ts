import { defineStore } from 'pinia';
// import { v4 as uuidv4 } from 'uuid';
import {
  addEncounter,
  deleteEncounter,
  getAllEncounters,
  getEncounter,
  updateEncounter,
} from '../database/db';
import type { EncounterCreature, Monster } from '../types';

export const useEncounterStore = defineStore('encounter', {
  state: () => ({
    loaded: false,
    encounters: [] as any[],
  }),
  actions: {
    async loadEncounters() {
      this.loaded = false;
      const encounters = await getAllEncounters();
      this.encounters = encounters;
      this.loaded = true;
    },
    async updateThisEncounter(encounter: any) {
      await updateEncounter(encounter);
    },
    async addEncounter(encounter: any) {
      await addEncounter(encounter);
      await this.loadEncounters(); // Refresh the list after adding
    },
    async deleteEncounter(id: string) {
      await deleteEncounter(id);
      await this.loadEncounters(); // Refresh the list after deleting
    },
    async getEncounterById(id: string) {
      const encounter = await getEncounter(id);
      return encounter;
    },
    async addMonsterToEncounter(encounterId: string, monster: Monster, howMany: number) {
      const encounter = await getEncounter(encounterId);
      if (encounter) {
        for (let i = 0; i < howMany; i++) {
          const monsterHp =
            typeof monster.hp === 'number'
              ? monster.hp
              : typeof monster.hp === 'object' && monster.hp.average
              ? monster.hp.average
              : 0;
          const encounterMonster: EncounterCreature = {
            ...structuredClone(JSON.parse(JSON.stringify(monster))),
            initiative: 0,
            currentHp: monsterHp,
            maxHp: monsterHp,
            conditions: [],
            tempHp: 0,
            useName: howMany > 1 ? `${monster.name} ${i + 1}` : monster.name, //only do this if howMany > 1, otherwise just use monster.name
          };
          encounter.monsters.push(encounterMonster);
        }

        await updateEncounter(encounter);
        await this.loadEncounters();
      }
    },
  },
});
