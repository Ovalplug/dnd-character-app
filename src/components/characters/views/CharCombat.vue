<template>
  <div class="char-combat">
    <!-- ── HP / AC / Class Bar ─────────────────────────────────────── -->
    <StatsBar :character="character" />

    <!-- ── Speed / Initiative / Prof / Inspiration / Death Saves ────── -->
    <OtherInfo :character="character" />

    <!-- ── Ability Scores ─────────────────────────────────────────── -->
    <AbilityTable :character="character" />

    <!-- ── Attacks ────────────────────────────────────────────────── -->
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
        <!-- Character saved attacks -->
        <div v-for="(atk, i) in character.attacks ?? []" :key="i" class="attack-row">
          <span class="attack-name">{{ atk.name }}</span>
          <span class="attack-bonus"
            >{{ atk.attackBonus >= 0 ? '+' : '' }}{{ atk.attackBonus }}</span
          >
          <span class="attack-dmg">{{ atk.damage }}</span>
          <span class="attack-type">{{ atk.damageType ?? '—' }}</span>
        </div>
      </div>
    </section>

    <!-- ── Actions Reference ──────────────────────────────────────── -->
    <section class="combat-section">
      <h3 class="section-label">Actions</h3>
      <div class="actions-grid">
        <div
          v-for="action in basicActions"
          :key="action.name"
          class="action-chip"
          :class="`action-chip--${action.type.toLowerCase().replace(' ', '-')}`"
        >
          <span class="action-chip-type">{{ action.type }}</span>
          <span class="action-chip-name">{{ action.name }}</span>
        </div>
      </div>
    </section>

    <!-- ── Spellcasting ───────────────────────────────────────────── -->
    <section v-if="spellInfo.isSpellcaster" class="combat-section">
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
          <button class="reset-btn" @click="resetSlots">Long Rest</button>
        </div>
        <div v-for="(slot, lvl) in mergedSlots" :key="lvl" class="slot-row">
          <span class="slot-level">{{ getPrettySpellLevel(Number(lvl)) }}</span>
          <div class="slot-pips">
            <button
              v-for="n in slot.max"
              :key="n"
              class="slot-pip-btn"
              :class="{ 'slot-pip-btn--used': n <= slot.used }"
              @click="toggleSlot(Number(lvl), n)"
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
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue';
  import type { playerCharacter, SavingThrow, Spell } from '../../../types';
  import {
    computeCharSpellcasting,
    abilityMod,
    getPrettySpellLevel,
    getPrettySpellSchool,
    getPrettyAbilityName,
  } from '../../../helperFunctions';
  import { useCharacterStore } from '../../../stores/characterStore';
  import StatsBar from './subcomponents/StatsBar.vue';
  import OtherInfo from './subcomponents/OtherInfo.vue';
  import AbilityTable from './subcomponents/AbilityTable.vue';

  const props = defineProps<{
    character: playerCharacter;
  }>();

  const charStore = useCharacterStore();

  // ── Saving throws ─────────────────────────────────────────────────────────
  const SAVE_ABBRS: { key: SavingThrow; abbr: string }[] = [
    { key: 'str', abbr: 'STR' },
    { key: 'dex', abbr: 'DEX' },
    { key: 'con', abbr: 'CON' },
    { key: 'int', abbr: 'INT' },
    { key: 'wis', abbr: 'WIS' },
    { key: 'cha', abbr: 'CHA' },
  ];

  const savingThrows = computed(() =>
    SAVE_ABBRS.map(({ key, abbr }) => {
      const score = props.character.abilityScores[key];
      const mod = abilityMod(score);
      const proficient = props.character.allProficiencies?.savingThrows?.[key] ?? false;
      const value = mod + (proficient ? props.character.proficiencyModifier : 0);
      return { abbr, value, proficient };
    })
  );

  // ── Unarmed Strike ────────────────────────────────────────────────────────
  const unarmedAttack = computed(() => {
    const strMod = abilityMod(props.character.abilityScores.str);
    const bonus = strMod + props.character.proficiencyModifier;
    return bonus >= 0 ? `+${bonus}` : `${bonus}`;
  });

  const unarmedDamage = computed(() => {
    const strMod = abilityMod(props.character.abilityScores.str);
    const flat = 1 + strMod;
    if (strMod === 0) return '1';
    return strMod > 0 ? `1 + ${strMod}` : `${Math.max(1, flat)}`;
  });

  // ── Basic Actions reference ───────────────────────────────────────────────
  const basicActions = [
    { name: 'Attack', type: 'Action' },
    { name: 'Cast a Spell', type: 'Action' },
    { name: 'Dash', type: 'Action' },
    { name: 'Disengage', type: 'Action' },
    { name: 'Dodge', type: 'Action' },
    { name: 'Help', type: 'Action' },
    { name: 'Hide', type: 'Action' },
    { name: 'Ready', type: 'Action' },
    { name: 'Search', type: 'Action' },
    { name: 'Use Object', type: 'Action' },
    { name: 'Grapple', type: 'Special' },
    { name: 'Shove', type: 'Special' },
    { name: 'Opportunity Attack', type: 'Reaction' },
    { name: 'Cast a Spell', type: 'Reaction' },
  ];

  // ── Spellcasting ──────────────────────────────────────────────────────────
  const spellInfo = computed(() => computeCharSpellcasting(props.character));

  const mergedSlots = computed((): Record<number, { max: number; used: number }> => {
    const result: Record<number, { max: number; used: number }> = {};
    const computedSlots = spellInfo.value.spellSlots;
    const tracked = props.character.spellcasting?.spellSlots ?? {};
    for (const lvlStr of Object.keys(computedSlots)) {
      const lvl = Number(lvlStr);
      result[lvl] = {
        max: computedSlots[lvl]!.max,
        used: tracked[lvl]?.used ?? 0,
      };
    }
    return result;
  });

  async function toggleSlot(level: number, n: number): Promise<void> {
    const slot = mergedSlots.value[level];
    if (!slot) return;
    const newUsed = n <= slot.used ? n - 1 : n;
    const updatedSlots = {
      ...(props.character.spellcasting?.spellSlots ?? {}),
      [level]: { max: slot.max, used: Math.max(0, Math.min(slot.max, newUsed)) },
    };
    await charStore.updateCharacter({
      ...props.character,
      spellcasting: { ...props.character.spellcasting, spellSlots: updatedSlots },
    });
  }

  async function resetSlots(): Promise<void> {
    const slots: Record<number, { max: number; used: number }> = {};
    for (const lvlStr of Object.keys(mergedSlots.value)) {
      const lvl = Number(lvlStr);
      slots[lvl] = { max: mergedSlots.value[lvl]!.max, used: 0 };
    }
    await charStore.updateCharacter({
      ...props.character,
      spellcasting: { ...props.character.spellcasting, spellSlots: slots },
    });
  }

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
    const combined = [...known, ...prepared];
    // deduplicate by name
    const seen = new Set<string>();
    return combined
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
</script>

