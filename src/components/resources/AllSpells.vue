<template>
  <div class="spells-container">
    <!-- Search + filter toggle -->
    <div class="search-row">
      <input v-model="searchVal" type="search" placeholder="Search spells…" class="search-input" />
      <button
        class="filter-toggle"
        :class="{ 'filter-toggle--active': hasActiveFilters }"
        @click="showFilters = !showFilters"
      >
        Filters
        <span v-if="activeFilterCount > 0" class="filter-badge">{{ activeFilterCount }}</span>
      </button>
    </div>

    <!-- Collapsible filter panel -->
    <div v-if="showFilters" class="filter-panel">
      <div class="filter-group">
        <span class="filter-label">Level</span>
        <div class="chip-row">
          <button
            v-for="lvl in allLevels"
            :key="lvl"
            class="chip"
            :class="{ 'chip--on': selectedLevels.includes(lvl) }"
            @click="toggleLevel(lvl)"
          >
            {{ lvl === 0 ? 'Cantrip' : lvl }}
          </button>
        </div>
      </div>

      <div class="filter-group">
        <span class="filter-label">School</span>
        <div class="chip-row">
          <button
            v-for="school in allSchools"
            :key="school.value"
            class="chip"
            :class="{ 'chip--on': selectedSchools.includes(school.value) }"
            @click="toggleSchool(school.value)"
          >
            {{ school.label }}
          </button>
        </div>
      </div>

      <div class="filter-group">
        <span class="filter-label">Class</span>
        <div class="chip-row">
          <button
            v-for="cls in allClasses"
            :key="cls"
            class="chip"
            :class="{ 'chip--on': selectedClasses.includes(cls) }"
            @click="toggleClass(cls)"
          >
            {{ capitalize(cls) }}
          </button>
        </div>
      </div>

      <div class="filter-footer">
        <div class="sort-group">
          <span class="filter-label">Sort</span>
          <button
            class="chip"
            :class="{ 'chip--on': orderBy === 'name' }"
            @click="orderBy = 'name'"
          >
            Name
          </button>
          <button
            class="chip"
            :class="{ 'chip--on': orderBy === 'level' }"
            @click="orderBy = 'level'"
          >
            Level
          </button>
        </div>
        <button v-if="hasActiveFilters" class="clear-btn" @click="clearFilters">Clear all</button>
      </div>
    </div>

    <!-- Result count -->
    <p class="result-count">
      {{ refinedSpellsList.length }} spell{{ refinedSpellsList.length !== 1 ? 's' : '' }}
    </p>

    <!-- Spell list -->
    <ul class="spell-list">
      <div
        v-for="spell in refinedSpellsList"
        :key="`${spell.name}-${spell.source}`"
        @click="selectSpell(spell)"
        class="feat-item"
      >
        <p>
          {{ spell.name }}<span class="p2"> ({{ spell.source }})</span>
        </p>
        <p class="spell_p3">
          {{ getPrettySpellSchool(spell.school) }} ({{ getPrettySpellLevel(spell.level) }})
        </p>
        <p class="spell_p3">{{ getPrettySpellClassList(spell.classes?.fromClassList ?? []) }}</p>
      </div>
    </ul>

    <PopOut :title="spellTitle" v-if="selectedSpell" :onClose="deselectSpell">
      <div v-if="debug">
        <pre>{{ JSON.stringify(selectedSpell, null, 2) }}</pre>
      </div>
      <div>
        <SingleSpell :spell="selectedSpell" />
      </div>
    </PopOut>
  </div>
</template>

