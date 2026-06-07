<template>
  <section class="creation-panel">
    <div class="summary-hero">
      <p class="summary-kicker">Ready to level up</p>
      <h2>{{ character.name }}</h2>
      <p class="summary-copy">Review the changes below, then confirm to apply them.</p>
    </div>

    <div class="creation-actions creation-actions--top">
      <button type="button" class="creation-primary-button save-button" @click="confirm">
        Apply Level Up
      </button>
    </div>

    <div class="levelup-summary card">
      <div class="levelup-summary__row">
        <span class="levelup-summary__label">Total level</span>
        <span class="levelup-summary__value">
          {{ currentTotalLevel }} → <strong>{{ newTotalLevel }}</strong>
        </span>
      </div>

      <div class="levelup-summary__row">
        <span class="levelup-summary__label">Class advancing</span>
        <span class="levelup-summary__value">
          {{ classData.name }}
          {{ currentClassLevel }} → <strong>{{ newClassLevel }}</strong>
          <span v-if="isMulticlass" class="levelup-badge">multiclass</span>
        </span>
      </div>

      <div v-if="subclassData" class="levelup-summary__row">
        <span class="levelup-summary__label">Subclass gained</span>
        <span class="levelup-summary__value">
          <strong>{{ subclassData.name }}</strong>
        </span>
      </div>

      <div class="levelup-summary__row">
        <span class="levelup-summary__label">HP increase</span>
        <span class="levelup-summary__value">
          +<strong>{{ hpGain }}</strong>
          ({{ character.maxHp }} → {{ character.maxHp + hpGain }})
        </span>
      </div>

      <div class="levelup-summary__row">
        <span class="levelup-summary__label">New proficiency bonus</span>
        <span class="levelup-summary__value">
          +<strong>{{ newProficiencyBonus }}</strong>
        </span>
      </div>
    </div>

    <div class="creation-actions">
      <button type="button" class="creation-primary-button save-button" @click="confirm">
        Apply Level Up
      </button>
    </div>
  </section>
</template>

<script lang="ts" setup>
  import { computed } from 'vue';
  import type { CharClass, ClassLevels, playerCharacter, Subclass } from '../../../types';
  import { calculateProficiencyBonus } from '../../../helperFunctions';

  const props = defineProps<{
    character: playerCharacter;
    classData: CharClass;
    subclassData: Subclass | null;
    hpGain: number;
  }>();

  const emit = defineEmits<{
    (e: 'finishLevelUp'): void;
  }>();

  const currentClassLevel = computed(
    () => props.character.classLevels[props.classData.name.toLowerCase() as keyof ClassLevels] ?? 0
  );

  const newClassLevel = computed(() => currentClassLevel.value + 1);

  const currentTotalLevel = computed(() =>
    Object.values(props.character.classLevels).reduce((sum, lvl) => sum + lvl, 0)
  );

  const newTotalLevel = computed(() => currentTotalLevel.value + 1);

  const newProficiencyBonus = computed(() => calculateProficiencyBonus(newTotalLevel.value));

  const isMulticlass = computed(
    () =>
      !props.character.classes.some(
        c => c.name.toLowerCase() === props.classData.name.toLowerCase()
      )
  );

  function confirm() {
    emit('finishLevelUp');
  }
</script>

<style scoped>
  .summary-hero {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .summary-hero h2 {
    margin: 0;
  }

  .summary-kicker {
    font-size: 0.78rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--color-primary, #6b2e2e);
    margin: 0;
  }

  .summary-copy {
    color: var(--color-muted, #888);
    margin: 0;
  }

  .levelup-summary {
    display: flex;
    flex-direction: column;
    gap: 0;
    padding: 0;
    overflow: hidden;
  }

  .levelup-summary__row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid rgba(0, 0, 0, 0.07);
  }

  .levelup-summary__row:last-child {
    border-bottom: none;
  }

  .levelup-summary__label {
    font-size: 0.88rem;
    color: var(--color-muted, #888);
  }

  .levelup-summary__value {
    font-size: 0.95rem;
  }

  .levelup-badge {
    margin-left: 0.5rem;
    font-size: 0.72rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--color-primary, #6b2e2e);
    border: 1px solid currentColor;
    border-radius: 4px;
    padding: 1px 5px;
  }
</style>
