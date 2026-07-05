<template>
  <div class="create-backpack">
    <h2>Create New Backpack</h2>
    <p class="description">Give your backpack a name to get started.</p>

    <div class="form-section">
      <label for="backpack-name">Backpack Name</label>
      <input
        id="backpack-name"
        v-model="backpackName"
        type="text"
        placeholder="Enter backpack name..."
        class="creation-input"
        @keyup.enter="submitForm"
      />

      <div class="form-actions">
        <button
          @click="submitForm"
          :disabled="!isFormValid()"
          class="creation-primary-button"
        >
          Create Backpack
        </button>
        <button @click="$router.back()" class="creation-secondary-button">
          Cancel
        </button>
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

<script lang="ts" setup>
  import { ref } from 'vue';
  import { useRouter } from 'vue-router';
  import { useItemStore } from '../../stores/itemStore';
  import { v4 as uuidv4 } from 'uuid';
  import type { Backpack } from '../../types';

  const router = useRouter();
  const itemStore = useItemStore();

  const backpackName = ref('');
  const errorMessage = ref('');
  const successMessage = ref('');

  function isFormValid(): boolean {
    return backpackName.value.trim().length > 0;
  }

  async function submitForm() {
    errorMessage.value = '';
    successMessage.value = '';

    if (!isFormValid()) {
      errorMessage.value = 'Backpack name is required';
      return;
    }

    try {
      const newBackpack: Backpack = {
        id: uuidv4(),
        name: backpackName.value.trim(),
        items: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await itemStore.addBackpack(newBackpack);
      successMessage.value = 'Backpack created successfully!';

      setTimeout(() => {
        router.push(`/backpack/${newBackpack.id}`);
      }, 500);
    } catch (error) {
      console.error('Error creating backpack:', error);
      errorMessage.value = 'Failed to create backpack. Please try again.';
    }
  }
</script>

<style scoped>
  .create-backpack {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    padding: 2rem;
    max-width: 600px;
    margin: 0 auto;
  }

  h2 {
    color: var(--color-primary);
    margin: 0;
  }

  .description {
    color: var(--color-muted);
    font-size: 0.95rem;
  }

  .form-section {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1.5rem;
    border-radius: var(--radius);
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.01), transparent);
    border: 1px solid rgba(107, 46, 46, 0.12);
  }

  label {
    font-weight: 600;
    color: var(--color-primary);
    font-size: 0.95rem;
  }

  .creation-input {
    padding: 0.8rem;
    border: 1px solid rgba(107, 46, 46, 0.2);
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.02);
    color: var(--color-text);
    font-size: 1rem;
    transition: all 0.15s ease;
  }

  .creation-input:focus {
    outline: none;
    background: rgba(255, 255, 255, 0.04);
    border-color: var(--color-accent);
  }

  .form-actions {
    display: flex;
    gap: 0.8rem;
    margin-top: 1rem;
  }

  .creation-primary-button {
    flex: 1;
    padding: 0.8rem;
    border: none;
    border-radius: 8px;
    background: var(--color-primary);
    color: white;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .creation-primary-button:hover:not(:disabled) {
    background: #8b3e3e;
  }

  .creation-primary-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .creation-secondary-button {
    flex: 1;
    padding: 0.8rem;
    border: 1px solid rgba(107, 46, 46, 0.2);
    border-radius: 8px;
    background: transparent;
    color: var(--color-primary);
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .creation-secondary-button:hover {
    background: rgba(107, 46, 46, 0.08);
    border-color: var(--color-primary);
  }

  .creation-message {
    padding: 0.8rem;
    border-radius: 8px;
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
</style>
