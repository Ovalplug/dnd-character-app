<template>
  <section class="creation-panel">
    <div class="creation-intro">
      <p>
        Here is everything <strong>{{ character.name }}</strong> gains at
        <strong>{{ classData.name }} {{ analysis.newClassLevel }}</strong
        >.
      </p>
    </div>

    <div class="creation-actions creation-actions--top">
      <button type="button" class="creation-primary-button" @click="$emit('nextStep')">
        Continue
      </button>
    </div>

    <!-- New class features -->
    <div v-if="analysis.featuresGained.length" class="features-section">
      <h3 class="features-section__heading">New features</h3>
      <div class="features-grid">
        <div
          v-for="feature in analysis.featuresGained"
          :key="feature.name"
          class="feature-card card"
        >
          <div class="feature-card__header">
            <span class="feature-card__name">{{ feature.name }}</span>
            <span v-if="feature.gainSubclassFeature" class="feature-badge">subclass</span>
            <span v-else-if="isASI(feature.name)" class="feature-badge feature-badge--asi"
              >ASI / Feat</span
            >
          </div>
          <ResourceEntries
            v-if="feature.entries?.length"
            :entries="feature.entries"
            class="feature-card__entries"
          />
        </div>
      </div>
    </div>

    <!-- Class table changes -->
    <div
      v-if="analysis.tableChanges.length || analysis.newSpellSlotsDescription.length"
      class="table-section"
    >
      <h3 class="features-section__heading">Class table at level {{ analysis.newClassLevel }}</h3>
      <div class="table-changes card">
        <div v-for="change in analysis.tableChanges" :key="change.label" class="table-row">
          <span class="table-row__label">{{ change.label }}</span>
          <span class="table-row__delta">
            <span class="table-row__old">{{ change.oldValue }}</span>
            <span class="table-row__arrow">→</span>
            <strong class="table-row__new">{{ change.newValue }}</strong>
          </span>
        </div>

        <div v-for="desc in analysis.newSpellSlotsDescription" :key="desc" class="table-row">
          <span class="table-row__label">Spell slots</span>
          <span class="table-row__delta">
            <strong class="table-row__new">{{ desc }}</strong>
          </span>
        </div>
      </div>
    </div>

    <div
      v-if="
        !analysis.featuresGained.length &&
        !analysis.tableChanges.length &&
        !analysis.newSpellSlotsDescription.length
      "
      class="empty-state"
    >
      <p>No mechanical changes to show for this level — onward!</p>
    </div>

    <div class="creation-actions">
      <button type="button" class="creation-primary-button" @click="$emit('nextStep')">
        Continue
      </button>
    </div>
  </section>
</template>

<script lang="ts" setup>
  import type { CharClass, playerCharacter } from '../../../types';
  import type { LevelUpAnalysis } from '../levelUpHelpers';
  import ResourceEntries from '../../resources/ResourceEntries.vue';

  defineProps<{
    character: playerCharacter;
    classData: CharClass;
    analysis: LevelUpAnalysis;
  }>();

  defineEmits<{ (e: 'nextStep'): void }>();

  function isASI(name: string): boolean {
    return (
      name.toLowerCase().includes('ability score improvement') ||
      name.toLowerCase().includes('ability score increase')
    );
  }
</script>

<style scoped>
  .features-section {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .features-section__heading {
    font-size: 0.9rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--color-primary, #6b2e2e);
    margin: 0;
  }

  .features-grid {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .feature-card {
    padding: 0.7rem 0.85rem;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .feature-card__header {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    flex-wrap: wrap;
  }

  .feature-card__name {
    font-weight: 700;
    font-size: 1rem;
  }

  .feature-card__entries {
    font-size: 0.88rem;
    color: var(--color-muted, #666);
  }

  .feature-badge {
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--color-primary, #6b2e2e);
    border: 1px solid currentColor;
    border-radius: 4px;
    padding: 1px 5px;
  }

  .feature-badge--asi {
    color: #2e6b6b;
  }

  .table-section {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .table-changes {
    display: flex;
    flex-direction: column;
    gap: 0;
    padding: 0;
    overflow: hidden;
  }

  .table-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    padding: 0.65rem 1rem;
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  }

  .table-row:last-child {
    border-bottom: none;
  }

  .table-row__label {
    font-size: 0.88rem;
    color: var(--color-muted, #888);
  }

  .table-row__delta {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.95rem;
  }

  .table-row__old {
    text-decoration: line-through;
    opacity: 0.5;
  }

  .table-row__arrow {
    opacity: 0.5;
  }

  .table-row__new {
    color: var(--color-primary, #6b2e2e);
  }

  .empty-state {
    text-align: center;
    color: var(--color-muted, #888);
    padding: 1.5rem;
  }
</style>
