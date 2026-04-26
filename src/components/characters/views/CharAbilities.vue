<template>
  <h1>Character Abilities</h1>
  <button @click="getSpellsList">Get spells list</button>
</template>

<script setup lang="ts">
  import type { playerCharacter, ClassLevels } from '../../../types';
  import { getFeaturesForLevel, computeCharSpellcasting } from '../../../helperFunctions';

  const props = defineProps<{
    character: playerCharacter;
  }>();

  function getSpellsList() {
    // props.character.classes.forEach(element => {
    //   const features = getFeaturesForLevel(
    //     element.classFeatures,
    //     props.character.classLevels[element.name.toLowerCase() as keyof ClassLevels]
    //   );
    //   console.log(features);
    // });

    computeSpellcasting();
  }

  function computeSpellcasting() {
    const spellcasting = computeCharSpellcasting(props.character);
  }
</script>
