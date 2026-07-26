<template>
  <ul class="resource-list">
    <div
      v-for="race in races"
      :key="race.name"
      @click="selectRace(race)"
      class="rl-item"
      tabindex="0"
      @keydown.enter="selectRace(race)"
      role="button"
    >
      <div class="rl-item__body">
        <span class="rl-item__name">{{ race.name }}</span>
        <div class="rl-item__tags">
          <span v-if="race.source" class="rl-tag rl-tag--source">{{ race.source }}</span>
          <span v-if="getRaceSpeed(race)" class="rl-tag">{{ getRaceSpeed(race) }} ft.</span>
          <span v-if="race.ability" class="rl-tag rl-tag--primary">{{ getRaceAbilitySummary(race) }}</span>
          <span v-if="race.subraces?.length" class="rl-tag rl-tag--accent">{{ race.subraces.length }} subrace{{ race.subraces.length > 1 ? 's' : '' }}</span>
        </div>
      </div>
    </div>
  </ul>
  <PopOut :title="raceTitle" v-if="selectedRace" :onClose="deselectRace">
    <div v-if="debug">
      <pre>{{ JSON.stringify(selectedRace, null, 2) }}</pre>
    </div>
    <div>
      <SingleRace :race="selectedRace" :fluff="selectedFluff" />
    </div>
  </PopOut>
</template>

<script lang="ts" setup>
  import type { Race, RaceFluff } from '../../types';
  import PopOut from '../PopOut.vue';
  import { computed, onMounted, ref } from 'vue';
  import { useDebug } from '../../composables/useDebug';
  import { useDataStore } from '../../stores/dataStore';
  import SingleRace from './SingleRace.vue';

  const { debug, initDebug } = useDebug();
  const dataStore = useDataStore();

  const { races, raceFluff } = defineProps<{ races: Race[]; raceFluff: RaceFluff[] }>();
  races.sort((a, b) => a.name.localeCompare(b.name));
  const selectedRace = ref<Race | null>(null);
  const selectedFluff = ref<RaceFluff | undefined>(undefined);

  const raceTitle = computed(() => {
    return selectedRace.value ? selectedRace.value.name : '';
  });

  function selectRace(race: Race) {
    selectedRace.value = race;
    selectedFluff.value = raceFluff.find(fluff => fluff.name === race.name);
  }

  function deselectRace() {
    selectedRace.value = null;
    selectedFluff.value = undefined;
  }

  function getRaceSpeed(race: Race): number | null {
    if (typeof race.speed === 'number') return race.speed;
    if (typeof race.speed === 'object' && race.speed !== null) {
      return (race.speed as any).walk ?? null;
    }
    return null;
  }

  const ALL_SIX = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

  function abilityAbbr(score: string): string {
    return score.toUpperCase().slice(0, 3);
  }

  function isChooseFromAny(from: any): boolean {
    if (from === 'asi') return true;
    if (!Array.isArray(from)) return false;
    return from.length >= 6 && ALL_SIX.every(s => from.includes(s));
  }

  function getRaceAbilitySummary(race: Race): string {
    if (!race.ability) return '';
    const arr: any[] = Array.isArray(race.ability) ? race.ability : [race.ability];

    const parts: string[] = [];
    let hasAnyChoice = false;

    for (const entry of arr) {
      if (entry.choose) {
        const { from, count = 1, amount = 1 } = entry.choose;
        if (isChooseFromAny(from)) {
          hasAnyChoice = true;
          parts.push(count > 1 ? `+${amount} \xd7${count}` : `+${amount}`);
        } else {
          const fromArr: string[] = Array.isArray(from) ? from : [from];
          const abbrs = fromArr.map(abilityAbbr).join('/');
          parts.push(count > 1 ? `+${amount} \xd7${count} (${abbrs})` : `+${amount} (${abbrs})`);
        }
      } else {
        // Fixed bonuses
        Object.entries(entry)
          .filter(([, v]) => typeof v === 'number' && (v as number) !== 0)
          .forEach(([k, v]) => {
            parts.push(`${(v as number) > 0 ? '+' : ''}${v} ${abilityAbbr(k)}`);
          });
      }
    }

    const base = parts.join(', ');
    return hasAnyChoice ? `${base}, any (max +2 each)` : base;
  }

  onMounted(async () => {
    await initDebug();
    if (!dataStore.loaded) {
      try {
        await dataStore.init();
      } catch (err) {
        // keep this simple; devs can improve error handling/UI later
        // eslint-disable-next-line no-console
        console.error('Failed to load data store', err);
      }
    }
  });
</script>

<style scoped>
  .resource-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .race-item {
    cursor: pointer;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid rgba(107, 46, 46, 0.12);
    min-height: 44px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    transition: background 0.14s;
  }

  .race-item:hover,
  .race-item:focus-visible {
    background: var(--color-surface);
    outline: none;
  }

  .race-item p {
    margin: 0;
    font-size: 0.95rem;
  }
</style>
