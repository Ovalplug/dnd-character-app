import { defineStore } from 'pinia';
import { getSetting, setSetting } from '../database/db';
import type {
  ActionRules,
  Boon,
  ConditionsRules,
  Diseases,
  Feat,
  Hazard,
  Item,
  Items,
  Monster,
  MonsterFluff,
  PlayerOptions,
  Rules,
  Trap,
} from '../types';

let datasets: any[] = [];
export let allData: any[] = [];

function aggregate<T>(key: string): T[] {
  return datasets.flatMap((src: any) => src[key] ?? []) as T[];
}

function aggregateClasses(datasets: any[]) {
  return datasets.flatMap((data: any) => {
    if (data.classes && Array.isArray(data.classes)) {
      return data.classes.map((cls: any) => {
        // Determine subclassAtLvl
        const subclassAtLvl = ['Cleric', 'Sorcerer', 'Warlock'].includes(cls.name) ? 1 : 3;
        return { ...cls, subclassAtLvl };
      });
    }
    return [];
  });
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
        // Ignore spells whose source contains a number
        const source = spell.source || spell.cource;
        if (typeof source === 'string' && !/\d/.test(source)) {
          spells.push(spell);
        }
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
    feats: [] as Feat[],
    races: [] as any[],
    backgrounds: [] as any[],
    backgroundFluff: [] as any[],
    raceFluff: [] as any[],
    classes: [] as any[],
    subclasses: {} as Record<string, any[]>,
    eInvocations: [] as any[],
    aInfusions: [] as any[],
    items: [] as Items,
    spells: [] as any[],
    // Record<acronym, boolean>; absence or true = enabled, false = disabled
    enabledSources: {} as Record<string, boolean>,
    monsters: [] as Monster[],
    monsterFluff: [] as MonsterFluff[],
    conditions: [] as ConditionsRules[],
    playerOptions: [] as PlayerOptions[],
    actionRules: [] as ActionRules[],
    traps: [] as Trap[],
    diseases: [] as Diseases[],
    boons: [] as Boon[],
    hazards: [] as Hazard[],
    rules: [] as Rules[],
  }),

  getters: {
    allSources(state): Array<{ name: string; acronym: string; edition: string }> {
      const seen = new Set<string>();
      return state.rawDatasets
        .filter((d: any) => d.acronym && !seen.has(d.acronym) && !!seen.add(d.acronym))
        .map((d: any) => ({ name: d.name, acronym: d.acronym, edition: d._edition ?? 'unknown' }))
        .sort((a, b) => a.name.localeCompare(b.name));
    },
    filteredFeats(state): Feat[] {
      return state.feats.filter(feat => state.enabledSources[feat.source ?? ''] !== false);
    },
    filteredRaces(state): any[] {
      return state.races.filter((r: any) => state.enabledSources[r.source] !== false);
    },
    filteredBackgrounds(state): any[] {
      return state.backgrounds.filter((b: any) => state.enabledSources[b.source] !== false);
    },
    filteredClasses(state): any[] {
      return state.classes.filter((c: any) => state.enabledSources[c.source] !== false);
    },
    filteredSubclasses(state): Record<string, any[]> {
      const result: Record<string, any[]> = {};
      for (const [cls, subs] of Object.entries(state.subclasses)) {
        result[cls] = (subs as any[]).filter((s: any) => state.enabledSources[s.source] !== false);
      }
      return result;
    },
    filteredEInvocations(state): any[] {
      return state.eInvocations.filter((i: any) => state.enabledSources[i.source] !== false);
    },
    filteredAInfusions(state): any[] {
      return state.aInfusions.filter((i: any) => state.enabledSources[i.source] !== false);
    },
    filteredItems(state): Item[] {
      return state.items.filter(item => state.enabledSources[item.source] !== false);
    },
    filteredSpells(state): any[] {
      return state.spells.filter((s: any) => state.enabledSources[s.source] !== false);
    },
  },

  actions: {
    async init() {
      // Load the manifest to discover all editions and their files dynamically
      const manifest: Record<string, string[]> = await fetch('/data/manifest.json').then(r => {
        if (!r.ok) throw new Error('Failed to fetch data/manifest.json');
        return r.json();
      });

      // Fetch every file listed across all editions in parallel, tagging each dataset with its edition
      const fetchTasks = Object.entries(manifest).flatMap(([edition, files]) =>
        files.map(file =>
          fetch(`/data/${edition}/${file}`).then(r => {
            if (!r.ok) throw new Error(`Failed to fetch ${edition}/${file}`);
            return r
              .json()
              .then((data: any[]) => data.map((d: any) => ({ ...d, _edition: edition })));
          })
        )
      );

      const results = await Promise.all(fetchTasks);

      // All source files share the same shape (array of source objects), so merge them all
      datasets = results.flat();
      allData = datasets;

      this.rawDatasets = datasets;
      this.feats = aggregate<Feat>('feats');
      this.races = aggregate('races');
      this.backgrounds = aggregate('backgrounds');
      this.backgroundFluff = aggregate('backgroundFluff');
      this.raceFluff = aggregate('raceFluff');
      this.classes = aggregateClasses(datasets);
      this.eInvocations = aggregate('eInvocations');
      this.aInfusions = aggregate('aInfusions');
      this.items = aggregate<Item>('items');
      this.subclasses = aggregateSubclasses(allData);
      this.spells = aggregateSpells(datasets);
      this.monsters = aggregate<Monster>('monster');
      this.monsterFluff = aggregate<MonsterFluff>('monsterFluff');
      this.conditions = aggregate<ConditionsRules>('cond');
      this.playerOptions = aggregate<PlayerOptions>('play');
      this.actionRules = aggregate<ActionRules>('acti');
      this.traps = aggregate<Trap>('trap');
      this.diseases = aggregate<Diseases>('dise');
      this.boons = aggregate<Boon>('boon');
      this.hazards = aggregate<Hazard>('haza');
      this.rules = aggregate<Rules>('rule');
      await this.loadSourceSettings();
      this.loaded = true;
    },

    async loadSourceSettings() {
      const saved = await getSetting<Record<string, boolean>>('enabledSources');
      if (saved) this.enabledSources = saved;
    },

    toggleSource(acronym: string) {
      const current = this.enabledSources[acronym] !== false;
      this.enabledSources[acronym] = !current;
      setSetting('enabledSources', { ...this.enabledSources });
    },

    enableAllSources() {
      for (const key of Object.keys(this.enabledSources)) {
        this.enabledSources[key] = true;
      }
      setSetting('enabledSources', { ...this.enabledSources });
    },

    disableAllSources() {
      for (const src of this.allSources) {
        this.enabledSources[src.acronym] = false;
      }
      setSetting('enabledSources', { ...this.enabledSources });
    },

    toggleEdition(edition: string) {
      const sources = this.allSources.filter(s => s.edition === edition);
      const allOn = sources.every(s => this.enabledSources[s.acronym] !== false);
      for (const src of sources) {
        this.enabledSources[src.acronym] = !allOn;
      }
      setSetting('enabledSources', { ...this.enabledSources });
    },

    reload() {
      this.loaded = false;
      return this.init();
    },

    // Small helpers
    findFeat(name: string): Feat | undefined {
      return this.feats.find(feat => feat.name === name || feat.displayName === name);
    },

    findRace(name: string) {
      return this.races.find((r: any) => r.name === name);
    },

    findItem(name: string) {
      return this.items.find(item => item.name === name || item.displayName === name);
    },
  },
});
