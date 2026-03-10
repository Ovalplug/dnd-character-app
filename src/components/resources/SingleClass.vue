<template>
  <!-- <p v-for="item in classOptions" :key="item">{{ item }}</p> -->
  <pre>{{ currSubclasses }}</pre>
</template>
<script lang="ts" setup>
  import { onMounted } from 'vue';
  import { useDebug } from '../../composables/useDebug';
  import { useDataStore } from '../../stores/dataStore';
  import type { CharClass, Subclass } from '../../types';

  const { initDebug } = useDebug();
  const dataStore = useDataStore();

  const props = defineProps<{
    currClass: CharClass;
    currSubclasses: Subclass[] | null;
  }>();

  //   const classOptions = [
  //     'Info',
  //     'Base',
  //     'Tables',
  //     ...(props.currSubclasses && props.currSubclasses.length ? ['Subclasses'] : []),
  //   ];

  onMounted(async () => {
    await initDebug();
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
