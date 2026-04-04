<template>
  <div class="update-ac">
    <div class="value-row">
      <button class="stepper-btn" @click="acDown" aria-label="Decrease">
        <img :src="downArrow" alt="−" class="stepper-icon" />
      </button>
      <input type="number" v-model.number="newAc" class="value-input" min="0" />
      <button class="stepper-btn" @click="acUp" aria-label="Increase">
        <img :src="upArrow" alt="+" class="stepper-icon" />
      </button>
    </div>
    <div class="action-row">
      <button class="action-btn temp-btn" @click="updateAc(newAc)">
        <span class="action-label">🛡</span>
        <span>Update AC</span>
      </button>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { ref } from 'vue';
  import { useCharacterStore } from '../../../../stores/characterStore';
  import type { playerCharacter } from '../../../../types';
  import downArrow from '../../../../assets/icons/down-arrow.svg';
  import upArrow from '../../../../assets/icons/up-arrow.svg';

  const charStore = useCharacterStore();
  const newAc = ref(0);

  function acUp() {
    newAc.value++;
  }

  function acDown() {
    if (newAc.value <= 0) return;
    newAc.value--;
  }

  const props = defineProps<{
    character: playerCharacter;
  }>();

  const emit = defineEmits<{ (e: 'close'): void }>();

  function updateAc(newAc: number) {
    charStore.updateAc(props.character.id, newAc);
    emit('close');
  }
</script>

<style scoped>
  .update-ac {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.25rem;
    padding: 0.5rem 0.25rem;
  }

  .value-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .stepper-btn {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    border: 2px solid var(--color-accent);
    background: var(--color-surface);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.15s, transform 0.1s;
    flex-shrink: 0;
  }

  .stepper-btn:active {
    background: var(--color-accent);
    transform: scale(0.93);
  }

  .stepper-icon {
    width: 20px;
    height: 20px;
  }

  .value-input {
    width: 80px;
    text-align: center;
    font-size: 2rem;
    font-weight: 700;
    color: var(--color-text);
    background: var(--color-surface);
    border: 2px solid rgba(31, 27, 22, 0.15);
    border-radius: 10px;
    padding: 0.3rem 0.4rem;
    appearance: textfield;
    -moz-appearance: textfield;
  }
  .value-input::-webkit-outer-spin-button,
  .value-input::-webkit-inner-spin-button {
    -webkit-appearance: none;
  }
  .value-input:focus {
    outline: none;
    border-color: var(--color-accent);
    box-shadow: 0 0 0 3px rgba(201, 164, 75, 0.2);
  }

  .action-row {
    display: flex;
    gap: 0.6rem;
    width: 100%;
  }

  .action-btn {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.2rem;
    padding: 0.65rem 0.4rem;
    border-radius: 10px;
    border: none;
    font-weight: 700;
    font-size: 0.8rem;
    cursor: pointer;
    transition: filter 0.15s, transform 0.1s;
    letter-spacing: 0.02em;
  }

  .action-btn:active {
    filter: brightness(0.88);
    transform: scale(0.97);
  }

  .action-label {
    font-size: 1.3rem;
    line-height: 1;
  }

  .temp-btn {
    background: var(--color-accent);
    color: #1f1b16;
  }
</style>
