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

      <div v-if="stackedInventory.length" class="inventory-list">
        <article v-for="row in stackedInventory" :key="row.key" class="inventory-row">
          <div class="inventory-copy">
            <div class="inventory-name-row">
              <p class="inventory-name">{{ getStackedItemDisplayName(row.item, row.quantity) }}</p>
              <span v-if="row.quantity > 1" class="stack-badge">x{{ row.quantity }}</span>
            </div>
            <p class="inventory-meta">{{ getItemMeta(row.item) }}</p>
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

      <p v-else class="inventory-empty">
        No items yet. Use the edit button in the name badge to add inventory.
      </p>
    </section>
  </article>
</template>

<script lang="ts" setup>
  import { computed } from 'vue';
  import {
    getPrettyItemType,
    itemRequiresAttunement,
    stackInventoryItems,
  } from '../../../helperFunctions';
  import { useCharacterStore } from '../../../stores/characterStore';
  import NameBadge from './subcomponents/NameBadge.vue';
  import type { Item, playerCharacter } from '../../../types';
  import Money from './subcomponents/Money.vue';

  const props = defineProps<{
    character: playerCharacter;
  }>();

  const charStore = useCharacterStore();
  const stackedInventory = computed(() => stackInventoryItems(props.character.inventory));

  function getStackedItemDisplayName(item: Item, quantity: number): string {
    if (quantity <= 1) return item.displayName || item.name;
    return `${quantity} x ${item.displayName || item.name}`;
  }

  function getItemMeta(item: Item): string {
    const parts = [
      item.source || 'Unknown source',
      item.rarity,
      item.type ? getPrettyItemType(item.type) : undefined,
      item.equipped ? 'Equipped' : undefined,
      item.attuned ? 'Attuned' : undefined,
    ].filter((value): value is string => Boolean(value));
    return parts.join(' • ');
  }

  async function toggleEquipped(index: number) {
    await charStore.toggleCharacterItemEquipped(props.character.id, index);
  }

  async function toggleAttuned(index: number) {
    await charStore.toggleCharacterItemAttuned(props.character.id, index);
  }
</script>

<style scoped>
  .inventory-layout {
    display: grid;
    gap: 1rem;
  }

  .inventory-card {
    display: grid;
    gap: 0.9rem;
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
    gap: 0.3rem;
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
</style>
