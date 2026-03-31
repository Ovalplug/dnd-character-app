<template>
  <div class="character-wrapper">
    <div class="character-content">
      <h2>Single Character</h2>
      <p>This is the single character view.</p>
      <AccordianHolder header="charcacter json">
          <pre>{{ character }}</pre>
      </AccordianHolder>
    </div>
    <div class="bar-content">
      <CharacterBar />
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { ref } from 'vue';
  import CharacterBar from './CharacterBar.vue';
  import AccordianHolder from '../AccordianHolder.vue';

  import type { playerCharacter } from '../../types';

  const props = defineProps<{
    character: playerCharacter;
  }>();

  const showOverview = ref(true);
  const showCombat = ref(false);
  const showInventory = ref(false);
  const showSpells = ref(false);
  const showNotes = ref(false);

  const allSections = ['overview', 'combat', 'inventory', 'spells', 'notes'];

  function toggleSection(section: string) {
    if (!allSections.includes(section)) return;
    showOverview.value = section === 'overview';
    showCombat.value = section === 'combat';
    showInventory.value = section === 'inventory';
    showSpells.value = section === 'spells';
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
    background-color: lightgray;
  }

  .bar-content {
    flex: 0 0 auto;
  }
</style>
