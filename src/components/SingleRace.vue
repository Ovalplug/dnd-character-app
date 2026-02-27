<template>
  <div>
    <div>
      <p>
        Source: {{ props.race.source }} <span class="p2">(page {{ props.race.page }})</span>
      </p>
    </div>
    <div>
      <button @click="showFluff">show fluff</button>
      <button @click="showBase">show base</button>
      <ResourceEntries v-if="show_base" :entries="props.race.entries ?? []" />
      <ResourceEntries v-if="show_fluff" :entries="props.fluff?.entries ?? []" />
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref } from 'vue';
  import type { Race, RaceFluff } from '../types';
  import ResourceEntries from './ResourceEntries.vue';

  const props = defineProps<{
    race: Race;
    fluff?: RaceFluff;
  }>();

  const show_fluff = ref(false);
  const show_base = ref(true);
  function showFluff() {
    show_fluff.value = true;
    show_base.value = false;
  }
  function showBase() {
    show_fluff.value = false;
    show_base.value = true;
  }
</script>

<style scoped></style>