<script lang="ts" setup>
  import type { Spell, SpellClass, SpellClasses, Spells, SpellSchools } from '../../types';
  import PopOut from '../PopOut.vue';
  import { computed, onMounted, ref } from 'vue';
  import { useDebug } from '../../composables/useDebug';
  import { useDataStore } from '../../stores/dataStore';
  import SingleSpell from './SingleSpell.vue';
  import {
    getPrettySpellLevel,
    getPrettySpellSchool,
    getPrettySpellClassList,
    getRefinedSpellsList,
  } from '../../helperFunctions';

  const { debug, initDebug } = useDebug();
  const dataStore = useDataStore();

  const props = defineProps<{
    spells: Spells;
  }>();

  // Filter state
  const searchVal = ref('');
  const selectedLevels = ref<number[]>([]);
  const selectedSchools = ref<SpellSchools[]>([]);
  const selectedClasses = ref<SpellClasses>([]);
  const orderBy = ref<'name' | 'level'>('name');
  const showFilters = ref(false);

  // Filter options
  const allLevels = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  const allSchools: { label: string; value: SpellSchools }[] = [
    { label: 'Abjuration', value: 'a' },
    { label: 'Conjuration', value: 'c' },
    { label: 'Divination', value: 'd' },
    { label: 'Enchantment', value: 'e' },
    { label: 'Evocation', value: 'v' },
    { label: 'Illusion', value: 'i' },
    { label: 'Necromancy', value: 'n' },
    { label: 'Transmutation', value: 't' },
  ];
  const allClasses: SpellClass[] = [
    'bard',
    'cleric',
    'druid',
    'paladin',
    'ranger',
    'sorcerer',
    'warlock',
    'wizard',
  ];

  const refinedSpellsList = computed(() =>
    getRefinedSpellsList(
      props.spells,
      selectedSchools.value,
      selectedLevels.value,
      selectedClasses.value,
      orderBy.value,
      searchVal.value || undefined
    )
  );

  const activeFilterCount = computed(
    () => selectedLevels.value.length + selectedSchools.value.length + selectedClasses.value.length
  );

  const hasActiveFilters = computed(
    () => activeFilterCount.value > 0 || searchVal.value.length > 0
  );

  function toggleLevel(lvl: number) {
    if (selectedLevels.value.includes(lvl))
      selectedLevels.value = selectedLevels.value.filter(l => l !== lvl);
    else selectedLevels.value = [...selectedLevels.value, lvl];
  }

  function toggleSchool(school: SpellSchools) {
    if (selectedSchools.value.includes(school))
      selectedSchools.value = selectedSchools.value.filter(s => s !== school);
    else selectedSchools.value = [...selectedSchools.value, school];
  }

  function toggleClass(cls: SpellClass) {
    if (selectedClasses.value.includes(cls))
      selectedClasses.value = selectedClasses.value.filter(c => c !== cls);
    else selectedClasses.value = [...selectedClasses.value, cls];
  }

  function clearFilters() {
    selectedLevels.value = [];
    selectedSchools.value = [];
    selectedClasses.value = [];
    searchVal.value = '';
  }

  function capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  const selectedSpell = ref<Spell | null>(null);
  const spellTitle = computed(() => (selectedSpell.value ? selectedSpell.value.name : ''));

  function selectSpell(spell: Spell) {
    selectedSpell.value = spell;
  }

  function deselectSpell() {
    selectedSpell.value = null;
  }

  onMounted(async () => {
    await initDebug();
    if (!dataStore.loaded) {
      try {
        await dataStore.init();
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Failed to load data store', err);
      }
    }
  });
</script>

<style scoped>
  .spells-container {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  /* Search + toggle row */
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

  /* Filter panel */
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

  /* Sort + clear row */
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

  /* Result count */
  .result-count {
    font-size: 0.85rem;
    color: var(--color-muted);
    margin: 0.1rem 0;
  }

  /* Spell list */
  .spell-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .feat-item {
    cursor: pointer;
    padding: 0.6rem 0.5rem;
    border-bottom: 1px solid rgba(122, 107, 87, 0.2);
    transition: background 0.1s;
  }

  .feat-item:hover {
    background: var(--color-surface);
  }

  .feat-item p {
    margin: 0;
  }

  .feat-item .p2 {
    color: var(--color-muted);
    font-size: 0.85rem;
  }

  .spell_p3 {
    color: var(--color-muted);
    font-size: 0.85rem;
  }

  @media (min-width: 640px) {
    .chip {
      font-size: 0.9rem;
    }
  }
</style>
