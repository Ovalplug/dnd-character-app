<template>
  <Loading v-if="!spellBookStore.loaded || !dataStore.loaded" />

  <div v-else class="creation-view">
    <h1>Create Spellbook</h1>

    <label for="spellbook-name">Spellbook Name:</label>
    <input
      id="spellbook-name"
      v-model="newSpellbook.name"
      placeholder="Enter spellbook name"
      class="creation-input"
    />

    <label for="spellcasting-ability">Spellcasting Ability:</label>
    <select
      id="spellcasting-ability"
      v-model="newSpellbook.spellcastingAbility"
      class="creation-input"
    >
      <option disabled value="">Select spellcasting ability</option>
      <option value="INT">Intelligence</option>
      <option value="WIS">Wisdom</option>
      <option value="CHA">Charisma</option>
    </select>

    <label for="spellcasting-dc">Spellcasting DC:</label>
    <input
      id="spellcasting-dc"
      type="number"
      v-model.number="newSpellbook.spellcastingDc"
      placeholder="Enter spellcasting DC"
      class="creation-input"
    />

    <label for="spellcasting-attack-bonus"> Spellcasting Attack Bonus: </label>
    <input
      id="spellcasting-attack-bonus"
      type="number"
      v-model.number="newSpellbook.spellcastingAttackBonus"
      placeholder="Enter spellcasting attack bonus"
      class="creation-input"
    />

    <label>
      Use Spell Slots
      <input type="checkbox" v-model="useSpellSlots" @change="useSpellSlotsChanged" />
    </label>

    <div v-if="useSpellSlots" class="spell-slot-container">
      <h3>Spell Slots</h3>

      <div v-for="level in 9" :key="level" class="spell-slot-row">
        <label> Level {{ level }} </label>

        <input
          type="number"
          min="0"
          v-model.number="getSpellSlot(level).max"
          placeholder="Max"
          class="creation-input"
        />
      </div>
    </div>

    <label>
      Prefill Spells
      <input type="checkbox" v-model="usePrefillSpells" @change="prefillSpells" />
    </label>
    <div v-if="usePrefillSpells" class="prefill-spells-container">
      <label for="spell-class">Spell Class:</label>
      <select
        id="spell-class"
        v-model="spellClass"
        class="creation-input"
        @change="prefillSpells()"
      >
        <option disabled value="">Select spell class</option>
        <option value="artificer">Artificer</option>
        <option value="cleric">Cleric</option>
        <option value="druid">Druid</option>
        <option value="paladin">Paladin</option>
      </select>
    </div>

    <button @click="submitSpellbook" :disabled="!isFormValid()" class="creation-primary-button">
      Create Spellbook
    </button>

    <div v-if="submitMessage" :class="['creation-message', { 'creation-message--error': isError }]">
      {{ submitMessage }}
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { ref } from 'vue';
  import { v4 as uuidv4 } from 'uuid';

  import { useSpellBookStore } from '../../stores/spellBookStore';
  import { useDataStore } from '../../stores/dataStore';
  import type { SpellBook, SpellClass } from '../../types';

  import Loading from '../resources/Loading.vue';

  import { getRefinedSpellsList } from '../../helperFunctions.ts';

  const spellBookStore = useSpellBookStore();
  const dataStore = useDataStore();
  dataStore.init();
  const spells = dataStore.spells;

  spellBookStore.loadSpellbooks();

  const useSpellSlots = ref(false);
  const usePrefillSpells = ref(false);
  const spellClass = ref<SpellClass>('artificer');
  const submitMessage = ref('');
  const isError = ref(false);

  const newSpellbook = ref<SpellBook>({
    id: uuidv4(),
    name: '',
    spellcastingAbility: '',
    spellcastingDc: 0,
    spellcastingAttackBonus: 0,

    spellSlots: {},

    innateSpells: [],
    cantrips: [],
    spellsKnown: [],
    spellsPrepared: [],
  });

  function useSpellSlotsChanged() {
    if (useSpellSlots.value) {
      newSpellbook.value.spellSlots = {};

      for (let i = 1; i <= 9; i++) {
        newSpellbook.value.spellSlots[i] = {
          max: 0,
          used: 0,
        };
      }
    } else {
      newSpellbook.value.spellSlots = {};
    }
  }

  function getSpellSlot(level: number) {
    if (!newSpellbook.value.spellSlots[level]) {
      newSpellbook.value.spellSlots[level] = {
        max: 0,
        used: 0,
      };
    }

    return newSpellbook.value.spellSlots[level];
  }

  function prefillSpells() {
    const refinedSpells = getRefinedSpellsList(
      spells,
      ['a', 'c', 'd', 'e', 'v', 'i', 'n', 't'],
      [1, 2, 3, 4, 5, 6, 7, 8, 9],
      [spellClass.value],
      'level'
    );
    newSpellbook.value.spellsKnown = refinedSpells;
  }

  function isFormValid(): boolean {
    return newSpellbook.value.name.trim() !== '' && newSpellbook.value.spellcastingAbility !== '';
  }

  async function submitSpellbook() {
    submitMessage.value = '';
    isError.value = false;

    try {
      if (!isFormValid()) {
        submitMessage.value = 'Please fill in all required fields.';
        isError.value = true;
        return;
      }

      await spellBookStore.addSpellbook(newSpellbook.value);

      submitMessage.value = `Spellbook "${newSpellbook.value.name}" created successfully!`;
      isError.value = false;

      // Reset form
      setTimeout(() => {
        newSpellbook.value = {
          id: uuidv4(),
          name: '',
          spellcastingAbility: '',
          spellcastingDc: 0,
          spellcastingAttackBonus: 0,
          spellSlots: {},
          innateSpells: [],
          cantrips: [],
          spellsKnown: [],
          spellsPrepared: [],
        };
        useSpellSlots.value = false;
        usePrefillSpells.value = false;
        submitMessage.value = '';
      }, 2000);
    } catch (error) {
      submitMessage.value = `Error creating spellbook: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`;
      isError.value = true;
    }
  }
