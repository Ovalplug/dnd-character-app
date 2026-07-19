import { defineStore } from 'pinia';
import type { Backpack, CustomItem } from '../types';
import {
  addBackpack,
  getAllBackpacks,
  getBackpack,
  deleteBackpack,
  addCustomItem,
  getAllCustomItems,
  getCustomItem,
  deleteCustomItem,
  updateCustomItem,
} from '../database/db';

export const useItemStore = defineStore('items', {
  state: () => ({
    loaded: false,
    backpacks: [] as Backpack[],
    customItems: [] as CustomItem[],
  }),
  actions: {
    async loadBackpacks() {
      this.loaded = false;
      const backpacks = await getAllBackpacks();
      this.backpacks = backpacks;
      this.loaded = true;
    },
    async loadCustomItems() {
      const items = await getAllCustomItems();
      this.customItems = items;
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
    async addCustomItem(item: CustomItem) {
      const clonedItem = structuredClone(JSON.parse(JSON.stringify(item)));
      await addCustomItem(clonedItem);
      await this.loadCustomItems();
    },
    async updateCustomItem(item: CustomItem) {
      const clonedItem = structuredClone(JSON.parse(JSON.stringify(item)));
      clonedItem.updatedAt = Date.now();
      await updateCustomItem(clonedItem);
      await this.loadCustomItems();
    },
    async deleteCustomItem(id: string) {
      await deleteCustomItem(id);
      await this.loadCustomItems();
    },
    async getCustomItemById(id: string) {
      await this.loadCustomItems();
      const item = await getCustomItem(id);
      return item;
    },
  },
});
