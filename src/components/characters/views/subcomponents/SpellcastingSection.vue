<template>
  <section v-if="spellInfo.isSpellcaster" class="ability-section">
    <div class="section-header">
      <h2 class="section-title">Spellcasting</h2>
      <span class="section-badge section-badge--spell">{{
        getPrettyCastingMode(spellInfo.castingMode)
      }}</span>
    </div>

    <div class="spell-info-grid">
      <div v-if="spellInfo.spellcastingAbility" class="spell-stat">
        <span class="spell-stat-label">Ability</span>
        <span class="spell-stat-value">{{
          getPrettyAbilityName(spellInfo.spellcastingAbility).toUpperCase().slice(0, 3)
        }}</span>
      </div>
      <div v-if="character.spellcasting.spellSaveDC" class="spell-stat">
        <span class="spell-stat-label">Save DC</span>
        <span class="spell-stat-value">{{ character.spellcasting.spellSaveDC }}</span>
      </div>
      <div v-if="(character.spellcasting.spellAttackBonus ?? 0) !== 0" class="spell-stat">
        <span class="spell-stat-label">Atk Bonus</span>
        <span class="spell-stat-value">+{{ character.spellcasting.spellAttackBonus }}</span>
      </div>
      <div v-if="spellInfo.cantripsKnown > 0" class="spell-stat">
        <span class="spell-stat-label">Cantrips</span>
        <span class="spell-stat-value">{{ spellInfo.cantripsKnown }}</span>
      </div>
      <div v-if="spellInfo.spellsKnownCount > 0" class="spell-stat">
        <span class="spell-stat-label">Known</span>
        <span class="spell-stat-value">{{ spellInfo.spellsKnownCount }}</span>
      </div>
      <div v-if="spellInfo.maxPrepared > 0" class="spell-stat">
        <span class="spell-stat-label">Prepared</span>
        <span class="spell-stat-value">{{ spellInfo.maxPrepared }}</span>
      </div>
    </div>

    <!-- Spell Slots -->
    <div v-if="Object.keys(spellInfo.spellSlots).length > 0" class="spell-slots">
      <h3 class="subsection-title">Spell Slots</h3>
      <div v-for="(slot, level) in spellInfo.spellSlots" :key="level" class="slot-row">
        <span class="slot-level">{{ getPrettySpellLevel(Number(level)) }}</span>
        <div class="slot-pips">
          <span
            v-for="n in slot.max"
            :key="n"
            class="slot-pip"
            :class="{ 'slot-pip--used': n <= slot.used }"
          />
        </div>
        <span class="slot-count">{{ slot.max - slot.used }}/{{ slot.max }}</span>
      </div>
    </div>

    <!-- Innate Spells -->
    <div v-if="spellInfo.innateSpells.length > 0" class="innate-spells">
      <h3 class="subsection-title">Innate Spells</h3>
      <div v-for="spell in spellInfo.innateSpells" :key="spell.name" class="innate-spell">
        <span class="innate-spell-name">{{ spell.name }}</span>
        <span class="innate-spell-meta">{{ getPrettyAbilityName(spell.ability) }}</span>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
  import { computed } from 'vue';
  import type { playerCharacter } from '../../../../types';
  import {
    computeCharSpellcasting,
    getPrettyAbilityName,
    getPrettySpellLevel,
    getPrettyCastingMode,
  } from '../../../../helperFunctions';

  const props = defineProps<{
    character: playerCharacter;
  }>();

  const spellInfo = computed(() => computeCharSpellcasting(props.character));
</script>

<style scoped>
  .ability-section {
    background: var(--color-surface);
    border-radius: var(--radius);
    box-shadow: var(--color-card-shadow);
    overflow: hidden;
  }

  .section-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid rgba(31, 27, 22, 0.08);
    flex-wrap: wrap;
  }

  .section-title {
    font-size: 1rem;
    font-weight: 700;
    color: var(--color-primary);
    margin: 0;
    flex: 1;
    min-width: 0;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .section-badge {
    font-size: 0.7rem;
    font-weight: 700;
    padding: 0.15rem 0.5rem;
    border-radius: 20px;
    background: rgba(107, 46, 46, 0.1);
    color: var(--color-primary);
    white-space: nowrap;
  }

  .section-badge--spell {
    background: rgba(46, 74, 107, 0.12);
    color: #2e4a6b;
  }

  .spell-info-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid rgba(31, 27, 22, 0.06);
  }

  .spell-stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    background: rgba(46, 74, 107, 0.06);
    border: 1px solid rgba(46, 74, 107, 0.12);
    border-radius: 10px;
    padding: 0.35rem 0.75rem;
    min-width: 60px;
  }

  .spell-stat-label {
    font-size: 0.6rem;
    font-weight: 700;
    color: #2e4a6b;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .spell-stat-value {
    font-size: 1rem;
    font-weight: 700;
    color: var(--color-text);
  }

  .subsection-title {
    font-size: 0.8rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-muted);
    margin: 0 0 0.5rem;
  }

  .spell-slots {
    padding: 0.75rem 1rem;
    border-bottom: 1px solid rgba(31, 27, 22, 0.06);
  }

  .slot-row {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.25rem 0;
  }

  .slot-level {
    font-size: 0.78rem;
    font-weight: 600;
    color: var(--color-text);
    min-width: 90px;
  }

  .slot-pips {
    display: flex;
    gap: 0.3rem;
    flex: 1;
  }

  .slot-pip {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: rgba(46, 74, 107, 0.25);
    border: 1.5px solid rgba(46, 74, 107, 0.4);
    display: inline-block;
    transition: background 0.15s;
  }

  .slot-pip--used {
    background: rgba(31, 27, 22, 0.12);
    border-color: rgba(31, 27, 22, 0.15);
  }

  .slot-count {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--color-muted);
    min-width: 36px;
    text-align: right;
  }

  .innate-spells {
    padding: 0.75rem 1rem;
  }

  .innate-spell {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.3rem 0;
    border-bottom: 1px solid rgba(31, 27, 22, 0.05);
    font-size: 0.88rem;
  }

  .innate-spell:last-child {
    border-bottom: none;
  }

  .innate-spell-name {
    font-weight: 600;
  }

  .innate-spell-meta {
    font-size: 0.75rem;
    color: var(--color-muted);
  }
</style>
