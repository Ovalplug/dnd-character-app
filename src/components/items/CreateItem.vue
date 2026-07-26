<template>
  <div class="create-item">
    <h2 class="page-title">Create Custom Item</h2>

    <!-- Basic Info -->
    <div class="form-section">
      <h3 class="section-title">Basic Info</h3>

      <div class="field">
        <label for="item-name">Name *</label>
        <input
          id="item-name"
          v-model="formData.name"
          type="text"
          placeholder="Item name…"
          class="field-input"
          @keyup.enter="submitForm"
        />
      </div>

      <div class="field-row">
        <div class="field">
          <label for="item-type">Type</label>
          <select id="item-type" v-model="formData.type" class="field-input">
            <option value="">— Select —</option>
            <option value="A">Ammunition</option>
            <option value="AF">Adventuring Gear</option>
            <option value="AT">Artisan Tools</option>
            <option value="G">Generic</option>
            <option value="M">Melee Weapon</option>
            <option value="P">Potion</option>
            <option value="R">Ranged Weapon</option>
            <option value="S">Shield</option>
            <option value="T">Tools</option>
            <option value="WD">Wondrous Item</option>
          </select>
        </div>
        <div class="field">
          <label for="item-rarity">Rarity</label>
          <select id="item-rarity" v-model="formData.rarity" class="field-input">
            <option value="">— Select —</option>
            <option value="Common">Common</option>
            <option value="Uncommon">Uncommon</option>
            <option value="Rare">Rare</option>
            <option value="Very Rare">Very Rare</option>
            <option value="Legendary">Legendary</option>
            <option value="Artifact">Artifact</option>
          </select>
        </div>
      </div>

      <div class="field-row">
        <div class="field">
          <label for="item-source">Source</label>
          <input
            id="item-source"
            v-model="formData.source"
            type="text"
            placeholder="Custom, Homebrew…"
            class="field-input"
          />
        </div>
        <div class="field">
          <label for="item-value">Value (gp)</label>
          <input
            id="item-value"
            v-model.number="formData.valueGp"
            type="number"
            min="0"
            step="0.01"
            placeholder="0"
            class="field-input"
          />
        </div>
      </div>

      <div class="field-row">
        <div class="field">
          <label for="item-weight">Weight (lb)</label>
          <input
            id="item-weight"
            v-model.number="formData.weight"
            type="number"
            step="0.1"
            min="0"
            placeholder="0"
            class="field-input"
          />
        </div>
        <div class="field">
          <label for="item-charges">Charges</label>
          <input
            id="item-charges"
            v-model.number="formData.charges"
            type="number"
            min="0"
            placeholder="—"
            class="field-input"
          />
        </div>
      </div>
    </div>

    <!-- Properties -->
    <div class="form-section">
      <h3 class="section-title">Properties</h3>

      <div class="toggle-row">
        <button
          type="button"
          class="toggle-pill"
          :class="{ 'toggle-pill--on': formData.armor }"
          @click="formData.armor = !formData.armor"
        >
          Armor
        </button>
        <button
          type="button"
          class="toggle-pill"
          :class="{ 'toggle-pill--on': formData.weapon }"
          @click="formData.weapon = !formData.weapon"
        >
          Weapon
        </button>
        <button
          type="button"
          class="toggle-pill"
          :class="{ 'toggle-pill--on': formData.wondrous }"
          @click="formData.wondrous = !formData.wondrous"
        >
          Wondrous
        </button>
        <button
          type="button"
          class="toggle-pill"
          :class="{ 'toggle-pill--on': formData.reqAttune }"
          @click="formData.reqAttune = !formData.reqAttune"
        >
          Attunement
        </button>
      </div>

      <div v-if="formData.armor" class="field">
        <label for="item-ac">Armor Class (AC)</label>
        <input
          id="item-ac"
          v-model="formData.ac"
          type="text"
          placeholder="e.g., 14, 10+DEX"
          class="field-input"
        />
      </div>

      <div v-if="formData.weapon" class="field-row">
        <div class="field">
          <label for="item-dmg1">Damage Dice</label>
          <input
            id="item-dmg1"
            v-model="formData.dmg1"
            type="text"
            placeholder="e.g., 1d8"
            class="field-input"
          />
        </div>
        <div class="field">
          <label for="item-dmg-type">Damage Type</label>
          <select id="item-dmg-type" v-model="formData.dmgType" class="field-input">
            <option value="">— Select —</option>
            <option value="B">Bludgeoning</option>
            <option value="P">Piercing</option>
            <option value="S">Slashing</option>
            <option value="F">Fire</option>
            <option value="C">Cold</option>
            <option value="L">Lightning</option>
            <option value="T">Thunder</option>
            <option value="I">Poison</option>
            <option value="Y">Psychic</option>
            <option value="R">Radiant</option>
            <option value="N">Necrotic</option>
            <option value="O">Force</option>
          </select>
        </div>
      </div>

      <div v-if="formData.reqAttune" class="field">
        <label for="item-attune-by">Attunement requirement (optional)</label>
        <input
          id="item-attune-by"
          v-model="formData.reqAttuneBy"
          type="text"
          placeholder="e.g., a wizard, a spellcaster…"
          class="field-input"
        />
      </div>

      <div class="field">
        <label for="item-recharge">Recharge</label>
        <input
          id="item-recharge"
          v-model="formData.recharge"
          type="text"
          placeholder="e.g., 1d6 at dawn, 1/day"
          class="field-input"
        />
      </div>
    </div>

    <!-- Description entries -->
    <div class="form-section">
      <h3 class="section-title">Description</h3>

      <div class="entries-list">
        <div v-for="(_, idx) in formData.entries" :key="idx" class="entry-row">
          <textarea
            v-model="formData.entries[idx]"
            class="field-input entry-textarea"
            rows="2"
            :placeholder="`Entry ${idx + 1}…`"
          />
          <button
            type="button"
            class="remove-entry-btn"
            @click="removeEntry(idx)"
            aria-label="Remove entry"
          >
            ✕
          </button>
        </div>
      </div>
      <button type="button" class="add-entry-btn" @click="addEntry">+ Add Entry</button>
    </div>

    <!-- Actions -->
    <div class="form-actions">
      <button @click="submitForm" :disabled="!isFormValid" class="btn-primary">Save Item</button>
      <button @click="$router.back()" class="btn-secondary">Cancel</button>
    </div>

    <p v-if="errorMessage" class="msg msg--error">{{ errorMessage }}</p>
    <p v-if="successMessage" class="msg msg--success">{{ successMessage }}</p>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue';
  import { useRouter } from 'vue-router';
  import { useItemStore } from '../../stores/itemStore';
  import { v4 as uuidv4 } from 'uuid';
  import type { CustomItem } from '../../types';

  const router = useRouter();
  const itemStore = useItemStore();

  const formData = ref({
    name: '',
    source: 'Custom',
    type: '' as string,
    rarity: '' as string,
    valueGp: undefined as number | undefined,
    weight: undefined as number | undefined,
    armor: false,
    weapon: false,
    wondrous: false,
    reqAttune: false,
    reqAttuneBy: '',
    ac: '' as string,
    dmg1: '' as string,
    dmgType: '' as string,
    charges: undefined as number | undefined,
    recharge: '' as string,
    entries: [''] as string[],
  });

  const errorMessage = ref('');
  const successMessage = ref('');

  const isFormValid = computed(() => formData.value.name.trim().length > 0);

  function addEntry() {
    formData.value.entries.push('');
  }

  function removeEntry(idx: number) {
    formData.value.entries.splice(idx, 1);
  }

  async function submitForm() {
    errorMessage.value = '';
    successMessage.value = '';

    if (!isFormValid.value) {
      errorMessage.value = 'Item name is required.';
      return;
    }

    try {
      const entries = formData.value.entries
        .map(e => e.trim())
        .filter(e => e.length > 0);

      // Attunement: string requirement takes priority over plain boolean
      const reqAttune = formData.value.reqAttune
        ? (formData.value.reqAttuneBy.trim() || true)
        : undefined;

      const newItem: CustomItem = {
        id: uuidv4(),
        name: formData.value.name.trim(),
        source: formData.value.source.trim() || 'Custom',
        ...(formData.value.type && { type: formData.value.type as any }),
        ...(formData.value.rarity && { rarity: formData.value.rarity }),
        // Value stored in copper pieces to match 5etools format (1 gp = 100 cp)
        ...(formData.value.valueGp !== undefined && { value: Math.round(formData.value.valueGp * 100) }),
        ...(formData.value.weight !== undefined && { weight: formData.value.weight }),
        ...(formData.value.armor && { armor: true }),
        ...(formData.value.weapon && { weapon: true }),
        ...(formData.value.wondrous && { wondrous: true }),
        ...(formData.value.ac && { ac: formData.value.ac }),
        ...(formData.value.dmg1 && { dmg1: formData.value.dmg1 }),
        ...(formData.value.dmgType && { dmgType: formData.value.dmgType }),
        ...(reqAttune !== undefined && { reqAttune }),
        ...(formData.value.charges !== undefined && { charges: formData.value.charges }),
        ...(formData.value.recharge && { recharge: formData.value.recharge }),
        ...(entries.length > 0 && { entries }),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await itemStore.addCustomItem(newItem);
      successMessage.value = 'Item created!';

      setTimeout(() => {
        router.push('/items');
      }, 400);
    } catch {
      errorMessage.value = 'Failed to create item. Please try again.';
    }
  }
</script>

<style scoped>
  .create-item {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding-bottom: 3rem;
  }

  .page-title {
    margin: 0 0 0.25rem;
    color: var(--color-primary);
    font-size: 1.4rem;
  }

  /* ── Sections ── */
  .form-section {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 1rem;
    background: var(--color-surface);
    border: 1px solid rgba(107, 46, 46, 0.12);
    border-radius: var(--radius);
  }

  .section-title {
    margin: 0 0 0.25rem;
    font-size: 0.8rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--color-primary);
    border-bottom: 1px solid rgba(107, 46, 46, 0.15);
    padding-bottom: 0.4rem;
  }

  /* ── Fields ── */
  .field {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .field label {
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--color-muted);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .field-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
  }

  .field-input {
    padding: 0.6rem 0.75rem;
    min-height: 44px;
    border: 1px solid rgba(107, 46, 46, 0.2);
    border-radius: 8px;
    background: var(--color-bg);
    color: var(--color-text);
    font-size: 0.95rem;
    font-family: inherit;
    width: 100%;
    box-sizing: border-box;
  }

  .field-input:focus {
    outline: 2px solid var(--color-accent);
    outline-offset: 1px;
    border-color: var(--color-accent);
  }

  select.field-input {
    cursor: pointer;
  }

  /* ── Toggle pills ── */
  .toggle-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .toggle-pill {
    padding: 0.4rem 0.9rem;
    min-height: 36px;
    border: 1px solid rgba(107, 46, 46, 0.25);
    border-radius: 20px;
    background: var(--color-bg);
    color: var(--color-text);
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
  }

  .toggle-pill--on {
    background: var(--color-primary);
    color: white;
    border-color: var(--color-primary);
  }

  /* ── Entries ── */
  .entries-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .entry-row {
    display: flex;
    gap: 0.5rem;
    align-items: flex-start;
  }

  .entry-textarea {
    resize: vertical;
    min-height: 60px;
  }

  .remove-entry-btn {
    flex-shrink: 0;
    width: 36px;
    height: 36px;
    margin-top: 0.4rem;
    border: 1px solid rgba(183, 59, 59, 0.25);
    border-radius: 6px;
    background: transparent;
    color: var(--color-danger);
    font-size: 0.85rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .add-entry-btn {
    align-self: flex-start;
    padding: 0.4rem 0.8rem;
    min-height: 36px;
    border: 1px dashed rgba(107, 46, 46, 0.3);
    border-radius: 8px;
    background: transparent;
    color: var(--color-muted);
    font-size: 0.85rem;
    cursor: pointer;
    transition: border-color 0.15s, color 0.15s;
  }

  .add-entry-btn:hover {
    border-color: var(--color-primary);
    color: var(--color-primary);
  }

  /* ── Actions ── */
  .form-actions {
    display: flex;
    gap: 0.75rem;
  }

  .btn-primary {
    flex: 1;
    padding: 0.8rem;
    min-height: 48px;
    border: none;
    border-radius: var(--radius);
    background: var(--color-primary);
    color: white;
    font-size: 1rem;
    font-weight: 700;
    cursor: pointer;
    transition: opacity 0.15s;
  }

  .btn-primary:hover:not(:disabled) {
    opacity: 0.88;
  }

  .btn-primary:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  .btn-secondary {
    flex: 1;
    padding: 0.8rem;
    min-height: 48px;
    border: 1px solid rgba(107, 46, 46, 0.25);
    border-radius: var(--radius);
    background: transparent;
    color: var(--color-primary);
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s;
  }

  .btn-secondary:hover {
    background: rgba(107, 46, 46, 0.06);
  }

  /* ── Messages ── */
  .msg {
    padding: 0.75rem;
    border-radius: 8px;
    font-size: 0.9rem;
    margin: 0;
  }

  .msg--error {
    background: rgba(183, 59, 59, 0.08);
    border: 1px solid rgba(183, 59, 59, 0.2);
    color: var(--color-danger);
  }

  .msg--success {
    background: rgba(80, 140, 80, 0.08);
    border: 1px solid rgba(80, 140, 80, 0.2);
    color: #4a7a4a;
  }

  /* Collapse two-col to single below 400px */
  @media (max-width: 399px) {
    .field-row {
      grid-template-columns: 1fr;
    }

    .form-actions {
      flex-direction: column;
    }
  }
</style>

