<template>
  <div v-if="character" style="height: 100%">
    <SingleCharacter :character="character" />
  </div>

  <div v-else>Character not found.</div>
</template>

<script setup lang="ts">
  import { useRoute } from 'vue-router';
  import { useCharacterStore } from '../stores/characterStore';
  import { computed } from 'vue';

  import SingleCharacter from '../components/characters/SingleCharacter.vue';

  const route = useRoute();
  const store = useCharacterStore();

  const characterId = computed(() => String(route.params.id));

  const character = computed(() => store.characters.find(c => c.id === characterId.value));
</script>
