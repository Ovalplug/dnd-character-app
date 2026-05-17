<template>
  <section class="combat-section">
    <h3 class="section-label">Saving Throws</h3>
    <div class="saves-row">
      <div
        v-for="save in savingThrows"
        :key="save.abbr"
        class="save-pill"
        :class="{ 'save-pill--prof': save.proficient }"
      >
        <span class="save-abbr">{{ save.abbr }}</span>
        <span class="save-val">{{ save.value >= 0 ? '+' : '' }}{{ save.value }}</span>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
  import { computed } from 'vue';
  import type { playerCharacter } from '../../../../types';
  import { abilityMod } from '../../../../helperFunctions';
  import { SAVE_ABBRS } from '../../../../constants';

  const props = defineProps<{
    character: playerCharacter;
  }>();

  const savingThrows = computed(() =>
    SAVE_ABBRS.map(({ key, abbr }) => {
      const score = props.character.abilityScores[key];
      const mod = abilityMod(score);
      const proficient = props.character.allProficiencies?.savingThrows?.[key] ?? false;
      const value = mod + (proficient ? props.character.proficiencyModifier : 0);
      return { abbr, value, proficient };
    })
  );
</script>

<style scoped>
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

  .saves-row {
    display: flex;
    gap: 0.35rem;
  }

  .save-pill {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex: 1 1 0;
    min-width: 0;
    padding: 0.35rem 0.4rem;
    background: rgba(31, 27, 22, 0.04);
    border: 1px solid rgba(31, 27, 22, 0.08);
    border-radius: 10px;
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
</style>
