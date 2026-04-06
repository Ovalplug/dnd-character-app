<template>
  <nav-bar />
  <div class="app-container" v-if="loaded">
    <router-view />
  </div>
  <div v-else>Loading...</div>
  <UpdatePrompt v-if="updateAvailable" />
</template>

<script setup lang="ts">
  import { onMounted, ref } from 'vue';
  import { useCharacterStore } from './stores/characterStore';
  import NavBar from './views/NavBar.vue';
  import UpdatePrompt from './components/UpdatePrompt.vue';
  import { checkForUpdate, useUpdateChecker } from './composables/useUpdateChecker';

  const store = useCharacterStore();
  const loaded = ref(false);
  const { updateAvailable } = useUpdateChecker();

  onMounted(async () => {
    await store.loadCharacters();
    loaded.value = true;
    checkForUpdate();
  });
</script>

<style>
  .app-container {
    margin-left: 12%;
    flex: 1 1 0;
    min-height: 0;
  }
</style>
