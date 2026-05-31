<template>
  <section class="combat-section">
    <div class="section-header">
      <div>
        <h3 class="section-label">Attacks</h3>
        <p class="section-copy">Tap an attack to see the full breakdown.</p>
      </div>
      <span class="attack-count">{{ attackRows.length }} total</span>
    </div>

    <div class="attack-list">
      <button
        v-for="attack in attackRows"
        :key="attack.key"
        type="button"
        class="attack-row"
        :class="{ 'attack-row--unarmed': attack.variant === 'unarmed' }"
        :aria-label="`View details for ${attack.name}`"
        @click="openAttackDetails(attack)"
      >
        <span class="attack-row__top">
          <span class="attack-name-wrap">
            <span class="attack-name">{{ attack.name }}</span>
            <span class="attack-subtitle">{{ attack.subtitle }}</span>
          </span>
          <span class="attack-chevron" aria-hidden="true">›</span>
        </span>

        <span class="attack-pill-row">
          <span class="attack-pill">
            <span class="attack-pill__label">To hit</span>
            <span class="attack-pill__value">{{ attack.bonus }}</span>
          </span>
          <span class="attack-pill">
            <span class="attack-pill__label">Damage</span>
            <span class="attack-pill__value">{{ attack.damage }}</span>
          </span>
          <span class="attack-pill attack-pill--type">
            <span class="attack-pill__label">Type</span>
            <span class="attack-pill__value">{{ attack.type }}</span>
          </span>
        </span>

        <span v-if="attack.meta" class="attack-meta">{{ attack.meta }}</span>
      </button>
    </div>

    <PopOut v-if="selectedAttack" :title="selectedAttack.name" :mini="true" @close="closeAttackDetails">
      <div class="attack-details">
        <p class="attack-details__intro">{{ selectedAttack.subtitle }}</p>

        <div class="attack-details__stats">
          <article class="attack-detail-stat">
            <span class="attack-detail-stat__label">To hit</span>
            <strong class="attack-detail-stat__value">{{ selectedAttack.bonus }}</strong>
          </article>
          <article class="attack-detail-stat">
            <span class="attack-detail-stat__label">Damage</span>
            <strong class="attack-detail-stat__value">{{ selectedAttack.damage }}</strong>
          </article>
          <article class="attack-detail-stat">
            <span class="attack-detail-stat__label">Type</span>
            <strong class="attack-detail-stat__value">{{ selectedAttack.type }}</strong>
          </article>
        </div>

        <div class="attack-detail-list">
          <article
            v-for="detail in selectedAttack.details"
            :key="`${selectedAttack.key}-${detail.label}`"
            class="attack-detail-row"
          >
            <span class="attack-detail-row__label">{{ detail.label }}</span>
            <span class="attack-detail-row__value">{{ detail.value }}</span>
          </article>
        </div>
      </div>
    </PopOut>
  </section>
</template>

