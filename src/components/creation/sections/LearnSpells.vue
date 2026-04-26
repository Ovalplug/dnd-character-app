<template>
  <div class="learn-spells">
    <!-- Filter bar -->
    <div class="filters">
      <input v-model="searchVal" placeholder="Search spells…" class="search-input" />
      <select v-model="filterLevel">
        <option value="">All levels</option>
        <option v-for="lvl in availableLevels" :key="lvl" :value="lvl">
          {{ lvl === 0 ? 'Cantrip' : ordinal(lvl) + ' level' }}
        </option>
      </select>
    </div>

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
            <td>{{ spell.name }}</td>
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
      Showing first {{ DISPLAY_CAP }} results — use search or level filter to narrow down.
    </p>
  </div>
</template>

<script lang="ts" setup>
  import { computed, ref } from 'vue';
  import type { Spell } from '../../../types';
  import { getPrettySpellSchool } from '../../../helperFunctions';

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
  const filterLevel = ref<number | ''>('');

  const availableLevels = computed(() => {
    const lvls = new Set<number>();
    for (const s of props.spells) lvls.add(s.level);
    return Array.from(lvls).sort((a, b) => a - b);
  });

  const filteredSpells = computed<Spell[]>(() => {
    let list = props.spells;
    if (filterLevel.value !== '') {
      list = list.filter(s => s.level === Number(filterLevel.value));
    }
    if (searchVal.value.trim()) {
      const q = searchVal.value.toLowerCase();
      list = list.filter(s => s.name.toLowerCase().includes(q));
    }
    return list;
  });

  const displayedSpells = computed(() => filteredSpells.value.slice(0, DISPLAY_CAP));

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
</script>

<style scoped>
  .learn-spells {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .filters {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .search-input {
    flex: 1;
    min-width: 160px;
    padding: 0.35rem 0.6rem;
    border: 1px solid var(--color-border, #ccc);
    border-radius: 4px;
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
</style>
