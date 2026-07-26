<template>
  <article class="single-item">
    <!-- ── Header ── -->
    <header class="item-header">
      <div class="item-heading">
        <h2>{{ item.displayName || item.name }}</h2>
        <p v-if="itemSubtitle" class="item-subtitle">{{ itemSubtitle }}</p>
      </div>

      <div class="item-badge-row">
        <span
          v-if="item.rarity && item.rarity !== 'none'"
          class="item-badge item-badge--rarity"
          :class="`rarity-${item.rarity.replace(' ', '-')}`"
          >{{ capitalizeRarity(item.rarity) }}</span
        >
        <span v-if="itemRequiresAttunement(item)" class="item-badge item-badge--attune">
          {{
            typeof item.reqAttune === 'string'
              ? `Attunement: ${item.reqAttune}`
              : 'Requires Attunement'
          }}
        </span>
        <span v-for="prop in itemProperties" :key="prop" class="item-badge item-badge--prop">{{
          prop
        }}</span>
      </div>
    </header>

    <p v-if="item.source" class="source-line">
      {{ item.source }}<span v-if="item.page"> · p. {{ item.page }}</span>
    </p>

    <!-- ── Stat grid ── -->
    <div v-if="summaryFields.length" class="item-stat-grid">
      <div v-for="field in summaryFields" :key="field.label" class="item-stat">
        <span class="item-stat__label">{{ field.label }}</span>
        <span class="item-stat__value">{{ field.value }}</span>
      </div>
    </div>

    <!-- ── Combat ── -->
    <div v-if="combatFields.length" class="item-section inset">
      <h3>Combat</h3>
      <div class="item-stat-grid">
        <div v-for="field in combatFields" :key="field.label" class="item-stat">
          <span class="item-stat__label">{{ field.label }}</span>
          <span class="item-stat__value">{{ field.value }}</span>
        </div>
      </div>
    </div>

    <!-- ── Vehicle ── -->
    <div v-if="vehicleFields.length" class="item-section inset">
      <h3>Vehicle</h3>
      <div class="item-stat-grid">
        <div v-for="field in vehicleFields" :key="field.label" class="item-stat">
          <span class="item-stat__label">{{ field.label }}</span>
          <span class="item-stat__value">{{ field.value }}</span>
        </div>
      </div>
    </div>

    <!-- ── Linked info ── -->
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

    <!-- ── Description ── -->
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

  const props = defineProps<{ item: Item }>();

  /**
   * Generic Variant (GV) items store rarity, entries, bonusAc, page, etc. under
   * `inherits`. Merge those into the top-level item, resolving {=fieldName}
   * template variables used in entries.
   */
  function resolveGVItem(raw: Item): Item {
    const r = raw as Record<string, any>;
    const inh = r.inherits as Record<string, any> | undefined;
    if (!inh) return raw;

    // Inherited fields are the base; top-level overrides them (except 'inherits' itself)
    const merged: Record<string, any> = { ...inh };
    for (const key of Object.keys(r)) {
      if (key !== 'inherits' && r[key] !== undefined) merged[key] = r[key];
    }

    // Resolve {=fieldName} template vars in entries using inherited values
    const resolveEntry = (e: unknown): unknown => {
      if (typeof e === 'string')
        return e.replace(/\{=(\w+)\}/g, (_: string, k: string) =>
          inh[k] !== undefined ? String(inh[k]) : `{=${k}}`
        );
      if (Array.isArray(e)) return e.map(resolveEntry);
      return e;
    };

    if (merged.entries) merged.entries = resolveEntry(merged.entries);

    return merged as unknown as Item;
  }

  /** Effective item — GV inherits resolved, template vars substituted */
  const item = computed(() => resolveGVItem(props.item));

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
    const i = item.value;
    const parts = [i.weaponCategory, getPrettyItemType(i.type)].filter(
      (value): value is string => typeof value === 'string' && value.length > 0
    );
    return parts.join(' • ');
  });

  /** Property badges shown below the rarity/attunement row */
  const itemProperties = computed(() => {
    const i = item.value as Record<string, any>;
    const badges: string[] = [];
    if (i.wondrous) badges.push('Wondrous Item');
    if (i.tattoo) badges.push('Tattoo');
    if (i.armor === true && !['LA', 'MA', 'HA', 'S'].includes(i.type ?? '')) badges.push('Armor');
    if (i.weapon === true && !['M', 'R'].includes(i.type ?? '')) badges.push('Weapon');
    if (Array.isArray(i.miscTags) && i.miscTags.includes('Curse')) badges.push('Cursed');
    return badges;
  });

  function capitalizeRarity(rarity: string): string {
    return rarity
      .split(' ')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }

  const summaryFields = computed(() => {
    const i = item.value as Record<string, any>;
    const fields: DisplayField[] = [];

    if (typeof i.reqAttune === 'string') {
      fields.push({ label: 'Attunement', value: i.reqAttune });
    } else if (i.reqAttune === true) {
      fields.push({ label: 'Attunement', value: 'Required' });
    }
    if (i.value !== undefined) fields.push({ label: 'Value', value: formatValue(i.value) });
    if (i.weight !== undefined) fields.push({ label: 'Weight', value: `${i.weight} lb.` });
    if (typeof i.ac === 'number' || typeof i.ac === 'string') {
      fields.push({ label: 'Base AC', value: i.ac });
    }
    if (typeof i.bonusAc === 'string') fields.push({ label: 'AC Bonus', value: i.bonusAc });
    if (i.bonusWeapon) fields.push({ label: 'Weapon Bonus', value: i.bonusWeapon });
    if (i.charges !== undefined) fields.push({ label: 'Charges', value: i.charges });
    if (i.recharge) fields.push({ label: 'Recharge', value: i.recharge });
    if (i.age) fields.push({ label: 'Age', value: i.age });
    if (i.ammoType) {
      fields.push({ label: 'Ammunition Type', value: formatLinkedValue(i.ammoType) });
    }

    return fields;
  });

  const combatFields = computed(() => {
    const i = item.value as Record<string, any>;
    const fields: DisplayField[] = [];

    if (i.dmg1) {
      const damage = i.dmg2 ? `${i.dmg1} (${i.dmg2} versatile)` : i.dmg1;
      fields.push({ label: 'Damage', value: damage });
    }
    if (i.dmgType) {
      fields.push({
        label: 'Damage Type',
        value: DAMAGE_TYPE_LABELS[i.dmgType] ?? i.dmgType,
      });
    }

    const propertyText = getPropertyText(i.property);
    if (propertyText) fields.push({ label: 'Properties', value: propertyText });

    const rangeText = formatRange(i.range);
    if (rangeText) fields.push({ label: 'Range', value: rangeText });

    return fields;
  });

  const vehicleFields = computed(() => {
    const i = item.value as Record<string, any>;
    const fields: DisplayField[] = [];

    if (i.crew !== undefined) fields.push({ label: 'Crew', value: i.crew });
    if (i.vehAc !== undefined) fields.push({ label: 'AC', value: i.vehAc });
    if (i.vehHp !== undefined) fields.push({ label: 'HP', value: i.vehHp });
    if (i.vehDmgThresh !== undefined) {
      fields.push({ label: 'Damage Threshold', value: i.vehDmgThresh });
    }
    if (i.vehSpeed !== undefined) fields.push({ label: 'Speed', value: i.vehSpeed });
    if (i.capCargo !== undefined) fields.push({ label: 'Cargo Capacity', value: i.capCargo });

    return fields;
  });

  const linkedSpells = computed(() =>
    getFlatStrings((item.value as any).attachedSpells).map(formatLinkedValue)
  );

  const relatedVehicles = computed(() =>
    getFlatStrings((item.value as any).seeAlsoVehicle).map(formatLinkedValue)
  );

  const relatedDecks = computed(() =>
    getFlatStrings((item.value as any).seeAlsoDeck).map(formatLinkedValue)
  );

  const additionalSources = computed(() => {
    const sources = (item.value as any).otherSources;
    if (!Array.isArray(sources)) return [];
    return sources
      .map((source: any) => {
        if (!source?.source) return null;
        return source.page ? `${source.source} p. ${source.page}` : source.source;
      })
      .filter((value: unknown): value is string => Boolean(value));
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

  function formatValue(cp: number) {
    if (cp === 0) return '0 cp';
    if (cp % 1000 === 0 && cp >= 1000) return `${(cp / 1000).toLocaleString()} pp`;
    if (cp % 100 === 0 && cp >= 100) return `${(cp / 100).toLocaleString()} gp`;
    if (cp % 10 === 0 && cp >= 10) return `${(cp / 10).toLocaleString()} sp`;
    return `${cp.toLocaleString()} cp`;
  }
</script>

<style scoped>
  .single-item {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  /* ── Header ── */
  .item-header {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .item-heading {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
  }

  .item-header h2 {
    margin: 0;
    font-size: 1.3rem;
    line-height: 1.2;
  }

  .item-subtitle {
    margin: 0;
    color: var(--color-muted);
    font-size: 0.9rem;
  }

  /* ── Badges ── */
  .item-badge-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    margin-top: 0.1rem;
  }

  .item-badge {
    padding: 0.2rem 0.6rem;
    border-radius: 999px;
    font-size: 0.8rem;
    font-weight: 600;
    line-height: 1.4;
  }

  .item-badge--rarity {
    color: #fff;
  }

  .rarity-common {
    background: #6b7280;
  }
  .rarity-uncommon {
    background: #15803d;
  }
  .rarity-rare {
    background: #1d4ed8;
  }
  .rarity-very-rare {
    background: #7c3aed;
  }
  .rarity-legendary {
    background: #b45309;
  }
  .rarity-artifact {
    background: #92400e;
  }
  .rarity-varies {
    background: #6b7280;
  }

  .item-badge--attune {
    background: rgba(201, 164, 75, 0.2);
    color: #6b4c00;
    border: 1px solid rgba(201, 164, 75, 0.4);
  }

  .item-badge--prop {
    background: rgba(107, 46, 46, 0.08);
    border: 1px solid rgba(107, 46, 46, 0.18);
    color: var(--color-primary);
  }

  /* ── Source ── */
  .source-line {
    margin: 0;
    color: var(--color-muted);
    font-size: 0.85rem;
  }

  /* ── Stat grid ── */
  .item-stat-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.5rem 1rem;
  }

  .item-stat {
    display: flex;
    flex-direction: column;
    gap: 0.05rem;
  }

  .item-stat__label {
    font-size: 0.72rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--color-muted);
  }

  .item-stat__value {
    font-size: 0.95rem;
    font-weight: 500;
    color: var(--color-text);
  }

  /* ── Sections ── */
  .item-section {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .item-section h3 {
    margin: 0;
    font-size: 0.85rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-muted);
  }

  .item-section p {
    margin: 0;
  }

  .inset {
    border-left: 3px solid var(--color-accent);
    padding: 0.7rem 0.9rem;
    background: rgba(107, 46, 46, 0.03);
    border-radius: 0 8px 8px 0;
  }
</style>
