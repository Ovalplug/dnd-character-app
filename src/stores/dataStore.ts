import { defineStore } from 'pinia';

let datasets: any[] = [];
export let allData: any[] = [];

function aggregate(key: string) {
  return datasets.flatMap((src: any) => src[key] ?? []);
}

function aggregateSubclasses(datasets: any[]) {
  const artificerSubs: any[] = [];
  const barbarianSubs: any[] = [];
  const bardSubs: any[] = [];
  const clericSubs: any[] = [];
  const druidSubs: any[] = [];
  const fighterSubs: any[] = [];
  const monkSubs: any[] = [];
  const paladinSubs: any[] = [];
  const rangerSubs: any[] = [];
  const rogueSubs: any[] = [];
  const sorcererSubs: any[] = [];
  const warlockSubs: any[] = [];
  const wizardSubs: any[] = [];
  datasets.forEach(data => {
    if (data.subclasses && Array.isArray(data.subclasses) && data.subclasses.length > 0) {
      data.subclasses.forEach((sub: any) => {
        switch (sub.name) {
          case 'Artificer':
            sub.subclasses.forEach((innersub: any) => {
              artificerSubs.push(innersub);
            });
            break;
          case 'Barbarian':
            sub.subclasses.forEach((innersub: any) => {
              barbarianSubs.push(innersub);
            });
            break;
          case 'Bard':
            sub.subclasses.forEach((innersub: any) => {
              bardSubs.push(innersub);
            });
            break;
          case 'Cleric':
            sub.subclasses.forEach((innersub: any) => {
              clericSubs.push(innersub);
            });
            break;
          case 'Druid':
            sub.subclasses.forEach((innersub: any) => {
              druidSubs.push(innersub);
            });
            break;
          case 'Fighter':
            sub.subclasses.forEach((innersub: any) => {
              fighterSubs.push(innersub);
            });
            break;
          case 'Monk':
            sub.subclasses.forEach((innersub: any) => {
              monkSubs.push(innersub);
            });
            break;
          case 'Paladin':
            sub.subclasses.forEach((innersub: any) => {
              paladinSubs.push(innersub);
            });
            break;
          case 'Ranger':
            sub.subclasses.forEach((innersub: any) => {
              rangerSubs.push(innersub);
            });
            break;
          case 'Rogue':
            sub.subclasses.forEach((innersub: any) => {
              rogueSubs.push(innersub);
            });
            break;
          case 'Sorcerer':
            sub.subclasses.forEach((innersub: any) => {
              sorcererSubs.push(innersub);
            });
            break;
          case 'Warlock':
            sub.subclasses.forEach((innersub: any) => {
              warlockSubs.push(innersub);
            });
            break;
          case 'Wizard':
            sub.subclasses.forEach((innersub: any) => {
              wizardSubs.push(innersub);
            });
            break;
          default:
            console.warn(`Unknown className '${sub.className}' in subclass '${sub.name}'`);
        }
      });
    }
  });
  return {
    Artificer: artificerSubs,
    Barbarian: barbarianSubs,
    Bard: bardSubs,
    Cleric: clericSubs,
    Druid: druidSubs,
    Fighter: fighterSubs,
    Monk: monkSubs,
    Paladin: paladinSubs,
    Ranger: rangerSubs,
    Rogue: rogueSubs,
    Sorcerer: sorcererSubs,
    Warlock: warlockSubs,
    Wizard: wizardSubs,
  };
}

function aggregateSpells(datasets: any[]) {
  const spells: any[] = [];
  datasets.forEach(data => {
    if (data.spells && Array.isArray(data.spells) && data.spells.length > 0) {
      data.spells.forEach((spell: any) => {
        spells.push(spell);
      });
    }
  });
  return spells;
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
    subclasses: {} as Record<string, any[]>,
    eInvocations: [] as any[],
    aInfusions: [] as any[],
    spells: [] as any[],
  }),

  actions: {
    async init() {
      // Load heavy JSON files from public/ at runtime so they are not bundled
      const [official, ua, spells] = await Promise.all([
        fetch('/data/char-official.json').then(r => {
          if (!r.ok) throw new Error('Failed to fetch char-official.json');
          return r.json();
        }),
        fetch('/data/char-ua.json').then(r => {
          if (!r.ok) throw new Error('Failed to fetch char-ua.json');
          return r.json();
        }),
        fetch('/data/spells-full.json').then(r => {
          if (!r.ok) throw new Error('Failed to fetch spells-full.json');
          return r.json();
        }),
      ]);

      const [officialData, uaData, spellsData] = [official, ua, spells];
      datasets = [...officialData, ...uaData];
      allData = datasets;

      this.rawDatasets = datasets;
      this.feats = aggregate('feats');
      this.races = aggregate('races');
      this.backgrounds = aggregate('backgrounds');
      this.backgroundFluff = aggregate('backgroundFluff');
      this.raceFluff = aggregate('raceFluff');
      this.classes = aggregate('classes');
      this.eInvocations = aggregate('eInvocations');
      this.aInfusions = aggregate('aInfusions');
      this.subclasses = aggregateSubclasses(allData);
      this.spells = aggregateSpells(spellsData);
      this.loaded = true;
    },

    reload() {
      this.loaded = false;
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
