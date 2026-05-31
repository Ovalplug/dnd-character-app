<template>
  <article class="char-abilities character-detail-view">
    <NameBadge :character="character" />

    <ClassFeaturesSection :character="character" />
    <RacialTraitsSection :character="character" />
    <FeatsSection :character="character" />
    <LanguagesSection :character="character" />
    <SpellcastingSection :character="character" />

    <!-- Empty state -->
    <div
      v-if="!character.classes.length && !character.race && !character.feats?.length"
      class="character-detail-empty"
    >
      <p class="muted">No abilities to display yet. Add a class, race, or feats to get started.</p>
    </div>
  </article>
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
  }
</style>
