<template>
  <div>
    <p>Speed: {{ props.character.speed }}</p>
    <p>
      Initiative: {{ props.character.initiativeBonus >= 0 ? '+' : ''
      }}{{ props.character.initiativeBonus }}
    </p>
    <p>Proficiency Bonus: +{{ props.character.proficiencyModifier }}</p>
    <p @click="toggleInspiration">
      Inspiration: <img v-if="props.character.inspiration" :src="blankd20" alt="Inspiration" /><span
        v-else
        >No</span
      >
    </p>
    <p>
      Passive Perception <span class="p2">(wis)</span>:
      {{
        props.character.passivePerception !== undefined
          ? (props.character.passivePerception >= 0 ? '+' : '') + props.character.passivePerception
          : 'N/A'
      }}
    </p>
    <p>
      Death Saves:
      {{ props.character.deathSaves !== undefined ? props.character.deathSaves : 'N/A' }}
    </p>
  </div>
</template>

<script lang="ts" setup>
  import type { playerCharacter } from '../../../../types';
  import blankd20 from '../../../../assets/icons/blankd20.svg';
  import { useCharacterStore } from '../../../../stores/characterStore';
  const characterStore = useCharacterStore();

  const props = defineProps<{
    character: playerCharacter;
  }>();

  function toggleInspiration() {
    characterStore.toggleInspiration(props.character.id);
  }
</script>

<style scoped></style>
