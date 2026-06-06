<template>
  <div class="feats-container">
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
      {{ refinedFeatsList.length }} feat{{ refinedFeatsList.length !== 1 ? 's' : '' }}
    </p>

    <ul class="resource-list">
      <div
        v-for="feat in refinedFeatsList"
        :key="`${feat.name}-${feat.source}`"
        @click="selectFeat(feat)"
        class="feat-item"
        tabindex="0"
        @keydown.enter="selectFeat(feat)"
        role="button"
      >
        <p>
          {{ feat.name }}<span class="p2"> ({{ feat.source }})</span>
        </p>
        <p v-if="getFeatMeta(feat)" class="feat-meta">{{ getFeatMeta(feat) }}</p>
      </div>
    </ul>
  </div>

  <PopOut :title="featTitle" v-if="selectedFeat" :onClose="deselectFeat">
    <div v-if="debug">
      <pre>{{ JSON.stringify(selectedFeat, null, 2) }}</pre>
    </div>
    <div>
      <SingleFeat :feat="selectedFeat" />
    </div>
  </PopOut>
</template>

<script lang="ts" setup>
  import type { Feat, SavingThrow } from '../../types';
  import type { FeatPrerequisiteTag, FeatSpellTag } from '../../helperFunctions';
  import PopOut from '../PopOut.vue';
  import { computed, onMounted, ref } from 'vue';
  import { useDebug } from '../../composables/useDebug';
  import { useDataStore } from '../../stores/dataStore';
  import SingleFeat from './SingleFeat.vue';
  import {
    getFeatAbilityFilters,
    getFeatPrerequisiteTags,
    getFeatSpellTags,
    getPrettyAbilityName,
    getPrettyFeatPrerequisiteTag,
    getPrettyFeatSpellTag,
    getRefinedFeatsList,
  } from '../../helperFunctions';

  const { debug, initDebug } = useDebug();
  const dataStore = useDataStore();

  const props = defineProps<{ feats: Feat[] }>();

  const searchVal = ref('');
  const selectedAbilities = ref<SavingThrow[]>([]);
  const selectedPrerequisites = ref<FeatPrerequisiteTag[]>([]);
  const selectedSpellTags = ref<FeatSpellTag[]>([]);
  const orderBy = ref<'name' | 'source'>('name');
  const showFilters = ref(false);

  const allAbilities = computed(() =>
    Array.from(new Set(props.feats.flatMap(feat => getFeatAbilityFilters(feat))))
      .sort((a, b) => a.localeCompare(b))
      .map(ability => ({ value: ability, label: getPrettyAbilityName(ability) }))
  );

  const allPrerequisiteTags = computed(() =>
    Array.from(new Set(props.feats.flatMap(feat => getFeatPrerequisiteTags(feat))))
      .sort((a, b) =>
        getPrettyFeatPrerequisiteTag(a).localeCompare(getPrettyFeatPrerequisiteTag(b))
      )
      .map(tag => ({ value: tag, label: getPrettyFeatPrerequisiteTag(tag) }))
  );

  const allSpellTags = computed(() =>
    Array.from(new Set(props.feats.flatMap(feat => getFeatSpellTags(feat))))
      .sort((a, b) => getPrettyFeatSpellTag(a).localeCompare(getPrettyFeatSpellTag(b)))
      .map(tag => ({ value: tag, label: getPrettyFeatSpellTag(tag) }))
  );

  const refinedFeatsList = computed(() =>
    getRefinedFeatsList(
      props.feats,
      [],
      selectedAbilities.value,
      selectedPrerequisites.value,
      selectedSpellTags.value,
      orderBy.value,
      searchVal.value || undefined
    )
  );

  const activeFilterCount = computed(
    () =>
      selectedAbilities.value.length +
      selectedPrerequisites.value.length +
      selectedSpellTags.value.length
  );

  const hasActiveFilters = computed(
    () => activeFilterCount.value > 0 || searchVal.value.length > 0
  );

  const selectedFeat = ref<Feat | null>(null);

  function toggleAbility(ability: SavingThrow) {
    if (selectedAbilities.value.includes(ability)) {
      selectedAbilities.value = selectedAbilities.value.filter(value => value !== ability);
    } else {
      selectedAbilities.value = [...selectedAbilities.value, ability];
    }
  }

  function togglePrerequisite(tag: FeatPrerequisiteTag) {
    if (selectedPrerequisites.value.includes(tag)) {
      selectedPrerequisites.value = selectedPrerequisites.value.filter(value => value !== tag);
    } else {
      selectedPrerequisites.value = [...selectedPrerequisites.value, tag];
    }
  }

  function toggleSpellTag(tag: FeatSpellTag) {
    if (selectedSpellTags.value.includes(tag)) {
      selectedSpellTags.value = selectedSpellTags.value.filter(value => value !== tag);
    } else {
      selectedSpellTags.value = [...selectedSpellTags.value, tag];
    }
  }

  function clearFilters() {
    selectedAbilities.value = [];
    selectedPrerequisites.value = [];
    selectedSpellTags.value = [];
    searchVal.value = '';
  }

  const featTitle = computed(() => {
    return selectedFeat.value ? selectedFeat.value.name : '';
  });

  function getFeatMeta(feat: Feat): string {
    const parts: string[] = [];
    const abilities = getFeatAbilityFilters(feat);
    const prerequisites = getFeatPrerequisiteTags(feat);

    if (abilities.length > 0) {
      parts.push(`Ability: ${abilities.map(getPrettyAbilityName).join(', ')}`);
    }

    if (prerequisites.length > 0) {
      parts.push(`Prerequisites: ${prerequisites.map(getPrettyFeatPrerequisiteTag).join(', ')}`);
    }

    const spellTags = getFeatSpellTags(feat);
    if (spellTags.length > 0) {
      parts.push(spellTags.map(getPrettyFeatSpellTag).join(', '));
    }

    return parts.join(' • ');
  }

  function selectFeat(feat: Feat) {
    selectedFeat.value = feat;
  }

  function deselectFeat() {
    selectedFeat.value = null;
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
  .feats-container {
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

  .feat-item {
    cursor: pointer;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid rgba(107, 46, 46, 0.12);
    min-height: 44px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    transition: background 0.14s;
  }

  .feat-item:hover,
  .feat-item:focus-visible {
    background: var(--color-surface);
    outline: none;
  }

  .feat-item p {
    margin: 0;
    font-size: 0.95rem;
  }

  .p2,
  .feat-meta {
    color: var(--color-muted);
    font-size: 0.85rem;
  }

  @media (min-width: 640px) {
    .chip {
      font-size: 0.9rem;
    }
  }
</style>
