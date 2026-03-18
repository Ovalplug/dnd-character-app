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
      <RaceExtras v-if="show_base" :race="props.race" />
      <ResourceEntries
        v-if="show_base"
        :entries="props.race.entries ?? ['No base entries available']"
      />
      <ResourceEntries
        v-if="show_fluff"
        :entries="props.fluff?.entries ?? ['No fluff available']"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref } from 'vue';
  import type { Race, RaceFluff } from '../../types';
  import ResourceEntries from './ResourceEntries.vue';
  import RaceExtras from './RaceExtras.vue';

  const props = defineProps<{
    race: Race;
    fluff?: RaceFluff;
  }>();

  const show_fluff = ref(true);
  const show_base = ref(false);
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
