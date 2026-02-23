import { defineStore } from 'pinia';

let datasets: any[] = [];
export let allData: any[] = [];

function aggregate(key: string) {
  return datasets.flatMap((src: any) => src[key] ?? []);
}

function aggregateSubclasses() {
  const raw = datasets.flatMap((src: any) => src.subclasses ?? []);
  // Some sources provide grouped subclasses like { name: 'Artificer', subclasses: [...] }
  return raw.flatMap((entry: any) =>
    Array.isArray(entry.subclasses) ? entry.subclasses : [entry]
  );
}

export const useDataStore = defineStore('data', {
  state: () => ({
    loaded: false as boolean,
    rawDatasets: datasets as any[],
    sources: allData as any[],
    feats: [] as any[],
    races: [] as any[],
    backgrounds: [] as any[],
    backgroundFluff: [] as any[],
    raceFluff: [] as any[],
    classes: [] as any[],
    subclasses: [] as any[],
    eInvocations: [] as any[],
    aInfusions: [] as any[],
  }),

  actions: {
    async init() {
      // Load heavy JSON files from public/ at runtime so they are not bundled
      const [official, ua] = await Promise.all([
        fetch('/data/char-official.json').then(r => {
          if (!r.ok) throw new Error('Failed to fetch char-official.json');
          return r.json();
        }),
        fetch('/data/char-ua.json').then(r => {
          if (!r.ok) throw new Error('Failed to fetch char-ua.json');
          return r.json();
        }),
      ]);

      datasets = [official, ua];
      allData = datasets.flat();

      this.rawDatasets = datasets;
      this.feats = aggregate('feats');
      this.races = aggregate('races');
      this.backgrounds = aggregate('backgrounds');
      this.backgroundFluff = aggregate('backgroundFluff');
      this.raceFluff = aggregate('raceFluff');
      this.classes = aggregate('classes');
      this.eInvocations = aggregate('eInvocations');
      this.aInfusions = aggregate('aInfusions');
      this.subclasses = aggregateSubclasses();
      this.loaded = true;
    },

    reload() {
      return this.init();
    },

    // Small helpers
    findFeat(name: string) {
      return this.feats.find((f: any) => f.name === name || f.displayName === name);
    },

    findRace(name: string) {
      return this.races.find((r: any) => r.name === name);
    },
  },
});
