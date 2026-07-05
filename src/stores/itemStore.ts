import { defineStore } from 'pinia';
import type { Backpack } from '../types';
import { addBackpack, getAllBackpacks, getBackpack, deleteBackpack } from '../database/db';

export const useItemStore = defineStore('items', {
  state: () => ({
    loaded: false,
    backpacks: [] as Backpack[],
  }),
  actions: {
    async loadBackpacks() {
      this.loaded = false;
      const backpacks = await getAllBackpacks();
      this.backpacks = backpacks;
      this.loaded = true;
    },
    async addBackpack(backpack: Backpack) {
      // Deep clone to ensure all data is serializable for IndexedDB
      const clonedBackpack = structuredClone(JSON.parse(JSON.stringify(backpack)));
      await addBackpack(clonedBackpack);
      await this.loadBackpacks();
    },
    async updateBackpack(backpack: Backpack) {
      // Deep clone to ensure all data is serializable for IndexedDB
      const clonedBackpack = structuredClone(JSON.parse(JSON.stringify(backpack)));
      clonedBackpack.updatedAt = Date.now();
      await addBackpack(clonedBackpack);
      await this.loadBackpacks();
    },
    async getBackpackById(id: string) {
      await this.loadBackpacks();
      const backpack = await getBackpack(id);
      return backpack;
    },
    async deleteBackpack(id: string) {
      await deleteBackpack(id);
      await this.loadBackpacks();
    },
  },
});