<script setup lang="ts">
  import { computed, ref } from 'vue';
  import PopOut from '../../../PopOut.vue';
  import type { Item, playerCharacter } from '../../../../types';
  import { abilityMod } from '../../../../helperFunctions';

  const props = defineProps<{
    character: playerCharacter;
  }>();

  type AttackRow = {
    key: string;
    name: string;
    subtitle: string;
    bonus: string;
    damage: string;
    type: string;
    meta?: string;
    details: Array<{ label: string; value: string }>;
    variant: 'unarmed' | 'equipped' | 'saved';
  };

  const selectedAttack = ref<AttackRow | null>(null);

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

  const unarmedAttack = computed(() => {
    const strMod = abilityMod(props.character.abilityScores.str);
    const bonus = strMod + props.character.proficiencyModifier;
    return bonus >= 0 ? `+${bonus}` : `${bonus}`;
  });

  const unarmedDamage = computed(() => {
    const strMod = abilityMod(props.character.abilityScores.str);
    if (strMod === 0) return '1';
    if (strMod > 0) return `1 + ${strMod}`;
    return `${Math.max(1, 1 + strMod)}`;
  });

  const attackRows = computed<AttackRow[]>(() => {
    const rows: AttackRow[] = [
      {
        key: 'unarmed',
        name: 'Unarmed Strike',
        subtitle: 'Default melee attack',
        bonus: unarmedAttack.value,
        damage: unarmedDamage.value,
        type: 'Bludgeoning',
        details: [
          { label: 'Source', value: 'Base character action' },
          { label: 'Reach', value: '5 ft.' },
          { label: 'Rules', value: 'Use Strength for the attack and damage rolls unless another feature changes it.' },
        ],
        variant: 'unarmed',
      },
    ];

    rows.push(...getEquippedWeaponRows(props.character));

    (props.character.attacks ?? []).forEach((atk, index) => {
      rows.push({
        key: `saved-${index}-${atk.name}`,
        name: atk.name,
        subtitle: 'Custom saved attack',
        bonus: `${atk.attackBonus >= 0 ? '+' : ''}${atk.attackBonus}`,
        damage: atk.damage,
        type: atk.damageType ?? '—',
        meta: atk.notes,
        details: [
          { label: 'Source', value: 'Saved custom attack' },
          { label: 'Damage', value: atk.damage || '—' },
          { label: 'Damage type', value: atk.damageType ?? '—' },
          ...(atk.notes ? [{ label: 'Notes', value: atk.notes }] : []),
        ],
        variant: 'saved',
      });
    });

    return rows;
  });

  function getEquippedWeaponRows(character: playerCharacter): AttackRow[] {
    return (character.inventory ?? [])
      .filter(item => item.equipped && item.weapon && item.dmg1)
      .map((item, index) => {
        const attackMod = getWeaponAbilityMod(character, item);
        const proficient = isProficientWithWeapon(character, item);
        const magicBonus = getWeaponMagicBonus(item);
        const attackBonus = attackMod + (proficient ? character.proficiencyModifier : 0) + magicBonus;
        const rangeText = typeof item.range === 'string' ? item.range : undefined;
        const ammoInfo = getAmmoInfo(character, item);
        const propertyText = getPropertyText(item);
        const metaParts = [
          rangeText ? `Range ${rangeText}` : undefined,
          ammoInfo,
          propertyText,
        ].filter((value): value is string => Boolean(value));

        return {
          key: `equipped-${index}-${item.name}`,
          name: item.displayName || item.name,
          subtitle: getWeaponSubtitle(item),
          bonus: formatSignedNumber(attackBonus),
          damage: getWeaponDamageText(item, attackMod),
          type: getDamageTypeLabel(item.dmgType),
          meta: metaParts.join(' • ') || undefined,
          details: [
            { label: 'Source', value: 'Equipped weapon' },
            { label: 'Weapon type', value: getWeaponSubtitle(item) },
            { label: 'Attack ability', value: getAttackAbilityLabel(character, item) },
            { label: 'Proficient', value: proficient ? 'Yes' : 'No' },
            ...(magicBonus !== 0 ? [{ label: 'Magic bonus', value: formatSignedNumber(magicBonus) }] : []),
            ...(rangeText ? [{ label: 'Range', value: rangeText }] : []),
            ...(ammoInfo ? [{ label: 'Ammunition', value: ammoInfo }] : []),
            ...(propertyText ? [{ label: 'Properties', value: propertyText }] : []),
          ],
          variant: 'equipped',
        };
      });
  }

  function openAttackDetails(attack: AttackRow) {
    selectedAttack.value = attack;
  }

  function closeAttackDetails() {
    selectedAttack.value = null;
  }

  function getWeaponAbilityMod(character: playerCharacter, item: Item): number {
    const strMod = abilityMod(character.abilityScores.str);
    const dexMod = abilityMod(character.abilityScores.dex);
    const properties = getPropertyCodes(item);

    if (item.type === 'R') return dexMod;
    if (properties.includes('F')) return Math.max(strMod, dexMod);
    return strMod;
  }

  function getAttackAbilityLabel(character: playerCharacter, item: Item): string {
    const strMod = abilityMod(character.abilityScores.str);
    const dexMod = abilityMod(character.abilityScores.dex);
    const properties = getPropertyCodes(item);

    if (item.type === 'R') return `Dexterity (${formatSignedNumber(dexMod)})`;
    if (properties.includes('F')) {
      if (dexMod > strMod) return `Dexterity (${formatSignedNumber(dexMod)})`;
      return `Strength (${formatSignedNumber(strMod)})`;
    }

    return `Strength (${formatSignedNumber(strMod)})`;
  }

  function getWeaponSubtitle(item: Item): string {
    const parts = [
      item.weaponCategory,
      item.type === 'R' ? 'Ranged weapon' : 'Melee weapon',
    ].filter((value): value is string => Boolean(value));
    return parts.join(' • ') || 'Weapon';
  }

  function isProficientWithWeapon(character: playerCharacter, item: Item): boolean {
    const proficiencies = character.allProficiencies?.weaponProficiencies ?? [];
    const normalizedProficiencies = proficiencies.map(value => value.toLowerCase().trim());
    const itemName = (item.displayName || item.name).toLowerCase();
    const category = `${item.weaponCategory ?? ''} weapons`.trim().toLowerCase();

    return (
      normalizedProficiencies.includes(itemName) ||
      (category.length > 0 && normalizedProficiencies.includes(category))
    );
  }

  function getWeaponMagicBonus(item: Item): number {
    if (typeof item.bonusWeapon !== 'string') return 0;
    const parsed = Number.parseInt(item.bonusWeapon.replace(/[^-\d]/g, ''), 10);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function getWeaponDamageText(item: Item, modifier: number): string {
    const baseDamage = `${item.dmg1}${modifier === 0 ? '' : modifier > 0 ? ` + ${modifier}` : ` - ${Math.abs(modifier)}`}`;
    if (!item.dmg2) return baseDamage;
    const versatileDamage = `${item.dmg2}${modifier === 0 ? '' : modifier > 0 ? ` + ${modifier}` : ` - ${Math.abs(modifier)}`}`;
    return `${baseDamage} (${versatileDamage} versatile)`;
  }

  function getDamageTypeLabel(rawType: unknown): string {
    if (typeof rawType !== 'string' || !rawType) return '—';
    return DAMAGE_TYPE_LABELS[rawType] ?? rawType;
  }

  function getPropertyCodes(item: Item): string[] {
    return Array.isArray(item.property) ? item.property.filter((value): value is string => typeof value === 'string') : [];
  }

  function getPropertyText(item: Item): string | undefined {
    const labels = getPropertyCodes(item).map(code => PROPERTY_LABELS[code] ?? code);
    return labels.length ? labels.join(', ') : undefined;
  }

  function getAmmoInfo(character: playerCharacter, item: Item): string | undefined {
    if (typeof item.ammoType !== 'string' || !item.ammoType) return undefined;

    const ammoSlug = item.ammoType.split('|')[0] ?? item.ammoType;
    const ammoCount = (character.inventory ?? []).reduce((total, inventoryItem) => {
      const directMatch = normalizeItemName(inventoryItem.name) === ammoSlug || normalizeItemName(inventoryItem.displayName || '') === ammoSlug;
      if (directMatch) return total + 1;

      const packedCount = Array.isArray(inventoryItem.packContents)
        ? inventoryItem.packContents.reduce((sum: number, entry: { item?: string; quantity?: number }) => {
            const packedSlug = typeof entry.item === 'string' ? entry.item.split('|')[0] : '';
            if (packedSlug !== ammoSlug) return sum;
            return sum + Math.max(0, Number(entry.quantity ?? 0));
          }, 0)
        : 0;

      return total + packedCount;
    }, 0);

    const ammoLabel = ammoSlug.replace(/-/g, ' ');
    return ammoCount > 0 ? `Ammo ${ammoCount} ${ammoLabel}${ammoCount === 1 ? '' : 's'}` : `Ammo ${ammoLabel}`;
  }

  function normalizeItemName(value: string): string {
    return value.toLowerCase().replace(/[’']/g, '').replace(/\s*\(\d+\)$/g, '').trim();
  }

  function formatSignedNumber(value: number): string {
    return value >= 0 ? `+${value}` : `${value}`;
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
    gap: 0.45rem;
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .section-label {
    font-size: 0.72rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--color-muted);
    margin: 0;
  }

  .section-copy {
    margin: 0.15rem 0 0;
    color: var(--color-muted);
    font-size: 0.8rem;
  }

  .attack-count {
    padding: 0.2rem 0.65rem;
    border-radius: 999px;
    background: rgba(107, 46, 46, 0.08);
    border: 1px solid rgba(107, 46, 46, 0.12);
    color: var(--color-primary);
    font-size: 0.78rem;
    font-weight: 700;
  }

  .attack-list {
    display: grid;
    gap: 0.55rem;
  }

  .attack-row {
    width: 100%;
    display: grid;
    gap: 0.55rem;
    padding: 0.7rem 0.8rem;
    border-radius: 14px;
    border: 1px solid rgba(107, 46, 46, 0.1);
    background: rgba(255, 255, 255, 0.58);
    color: inherit;
    text-align: left;
    cursor: pointer;
    transition: transform 0.12s ease, box-shadow 0.12s ease, border-color 0.12s ease;
  }

  .attack-row--unarmed .attack-name {
    color: var(--color-muted);
    font-style: italic;
  }

  .attack-row:hover,
  .attack-row:focus-visible {
    transform: translateY(-1px);
    box-shadow: 0 8px 18px rgba(31, 27, 22, 0.08);
    border-color: rgba(107, 46, 46, 0.2);
  }

  .attack-row:focus-visible {
    outline: 2px solid rgba(107, 46, 46, 0.22);
    outline-offset: 2px;
  }

  .attack-row__top {
    display: flex;
    justify-content: space-between;
    gap: 0.75rem;
    align-items: flex-start;
  }

  .attack-name {
    font-weight: 600;
    font-size: 0.94rem;
  }

  .attack-name-wrap {
    display: grid;
    gap: 0.15rem;
    min-width: 0;
  }

  .attack-subtitle {
    font-size: 0.74rem;
    color: var(--color-muted);
  }

  .attack-chevron {
    font-size: 1.4rem;
    line-height: 1;
    color: var(--color-muted);
  }

  .attack-pill-row {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.4rem;
  }

  .attack-pill {
    display: grid;
    gap: 0.15rem;
    padding: 0.45rem 0.55rem;
    border-radius: 12px;
    background: rgba(107, 46, 46, 0.06);
    border: 1px solid rgba(107, 46, 46, 0.08);
    min-width: 0;
  }

  .attack-pill--type {
    background: rgba(31, 27, 22, 0.04);
  }

  .attack-pill__label {
    font-size: 0.6rem;
    font-weight: 700;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: var(--color-muted);
  }

  .attack-pill__value {
    font-size: 0.78rem;
    font-weight: 700;
    color: var(--color-primary);
    overflow-wrap: anywhere;
  }

  .attack-meta {
    font-size: 0.68rem;
    color: var(--color-muted);
    line-height: 1.25;
    overflow-wrap: anywhere;
  }

  .attack-details {
    display: grid;
    gap: 1rem;
    min-width: min(78vw, 460px);
  }

  .attack-details__intro {
    margin: 0;
    color: var(--color-muted);
    font-size: 0.92rem;
  }

  .attack-details__stats {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.6rem;
  }

  .attack-detail-stat {
    display: grid;
    gap: 0.2rem;
    padding: 0.7rem;
    border-radius: 12px;
    background: rgba(107, 46, 46, 0.06);
    border: 1px solid rgba(107, 46, 46, 0.08);
  }

  .attack-detail-stat__label,
  .attack-detail-row__label {
    font-size: 0.68rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-muted);
    font-weight: 700;
  }

  .attack-detail-stat__value {
    font-size: 0.95rem;
    color: var(--color-primary);
  }

  .attack-detail-list {
    display: grid;
    gap: 0.55rem;
  }

  .attack-detail-row {
    display: grid;
    gap: 0.2rem;
    padding: 0.7rem 0.8rem;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.62);
    border: 1px solid rgba(107, 46, 46, 0.08);
  }

  .attack-detail-row__value {
    font-size: 0.92rem;
    line-height: 1.4;
    color: var(--color-text);
    overflow-wrap: anywhere;
  }

  @media (max-width: 700px) {
    .combat-section {
      padding: 0.75rem;
    }

    .attack-pill-row,
    .attack-details__stats {
      grid-template-columns: 1fr;
    }

    .attack-details {
      min-width: 0;
    }
  }
</style>
