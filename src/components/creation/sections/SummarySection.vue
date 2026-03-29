<template>
    <p>Summary section coming soon...</p>
    <p>just press the button and save your character for now...</p>
    <button @click="saveCharacter">Save Character</button>
</template>

<script lang="ts" setup>
  import { useCharacterStore } from '../../../stores/characterStore';

  const store = useCharacterStore();
  const emit = defineEmits<{ (e: 'finishCreation'): void }>();

  function saveCharacter() {
    store.finalizeCharacterCreation();
    emit('finishCreation');
  }
  </script>