<template>
  <div class="update-speed">
    <div v-for="entry in speedFields" :key="entry.key" class="speed-row">
      <span class="speed-label">{{ entry.label }}</span>
      <div class="value-row">
        <button class="stepper-btn" @click="decrement(entry.key)" aria-label="Decrease">
          <img :src="downArrow" alt="−" class="stepper-icon" />
        </button>
        <input type="number" v-model.number="speeds[entry.key]" class="value-input" min="0" />
        <button class="stepper-btn" @click="increment(entry.key)" aria-label="Increase">
          <img :src="upArrow" alt="+" class="stepper-icon" />
        </button>
      </div>
    </div>
    <div class="action-row">
      <button class="action-btn" @click="save">Save Speeds</button>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { reactive } from 'vue';
  import { useCharacterStore } from '../../../../stores/characterStore';
  import type { playerCharacter } from '../../../../types';
  import downArrow from '../../../../assets/icons/down-arrow.svg';
  import upArrow from '../../../../assets/icons/up-arrow.svg';

  const props = defineProps<{ character: playerCharacter }>();
  const emit = defineEmits<{ (e: 'close'): void }>();

  const charStore = useCharacterStore();

  const speedFields = [
    { key: 'base' as const, label: 'Speed' },
    { key: 'fly' as const, label: 'Fly' },
    { key: 'swim' as const, label: 'Swim' },
    { key: 'climb' as const, label: 'Climb' },
    { key: 'burrow' as const, label: 'Burrow' },
  ];

  const speeds = reactive({
    base: props.character.speed.base,
    fly: props.character.speed.fly ?? 0,
    swim: props.character.speed.swim ?? 0,
    climb: props.character.speed.climb ?? 0,
    burrow: props.character.speed.burrow ?? 0,
  });

  function increment(key: keyof typeof speeds) {
    speeds[key] += 5;
  }

  function decrement(key: keyof typeof speeds) {
    if (speeds[key] <= 0) return;
    speeds[key] = Math.max(0, speeds[key] - 5);
  }

  function save() {
    charStore.updateSpeed(props.character.id, {
      base: speeds.base,
      fly: speeds.fly || undefined,
      swim: speeds.swim || undefined,
      climb: speeds.climb || undefined,
      burrow: speeds.burrow || undefined,
    });
    emit('close');
  }
</script>

<style scoped>
  .update-speed {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 0.5rem 0.25rem;
  }

  .speed-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }

  .speed-label {
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--color-muted);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    width: 50px;
    flex-shrink: 0;
  }

  .value-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .stepper-btn {
    width: 36px;
    height: 36px;
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

  .stepper-btn:hover {
    background: rgba(201, 164, 75, 0.15);
    transform: scale(1.1);
  }

  .stepper-icon {
    width: 16px;
    height: 16px;
  }

  .value-input {
    width: 60px;
    text-align: center;
    font-size: 1rem;
    font-weight: 700;
    border: 1px solid rgba(0, 0, 0, 0.15);
    border-radius: 8px;
    padding: 0.25rem;
    background: var(--color-surface);
    color: var(--color-text);
  }

  .action-row {
    display: flex;
    justify-content: center;
    margin-top: 0.25rem;
  }

  .action-btn {
    padding: 0.5rem 1.5rem;
    border-radius: 8px;
    border: none;
    background: var(--color-accent);
    color: #fff;
    font-weight: 700;
    cursor: pointer;
    font-size: 0.9rem;
    transition: opacity 0.15s;
  }

  .action-btn:hover {
    opacity: 0.85;
  }
</style>
