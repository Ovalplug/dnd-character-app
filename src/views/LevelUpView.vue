<template>
  <div v-if="character" class="level-up-view">
    <LevelUp :character="character" />
  </div>
  <div v-else class="level-up-view level-up-view--not-found">
    <p>Character not found.</p>
    <router-link to="/characters">Back to characters</router-link>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue';
  import { useRoute } from 'vue-router';
  import { useCharacterStore } from '../stores/characterStore';
  import LevelUp from '../components/levelup/LevelUp.vue';

  const route = useRoute();
  const store = useCharacterStore();

  const characterId = computed(() => String(route.params.id));
  const character = computed(() => store.characters.find(c => c.id === characterId.value));
</script>

<style scoped>
  .level-up-view {
    padding: 1.5rem;
    max-width: 720px;
    margin: 0 auto;
  }

  .level-up-view--not-found {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    padding-top: 4rem;
    color: var(--color-muted, #888);
  }
</style>