</script>

<style scoped>
  .creation-message {
    margin-top: 1rem;
    padding: 0.85rem;
    border-radius: var(--radius);
    background: linear-gradient(180deg, rgba(107, 46, 46, 0.06), rgba(107, 46, 46, 0.02));
    color: var(--color-text);
    border: 1px solid rgba(107, 46, 46, 0.12);
    font-weight: 600;
    font-size: 0.95rem;
  }

  .creation-message--error {
    background: linear-gradient(180deg, rgba(183, 59, 59, 0.08), rgba(183, 59, 59, 0.04));
    color: var(--color-danger);
    border-color: rgba(183, 59, 59, 0.2);
  }

  .creation-view {
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
  }

  .creation-input {
    width: 100%;
    padding: 0.6rem 0.8rem;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.04);
    color: var(--color-text);
    font-family: inherit;
  }

  .creation-input:focus {
    outline: none;
    box-shadow: 0 0 0 4px rgba(201, 164, 75, 0.12);
    border-color: var(--color-primary);
  }

  .spell-slot-container {
    display: flex;
    flex-direction: column;
    gap: 0.65rem;
    padding: 1rem;
    border-radius: var(--radius);
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(107, 46, 46, 0.08);
  }

  .spell-slot-row {
    display: flex;
    gap: 0.75rem;
    align-items: center;
  }

  .spell-slot-row label {
    min-width: 4rem;
    font-weight: 600;
  }

  .spell-slot-row input {
    max-width: 6rem;
  }

  .prefill-spells-container {
    display: flex;
    flex-direction: column;
    gap: 0.65rem;
    padding: 1rem;
    border-radius: var(--radius);
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(107, 46, 46, 0.08);
  }
</style>
