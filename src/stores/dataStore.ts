import { defineStore } from 'pinia';
import charOfficial from './char-official.json';
import charUA from './char-ua.json';

const datasets = [charOfficial, charUA] as any[];
export const allData = datasets.flat();

export const useDataStore = defineStore('data', {
  state: () => ({
    loaded: false,
  }),

  actions: {},
});
