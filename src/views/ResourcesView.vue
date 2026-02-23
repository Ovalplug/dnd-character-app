<template>
  <div>
    <h1>This is where all the resources stuff will go</h1>

    <div v-if="!dataStore.loaded">
      <Loading message="Loading resources..." :size="96" variant="bold"></Loading>
    </div>

    <div v-else>
      <pre>{{ dataStore.rawDatasets[2] }}</pre>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { onMounted } from 'vue';
  import { useDataStore } from '../stores/dataStore';
  import Loading from '../components/Loading.vue';

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
