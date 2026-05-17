<template>
  <NameBadge :character="character" />
  <div class="char-abilities">
    <ClassFeaturesSection :character="character" />
    <RacialTraitsSection :character="character" />
    <FeatsSection :character="character" />
    <LanguagesSection :character="character" />
    <SpellcastingSection :character="character" />

    <!-- Empty state -->
    <div
      v-if="!character.classes.length && !character.race && !character.feats?.length"
      class="empty-state"
    >
      <p class="muted">No abilities to display yet. Add a class, race, or feats to get started.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
  import type { playerCharacter } from '../../../types';
  import NameBadge from './subcomponents/NameBadge.vue';
  import ClassFeaturesSection from './subcomponents/ClassFeaturesSection.vue';
  import RacialTraitsSection from './subcomponents/RacialTraitsSection.vue';
  import FeatsSection from './subcomponents/FeatsSection.vue';
  import LanguagesSection from './subcomponents/LanguagesSection.vue';
  import SpellcastingSection from './subcomponents/SpellcastingSection.vue';

  defineProps<{
    character: playerCharacter;
  }>();
</script>

<style scoped>
  .char-abilities {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    padding-bottom: 2rem;
  }

  .empty-state {
    text-align: center;
    padding: 3rem 1rem;
    background: var(--color-surface);
    border-radius: var(--radius);
    box-shadow: var(--color-card-shadow);
  }
</style>
