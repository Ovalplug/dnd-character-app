<template>
  <section v-if="character.feats?.length" class="ability-section">
    <div class="section-header">
      <h2 class="section-title">Feats</h2>
      <span class="section-badge">{{ character.feats.length }}</span>
    </div>

    <div class="feature-list">
      <FeatureCard
        v-for="(feat, i) in character.feats"
        :key="`feat-${i}`"
        :name="feat.name"
        tag="Feat"
        variant="feat"
      >
        <p v-if="feat.description" class="feat-desc">{{ feat.description }}</p>
        <ResourceEntries v-if="feat.entries?.length" :entries="feat.entries" />
      </FeatureCard>
    </div>
  </section>
</template>

<script setup lang="ts">
  import type { playerCharacter } from '../../../../types';
  import ResourceEntries from '../../../resources/ResourceEntries.vue';
  import FeatureCard from './FeatureCard.vue';

  defineProps<{
    character: playerCharacter;
  }>();
</script>

<style scoped>
  .ability-section {
    background: var(--color-surface);
    border-radius: var(--radius);
    box-shadow: var(--color-card-shadow);
    overflow: hidden;
  }

  .section-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid rgba(31, 27, 22, 0.08);
    flex-wrap: wrap;
  }

  .section-title {
    font-size: 1rem;
    font-weight: 700;
    color: var(--color-primary);
    margin: 0;
    flex: 1;
    min-width: 0;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .section-badge {
    font-size: 0.7rem;
    font-weight: 700;
    padding: 0.15rem 0.5rem;
    border-radius: 20px;
    background: rgba(107, 46, 46, 0.1);
    color: var(--color-primary);
    white-space: nowrap;
  }

  .feature-list {
    display: flex;
    flex-direction: column;
  }
</style>
