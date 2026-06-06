<template>
  <section class="combat-section">
    <div class="section-header">
      <div>
        <h3 class="section-label">Equipped Gear</h3>
        <p class="section-copy">What is active right now in the middle of a fight.</p>
      </div>
      <span class="section-count">{{ totalActiveItems }} active</span>
    </div>

    <div v-if="totalInventoryItems > 0" class="section-summary">
      <article v-for="stat in summaryStats" :key="stat.label" class="section-summary-card">
        <span class="section-summary-label">{{ stat.label }}</span>
        <strong class="section-summary-value">{{ stat.value }}</strong>
      </article>
    </div>

    <div v-if="visibleSections.length" class="gear-sections">
      <article v-for="section in visibleSections" :key="section.key" class="gear-group">
        <div class="gear-group__header">
          <div>
            <h4 class="gear-group__title">{{ section.title }}</h4>
            <p class="gear-group__copy">{{ section.description }}</p>
          </div>
          <span class="gear-group__count">{{ section.rows.length }}</span>
        </div>

        <div class="gear-list">
          <article v-for="row in section.rows" :key="row.key" class="gear-row">
            <div class="gear-row__copy">
              <p class="gear-row__name">{{ getDisplayName(row.item, row.quantity) }}</p>
              <div class="gear-row__badges">
                <span
                  v-for="badge in getBadges(row.item)"
                  :key="`${row.key}-${badge}`"
                  class="gear-badge"
                >
                  {{ badge }}
                </span>
              </div>
              <p v-if="getFacts(row.item)" class="gear-row__facts">{{ getFacts(row.item) }}</p>
            </div>
          </article>
        </div>
      </article>
    </div>

    <p v-else class="section-empty">No weapons, armor, or other gear are marked active yet.</p>
  </section>
</template>

<script setup lang="ts">
  import { computed } from 'vue';
  import {
    getInventoryItemBadges,
    getInventoryItemDisplayName,
    getInventoryItemFacts,
    isArmorItem,
    isWeaponItem,
    stackInventoryItems,
  } from '../../../../helperFunctions';
  import type { InventoryStackRow } from '../../../../helperFunctions';
  import type { Item, playerCharacter } from '../../../../types';

  const props = defineProps<{
    character: playerCharacter;
  }>();

  const stackedInventory = computed(() => stackInventoryItems(props.character.inventory ?? []));
  const equippedRows = computed(() => stackedInventory.value.filter(row => row.item.equipped));
  const attunedOnlyRows = computed(() =>
    stackedInventory.value.filter(row => row.item.attuned && !row.item.equipped)
  );
  const defenseRows = computed(() => equippedRows.value.filter(row => isArmorItem(row.item)));
  const weaponRows = computed(() => equippedRows.value.filter(row => isWeaponItem(row.item)));
  const utilityRows = computed(() =>
    equippedRows.value.filter(row => !isArmorItem(row.item) && !isWeaponItem(row.item))
  );

  const visibleSections = computed(() =>
    [
      {
        key: 'defense',
        title: 'Defense',
        description: 'Armor and shields contributing to survivability.',
        rows: defenseRows.value,
      },
      {
        key: 'weapons',
        title: 'Ready Weapons',
        description: 'Weapons currently available on the character.',
        rows: weaponRows.value,
      },
      {
        key: 'utility',
        title: 'Worn Gear',
        description: 'Other equipped items with combat relevance.',
        rows: utilityRows.value,
      },
      {
        key: 'attuned',
        title: 'Attuned Magic',
        description: 'Active attuned items that are not separately marked equipped.',
        rows: attunedOnlyRows.value,
      },
    ].filter(section => section.rows.length > 0)
  );

  const totalActiveItems = computed(() =>
    countRows(stackedInventory.value, row => !!row.item.equipped || !!row.item.attuned)
  );
  const totalInventoryItems = computed(() => stackedInventory.value.length);

  const summaryStats = computed(() => [
    { label: 'Equipped', value: countRows(stackedInventory.value, row => !!row.item.equipped) },
    {
      label: 'Weapons',
      value: countRows(
        stackedInventory.value,
        row => isWeaponItem(row.item) && !!row.item.equipped
      ),
    },
    {
      label: 'Defense',
      value: countRows(stackedInventory.value, row => isArmorItem(row.item) && !!row.item.equipped),
    },
    { label: 'Attuned', value: countRows(stackedInventory.value, row => !!row.item.attuned) },
  ]);

  function countRows(
    rows: InventoryStackRow[],
    predicate: (row: InventoryStackRow) => boolean
  ): number {
    return rows.reduce((total, row) => total + (predicate(row) ? row.quantity : 0), 0);
  }

  function getDisplayName(item: Item, quantity: number): string {
    if (quantity <= 1) return getInventoryItemDisplayName(item);
    return `${quantity} x ${getInventoryItemDisplayName(item)}`;
  }

  function getBadges(item: Item): string[] {
    return getInventoryItemBadges(item);
  }

  function getFacts(item: Item): string {
    return getInventoryItemFacts(item).join(' • ');
  }
</script>

<style scoped>
  .combat-section {
    background: var(--color-surface);
    border-radius: var(--radius);
    box-shadow: var(--color-card-shadow);
    padding: 0.75rem 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
  }

  .section-header,
  .gear-group__header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .section-label,
  .gear-group__title {
    margin: 0;
  }

  .section-label,
  .section-summary-label {
    font-size: 0.72rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--color-muted);
  }

  .section-copy,
  .gear-group__copy,
  .section-empty,
  .gear-row__facts,
  .section-count,
  .gear-group__count {
    margin: 0;
    color: var(--color-muted);
    font-size: 0.8rem;
  }

  .section-count,
  .gear-group__count {
    padding: 0.2rem 0.65rem;
    border-radius: 999px;
    background: rgba(107, 46, 46, 0.08);
    border: 1px solid rgba(107, 46, 46, 0.12);
    color: var(--color-primary);
    font-weight: 700;
  }

  .section-summary {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0.55rem;
  }

  .section-summary-card,
  .gear-row {
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.6);
    border: 1px solid rgba(107, 46, 46, 0.08);
  }

  .section-summary-card {
    padding: 0.7rem 0.8rem;
    display: grid;
    gap: 0.18rem;
  }

  .section-summary-value {
    font-size: 1.15rem;
    color: var(--color-primary);
  }

  .gear-sections {
    display: grid;
    gap: 0.8rem;
  }

  .gear-group {
    display: grid;
    gap: 0.6rem;
  }

  .gear-list {
    display: grid;
    gap: 0.5rem;
  }

  .gear-row {
    padding: 0.75rem 0.85rem;
  }

  .gear-row__copy {
    display: grid;
    gap: 0.4rem;
  }

  .gear-row__name {
    margin: 0;
    font-weight: 700;
    color: var(--color-text);
  }

  .gear-row__badges {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
  }

  .gear-badge {
    padding: 0.12rem 0.5rem;
    border-radius: 999px;
    background: rgba(107, 46, 46, 0.08);
    border: 1px solid rgba(107, 46, 46, 0.1);
    color: var(--color-primary);
    font-size: 0.76rem;
    font-weight: 700;
  }

  @media (max-width: 720px) {
    .section-summary {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
</style>
