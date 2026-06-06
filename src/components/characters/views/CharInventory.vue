<template>
  <article class="inventory-layout character-detail-view">
    <NameBadge :character="props.character" />

    <Money
      :character-id="props.character.id"
      :money="props.character.currency"
      :additional-money="props.character.additionalCurrency"
    />

    <section class="inventory-card">
      <div class="inventory-card__header">
        <div>
          <p class="inventory-kicker">Equipment</p>
          <h3>Carried Items</h3>
        </div>
        <span class="inventory-count">{{ props.character.inventory.length }} total</span>
      </div>

      <div v-if="stackedInventory.length" class="inventory-summary">
        <article v-for="stat in inventorySummary" :key="stat.label" class="inventory-summary-card">
          <span class="inventory-summary-label">{{ stat.label }}</span>
          <strong class="inventory-summary-value">{{ stat.value }}</strong>
        </article>
      </div>

      <div v-if="stackedInventory.length" class="inventory-sections">
        <section v-for="section in inventorySections" :key="section.key" class="inventory-section">
          <div class="inventory-section-header">
            <div>
              <h4 class="inventory-section-title">{{ section.title }}</h4>
              <p class="inventory-section-description">{{ section.description }}</p>
            </div>
            <span class="inventory-section-count">
              {{ section.rows.reduce((total, row) => total + row.quantity, 0) }} item(s)
            </span>
          </div>

          <div v-if="section.rows.length" class="inventory-list">
            <article v-for="row in section.rows" :key="row.key" class="inventory-row">
              <div class="inventory-copy">
                <div class="inventory-name-row">
                  <p class="inventory-name">{{ getStackedItemDisplayName(row.item, row.quantity) }}</p>
                  <span v-if="row.quantity > 1" class="stack-badge">x{{ row.quantity }}</span>
                  <button
                    type="button"
                    class="inventory-info-button"
                    :aria-label="`View details for ${row.item.displayName || row.item.name}`"
                    @click="openItemDetails(row.item)"
                  >
                    <img :src="questionIcon" alt="" />
                  </button>
                </div>

                <div class="inventory-badge-row">
                  <span v-for="badge in getItemBadges(row.item)" :key="`${row.key}-${badge}`" class="inventory-badge">
                    {{ badge }}
                  </span>
                </div>

                <p v-if="getItemFacts(row.item)" class="inventory-facts">{{ getItemFacts(row.item) }}</p>
                <p class="inventory-source">{{ getItemSource(row.item) }}</p>
              </div>
              <div class="inventory-actions">
                <button
                  type="button"
                  class="inventory-toggle"
                  :class="{ 'inventory-toggle--active': !!row.item.equipped }"
                  @click="toggleEquipped(row.indexes[0] ?? -1)"
                >
                  {{ row.item.equipped ? 'Equipped' : 'Equip' }}
                </button>
                <button
                  v-if="itemRequiresAttunement(row.item)"
                  type="button"
                  class="inventory-toggle"
                  :class="{ 'inventory-toggle--active': !!row.item.attuned }"
                  @click="toggleAttuned(row.indexes[0] ?? -1)"
                >
                  {{ row.item.attuned ? 'Attuned' : 'Attune' }}
                </button>
              </div>
            </article>
          </div>

          <p v-else class="inventory-empty">{{ section.emptyText }}</p>
        </section>
      </div>

      <p v-else class="inventory-empty">
        No items yet. Use the edit button in the name badge to add inventory.
      </p>
    </section>

    <PopOut
      v-if="selectedItem"
      :title="selectedItem.displayName || selectedItem.name"
      @close="closeItemDetails"
    >
      <SingleItem :item="selectedItem" />
    </PopOut>
  </article>
</template>

