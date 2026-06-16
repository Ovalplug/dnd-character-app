<template>
  <div class="monster-container">
    <!-- <div class="search-row">
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
      <div class="filter-group">
        <span class="filter-label">Ability</span>
        <div class="chip-row">
          <button
            v-for="ability in allAbilities"
            :key="ability.value"
            class="chip"
            :class="{ 'chip--on': selectedAbilities.includes(ability.value) }"
            @click="toggleAbility(ability.value)"
          >
            {{ ability.label }}
          </button>
        </div>
      </div>

      <div class="filter-group">
        <span class="filter-label">Prerequisite</span>
        <div class="chip-row">
          <button
            v-for="tag in allPrerequisiteTags"
            :key="tag.value"
            class="chip"
            :class="{ 'chip--on': selectedPrerequisites.includes(tag.value) }"
            @click="togglePrerequisite(tag.value)"
          >
            {{ tag.label }}
          </button>
        </div>
      </div>

      <div v-if="allSpellTags.length > 0" class="filter-group">
        <span class="filter-label">Spells</span>
        <div class="chip-row">
          <button
            v-for="tag in allSpellTags"
            :key="tag.value"
            class="chip"
            :class="{ 'chip--on': selectedSpellTags.includes(tag.value) }"
            @click="toggleSpellTag(tag.value)"
          >
            {{ tag.label }}
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
            :class="{ 'chip--on': orderBy === 'source' }"
            @click="orderBy = 'source'"
          >
            Source
          </button>
        </div>
        <button v-if="hasActiveFilters" class="clear-btn" @click="clearFilters">Clear all</button>
      </div>
    </div>

    <p class="result-count">
      {{ sortedMonsters.length }} monster{{ sortedMonsters.length !== 1 ? 's' : '' }}
    </p> -->

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
      </div>
    </ul>
  </div>

  <PopOut :title="monsterTitle" v-if="selectedMonster" :onClose="deselectMonster">
    <div>
      <SingleMonster :monster="selectedMonster" :fluff="getMonsterFluff(selectedMonster)" />
    </div>
  </PopOut>
</template>

<script lang="ts" setup>
  import { computed, ref } from 'vue';
  import SingleMonster from './SingleMonster.vue';
  import PopOut from '../PopOut.vue';
  import type { Monster, MonsterFluff } from '../../types.ts';
  import { getPrettyMonsterType } from '../../helperFunctions.ts';
  const props = defineProps<{
    monsters: Monster[];
    monsterFluff: MonsterFluff[];
  }>();

  const sortedMonsters = computed(() => {
    return [...props.monsters].sort((a, b) => a.name.localeCompare(b.name));
  });

  const selectedMonster = ref<Monster | null>(null);
  const monsterTitle = computed(() => {
    if (!selectedMonster.value) return '';
    return `${selectedMonster.value.name} (${selectedMonster.value.source} page ${
      selectedMonster.value.page ?? 'N/A'
    })`;
  });

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
</script>

<style scoped>
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

  @media (min-width: 640px) {
    .chip {
      font-size: 0.9rem;
    }
  }
</style>
