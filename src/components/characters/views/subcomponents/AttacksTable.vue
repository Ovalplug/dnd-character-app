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
      <!-- Unarmed Strike -->
      <div class="attack-row attack-row--unarmed">
        <span class="attack-name">Unarmed Strike</span>
        <span class="attack-bonus">{{ unarmedAttack }}</span>
        <span class="attack-dmg">{{ unarmedDamage }}</span>
        <span class="attack-type">Bludgeoning</span>
      </div>
      <!-- Saved attacks -->
      <div v-for="(atk, i) in character.attacks ?? []" :key="i" class="attack-row">
        <span class="attack-name">{{ atk.name }}</span>
        <span class="attack-bonus">{{ atk.attackBonus >= 0 ? '+' : '' }}{{ atk.attackBonus }}</span>
        <span class="attack-dmg">{{ atk.damage }}</span>
        <span class="attack-type">{{ atk.damageType ?? '—' }}</span>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
  import { computed } from 'vue';
  import type { playerCharacter } from '../../../../types';
  import { abilityMod } from '../../../../helperFunctions';

  const props = defineProps<{
    character: playerCharacter;
  }>();

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
