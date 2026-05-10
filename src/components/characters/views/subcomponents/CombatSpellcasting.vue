<template>
  <section class="combat-section">
    <div class="section-header-row">
      <h3 class="section-label">Spellcasting</h3>
      <div class="spell-meta-pills">
        <span v-if="spellInfo.spellcastingAbility" class="spell-meta-pill">
          {{ spellInfo.spellcastingAbility.toUpperCase() }}
        </span>
        <span class="spell-meta-pill">DC {{ spellSaveDc }}</span>
        <span class="spell-meta-pill">+{{ spellAttackBonus }} to hit</span>
      </div>
    </div>

    <!-- Spell Slots -->
    <div v-if="Object.keys(mergedSlots).length > 0" class="spell-slots-block">
      <div class="spell-slots-header">
        <span class="spell-slots-title">Spell Slots</span>
        <button class="reset-btn" @click="onResetSlots">Long Rest</button>
      </div>
      <div v-for="(slot, lvl) in mergedSlots" :key="lvl" class="slot-row">
        <span class="slot-level">{{ getPrettySpellLevel(Number(lvl)) }}</span>
        <div class="slot-pips">
          <button
            v-for="n in slot.max"
            :key="n"
            class="slot-pip-btn"
            :class="{ 'slot-pip-btn--used': n <= slot.used }"
            @click="onToggleSlot(Number(lvl), n, slot.max)"
            :aria-label="`Level ${lvl} slot ${n}: ${n <= slot.used ? 'used' : 'available'}`"
          />
        </div>
        <span class="slot-count">{{ slot.max - slot.used }}/{{ slot.max }}</span>
      </div>
    </div>

    <!-- Cantrips -->
    <div v-if="cantrips.length" class="spell-group">
      <h4 class="spell-group-label">Cantrips</h4>
      <div class="spell-list">
        <div v-for="spell in cantrips" :key="spell.name" class="spell-row spell-row--cantrip">
          <span class="spell-name">{{ spell.name }}</span>
          <span class="spell-school">{{ getPrettySpellSchool(spell.school) }}</span>
        </div>
      </div>
    </div>

    <!-- Known / Prepared spells -->
    <div v-if="nonCantripSpells.length" class="spell-group">
      <h4 class="spell-group-label">{{ spellGroupLabel }}</h4>
      <div class="spell-list">
        <div v-for="spell in nonCantripSpells" :key="spell.name" class="spell-row">
          <span class="spell-level-badge">{{ spell.level }}</span>
          <span class="spell-name">{{ spell.name }}</span>
          <span class="spell-school">{{ getPrettySpellSchool(spell.school) }}</span>
        </div>
      </div>
    </div>

    <!-- Innate spells -->
    <div v-if="spellInfo.innateSpells.length" class="spell-group">
      <h4 class="spell-group-label">Innate</h4>
      <div class="spell-list">
        <div v-for="s in spellInfo.innateSpells" :key="s.name" class="spell-row">
          <span class="spell-name">{{ s.name }}</span>
          <span class="spell-school">{{ getPrettyAbilityName(s.ability) }}</span>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
  import { computed } from 'vue';
  import type { playerCharacter, Spell } from '../../../../types';
  import {
    computeCharSpellcasting,
    abilityMod,
    getPrettySpellLevel,
    getPrettySpellSchool,
    getPrettyAbilityName,
  } from '../../../../helperFunctions';
  import { useCharacterStore } from '../../../../stores/characterStore';

  const props = defineProps<{
    character: playerCharacter;
  }>();

  const charStore = useCharacterStore();

  const spellInfo = computed(() => computeCharSpellcasting(props.character));

  const mergedSlots = computed((): Record<number, { max: number; used: number }> => {
    const computedSlots = spellInfo.value.spellSlots;
    const tracked = props.character.spellcasting?.spellSlots ?? {};
    const result: Record<number, { max: number; used: number }> = {};
    for (const lvlStr of Object.keys(computedSlots)) {
      const lvl = Number(lvlStr);
      result[lvl] = { max: computedSlots[lvl]!.max, used: tracked[lvl]?.used ?? 0 };
    }
    return result;
  });

  const spellSaveDc = computed(() => {
    if (props.character.spellcasting?.spellSaveDC) return props.character.spellcasting.spellSaveDC;
    const ability = spellInfo.value.spellcastingAbility;
    if (!ability) return 0;
    const score =
      props.character.abilityScores[ability as keyof typeof props.character.abilityScores] ?? 10;
    return 8 + props.character.proficiencyModifier + abilityMod(score);
  });

  const spellAttackBonus = computed(() => {
    if (props.character.spellcasting?.spellAttackBonus)
      return props.character.spellcasting.spellAttackBonus;
    const ability = spellInfo.value.spellcastingAbility;
    if (!ability) return 0;
    const score =
      props.character.abilityScores[ability as keyof typeof props.character.abilityScores] ?? 10;
    return props.character.proficiencyModifier + abilityMod(score);
  });

  const cantrips = computed(
    (): Spell[] => (props.character.spellcasting?.cantrips ?? []) as Spell[]
  );

  const nonCantripSpells = computed((): Spell[] => {
    const known = (props.character.spellcasting?.knownSpells ?? []) as Spell[];
    const prepared = (props.character.spellcasting?.preparedSpells ?? []) as Spell[];
    const seen = new Set<string>();
    return [...known, ...prepared]
      .filter(s => {
        if (seen.has(s.name)) return false;
        seen.add(s.name);
        return true;
      })
      .sort((a, b) => a.level - b.level);
  });

  const spellGroupLabel = computed(() =>
    spellInfo.value.castingMode === 'prepared' || spellInfo.value.castingMode === 'spellbook'
      ? 'Prepared Spells'
      : 'Known Spells'
  );

  async function onToggleSlot(level: number, n: number, max: number): Promise<void> {
    await charStore.toggleSpellSlot(props.character.id, level, n, max);
  }

  async function onResetSlots(): Promise<void> {
    const maxSlots: Record<number, number> = {};
    for (const [lvl, slot] of Object.entries(mergedSlots.value)) {
      maxSlots[Number(lvl)] = slot.max;
    }
    await charStore.resetSpellSlots(props.character.id, maxSlots);
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

  .section-header-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 0.4rem;
  }

  .spell-meta-pills {
    display: flex;
    gap: 0.3rem;
    flex-wrap: wrap;
  }

  .spell-meta-pill {
    font-size: 0.7rem;
    font-weight: 700;
    padding: 0.15rem 0.5rem;
    border-radius: 20px;
    background: rgba(46, 74, 107, 0.1);
    color: #2e4a6b;
    border: 1px solid rgba(46, 74, 107, 0.18);
  }

  /* ── Spell Slots ── */
  .spell-slots-block {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    padding: 0.6rem 0.75rem;
    background: rgba(46, 74, 107, 0.04);
    border: 1px solid rgba(46, 74, 107, 0.1);
    border-radius: 10px;
  }

  .spell-slots-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .spell-slots-title {
    font-size: 0.65rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #2e4a6b;
  }

  .reset-btn {
    font-size: 0.68rem;
    font-weight: 700;
    padding: 0.15rem 0.55rem;
    border-radius: 6px;
    border: 1px solid rgba(46, 74, 107, 0.3);
    background: transparent;
    color: #2e4a6b;
    cursor: pointer;
    transition: background 0.12s;
  }

  .reset-btn:hover {
    background: rgba(46, 74, 107, 0.12);
  }

  .slot-row {
    display: flex;
    align-items: center;
    gap: 0.6rem;
  }

  .slot-level {
    font-size: 0.78rem;
    font-weight: 600;
    color: var(--color-text);
    min-width: 88px;
  }

  .slot-pips {
    display: flex;
    gap: 0.35rem;
    flex: 1;
  }

  .slot-pip-btn {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    border: 2px solid rgba(46, 74, 107, 0.45);
    background: rgba(46, 74, 107, 0.18);
    cursor: pointer;
    padding: 0;
    transition: background 0.15s, border-color 0.15s, transform 0.1s;
    flex-shrink: 0;
  }

  .slot-pip-btn:hover {
    border-color: rgba(46, 74, 107, 0.7);
    transform: scale(1.15);
  }

  .slot-pip-btn--used {
    background: rgba(31, 27, 22, 0.1);
    border-color: rgba(31, 27, 22, 0.15);
  }

  .slot-count {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--color-muted);
    min-width: 32px;
    text-align: right;
  }

  /* ── Spell groups ── */
  .spell-group {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }

  .spell-group-label {
    font-size: 0.65rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-muted);
    margin: 0.25rem 0 0.15rem;
  }

  .spell-list {
    display: flex;
    flex-direction: column;
  }

  .spell-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.3rem 0;
    border-bottom: 1px solid rgba(31, 27, 22, 0.05);
    font-size: 0.88rem;
  }

  .spell-row:last-child {
    border-bottom: none;
  }

  .spell-level-badge {
    font-size: 0.65rem;
    font-weight: 700;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: rgba(46, 74, 107, 0.15);
    color: #2e4a6b;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .spell-row--cantrip .spell-name {
    color: var(--color-muted);
  }

  .spell-name {
    flex: 1;
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .spell-school {
    font-size: 0.72rem;
    color: var(--color-muted);
    white-space: nowrap;
  }
</style>