<script lang="ts" setup>
  import { computed, ref } from 'vue';
  import questionIcon from '../../../assets/icons/question.svg';
  import {
    getInventoryItemBadges,
    getInventoryItemDisplayName,
    getInventoryItemFacts,
    isArmorItem,
    isWeaponItem,
    itemRequiresAttunement,
    stackInventoryItems,
  } from '../../../helperFunctions';
  import type { InventoryStackRow } from '../../../helperFunctions';
  import PopOut from '../../PopOut.vue';
  import SingleItem from '../../resources/SingleItem.vue';
  import { useCharacterStore } from '../../../stores/characterStore';
  import NameBadge from './subcomponents/NameBadge.vue';
  import type { Item, playerCharacter } from '../../../types';
  import Money from './subcomponents/Money.vue';

  const props = defineProps<{
    character: playerCharacter;
  }>();

  const charStore = useCharacterStore();
  const selectedItem = ref<Item | null>(null);
  const stackedInventory = computed(() => stackInventoryItems(props.character.inventory));
  const totalEquipped = computed(() => countRows(stackedInventory.value, row => !!row.item.equipped));
  const totalAttuned = computed(() => countRows(stackedInventory.value, row => !!row.item.attuned));
  const totalWeapons = computed(() => countRows(stackedInventory.value, row => isWeaponItem(row.item)));
  const totalArmor = computed(() => countRows(stackedInventory.value, row => isArmorItem(row.item)));

  const inventorySummary = computed(() => [
    { label: 'Equipped', value: totalEquipped.value },
    { label: 'Attuned', value: totalAttuned.value },
    { label: 'Weapons', value: totalWeapons.value },
    { label: 'Armor', value: totalArmor.value },
  ]);

  const equippedRows = computed(() => stackedInventory.value.filter(row => row.item.equipped));
  const attunedRows = computed(() =>
    stackedInventory.value.filter(row => row.item.attuned && !row.item.equipped)
  );
  const carriedRows = computed(() =>
    stackedInventory.value.filter(row => !row.item.equipped && !row.item.attuned)
  );

  const inventorySections = computed(() => [
    {
      key: 'equipped',
      title: 'Equipped Now',
      description: 'Active weapons, armor, shields, and worn gear.',
      rows: equippedRows.value,
      emptyText: 'Nothing is marked equipped yet.',
    },
    {
      key: 'attuned',
      title: 'Attuned Items',
      description: 'Magic items that are currently bonded but not marked equipped.',
      rows: attunedRows.value,
      emptyText: 'No extra attuned items are active.',
    },
    {
      key: 'carried',
      title: 'Pack and Pockets',
      description: 'Everything else the character is carrying.',
      rows: carriedRows.value,
      emptyText: 'The pack is empty.',
    },
  ]);

  function getStackedItemDisplayName(item: Item, quantity: number): string {
    if (quantity <= 1) return getInventoryItemDisplayName(item);
    return `${quantity} x ${getInventoryItemDisplayName(item)}`;
  }

  function getItemBadges(item: Item): string[] {
    return getInventoryItemBadges(item);
  }

  function getItemFacts(item: Item): string {
    return getInventoryItemFacts(item).join(' • ');
  }

  function getItemSource(item: Item): string {
    return item.source || 'Unknown source';
  }

  function countRows(
    rows: InventoryStackRow[],
    predicate: (row: InventoryStackRow) => boolean
  ): number {
    return rows.reduce((total, row) => total + (predicate(row) ? row.quantity : 0), 0);
  }

  async function toggleEquipped(index: number) {
    await charStore.toggleCharacterItemEquipped(props.character.id, index);
  }

  async function toggleAttuned(index: number) {
    await charStore.toggleCharacterItemAttuned(props.character.id, index);
  }

  function openItemDetails(item: Item) {
    selectedItem.value = item;
  }

  function closeItemDetails() {
    selectedItem.value = null;
  }
</script>

