<template>
  <div class="monster-container">
    <!-- The filter -->
    <div class="search-row">
      <input v-model="searchVal" type="search" placeholder="Search feats..." class="search-input" />
      <button
        class="filter-toggle"
        :class="{ 'filter-toggle--active': hasActiveFilters }"
        @click="showFilters = !showFilters"
      >
        Filters
        <span v-if="activeFilterCount > 0" class="filter-badge">{{ activeFilterCount }}</span>
      </button>
    </div>

    <div v-if="showFilters" class="filter-panel">
      <!-- orderby filter pills -->
      <div class="filter-footer">
        <div class="sort-group">
          <span class="filter-label">Sort By:</span>
          <button
            class="chip"
            :class="{ 'chip--on': orderBy === 'atoz' }"
            @click="orderBy = 'atoz'"
          >
            A → Z
          </button>
          <button
            class="chip"
            :class="{ 'chip--on': orderBy === 'ztoa' }"
            @click="orderBy = 'ztoa'"
          >
            Z → A
          </button>
          <button
            class="chip"
            :class="{ 'chip--on': orderBy === 'crUp' }"
            @click="orderBy = 'crUp'"
          >
            CR ↑
          </button>
          <button
            class="chip"
            :class="{ 'chip--on': orderBy === 'crDown' }"
            @click="orderBy = 'crDown'"
          >
            CR ↓
          </button>
          <button
            class="chip"
            :class="{ 'chip--on': orderBy === 'type' }"
            @click="orderBy = 'type'"
          >
            Type
          </button>
        </div>
      </div>

      <!-- type filter pills -->
      <div class="filter-group">
        <span class="filter-label">Type:</span>
        <div class="chip-row">
          <button
            v-for="type in [
              'Aberration',
              'Beast',
              'Celestial',
              'Construct',
              'Dragon',
              'Elemental',
              'Fey',
              'Fiend',
              'Giant',
              'Humanoid',
              'Monstrosity',
              'Ooze',
              'Plant',
              'Undead',
            ]"
            :key="type"
            class="chip"
            :class="{ 'chip--on': typeFilter.includes(type) }"
            @click="toggleTypeFilter(type)"
          >
            {{ type }}
          </button>
        </div>
      </div>

      <!-- CR Stuff -->
      <div class="filter-group">
        <span class="filter-label"> Challenge Rating: {{ crMin }} - {{ crMax }} </span>

        <div class="dual-range">
          <input
            type="range"
            min="0"
            max="30"
            v-model.number="crMin"
            @input="crMin = Math.min(crMin, crMax)"
          />

          <input
            type="range"
            min="0"
            max="30"
            v-model.number="crMax"
            @input="crMax = Math.max(crMax, crMin)"
          />

          <div
            class="dual-range__fill"
            :style="{
              left: `${(crMin / 30) * 100}%`,
              width: `${((crMax - crMin) / 30) * 100}%`,
            }"
          />
        </div>
      </div>

      <!-- size filter -->
      <div class="filter-group">
        <span class="filter-label">Size:</span>
        <div class="chip-row">
          <button
            v-for="size in ([
              ['Tiny', 'T'],
              ['Small', 'S'],
              ['Medium', 'M'],
              ['Large', 'L'],
              ['Huge', 'H'],
              ['Gargantuan', 'G'],
            ] as const)"
            :key="size[0]"
            class="chip"
            :class="{ 'chip--on': sizeFilter.includes(size[1]) }"
            @click="
              () => {
                if (sizeFilter.includes(size[1])) {
                  sizeFilter = sizeFilter.filter(s => s !== size[1]);
                } else {
                  sizeFilter.push(size[1]);
                }
              }
            "
          >
            {{ size[0] }}
          </button>
        </div>
      </div>

      <!-- alignment filter -->
      <div class="filter-group">
        <span class="filter-label">Alignment:</span>
        <div class="chip-row">
          <button
            v-for="alignment in ([
              ['Lawful', 'L'],
              ['Neutral', 'N'],
              ['Chaotic', 'C'],
              ['Good', 'G'],
              ['Evil', 'E'],
            ] as const)"
            :key="alignment[1]"
            class="chip"
            :class="{ 'chip--on': alignmentFilter.includes(alignment[1]) }"
            @click="
              () => {
                if (alignmentFilter.includes(alignment[1])) {
                  alignmentFilter = alignmentFilter.filter(a => a !== alignment[1]);
                } else {
                  alignmentFilter.push(alignment[1] ? alignment[1] : '');
                }
              }
            "
          >
            {{ alignment[0] }}
          </button>
        </div>
      </div>

      <!-- spellcasting, legendary, mythic filters for both include and exclude -->
      <div class="filter-group">
        <span class="filter-label">Spellcasting:</span>
        <div class="chip-row">
          <button
            class="chip"
            :class="{ 'chip--on': spellcastingFilter === true }"
            @click="spellcastingFilter = spellcastingFilter === true ? undefined : true"
          >
            Has Spellcasting
          </button>
          <button
            class="chip"
            :class="{ 'chip--on': legendaryFilter === true }"
            @click="legendaryFilter = legendaryFilter === true ? undefined : true"
          >
            Has Legendary Actions
          </button>
          <button
            class="chip"
            :class="{ 'chip--on': mythicFilter === true }"
            @click="mythicFilter = mythicFilter === true ? undefined : true"
          >
            Has Mythic Actions
          </button>
        </div>
      </div>
    </div>

    <p class="result-count">
      {{ sortedMonsters.length }} monsters{{ sortedMonsters.length !== 1 ? 's' : '' }}
    </p>

    <!-- The monster list -->
    <div>
      <ul class="resource-list">
        <div
          v-for="monster in sortedMonsters"
          :key="`${monster.name}-${monster.source}`"
          @click="selectMonster(monster)"
          class="monster-item"
          tabindex="0"
          @keydown.enter="selectMonster(monster)"
          role="button"
        >
          <p>
            {{ monster.name
            }}<span class="p2">
              ({{ monster.source }}) {{ calcCR(monster) }}
              {{ getPrettyMonsterType(monster.type ?? '') }}</span
            >
          </p>
          <img :src="shieldIcon" alt="shield icon" class="icon" @click="addToEncounter(monster)"/>
        </div>
      </ul>
    </div>
  </div>

  <PopOut :title="monsterTitle" v-if="selectedMonster" :onClose="deselectMonster">
    <div>
      <SingleMonster
        :monster="selectedMonster"
        :fluff="getMonsterFluff(selectedMonster)"
        :spells="props.spells"
      />
    </div>
  </PopOut>

  <PopOut
    v-if="encounterPopupOpen && monsterForEncounter"
    :title="`Add ${monsterForEncounter.name} to Encounter`"
    @close="encounterPopupOpen = false"
  >
  <div>
    <p>Select encounter to add to:</p>
    <ul>
      <li v-for="enc in encounterStore.encounters" :key="enc.id">
        <button @click="addThisMOnsterToThisEncounter(enc.id)">
          {{ enc.name }}
        </button>

      </li>
    </ul>
  </div>
  </PopOut>
