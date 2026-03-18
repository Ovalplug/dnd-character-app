<template>
  <div>
    <h2>Name Selector</h2>
    <p>Choose a name for your character, or generate a random one.</p>
    <input v-model="characterName" :placeholder="placeholderName" />
    <button @click="randomiseName()">Generate Random Name</button>
    <button @click="updateName()">Next -></button>
  </div>
</template>
<script lang="ts" setup>
  import { ref } from 'vue';
  import { useCharacterStore } from '../../../stores/characterStore';
  import { createRandomName } from '../../../stores/randomNames.ts';
  const store = useCharacterStore();
  const placeholderName = ref('Adventurer');
  const characterName = ref('');
  const emit = defineEmits<{
    (e: 'nextStep'): void;
  }>();

  function randomiseName() {
    const randomName = createRandomName();
    characterName.value = randomName;
  }

  function updateName() {
    store.updateCharacterName(characterName.value);
    emit('nextStep');
  }
</script>
