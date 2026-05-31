<template>
  <section class="combat-section">
    <h3 class="section-label">Attacks</h3>
    <div class="attack-table">
      <div class="attack-header">
        <span>Name</span>
        <span>To Hit</span>
        <span>Damage</span>
        <span>Type</span>
      </div>
      <div
        v-for="attack in attackRows"
        :key="attack.key"
        class="attack-row"
        :class="{ 'attack-row--unarmed': attack.variant === 'unarmed' }"
      >
        <span class="attack-name-wrap">
          <span class="attack-name">{{ attack.name }}</span>
          <span v-if="attack.meta" class="attack-meta">{{ attack.meta }}</span>
        </span>
        <span class="attack-bonus">{{ attack.bonus }}</span>
        <span class="attack-dmg">{{ attack.damage }}</span>
        <span class="attack-type">{{ attack.type }}</span>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
  import { computed } from 'vue';
  import type { Item, playerCharacter } from '../../../../types';
  import { abilityMod } from '../../../../helperFunctions';

  const props = defineProps<{
    character: playerCharacter;
  }>();

  type AttackRow = {
    key: string;
    name: string;
    bonus: string;
    damage: string;
    type: string;
    meta?: string;
    variant: 'unarmed' | 'equipped' | 'saved';
  };

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
        bonus: unarmedAttack.value,
        damage: unarmedDamage.value,
        type: 'Bludgeoning',
        variant: 'unarmed',
      },
    ];

    rows.push(...getEquippedWeaponRows(props.character));

    (props.character.attacks ?? []).forEach((atk, index) => {
      rows.push({
        key: `saved-${index}-${atk.name}`,
        name: atk.name,
        bonus: `${atk.attackBonus >= 0 ? '+' : ''}${atk.attackBonus}`,
        damage: atk.damage,
        type: atk.damageType ?? '—',
        meta: atk.notes,
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
        const attackBonus = attackMod + (isProficientWithWeapon(character, item) ? character.proficiencyModifier : 0) + getWeaponMagicBonus(item);
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
          bonus: formatSignedNumber(attackBonus),
          damage: getWeaponDamageText(item, attackMod),
          type: getDamageTypeLabel(item.dmgType),
          meta: metaParts.join(' • ') || undefined,
          variant: 'equipped',
        };
      });
  }

  function getWeaponAbilityMod(character: playerCharacter, item: Item): number {
    const strMod = abilityMod(character.abilityScores.str);
    const dexMod = abilityMod(character.abilityScores.dex);
    const properties = getPropertyCodes(item);

    if (item.type === 'R') return dexMod;
    if (properties.includes('F')) return Math.max(strMod, dexMod);
    return strMod;
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
    gap: 0.6rem;
  }

  .section-label {
    font-size: 0.72rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--color-muted);
    margin: 0;
  }

  .attack-table {
    width: 100%;
    font-size: 0.88rem;
  }

  .attack-header,
  .attack-row {
    display: grid;
    grid-template-columns: 1fr 60px 80px 90px;
    gap: 0.25rem;
    padding: 0.35rem 0;
    border-bottom: 1px solid rgba(31, 27, 22, 0.06);
    align-items: center;
  }

  .attack-header {
    font-size: 0.65rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-muted);
    border-bottom: 1px solid rgba(31, 27, 22, 0.12);
    padding-bottom: 0.3rem;
  }

  .attack-row:last-child {
    border-bottom: none;
  }

  .attack-row--unarmed .attack-name {
    color: var(--color-muted);
    font-style: italic;
  }

  .attack-name {
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .attack-name-wrap {
    display: grid;
    gap: 0.2rem;
    min-width: 0;
  }

  .attack-meta {
    font-size: 0.72rem;
    color: var(--color-muted);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .attack-bonus {
    font-weight: 700;
    color: var(--color-primary);
    text-align: center;
  }

  .attack-dmg {
    font-weight: 600;
    text-align: center;
  }

  .attack-type {
    font-size: 0.78rem;
    color: var(--color-muted);
    text-align: right;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