</template>

<script lang="ts" setup>
  import { computed, ref } from 'vue';
  import SingleMonster from './SingleMonster.vue';
  import PopOut from '../PopOut.vue';
  import type { Monster, MonsterFluff, Spells } from '../../types.ts';
  import { getPrettyMonsterType, bestiaryFilter } from '../../helperFunctions.ts';
  import { CR_VALUES } from '../../constants.ts';
  import { useEncounterStore } from '../../stores/encounterStore.ts';
  import shieldIcon from '../../assets/icons/shield.svg';
  const props = defineProps<{
    monsters: Monster[];
    monsterFluff: MonsterFluff[];
    spells: Spells;
  }>();

  const encounterStore = useEncounterStore();
  encounterStore.loadEncounters();

  const showFilters = ref(false);
  const searchVal = ref('');
  const orderBy = ref<'atoz' | 'ztoa' | 'crUp' | 'crDown' | 'type'>('atoz');
  const typeFilter = ref<string[]>([]);
  const sizeFilter = ref<string[]>([]);
  const alignmentFilter = ref<string[]>([]);
  const crMax = ref<number>(CR_VALUES[CR_VALUES.length - 1] || 0);
  const crMin = ref<number>(CR_VALUES[0] || 0);
  const spellcastingFilter = ref<boolean | undefined>(undefined);
  const legendaryFilter = ref<boolean | undefined>(undefined);
  const mythicFilter = ref<boolean | undefined>(undefined);
  const environmentFilter = ref<string[]>([]);
  const monsterForEncounter = ref<Monster | null>(null);
    const encounterPopupOpen = ref(false);

  const sortedMonsters = computed(() => {
    return bestiaryFilter(
      props.monsters,
      orderBy.value,
      searchVal.value,
      typeFilter.value,
      sizeFilter.value,
      alignmentFilter.value,
      crMin.value,
      crMax.value,
      spellcastingFilter.value,
      legendaryFilter.value,
      mythicFilter.value,
      environmentFilter.value
    );
  });

  const activeFilterCount = computed(
    () =>
      typeFilter.value.length +
      sizeFilter.value.length +
      alignmentFilter.value.length +
      (crMin.value !== 0 || crMax.value !== 30 ? 1 : 0) +
      (spellcastingFilter.value !== undefined ? 1 : 0) +
      (legendaryFilter.value !== undefined ? 1 : 0) +
      (mythicFilter.value !== undefined ? 1 : 0) +
      environmentFilter.value.length
  );

  const hasActiveFilters = computed(
    () => activeFilterCount.value > 0 || searchVal.value.length > 0
  );

  const selectedMonster = ref<Monster | null>(null);
  const monsterTitle = computed(() => {
    if (!selectedMonster.value) return '';
    return `${selectedMonster.value.name} (${selectedMonster.value.source} page ${
      selectedMonster.value.page ?? 'N/A'
    })`;
  });

  function toggleTypeFilter(type: string) {
    if (typeFilter.value.includes(type)) {
      typeFilter.value = typeFilter.value.filter(t => t !== type);
    } else {
      typeFilter.value.push(type);
    }
  }

  function calcCR(monster: Monster): string {
    if (typeof monster.cr === 'object') {
      return `CR ${monster.cr.cr}${monster.cr.coven ? ' coven: ' + monster.cr.coven : ''}${
        monster.cr.lair ? ' lair: ' + monster.cr.lair : ''
      }`;
    } else if (typeof monster.cr === 'undefined') {
      return '';
    } else {
      return `CR ${monster.cr}`;
    }
  }
  function selectMonster(monster: Monster) {
    selectedMonster.value = monster;
  }

  function deselectMonster() {
    selectedMonster.value = null;
  }

  function getMonsterFluff(monster: Monster): MonsterFluff | undefined {
    return props.monsterFluff.find(
      fluff => fluff.name === monster.name && fluff.source === monster.source
    );
  }

  function addToEncounter(monster: Monster) {
    monsterForEncounter.value = monster;
    encounterPopupOpen.value = true;
  }
  async function addThisMOnsterToThisEncounter(encounterId: string) {
    if (!monsterForEncounter.value) return;

    await encounterStore.addMonsterToEncounter(encounterId, monsterForEncounter.value);
    encounterPopupOpen.value = false;
    monsterForEncounter.value = null;
  }
