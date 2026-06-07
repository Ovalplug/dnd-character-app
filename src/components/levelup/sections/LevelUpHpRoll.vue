<template>
  <section class="creation-panel">
    <div class="creation-intro">
      <p>
        Roll or enter the HP gained for this level of <strong>{{ classData.name }}</strong>. The
        hit die is <strong>{{ classData.hd }}</strong>.
      </p>
    </div>

    <div class="creation-actions creation-actions--top">
      <button
        type="button"
        class="creation-primary-button"
        :disabled="hpGain < 1"
        @click="confirm"
      >
        Continue
      </button>
    </div>

    <div class="hp-panel card">
      <div class="hp-panel__row">
        <div class="hp-panel__col">
          <p class="hp-panel__label">Hit die</p>
          <p class="hp-panel__value">{{ classData.hd }}</p>
        </div>
        <div class="hp-panel__col">
          <p class="hp-panel__label">CON modifier</p>
          <p class="hp-panel__value">{{ conModDisplay }}</p>
        </div>
        <div class="hp-panel__col">
          <p class="hp-panel__label">Total HP gain</p>
          <p class="hp-panel__value hp-panel__value--highlight">{{ totalHpGain }}</p>
        </div>
      </div>

      <div class="hp-panel__mode-row">
        <label class="toggle-row">
          <input v-model="mode" type="radio" value="roll" name="hp-mode" />
          <span>Roll for HP</span>
        </label>
        <label class="toggle-row">
          <input v-model="mode" type="radio" value="average" name="hp-mode" />
          <span>Take average ({{ averageRoll }})</span>
        </label>
        <label class="toggle-row">
          <input v-model="mode" type="radio" value="max" name="hp-mode" />
          <span>Take maximum ({{ maxRoll }})</span>
        </label>
        <label class="toggle-row">
          <input v-model="mode" type="radio" value="manual" name="hp-mode" />
          <span>Enter manually</span>
        </label>
      </div>

      <div v-if="mode === 'roll'" class="hp-panel__roll-area">
        <p v-if="rolledValue !== null" class="hp-panel__roll-result">
          You rolled a <strong>{{ rolledValue }}</strong>!
        </p>
        <button type="button" class="btn btn-primary" @click="rollDie">
          {{ rolledValue === null ? `Roll ${classData.hd}` : `Re-roll ${classData.hd}` }}
        </button>
      </div>

      <div v-else-if="mode === 'manual'" class="hp-panel__manual">
        <label class="form-label" for="hp-manual-input">HP rolled (before CON)</label>
        <input
          id="hp-manual-input"
          v-model.number="manualRoll"
          type="number"
          :min="1"
          :max="maxRoll"
        />
      </div>
    </div>

    <div class="creation-actions">
      <button
        type="button"
        class="creation-primary-button"
        :disabled="hpGain < 1"
        @click="confirm"
      >
        Continue
      </button>
    </div>
  </section>
</template>

<script lang="ts" setup>
  import { computed, ref, watch } from 'vue';
  import type { CharClass, playerCharacter } from '../../../types';
  import { calculateAbilityScoreModifier } from '../../../helperFunctions';

  const props = defineProps<{
    character: playerCharacter;
    classData: CharClass;
  }>();

  const emit = defineEmits<{
    (e: 'nextStep', hpGain: number): void;
  }>();

  const mode = ref<'roll' | 'average' | 'max' | 'manual'>('roll');
  const rolledValue = ref<number | null>(null);
  const manualRoll = ref<number>(1);

  const maxRoll = computed(() => {
    const sides = parseInt(props.classData.hd.substring(1), 10);
    return Number.isFinite(sides) && sides > 0 ? sides : 8;
  });

  const averageRoll = computed(() => Math.floor(maxRoll.value / 2) + 1);

  const conMod = computed(() =>
    calculateAbilityScoreModifier(props.character.abilityScores.con, 0, false, false)
  );

  const conModDisplay = computed(() => (conMod.value >= 0 ? `+${conMod.value}` : `${conMod.value}`));

  const baseRoll = computed(() => {
    if (mode.value === 'roll') return rolledValue.value ?? 0;
    if (mode.value === 'average') return averageRoll.value;
    if (mode.value === 'max') return maxRoll.value;
    return Math.max(1, Math.min(maxRoll.value, manualRoll.value ?? 1));
  });

  const totalHpGain = computed(() => Math.max(1, baseRoll.value + conMod.value));

  // hpGain is what gets emitted; guard against 0 so button stays disabled until a roll is made
  const hpGain = computed(() => {
    if (mode.value === 'roll' && rolledValue.value === null) return 0;
    return totalHpGain.value;
  });

  // Reset roll when mode changes
  watch(mode, () => {
    rolledValue.value = null;
  });

  function rollDie() {
    rolledValue.value = Math.floor(Math.random() * maxRoll.value) + 1;
  }

  function confirm() {
    if (hpGain.value < 1) return;
    emit('nextStep', hpGain.value);
  }
</script>

<style scoped>
  .hp-panel {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    padding: 1.25rem;
  }

  .hp-panel__row {
    display: flex;
    gap: 1.5rem;
  }

  .hp-panel__col {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .hp-panel__label {
    font-size: 0.78rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--color-muted, #888);
    margin: 0;
  }

  .hp-panel__value {
    font-size: 1.4rem;
    font-weight: 700;
    margin: 0;
  }

  .hp-panel__value--highlight {
    color: var(--color-primary, #6b2e2e);
  }

  .hp-panel__mode-row {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .hp-panel__roll-area {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .hp-panel__roll-result {
    margin: 0;
    font-size: 1rem;
  }

  .hp-panel__manual {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    max-width: 12rem;
  }
</style>
