<template>
  <div class="spells-selection">
    <h2>Spellcasting</h2>

    <!-- Non-spellcaster -->
    <div v-if="!info || !info.isSpellcaster" class="no-spells">
      <p>Your character has no spellcasting from their class, race, or background.</p>
      <button class="next-btn" @click="emit('nextStep')">Next</button>
    </div>

    <template v-else>
      <!-- Summary banner -->
      <div class="profile-summary">
        <p>
          <strong>Casting style:</strong> {{ castingModeLabel }}
        </p>
        <p v-if="info.spellcastingAbility">
            <strong>Casting Ability:</strong> {{ prettyAbility(info.spellcastingAbility) }}
          </p>
        <div v-if="Object.keys(info.spellSlots).length > 0" class="spell-slots">
          <strong>Spell slots at level {{ characterLevel }}:</strong>
          <span v-for="(slot, lvl) in info.spellSlots" :key="lvl" class="slot-badge">
            {{ ordinal(Number(lvl)) }}: {{ slot.max }}
          </span>
        </div>
      </div>

      <!-- ── Section 1: Fixed / innate spells ── -->
      <div v-if="info.innateSpells.length > 0" class="section">
        <h3>Fixed Spells <span class="hint-label">(granted — cannot be changed)</span></h3>
        <p class="hint">
          These spells come from your race or background. They are always available and do not count
          against your spells known or prepared.
        </p>
        <table class="spells-table">
          <thead>
            <tr>
              <th>Spell</th>
              <th>Granted at level</th>
              <th>Casting ability</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(s, i) in info.innateSpells" :key="i">
              <td>{{ s.name }}</td>
              <td>{{ s.level }}</td>
              <td>{{ prettyAbility(s.ability) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- ── Section 2: Cantrip selection ── -->
      <div v-if="info.cantripsKnown > 0" class="section">
        <h3>
          Cantrips
          <span class="limit-badge"
            >({{ selectedCantrips.length }} / {{ info.cantripsKnown }})</span
          >
        </h3>
        <p class="hint">Choose {{ info.cantripsKnown }} cantrips from your class list.</p>
        <learn-spells
          :spells="classCantrips"
          :limit="info.cantripsKnown"
          v-model="selectedCantrips"
        />
      </div>

      <!-- ── Section 3: Learn Spells (known-casters and Wizard spellbook) ── -->
      <div v-if="info.castingMode === 'known' || info.castingMode === 'spellbook'" class="section">
        <h3>
          {{ info.castingMode === 'spellbook' ? 'Spellbook' : 'Spells Known' }}
          <span class="limit-badge"
            >({{ selectedLearnedSpells.length }} / {{ info.spellsKnownCount }})</span
          >
        </h3>
        <p class="hint">
          <template v-if="info.castingMode === 'spellbook'">
            Choose {{ info.spellsKnownCount }} spells for your spellbook. You will prepare your
            spells from this list each day.
          </template>
          <template v-else>
            Choose the {{ info.spellsKnownCount }} spells you know. These are always available to
            cast when you have slots.
          </template>
        </p>
        <learn-spells
          :spells="classLeveledSpells"
          :limit="info.spellsKnownCount"
          v-model="selectedLearnedSpells"
        />
      </div>

      <!-- ── Section 4: Prepare Spells ── -->
      <!-- Prepared-casters prepare from all class spells; spellbook-casters from their book -->
      <div
        v-if="info.castingMode === 'prepared' || info.castingMode === 'spellbook'"
        class="section"
      >
        <h3>
          Prepared Spells
          <span class="limit-badge"
            >({{ selectedPreparedSpells.length }} / {{ info.maxPrepared }})</span
          >
        </h3>
        <p class="hint">
          <template v-if="info.castingMode === 'spellbook'">
            Choose up to {{ info.maxPrepared }} spells to prepare from your spellbook.
          </template>
          <template v-else>
            Choose up to {{ info.maxPrepared }} spells to have prepared. You can change these after
            each long rest.
          </template>
        </p>
        <prepare-spells
          :spells="spellsToPrepareFrom"
          :limit="info.maxPrepared"
          v-model="selectedPreparedSpells"
        />
      </div>

      <button class="next-btn" @click="save">Next</button>
    </template>
  </div>
</template>

<script lang="ts" setup>
  import { computed, ref } from 'vue';
  import { useCharacterStore } from '../../../stores/characterStore';
  import { useDataStore } from '../../../stores/dataStore';
  import { getPrettyAbilityName, computeCharSpellcasting } from '../../../helperFunctions';
  import type { Spell, SpellcastingInfo } from '../../../types';
  import LearnSpells from './LearnSpells.vue';
  import PrepareSpells from './PrepareSpells.vue';

  const emit = defineEmits<{ (e: 'nextStep'): void }>();

  const store = useCharacterStore();
  const dataStore = useDataStore();

  const info = computed<SpellcastingInfo | null>(() => {
    if (!store.currNewCharacter) return null;
    return computeCharSpellcasting(store.currNewCharacter);
  });

  const characterLevel = computed(() => {
    if (!store.currNewCharacter) return 1;
    return Object.values(store.currNewCharacter.classLevels).reduce((s, v) => s + v, 0) || 1;
  });

  const castingModeLabel = computed(() => {
    switch (info.value?.castingMode) {
      case 'known':
        return 'Known spells';
      case 'prepared':
        return 'Prepared spells (full list)';
      case 'spellbook':
        return 'Spellbook + prepared';
      case 'innate':
        return 'Innate spells only';
      default:
        return 'None';
    }
  });

  // All class spells filtered from the data store
  const allClassSpells = computed<Spell[]>(() => {
    if (!info.value?.isSpellcaster) return [];
    const className = store.currNewCharacter?.classes[0]?.name?.toLowerCase() ?? '';
    return dataStore.spells.filter((spell: Spell) => {
      const fromClassList: any[] = spell.classes?.fromClassList ?? [];
      const inClass = fromClassList.some((c: any) => c.name?.toLowerCase() === className);
      const inExpanded = info.value!.expandedSpellNames.includes(spell.name);
      return inClass || inExpanded;
    });
  });

  // Only the cantrips (level 0) from the class spell list
  const classCantrips = computed<Spell[]>(() => allClassSpells.value.filter(s => s.level === 0));

  // Only leveled spells (level > 0) castable with available slots
  const classLeveledSpells = computed<Spell[]>(() => {
    const maxSlotLevel = Math.max(0, ...Object.keys(info.value?.spellSlots ?? {}).map(Number));
    return allClassSpells.value.filter(s => s.level > 0 && s.level <= maxSlotLevel);
  });

  // Spell selections
  const selectedCantrips = ref<string[]>([]);
  const selectedLearnedSpells = ref<string[]>([]);
  const selectedPreparedSpells = ref<string[]>([]);

  /**
   * For prepared-casters: all class leveled spells.
   * For spellbook-casters (Wizard): only spells already in the spellbook.
   */
  const spellsToPrepareFrom = computed<Spell[]>(() => {
    if (info.value?.castingMode === 'spellbook') {
      return dataStore.spells.filter((s: Spell) => selectedLearnedSpells.value.includes(s.name));
    }
    return classLeveledSpells.value;
  });

  function prettyAbility(ab: string): string {
    return getPrettyAbilityName(ab);
  }

  function ordinal(n: number): string {
    if (n === 1) return '1st';
    if (n === 2) return '2nd';
    if (n === 3) return '3rd';
    return `${n}th`;
  }

  function save() {
    if (!store.currNewCharacter) {
      emit('nextStep');
      return;
    }

    const cantripObjs = selectedCantrips.value
      .map(name => dataStore.spells.find((s: Spell) => s.name === name))
      .filter(Boolean) as Spell[];

    const knownObjs = selectedLearnedSpells.value
      .map(name => dataStore.spells.find((s: Spell) => s.name === name))
      .filter(Boolean) as Spell[];

    const preparedObjs = selectedPreparedSpells.value
      .map(name => dataStore.spells.find((s: Spell) => s.name === name))
      .filter(Boolean) as Spell[];

    const mode = info.value?.castingMode;
    store.currNewCharacter.spellcasting = {
      spellCaster: info.value?.isSpellcaster ? 'Full Caster' : 'None',
      spellSlots:
        Object.keys(info.value?.spellSlots ?? {}).length > 0 ? info.value!.spellSlots : undefined,
      cantrips: cantripObjs.length > 0 ? cantripObjs : undefined,
      knownSpells: mode === 'known' ? knownObjs : undefined,
      preparedSpells: mode === 'prepared' || mode === 'spellbook' ? preparedObjs : undefined,
      spellSaveDC: store.currNewCharacter.spellcasting.spellSaveDC,
      spellAttackBonus: store.currNewCharacter.spellcasting.spellAttackBonus,
    };

    emit('nextStep');
  }
</script>

<style scoped>
  .spells-selection {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    max-width: 860px;
    margin: 0 auto;
  }

  .no-spells {
    text-align: center;
    padding: 2rem;
  }

  .profile-summary {
    background: var(--color-background-soft, #f4f4f4);
    border-radius: 6px;
    padding: 0.75rem 1rem;
  }

  .spell-slots {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    margin-top: 0.4rem;
    align-items: center;
  }

  .slot-badge {
    background: #5865f2;
    color: #fff;
    border-radius: 4px;
    padding: 0.1rem 0.5rem;
    font-size: 0.85rem;
  }

  .section {
    border-top: 1px solid var(--color-border, #ccc);
    padding-top: 0.75rem;
  }

  .hint {
    font-size: 0.875rem;
    color: var(--color-text-muted, #666);
    margin-bottom: 0.5rem;
  }

  .hint-label {
    font-weight: normal;
    font-size: 0.85rem;
    color: var(--color-text-muted, #666);
  }

  .spells-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.9rem;
  }

  .spells-table th,
  .spells-table td {
    border: 1px solid var(--color-border, #ccc);
    padding: 0.35rem 0.6rem;
    text-align: left;
  }

  .limit-badge {
    font-weight: normal;
    font-size: 0.85rem;
    color: var(--color-text-muted, #666);
  }

  .next-btn {
    align-self: flex-end;
    padding: 0.5rem 1.25rem;
    font-size: 1rem;
  }
</style>