</script>

<style scoped>
.icon {
    width: 18px;
    height: 18px;
    cursor: pointer;
    opacity: 0.6;
    transition: opacity 0.15s ease;
    display: block;
    margin: 0 auto;
  }

  .monster-container {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .search-row {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }

  .search-input {
    flex: 1;
    padding: 0.6rem 0.8rem;
    border: 1px solid var(--color-muted);
    border-radius: 8px;
    background: var(--color-surface);
    color: var(--color-text);
    font-size: 1rem;
    min-height: 44px;
  }

  .search-input:focus {
    outline: 2px solid var(--color-primary);
    outline-offset: 1px;
  }

  .filter-toggle {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.6rem 1rem;
    border: 1px solid var(--color-muted);
    border-radius: 8px;
    background: var(--color-surface);
    color: var(--color-text);
    cursor: pointer;
    font-size: 0.95rem;
    min-height: 44px;
    white-space: nowrap;
  }

  .filter-toggle--active {
    border-color: var(--color-primary);
    color: var(--color-primary);
  }

  .filter-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: var(--color-primary);
    color: white;
    border-radius: 99px;
    font-size: 0.75rem;
    font-weight: 700;
    min-width: 1.25rem;
    height: 1.25rem;
    padding: 0 0.3rem;
  }

  .filter-panel {
    background: var(--color-surface);
    border: 1px solid rgba(107, 46, 46, 0.15);
    border-radius: 10px;
    padding: 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .filter-group {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .filter-label {
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--color-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin: 0;
  }

  .chip-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }

  .chip {
    padding: 0.35rem 0.7rem;
    border: 1px solid rgba(107, 46, 46, 0.25);
    border-radius: 99px;
    background: var(--color-bg);
    color: var(--color-text);
    cursor: pointer;
    font-size: 0.85rem;
    min-height: 36px;
    line-height: 1;
    transition: background 0.12s, color 0.12s, border-color 0.12s;
  }

  .chip--on {
    background: var(--color-primary);
    color: white;
    border-color: var(--color-primary);
  }

  .chip:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  .filter-footer {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .sort-group {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    flex-wrap: wrap;
  }

  .clear-btn {
    margin-left: auto;
    background: transparent;
    border: 1px solid var(--color-danger);
    color: var(--color-danger);
    border-radius: 8px;
    padding: 0.35rem 0.75rem;
    cursor: pointer;
    font-size: 0.85rem;
    min-height: 36px;
  }

  .result-count {
    font-size: 0.85rem;
    color: var(--color-muted);
    margin: 0.1rem 0;
  }

  .resource-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .monster-item {
    cursor: pointer;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid rgba(107, 46, 46, 0.12);
    min-height: 44px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    transition: background 0.14s;
  }

  .monster-item:hover,
  .monster-item:focus-visible {
    background: var(--color-surface);
    outline: none;
  }

  .monster-item p {
    margin: 0;
    font-size: 0.95rem;
  }

  .p2,
  .monster-meta {
    color: var(--color-muted);
    font-size: 0.85rem;
  }

  .dual-range {
    position: relative;
    height: 32px;
    margin-top: 0.5rem;
  }

  .dual-range input[type='range'] {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    margin: 0;
    pointer-events: none;
    background: transparent;
    appearance: none;
    z-index: 2;
  }

  .dual-range input[type='range']::-webkit-slider-thumb {
    appearance: none;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: var(--color-primary);
    cursor: pointer;
    pointer-events: all;
    border: 2px solid white;
  }

  .dual-range input[type='range']::-moz-range-thumb {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: var(--color-primary);
    cursor: pointer;
    pointer-events: all;
    border: 2px solid white;
  }

  .dual-range::before {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    top: 8px;
    height: 4px;
    border-radius: 999px;
    background: var(--color-muted);
    opacity: 0.25;
  }

  .dual-range__fill {
    position: absolute;
    top: 8px;
    height: 4px;
    border-radius: 999px;
    background: var(--color-primary);
    z-index: 1;
  }

  @media (min-width: 640px) {
    .chip {
      font-size: 0.9rem;
    }
  }
</style>
