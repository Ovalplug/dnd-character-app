<template>
  <section v-if="character.race" class="ability-section">
    <div class="section-header">
      <h2 class="section-title">{{ character.race.name }} Traits</h2>
      <span class="section-badge section-badge--race">Racial</span>
      <span v-if="character.subrace" class="subclass-pill">
        {{ character.subrace.name }}
      </span>
    </div>

    <div class="feature-list">
      <FeatureCard
        v-for="(entry, i) in namedRaceEntries"
        :key="`race-${i}`"
        :name="(entry as any).name"
        tag="Trait"
        variant="race"
      >
        <ResourceEntries v-if="(entry as any).entries?.length" :entries="(entry as any).entries" />
        <p v-else-if="typeof (entry as any).entry === 'string'" class="muted">
          {{ (entry as any).entry }}
        </p>
      </FeatureCard>

      <template v-if="character.subrace?.entries">
        <FeatureCard
          v-for="(entry, i) in namedSubraceEntries"
          :key="`subrace-${i}`"
          :name="(entry as any).name"
          tag="Subrace"
          variant="subclass"
        >
          <ResourceEntries
            v-if="(entry as any).entries?.length"
            :entries="(entry as any).entries"
          />
          <p v-else-if="typeof (entry as any).entry === 'string'">
            {{ (entry as any).entry }}
          </p>
        </FeatureCard>
      </template>
    </div>
  </section>
</template>

<script setup lang="ts">
  import { computed } from 'vue';
  import type { playerCharacter, Entry } from '../../../../types';
  import ResourceEntries from '../../../resources/ResourceEntries.vue';
  import FeatureCard from './FeatureCard.vue';

  const props = defineProps<{
    character: playerCharacter;
  }>();

  function isNamedEntry(entry: Entry): boolean {
    return (
      typeof entry !== 'string' &&
      !!(entry as any).name &&
      ((entry as any).entries?.length || typeof (entry as any).entry === 'string')
    );
  }

  const namedRaceEntries = computed((): Entry[] => {
    return (props.character.race?.entries ?? []).filter(isNamedEntry);
  });

  const namedSubraceEntries = computed((): Entry[] => {
    return (props.character.subrace?.entries ?? []).filter(isNamedEntry);
  });
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

  .section-badge--race {
    background: rgba(74, 107, 46, 0.12);
    color: #4a6b2e;
  }

  .subclass-pill {
    font-size: 0.72rem;
    font-weight: 600;
    padding: 0.15rem 0.55rem;
    border-radius: 20px;
    background: rgba(201, 164, 75, 0.18);
    color: #7a5d1a;
    border: 1px solid rgba(201, 164, 75, 0.3);
    white-space: nowrap;
  }

  .feature-list {
    display: flex;
    flex-direction: column;
  }
</style>
