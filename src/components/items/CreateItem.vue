<template>
  <div class="create-item">
    <div class="header">
      <h1>Create Custom Item</h1>
      <p class="description">Define a new custom item with all its properties and abilities</p>
    </div>

    <div class="form-container">
      <!-- Basic Information Section -->
      <div class="form-section">
        <h2 class="section-title">Basic Information</h2>

        <div class="form-grid two-col">
          <div class="form-group">
            <label for="item-name">Item Name *</label>
            <input
              id="item-name"
              v-model="formData.name"
              type="text"
              placeholder="Enter item name..."
              class="creation-input"
              @keyup.enter="submitForm"
            />
          </div>

          <div class="form-group">
            <label for="item-source">Source *</label>
            <input
              id="item-source"
              v-model="formData.source"
              type="text"
              placeholder="e.g., Custom, Homebrew, DMG..."
              class="creation-input"
            />
          </div>
        </div>

        <div class="form-grid two-col">
          <div class="form-group">
            <label for="item-page">Page Number</label>
            <input
              id="item-page"
              v-model.number="formData.page"
              type="number"
              placeholder="Optional"
              class="creation-input"
            />
          </div>

          <div class="form-group">
            <label for="item-display-name">Display Name</label>
            <input
              id="item-display-name"
              v-model="formData.displayName"
              type="text"
              placeholder="Override (optional)"
              class="creation-input"
            />
          </div>
        </div>
      </div>

      <!-- Item Properties Section -->
      <div class="form-section">
        <h2 class="section-title">Item Properties</h2>

        <div class="form-grid three-col">
          <div class="form-group">
            <label for="item-type">Item Type</label>
            <select id="item-type" v-model="formData.type" class="creation-input">
              <option value="">-- Select Type --</option>
              <option value="$">Currency</option>
              <option value="A">Ammunition</option>
              <option value="AF">Adventuring Gear</option>
              <option value="AT">Artisan Tools</option>
              <option value="G">Generic Item</option>
              <option value="M">Melee Weapon</option>
              <option value="P">Potion</option>
              <option value="R">Ranged Weapon</option>
              <option value="S">Shield</option>
              <option value="T">Tools</option>
              <option value="WD">Wondrous Item</option>
            </select>
          </div>

          <div class="form-group">
            <label for="item-rarity">Rarity</label>
            <select id="item-rarity" v-model="formData.rarity" class="creation-input">
              <option value="">-- Select Rarity --</option>
              <option value="Common">Common</option>
              <option value="Uncommon">Uncommon</option>
              <option value="Rare">Rare</option>
              <option value="Very Rare">Very Rare</option>
              <option value="Legendary">Legendary</option>
              <option value="Artifact">Artifact</option>
            </select>
          </div>

          <div class="form-group">
            <label for="item-value">Value (gp)</label>
            <input
              id="item-value"
              v-model.number="formData.value"
              type="number"
              placeholder="0"
              class="creation-input"
            />
          </div>
        </div>

        <div class="form-grid two-col">
          <div class="form-group">
            <label for="item-weight">Weight (lb)</label>
            <input
              id="item-weight"
              v-model.number="formData.weight"
              type="number"
              step="0.1"
              placeholder="0"
              class="creation-input"
            />
          </div>

          <div class="form-group">
            <label for="item-charges">Charges</label>
            <input
              id="item-charges"
              v-model.number="formData.charges"
              type="number"
              placeholder="Optional"
              class="creation-input"
            />
          </div>
        </div>
      </div>

      <!-- Combat Properties Section -->
      <div class="form-section">
        <h2 class="section-title">Combat Properties</h2>

        <div class="checkbox-group">
          <label class="checkbox-label">
            <input v-model="formData.armor" type="checkbox" />
            Armor
          </label>
          <label class="checkbox-label">
            <input v-model="formData.weapon" type="checkbox" />
            Weapon
          </label>
          <label class="checkbox-label">
            <input v-model="formData.wondrous" type="checkbox" />
            Wondrous Item
          </label>
        </div>

        <div v-if="formData.armor" class="form-grid">
          <div class="form-group">
            <label for="item-ac">Armor Class (AC)</label>
            <input
              id="item-ac"
              v-model="formData.ac"
              type="text"
              placeholder="e.g., 12, 10+DEX, 16"
              class="creation-input"
            />
          </div>
        </div>

        <div v-if="formData.weapon" class="form-grid two-col">
          <div class="form-group">
            <label for="item-dmg1">Damage Dice</label>
            <input
              id="item-dmg1"
              v-model="formData.dmg1"
              type="text"
              placeholder="e.g., 1d8, 2d6"
              class="creation-input"
            />
          </div>

          <div class="form-group">
            <label for="item-dmg-type">Damage Type</label>
            <select id="item-dmg-type" v-model="formData.dmgType" class="creation-input">
              <option value="">-- Select Type --</option>
              <option value="Slashing">Slashing</option>
              <option value="Piercing">Piercing</option>
              <option value="Bludgeoning">Bludgeoning</option>
              <option value="Fire">Fire</option>
              <option value="Cold">Cold</option>
              <option value="Lightning">Lightning</option>
              <option value="Thunder">Thunder</option>
              <option value="Poison">Poison</option>
              <option value="Psychic">Psychic</option>
              <option value="Radiant">Radiant</option>
              <option value="Necrotic">Necrotic</option>
              <option value="Force">Force</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Magical Properties Section -->
      <div class="form-section">
        <h2 class="section-title">Magical Properties</h2>

        <div class="form-grid two-col">
          <div class="form-group">
            <label for="item-req-attune">Attunement Required</label>
            <select id="item-req-attune" v-model="formData.reqAttune" class="creation-input">
              <option :value="false">No</option>
              <option :value="true">Yes</option>
            </select>
          </div>

          <div class="form-group">
            <label for="item-recharge">Recharge Rate</label>
            <input
              id="item-recharge"
              v-model="formData.recharge"
              type="text"
              placeholder="e.g., 1d6, 1/day"
              class="creation-input"
            />
          </div>
        </div>
      </div>

      <!-- Description Section -->
      <div class="form-section">
        <h2 class="section-title">Description</h2>

        <div class="form-group">
          <label for="item-entries">Item Description & Abilities</label>
          <textarea
            id="item-entries"
            v-model="itemEntriesText"
            placeholder="Enter item description or abilities (one per line for multiple entries)"
            class="creation-textarea"
            rows="6"
          />
          <small class="help-text">Separate multiple descriptions with new lines</small>
        </div>
      </div>

      <!-- Actions -->
      <div class="form-actions">
        <button @click="submitForm" :disabled="!isFormValid()" class="creation-primary-button">
          Create Item
        </button>
        <button @click="$router.back()" class="creation-secondary-button">Cancel</button>
      </div>

      <div v-if="errorMessage" class="creation-message error-message">
        {{ errorMessage }}
      </div>
      <div v-if="successMessage" class="creation-message success-message">
        {{ successMessage }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref } from 'vue';
  import { useRouter } from 'vue-router';
  import { useItemStore } from '../../stores/itemStore';
  import { v4 as uuidv4 } from 'uuid';
  import type { CustomItem } from '../../types';

  const router = useRouter();
  const itemStore = useItemStore();

  const formData = ref({
    name: '',
    source: '',
    page: undefined as number | undefined,
    displayName: '',
    type: '',
    rarity: '',
    value: undefined as number | undefined,
    weight: undefined as number | undefined,
    armor: false,
    weapon: false,
    ac: '' as string | number | undefined,
    dmg1: '',
    dmgType: '',
    reqAttune: false,
    wondrous: false,
    charges: undefined as number | undefined,
    recharge: '',
  });

  const itemEntriesText = ref('');
  const errorMessage = ref('');
  const successMessage = ref('');

  function isFormValid(): boolean {
    return formData.value.name.trim().length > 0 && formData.value.source.trim().length > 0;
  }

  async function submitForm() {
    errorMessage.value = '';
    successMessage.value = '';

    if (!isFormValid()) {
      errorMessage.value = 'Item name and source are required';
      return;
    }

    try {
      const entries = itemEntriesText.value
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

      const newItem: CustomItem = {
        id: uuidv4(),
        name: formData.value.name.trim(),
        source: formData.value.source.trim(),
        ...(formData.value.page && { page: formData.value.page }),
        ...(formData.value.displayName && { displayName: formData.value.displayName.trim() }),
        ...(formData.value.type && { type: formData.value.type as any }),
        ...(formData.value.rarity && { rarity: formData.value.rarity }),
        ...(formData.value.value !== undefined && { value: formData.value.value }),
        ...(formData.value.weight !== undefined && { weight: formData.value.weight }),
        ...(formData.value.armor && { armor: true }),
        ...(formData.value.weapon && { weapon: true }),
        ...(formData.value.ac && { ac: formData.value.ac }),
        ...(formData.value.dmg1 && { dmg1: formData.value.dmg1 }),
        ...(formData.value.dmgType && { dmgType: formData.value.dmgType }),
        ...(formData.value.reqAttune && { reqAttune: formData.value.reqAttune }),
        ...(formData.value.wondrous && { wondrous: true }),
        ...(formData.value.charges !== undefined && { charges: formData.value.charges }),
        ...(formData.value.recharge && { recharge: formData.value.recharge }),
        ...(entries.length > 0 && { entries: entries }),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await itemStore.addCustomItem(newItem);
      successMessage.value = 'Item created successfully!';

      setTimeout(() => {
        router.push(`/items/${newItem.id}`);
      }, 500);
    } catch (error) {
      console.error('Error creating item:', error);
      errorMessage.value = 'Failed to create item. Please try again.';
    }
  }
</script>

<style scoped>
  .create-item {
    display: flex;
    flex-direction: column;
    gap: 2rem;
    padding: 2rem;
    max-width: 1000px;
    margin: 0 auto;
  }

  .header {
    text-align: center;
    margin-bottom: 1rem;
  }

  .header h1 {
    margin: 0;
    color: var(--color-primary);
    font-size: 2rem;
  }

  .description {
    color: var(--color-muted);
    font-size: 1rem;
    margin: 0.5rem 0 0 0;
  }

  .form-container {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .form-section {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1.5rem;
    border-radius: 8px;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.02), transparent);
    border: 1px solid rgba(107, 46, 46, 0.12);
  }

  .section-title {
    margin: 0;
    padding-bottom: 0.75rem;
    border-bottom: 2px solid rgba(107, 46, 46, 0.2);
    color: var(--color-primary);
    font-size: 1.15rem;
  }

  .form-grid {
    display: grid;
    gap: 1rem;
  }

  .form-grid.two-col {
    grid-template-columns: repeat(2, 1fr);
  }

  .form-grid.three-col {
    grid-template-columns: repeat(3, 1fr);
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .form-group label {
    font-weight: 600;
    color: var(--color-primary);
    font-size: 0.9rem;
  }

  .creation-input,
  .creation-textarea {
    padding: 0.7rem;
    border: 1px solid rgba(107, 46, 46, 0.2);
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.02);
    color: var(--color-text);
    font-size: 0.95rem;
    transition: all 0.15s ease;
    font-family: inherit;
  }

  .creation-input:focus,
  .creation-textarea:focus {
    outline: none;
    background: rgba(255, 255, 255, 0.04);
    border-color: var(--color-accent);
  }

  .creation-textarea {
    resize: vertical;
  }

  .help-text {
    font-size: 0.8rem;
    color: var(--color-muted);
    margin-top: 0.2rem;
  }

  .checkbox-group {
    display: flex;
    flex-wrap: wrap;
    gap: 1.5rem;
    padding: 0.75rem 0;
  }

  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 400;
    color: var(--color-text);
    cursor: pointer;
  }

  .checkbox-label input {
    cursor: pointer;
  }

  .form-actions {
    display: flex;
    gap: 0.8rem;
    margin-top: 1rem;
  }

  .creation-primary-button {
    flex: 1;
    padding: 0.9rem 1.5rem;
    border: none;
    border-radius: 6px;
    background: var(--color-primary);
    color: white;
    font-weight: 600;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .creation-primary-button:hover:not(:disabled) {
    background: #8b3e3e;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(107, 46, 46, 0.2);
  }

  .creation-primary-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .creation-secondary-button {
    flex: 1;
    padding: 0.9rem 1.5rem;
    border: 1px solid rgba(107, 46, 46, 0.2);
    border-radius: 6px;
    background: transparent;
    color: var(--color-primary);
    font-weight: 600;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .creation-secondary-button:hover {
    background: rgba(107, 46, 46, 0.08);
    border-color: var(--color-primary);
  }

  .creation-message {
    padding: 0.9rem;
    border-radius: 6px;
    font-size: 0.9rem;
    margin-top: 0.5rem;
  }

  .error-message {
    background: rgba(183, 59, 59, 0.08);
    border: 1px solid rgba(183, 59, 59, 0.2);
    color: var(--color-danger);
  }

  .success-message {
    background: rgba(107, 139, 107, 0.08);
    border: 1px solid rgba(107, 139, 107, 0.2);
    color: #6b8b6b;
  }

  @media (max-width: 768px) {
    .create-item {
      padding: 1rem;
    }

    .header h1 {
      font-size: 1.5rem;
    }

    .form-grid.two-col,
    .form-grid.three-col {
      grid-template-columns: 1fr;
    }

    .checkbox-group {
      flex-direction: column;
      gap: 0.8rem;
    }

    .form-actions {
      flex-direction: column;
    }
  }
</style>
