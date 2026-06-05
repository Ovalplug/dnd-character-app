<template>
  <article class="single-item">
    <header class="item-header">
      <div class="item-heading">
        <h2>{{ item.displayName || item.name }}</h2>
        <p v-if="itemSubtitle" class="item-subtitle">{{ itemSubtitle }}</p>
      </div>

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

    <div v-if="combatFields.length" class="item-section inset">
      <h3>Combat Details</h3>
      <p v-for="field in combatFields" :key="field.label">
        <strong>{{ field.label }}:</strong> {{ field.value }}
      </p>
    </div>

    <div v-if="vehicleFields.length" class="item-section inset">
      <h3>Vehicle Details</h3>
      <p v-for="field in vehicleFields" :key="field.label">
        <strong>{{ field.label }}:</strong> {{ field.value }}
      </p>
    </div>

    <div v-if="linkedSpells.length" class="item-section inset">
      <h3>Attached Spells</h3>
      <p>{{ linkedSpells.join(', ') }}</p>
    </div>

    <div v-if="relatedVehicles.length" class="item-section inset">
      <h3>Related Vehicles</h3>
      <p>{{ relatedVehicles.join(', ') }}</p>
    </div>

    <div v-if="relatedDecks.length" class="item-section inset">
      <h3>Related Decks</h3>
      <p>{{ relatedDecks.join(', ') }}</p>
    </div>

    <div v-if="additionalSources.length" class="item-section inset">
      <h3>Other Sources</h3>
      <p>{{ additionalSources.join(', ') }}</p>
    </div>

    <div v-if="item.entries?.length" class="item-section">
      <ResourceEntries :entries="item.entries" />
    </div>
  </article>
</template>

<script lang="ts" setup>
  import { computed } from 'vue';
  import type { Item } from '../../types';
  import { getPrettyItemType, itemRequiresAttunement } from '../../helperFunctions';
  import ResourceEntries from './ResourceEntries.vue';

  const { item } = defineProps<{ item: Item }>();

  const DAMAGE_TYPE_LABELS: Record<string, string> = {
    B: 'Bludgeoning',
    P: 'Piercing',
    S: 'Slashing',
    A: 'Acid',
    C: 'Cold',
    F: 'Fire',
    FC: 'Force',
    L: 'Lightning',
    N: 'Necrotic',
    PS: 'Poison',
    I: 'Psychic',
    R: 'Radiant',
    T: 'Thunder',
  };

  const PROPERTY_LABELS: Record<string, string> = {
    A: 'Ammunition',
    F: 'Finesse',
    H: 'Heavy',
    L: 'Light',
    LD: 'Loading',
    R: 'Reach',
    S: 'Special',
    T: 'Thrown',
    '2H': 'Two-Handed',
    V: 'Versatile',
  };

  type DisplayField = { label: string; value: string | number };

  const itemSubtitle = computed(() => {
    const parts = [item.weaponCategory, getPrettyItemType(item.type)].filter(
      (value): value is string => typeof value === 'string' && value.length > 0
    );
    return parts.join(' • ');
  });

  const itemTags = computed(() => {
    const tags = [item.rarity, getPrettyItemType(item.type)];
    if (item.wondrous) tags.push('Wondrous Item');
    if (item.tattoo) tags.push('Tattoo');
    if (item.armor === true) tags.push('Armor');
    if (item.weapon === true) tags.push('Weapon');
    if (itemRequiresAttunement(item)) tags.push('Requires Attunement');
    return tags.filter((tag): tag is string => Boolean(tag));
  });

  const summaryFields = computed(() => {
    const fields: DisplayField[] = [];

    if (typeof item.reqAttune === 'string') {
      fields.push({ label: 'Attunement', value: item.reqAttune });
    } else if (item.reqAttune === true) {
      fields.push({ label: 'Attunement', value: 'Required' });
    }
    if (item.value !== undefined) fields.push({ label: 'Value', value: formatValue(item.value) });
    if (item.weight !== undefined) fields.push({ label: 'Weight', value: `${item.weight} lb.` });
    if (typeof item.ac === 'number' || typeof item.ac === 'string') {
      fields.push({ label: 'Base AC', value: item.ac });
    }
    if (typeof item.bonusAc === 'string') fields.push({ label: 'AC Bonus', value: item.bonusAc });
    if (item.bonusWeapon) fields.push({ label: 'Weapon Bonus', value: item.bonusWeapon });
    if (item.charges !== undefined) fields.push({ label: 'Charges', value: item.charges });
    if (item.recharge) fields.push({ label: 'Recharge', value: item.recharge });
    if (item.age) fields.push({ label: 'Age', value: item.age });
    if (item.ammoType) {
      fields.push({ label: 'Ammunition Type', value: formatLinkedValue(item.ammoType) });
    }

    return fields;
  });

  const combatFields = computed(() => {
    const fields: DisplayField[] = [];

    if (item.dmg1) {
      const damage = item.dmg2 ? `${item.dmg1} (${item.dmg2} versatile)` : item.dmg1;
      fields.push({ label: 'Damage', value: damage });
    }
    if (item.dmgType) {
      fields.push({ label: 'Damage Type', value: DAMAGE_TYPE_LABELS[item.dmgType] ?? item.dmgType });
    }

    const propertyText = getPropertyText(item.property);
    if (propertyText) fields.push({ label: 'Properties', value: propertyText });

    const rangeText = formatRange(item.range);
    if (rangeText) fields.push({ label: 'Range', value: rangeText });

    return fields;
  });

  const vehicleFields = computed(() => {
    const fields: DisplayField[] = [];

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

  const linkedSpells = computed(() => getFlatStrings(item.attachedSpells).map(formatLinkedValue));

  const relatedVehicles = computed(() =>
    getFlatStrings(item.seeAlsoVehicle).map(formatLinkedValue)
  );

  const relatedDecks = computed(() => getFlatStrings(item.seeAlsoDeck).map(formatLinkedValue));

  const additionalSources = computed(() => {
    if (!Array.isArray(item.otherSources)) return [];

    return item.otherSources
      .map(source => {
        if (!source?.source) return null;
        return source.page ? `${source.source} p. ${source.page}` : source.source;
      })
      .filter((value): value is string => Boolean(value));
  });

  function getFlatStrings(value: unknown): string[] {
    if (typeof value === 'string') return [value];
    if (Array.isArray(value)) return value.flatMap(entry => getFlatStrings(entry));
    if (value && typeof value === 'object') {
      return Object.values(value).flatMap(entry => getFlatStrings(entry));
    }
    return [];
  }

  function formatLinkedValue(value: string): string {
    const [name, source] = value.split('|');
    if (!source) return name ?? value;
    return `${name} (${source})`;
  }

  function getPropertyText(value: unknown): string | null {
    if (!Array.isArray(value)) return null;

    const labels = value
      .filter((entry): entry is string => typeof entry === 'string')
      .map(entry => PROPERTY_LABELS[entry] ?? entry);

    return labels.length ? labels.join(', ') : null;
  }

  function formatRange(value: unknown): string | null {
    if (!value) return null;
    if (typeof value === 'string') return value;
    if (typeof value !== 'object') return null;

    const text = getFlatStrings(value).filter(Boolean);
    return text.length ? text.join(', ') : null;
  }

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

  .item-header {
    display: grid;
    gap: 0.45rem;
  }

  .item-heading {
    display: grid;
    gap: 0.2rem;
  }

  .item-header h2 {
    margin: 0;
  }

  .item-subtitle {
    margin: 0;
    color: var(--color-muted);
    font-size: 0.95rem;
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
