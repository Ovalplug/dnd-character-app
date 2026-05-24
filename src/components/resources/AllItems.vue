<template>
  <div class="items-container">
    <div class="search-row">
      <input v-model="searchVal" type="search" placeholder="Search items..." class="search-input" />
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
        <span class="filter-label">Rarity</span>
        <div class="chip-row">
          <button
            v-for="rarity in allRarities"
            :key="rarity"
            class="chip"
            :class="{ 'chip--on': selectedRarities.includes(rarity) }"
            @click="toggleRarity(rarity)"
          >
            {{ rarity }}
          </button>
        </div>
      </div>

      <div class="filter-group">
        <span class="filter-label">Type</span>
        <div class="chip-row">
          <button
            v-for="type in allTypes"
            :key="type.value"
            class="chip"
            :class="{ 'chip--on': selectedTypes.includes(type.value) }"
            @click="toggleType(type.value)"
          >
            {{ type.label }}
          </button>
        </div>
      </div>

      <div class="filter-group">
        <span class="filter-label">Tags</span>
        <div class="chip-row">
          <button
            v-for="tag in allTags"
            :key="tag.value"
            class="chip"
            :class="{ 'chip--on': selectedTags.includes(tag.value) }"
            @click="toggleTag(tag.value)"
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
            :class="{ 'chip--on': orderBy === 'rarity' }"
            @click="orderBy = 'rarity'"
          >
            Rarity
          </button>
        </div>
        <button v-if="hasActiveFilters" class="clear-btn" @click="clearFilters">Clear all</button>
      </div>
    </div>

    <p class="result-count">
      {{ refinedItemsList.length }} item{{ refinedItemsList.length !== 1 ? 's' : '' }}
    </p>

    <ul class="item-list">
      <div
        v-for="item in refinedItemsList"
        :key="`${item.name}-${item.source}`"
        @click="selectItem(item)"
        class="item-card"
        tabindex="0"
        @keydown.enter="selectItem(item)"
        role="button"
      >
        <p>
          {{ item.name }}<span class="p2"> ({{ item.source }})</span>
        </p>
        <p class="item-meta">{{ getItemMeta(item) }}</p>
      </div>
    </ul>
  </div>

  <PopOut :title="itemTitle" v-if="selectedItem" :onClose="deselectItem">
    <div v-if="debug">
      <pre>{{ JSON.stringify(selectedItem, null, 2) }}</pre>
    </div>
    <div>
      <SingleItem :item="selectedItem" />
    </div>
  </PopOut>
</template>

<script lang="ts" setup>
  import type { Item } from '../../types';
  import type { ItemFilterTag } from '../../helperFunctions';
  import PopOut from '../PopOut.vue';
  import { computed, onMounted, ref } from 'vue';
  import { useDebug } from '../../composables/useDebug';
  import { useDataStore } from '../../stores/dataStore';
  import SingleItem from './SingleItem.vue';
  import { getPrettyItemType, getRefinedItemsList } from '../../helperFunctions';

  const { debug, initDebug } = useDebug();
  const dataStore = useDataStore();

  const props = defineProps<{ items: Item[] }>();

  const searchVal = ref('');
  const selectedRarities = ref<string[]>([]);
  const selectedTypes = ref<string[]>([]);
  const selectedTags = ref<ItemFilterTag[]>([]);
  const orderBy = ref<'name' | 'rarity'>('name');
  const showFilters = ref(false);

  const allRarities = computed(() =>
    [...new Set(props.items.map(item => item.rarity).filter((rarity): rarity is string => Boolean(rarity)))].sort(
      (a, b) => a.localeCompare(b)
    )
  );

  const allTypes = computed(() =>
    [...new Set(props.items.map(item => item.type).filter((type): type is string => Boolean(type)))].sort(
      (a, b) => getPrettyItemType(a).localeCompare(getPrettyItemType(b))
    )
    .map(type => ({ value: type.toLowerCase(), label: getPrettyItemType(type) }))
  );

  const allTags: Array<{ label: string; value: ItemFilterTag }> = [
    { label: 'Attunement', value: 'attunement' },
    { label: 'Wondrous', value: 'wondrous' },
    { label: 'Tattoo', value: 'tattoo' },
    { label: 'Vehicle', value: 'vehicle' },
  ];

  const refinedItemsList = computed(() =>
    getRefinedItemsList(
      props.items,
      selectedRarities.value,
      selectedTypes.value,
      selectedTags.value,
      orderBy.value,
      searchVal.value || undefined
    )
  );

  const activeFilterCount = computed(
    () => selectedRarities.value.length + selectedTypes.value.length + selectedTags.value.length
  );

  const hasActiveFilters = computed(
    () => activeFilterCount.value > 0 || searchVal.value.length > 0
  );

  const selectedItem = ref<Item | null>(null);
  const itemTitle = computed(() => (selectedItem.value ? selectedItem.value.name : ''));

  function toggleRarity(rarity: string) {
    if (selectedRarities.value.includes(rarity)) {
      selectedRarities.value = selectedRarities.value.filter(value => value !== rarity);
    } else {
      selectedRarities.value = [...selectedRarities.value, rarity];
    }
  }

  function toggleType(type: string) {
    if (selectedTypes.value.includes(type)) {
      selectedTypes.value = selectedTypes.value.filter(value => value !== type);
    } else {
      selectedTypes.value = [...selectedTypes.value, type];
    }
  }

  function toggleTag(tag: ItemFilterTag) {
    if (selectedTags.value.includes(tag)) {
      selectedTags.value = selectedTags.value.filter(value => value !== tag);
    } else {
      selectedTags.value = [...selectedTags.value, tag];
    }
  }

  function clearFilters() {
    selectedRarities.value = [];
    selectedTypes.value = [];
    selectedTags.value = [];
    searchVal.value = '';
  }

  function selectItem(item: Item) {
    selectedItem.value = item;
  }

  function deselectItem() {
    selectedItem.value = null;
  }

  function getItemMeta(item: Item): string {
    const parts = [item.rarity, item.type ? getPrettyItemType(item.type) : undefined].filter(
      (value): value is string => Boolean(value)
    );
    return parts.join(' • ');
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
  .items-container {
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

  .item-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .item-card {
    cursor: pointer;
    padding: 0.6rem 0.5rem;
    border-bottom: 1px solid rgba(122, 107, 87, 0.2);
    transition: background 0.1s;
  }

  .item-card:hover,
  .item-card:focus-visible {
    background: var(--color-surface);
    outline: none;
  }

  .item-card p {
    margin: 0;
  }

  .p2,
  .item-meta {
    color: var(--color-muted);
    font-size: 0.85rem;
  }

  @media (min-width: 640px) {
    .chip {
      font-size: 0.9rem;
    }
  }
</style>
