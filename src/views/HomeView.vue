<template>
  <div v-if="!dataStore.loaded" class="content-under-header">
      <Loading message="Loading resources..." :size="96" variant="bold"></Loading>
    </div>
  <div v-else>
    <h1>Welcome to D&D Character Manager</h1>
    <p>
      This is your home screen. Use the navigation to manage your characters, view resources, and
      more.
    </p>
  </div>
</template>

<script setup lang="ts">
import Loading from '../components/resources/Loading.vue';

import { useDataStore } from '../stores/dataStore';
import { onMounted } from 'vue';
const dataStore = useDataStore();
onMounted(async () => {
    if (!dataStore.loaded) {
      try {
        await dataStore.init();
      } catch (err) {
        // keep this simple; devs can improve error handling/UI later
        // eslint-disable-next-line no-console
        console.error('Failed to load data store', err);
      }
    }
  });
</script>

<style scoped>
  /* Add any home-specific styles here */
</style>