<style scoped>
  .inventory-layout {
    display: grid;
    gap: 1rem;
  }

  .inventory-card {
    display: grid;
    gap: 1rem;
    padding: 1rem;
    border-radius: 16px;
    background: rgba(255, 255, 255, 0.72);
    border: 1px solid rgba(107, 46, 46, 0.12);
    box-shadow: var(--color-card-shadow);
  }

  .inventory-card__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .inventory-kicker,
  .inventory-meta,
  .inventory-empty,
  .inventory-count {
    margin: 0;
    color: var(--color-muted);
    font-size: 0.9rem;
  }

  .inventory-card__header h3,
  .inventory-name {
    margin: 0;
  }

  .inventory-list {
    display: grid;
    gap: 0.65rem;
  }

  .inventory-summary {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0.65rem;
  }

  .inventory-summary-card {
    display: grid;
    gap: 0.2rem;
    padding: 0.75rem 0.8rem;
    border-radius: 14px;
    background: rgba(255, 255, 255, 0.58);
    border: 1px solid rgba(107, 46, 46, 0.08);
  }

  .inventory-summary-label {
    color: var(--color-muted);
    font-size: 0.78rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .inventory-summary-value {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--color-primary);
  }

  .inventory-sections {
    display: grid;
    gap: 0.9rem;
  }

  .inventory-section {
    display: grid;
    gap: 0.75rem;
  }

  .inventory-section-header {
    display: flex;
    justify-content: space-between;
    gap: 0.75rem;
    align-items: flex-start;
    flex-wrap: wrap;
  }

  .inventory-section-title {
    margin: 0;
  }

  .inventory-section-description,
  .inventory-section-count,
  .inventory-source,
  .inventory-facts {
    margin: 0;
    color: var(--color-muted);
    font-size: 0.85rem;
  }

  .inventory-row {
    display: flex;
    justify-content: space-between;
    gap: 0.85rem;
    align-items: center;
    flex-wrap: wrap;
    padding: 0.8rem 0.9rem;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.55);
    border: 1px solid rgba(107, 46, 46, 0.08);
  }

  .inventory-copy {
    display: grid;
    gap: 0.45rem;
    flex: 1;
    min-width: 0;
  }

  .inventory-name-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .stack-badge {
    padding: 0.12rem 0.45rem;
    border-radius: 999px;
    background: rgba(107, 46, 46, 0.08);
    border: 1px solid rgba(107, 46, 46, 0.12);
    color: var(--color-primary);
    font-size: 0.78rem;
    font-weight: 700;
  }

  .inventory-info-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.9rem;
    height: 1.9rem;
    border: 1px solid rgba(107, 46, 46, 0.14);
    border-radius: 999px;
    background: var(--color-surface);
    padding: 0;
    cursor: pointer;
    transition: transform 0.12s ease, box-shadow 0.12s ease;
  }

  .inventory-info-button:hover,
  .inventory-info-button:focus-visible {
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(31, 27, 22, 0.08);
  }

  .inventory-info-button:focus-visible {
    outline: 2px solid rgba(107, 46, 46, 0.25);
    outline-offset: 2px;
  }

  .inventory-info-button img {
    width: 1rem;
    height: 1rem;
  }

  .inventory-badge-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }

  .inventory-badge {
    padding: 0.14rem 0.5rem;
    border-radius: 999px;
    background: rgba(107, 46, 46, 0.08);
    border: 1px solid rgba(107, 46, 46, 0.1);
    color: var(--color-primary);
    font-size: 0.76rem;
    font-weight: 700;
  }

  .inventory-actions {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .inventory-toggle {
    border: 1px solid rgba(107, 46, 46, 0.14);
    background: var(--color-surface);
    color: var(--color-text);
    border-radius: 999px;
    padding: 0.45rem 0.8rem;
    font: inherit;
    cursor: pointer;
  }

  .inventory-toggle--active {
    background: rgba(201, 164, 75, 0.18);
    border-color: rgba(201, 164, 75, 0.45);
    color: var(--color-primary);
  }

  @media (max-width: 720px) {
    .inventory-summary {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
</style>
