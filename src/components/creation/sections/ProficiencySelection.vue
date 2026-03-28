<template>
  <div>
    <pre>{{ startingProficiencies }}</pre>
    <pre>{{ skillChoices }}</pre>
  </div>
</template>

<script lang="ts" setup>
  import { useCharacterStore } from '../../../stores/characterStore';
  import { ref } from 'vue';
  import { setStartingSkillProficiencies } from '../../../helperFunctions';
  import type { PlayerSkills } from '../../../types';
  const store = useCharacterStore();
  const emit = defineEmits<{ (e: 'nextStep'): void }>();
  const charRace = store.getCharRace();
  const charBackground = store.getCharBackground();

  const charClass = store.getCharFullClasses()[0] || null;
  const { skills, additionalChoices } = setStartingSkillProficiencies(
    charClass,
    charRace,
    charBackground
  );
  const startingProficiencies = ref<PlayerSkills>(skills);
  const skillChoices = ref(additionalChoices);
</script>
