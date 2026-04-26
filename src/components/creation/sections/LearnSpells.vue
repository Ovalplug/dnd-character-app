<template>
  <div class="learn-spells">
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
            v-for="lvl in availableLevels"
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

      <div class="filter-footer">
        <div class="sort-group">
          <span class="filter-label">Sort</span>
          <button class="chip" :class="{ 'chip--on': orderBy === 'name' }" @click="orderBy = 'name'">Name</button>
          <button class="chip" :class="{ 'chip--on': orderBy === 'level' }" @click="orderBy = 'level'">Level</button>
        </div>
        <button v-if="hasActiveFilters" class="clear-btn" @click="clearFilters">Clear all</button>
      </div>
    </div>

    <!-- Result count -->
    <p class="result-count">{{ filteredSpells.length }} spell{{ filteredSpells.length !== 1 ? 's' : '' }}</p>

    <!-- Spell list -->
    <div class="spell-scroll">
      <table class="spells-table">
        <thead>
          <tr>
            <th>Spell</th>
            <th>Level</th>
            <th>School</th>
            <th>
              <span v-if="limit > 0">{{ modelValue.length }} / {{ limit }}</span>
              <span v-else>Select</span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="spell in displayedSpells"
            :key="spell.name"
            :class="{ selected: isSelected(spell.name) }"
          >
            <td>
              <div class="spell-name-cell">
                <span class="spell-name-text">{{ spell.name }}</span>
                <button class="info-btn" @click.stop="selectSpell(spell)" aria-label="View spell details">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10.125 8.875C10.125 7.83947 10.9645 7 12 7C13.0355 7 13.875 7.83947 13.875 8.875C13.875 9.56245 13.505 10.1635 12.9534 10.4899C12.478 10.7711 12 11.1977 12 11.75V13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                    <circle cx="12" cy="16" r="1" fill="currentColor"/>
                    <path d="M22 12C22 16.714 22 19.0711 20.5355 20.5355C19.0711 22 16.714 22 12 22C7.28595 22 4.92893 22 3.46447 20.5355C2 19.0711 2 16.714 2 12C2 7.28595 2 4.92893 3.46447 3.46447C4.92893 2 7.28595 2 12 2C16.714 2 19.0711 2 20.5355 3.46447C21.5093 4.43821 21.8356 5.80655 21.9449 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                  </svg>
                </button>
              </div>
            </td>
            <td>{{ spell.level === 0 ? 'Cantrip' : ordinal(spell.level) }}</td>
            <td>{{ getPrettySpellSchool(spell.school) }}</td>
            <td>
              <input
                type="checkbox"
                :checked="isSelected(spell.name)"
                :disabled="!isSelected(spell.name) && limit > 0 && modelValue.length >= limit"
                @change="toggle(spell.name)"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <p v-if="filteredSpells.length > DISPLAY_CAP" class="cap-hint">
      Showing first {{ DISPLAY_CAP }} results — use search or filters to narrow down.
    </p>

    <PopOut v-if="selectedSpell" :title="selectedSpell.name" :onClose="deselectSpell">
      <SingleSpell :spell="selectedSpell" />
    </PopOut>
  </div>
</template>

<script lang="ts" setup>
  import { computed, ref } from 'vue';
  import type { Spell, SpellSchools } from '../../../types';
  import { getPrettySpellSchool, getRefinedSpellsList } from '../../../helperFunctions';
  import PopOut from '../../PopOut.vue';
  import SingleSpell from '../../resources/SingleSpell.vue';

  const props = defineProps<{
    /** Full list of spells that may be learned */
    spells: Spell[];
    /** Max number of spells that may be selected (0 = unlimited) */
    limit: number;
    /** Currently selected spell names */
    modelValue: string[];
  }>();

  const emit = defineEmits<{
    (e: 'update:modelValue', value: string[]): void;
  }>();

  const DISPLAY_CAP = 200;

  const searchVal = ref('');
  const selectedLevels = ref<number[]>([]);
  const selectedSchools = ref<SpellSchools[]>([]);
  const orderBy = ref<'name' | 'level'>('name');
  const showFilters = ref(false);

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

  const availableLevels = computed(() => {
    const lvls = new Set<number>();
    for (const s of props.spells) lvls.add(s.level);
    return Array.from(lvls).sort((a, b) => a - b);
  });

  const activeFilterCount = computed(() => selectedLevels.value.length + selectedSchools.value.length);
  const hasActiveFilters = computed(() => activeFilterCount.value > 0 || searchVal.value.length > 0);

  const filteredSpells = computed<Spell[]>(() =>
    getRefinedSpellsList(
      props.spells,
      selectedSchools.value,
      selectedLevels.value,
      [],
      orderBy.value,
      searchVal.value || undefined
    )
  );

  const displayedSpells = computed(() => filteredSpells.value.slice(0, DISPLAY_CAP));

  function toggleLevel(lvl: number) {
    selectedLevels.value = selectedLevels.value.includes(lvl)
      ? selectedLevels.value.filter(l => l !== lvl)
      : [...selectedLevels.value, lvl];
  }

  function toggleSchool(school: SpellSchools) {
    selectedSchools.value = selectedSchools.value.includes(school)
      ? selectedSchools.value.filter(s => s !== school)
      : [...selectedSchools.value, school];
  }

  function clearFilters() {
    selectedLevels.value = [];
    selectedSchools.value = [];
    searchVal.value = '';
  }

  function isSelected(name: string): boolean {
    return props.modelValue.includes(name);
  }

  function toggle(name: string) {
    const next = [...props.modelValue];
    const idx = next.indexOf(name);
    if (idx !== -1) {
      next.splice(idx, 1);
    } else {
      next.push(name);
    }
    emit('update:modelValue', next);
  }

  function ordinal(n: number): string {
    if (n === 1) return '1st';
    if (n === 2) return '2nd';
    if (n === 3) return '3rd';
    return `${n}th`;
  }

  const selectedSpell = ref<Spell | null>(null);

  function selectSpell(spell: Spell) {
    selectedSpell.value = spell;
  }

  function deselectSpell() {
    selectedSpell.value = null;
  }
</script>

<style scoped>
  .learn-spells {
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

  .spell-scroll {
    max-height: 360px;
    overflow-y: auto;
  }

  .spells-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.9rem;
  }

  .spells-table th,
  .spells-table td {
    border: 1px solid var(--color-border, #ccc);
    padding: 0.35rem 0.6rem;
    text-align: left;
  }

  .spells-table tr.selected {
    background: #e8f0fe;
  }

  .cap-hint {
    font-size: 0.8rem;
    color: var(--color-text-muted, #888);
    text-align: center;
  }

  .spell-name-cell {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    min-width: 0;
  }

  .spell-name-text {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .info-btn {
    flex-shrink: 0;
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    color: var(--color-muted);
    display: flex;
    align-items: center;
    line-height: 1;
  }

  .info-btn:hover {
    color: var(--color-primary);
  }
</style>