<style scoped>
  .char-combat {
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
    padding-bottom: 2rem;
  }

  /* ── Shared section wrapper ── */
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

  /* ── Saving Throws ── */
  .saves-row {
    display: flex;
    gap: 0.35rem;
    flex-wrap: wrap;
  }

  .save-pill {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex: 1;
    min-width: 48px;
    padding: 0.35rem 0.4rem;
    background: rgba(31, 27, 22, 0.04);
    border: 1px solid rgba(31, 27, 22, 0.08);
    border-radius: 10px;
    transition: background 0.15s;
  }

  .save-pill--prof {
    background: rgba(107, 46, 46, 0.08);
    border-color: rgba(107, 46, 46, 0.2);
  }

  .save-abbr {
    font-size: 0.6rem;
    font-weight: 700;
    color: var(--color-muted);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .save-val {
    font-size: 1rem;
    font-weight: 700;
    color: var(--color-text);
  }

  .save-pill--prof .save-val {
    color: var(--color-primary);
  }

  /* ── Attack table ── */
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

  /* ── Actions reference grid ── */
  .actions-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
  }

  .action-chip {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0.3rem 0.6rem;
    border-radius: 8px;
    font-size: 0.75rem;
  }

  .action-chip-type {
    font-size: 0.55rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    opacity: 0.75;
  }

  .action-chip-name {
    font-weight: 600;
    white-space: nowrap;
  }

  .action-chip--action {
    background: rgba(107, 46, 46, 0.1);
    color: var(--color-primary);
    border: 1px solid rgba(107, 46, 46, 0.18);
  }

  .action-chip--special {
    background: rgba(46, 74, 107, 0.1);
    color: #2e4a6b;
    border: 1px solid rgba(46, 74, 107, 0.18);
  }

  .action-chip--reaction {
    background: rgba(201, 164, 75, 0.15);
    color: #7a5d1a;
    border: 1px solid rgba(201, 164, 75, 0.3);
  }

  /* ── Spellcasting ── */
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
