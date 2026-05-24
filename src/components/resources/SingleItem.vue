<template>
  <article class="single-item">
    <header class="item-header">
      <div v-if="itemTags.length" class="item-tags">
        <span v-for="tag in itemTags" :key="tag" class="item-tag">{{ tag }}</span>
      </div>
    </header>

    <p v-if="item.source" class="source-line">
      Source: {{ item.source }}<span v-if="item.page"> (page {{ item.page }})</span>
    </p>

    <div v-if="summaryFields.length" class="item-summary">
      <p v-for="field in summaryFields" :key="field.label">
        <strong>{{ field.label }}:</strong> {{ field.value }}
      </p>
    </div>

    <div v-if="vehicleFields.length" class="item-section inset">
      <h3>Vehicle Details</h3>
      <p v-for="field in vehicleFields" :key="field.label">
        <strong>{{ field.label }}:</strong> {{ field.value }}
      </p>
    </div>

    <div v-if="item.attachedSpells?.length" class="item-section inset">
      <h3>Attached Spells</h3>
      <p>{{ item.attachedSpells.join(', ') }}</p>
    </div>

    <div v-if="item.seeAlsoVehicle?.length" class="item-section inset">
      <h3>Related Vehicles</h3>
      <p>{{ item.seeAlsoVehicle.join(', ') }}</p>
    </div>

    <div v-if="item.entries?.length" class="item-section">
      <ResourceEntries :entries="item.entries" />
    </div>
  </article>
</template>

<script lang="ts" setup>
  import { computed } from 'vue';
  import type { Item } from '../../types';
  import ResourceEntries from './ResourceEntries.vue';

  const { item } = defineProps<{ item: Item }>();

  const itemTags = computed(() => {
    const tags = [item.rarity, item.type];
    if (item.wondrous) tags.push('Wondrous Item');
    if (item.tattoo) tags.push('Tattoo');
    if (item.reqAttune === true) tags.push('Requires Attunement');
    if (typeof item.reqAttune === 'string') tags.push(`Attunement: ${item.reqAttune}`);
    return tags.filter((tag): tag is string => Boolean(tag));
  });

  const summaryFields = computed(() => {
    const fields: Array<{ label: string; value: string | number }> = [];

    if (item.value !== undefined) fields.push({ label: 'Value', value: formatValue(item.value) });
    if (item.weight !== undefined) fields.push({ label: 'Weight', value: `${item.weight} lb.` });
    if (item.bonusWeapon) fields.push({ label: 'Weapon Bonus', value: item.bonusWeapon });
    if (item.charges !== undefined) fields.push({ label: 'Charges', value: item.charges });
    if (item.recharge) fields.push({ label: 'Recharge', value: item.recharge });
    if (item.age) fields.push({ label: 'Age', value: item.age });
    if (item.ammoType) fields.push({ label: 'Ammunition Type', value: item.ammoType });

    return fields;
  });

  const vehicleFields = computed(() => {
    const fields: Array<{ label: string; value: string | number }> = [];

    if (item.crew !== undefined) fields.push({ label: 'Crew', value: item.crew });
    if (item.vehAc !== undefined) fields.push({ label: 'AC', value: item.vehAc });
    if (item.vehHp !== undefined) fields.push({ label: 'HP', value: item.vehHp });
    if (item.vehDmgThresh !== undefined) {
      fields.push({ label: 'Damage Threshold', value: item.vehDmgThresh });
    }
    if (item.vehSpeed !== undefined) fields.push({ label: 'Speed', value: item.vehSpeed });
    if (item.capCargo !== undefined) fields.push({ label: 'Cargo Capacity', value: item.capCargo });

    return fields;
  });

  function formatValue(value: number) {
    if (value >= 100) return `${value.toLocaleString()} cp`;
    return `${value} cp`;
  }
</script>

<style scoped>
  .single-item {
    display: grid;
    gap: 0.9rem;
  }

  .item-header h2 {
    margin: 0;
  }

  .item-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.45rem;
    margin-top: 0.5rem;
  }

  .item-tag {
    padding: 0.2rem 0.55rem;
    border-radius: 999px;
    background: rgba(107, 46, 46, 0.08);
    border: 1px solid rgba(107, 46, 46, 0.16);
    font-size: 0.85rem;
  }

  .source-line,
  .item-summary p,
  .item-section p {
    margin: 0.2rem 0;
  }

  .source-line {
    color: var(--color-muted);
    font-size: 0.95rem;
  }

  .item-summary {
    display: grid;
    gap: 0.2rem;
  }

  .item-section {
    display: grid;
    gap: 0.3rem;
  }

  .item-section h3 {
    margin: 0;
    font-size: 1rem;
  }

  .inset {
    border-left: 3px solid var(--color-accent);
    padding: 0.65rem 0.8rem;
    background: rgba(107, 46, 46, 0.04);
    border-radius: 0 6px 6px 0;
  }
 </style>