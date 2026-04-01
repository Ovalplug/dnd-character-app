<template>
  <div class="character-wrapper">
    <div class="character-content">
      <CharOverview v-if="showOverview" :character="character" />
      <CharCombat v-if="showCombat" :character="character" />
      <CharInventory v-if="showInventory" :character="character" />
      <CharNotes v-if="showNotes" :character="character" />
      <CharAbilities v-if="showAbilities" :character="character" />
    </div>
    <div class="bar-content">
      <CharacterBar @selectSection="toggleSection" />
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { ref } from 'vue';
  import CharacterBar from './CharacterBar.vue';
  //   import AccordianHolder from '../AccordianHolder.vue';
  import CharAbilities from './views/CharAbilities.vue';
  import CharCombat from './views/CharCombat.vue';
  import CharInventory from './views/CharInventory.vue';
  import CharNotes from './views/CharNotes.vue';
  import CharOverview from './views/CharOverview.vue';

  import type { playerCharacter } from '../../types';

  const props = defineProps<{
    character: playerCharacter;
  }>();

  const showOverview = ref(true);
  const showCombat = ref(false);
  const showInventory = ref(false);
  const showAbilities = ref(false);
  const showNotes = ref(false);

  const allSections = ['overview', 'combat', 'inventory', 'abilities', 'notes'];

  function toggleSection(section: string) {
    if (!allSections.includes(section)) return;
    showOverview.value = section === 'overview';
    showCombat.value = section === 'combat';
    showInventory.value = section === 'inventory';
    showAbilities.value = section === 'abilities';
    showNotes.value = section === 'notes';
  }
</script>

<style scoped>
  .character-wrapper {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  .character-content {
    flex: 1 1 0;
    overflow-y: auto;
    overflow-x: hidden;
  }

  .bar-content {
    flex: 0 0 auto;
  }
</style>
