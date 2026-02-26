<template>
  <div>
    <p>
      Source: {{ props.feat.source }} <span class="p2">({{ props.feat.page }})</span>
    </p>
  </div>
  <div>
    <ResourceEntries :entries="props.feat.entries ?? []" />
  </div>
</template>

<script setup lang="ts">
  import type { Feat } from '../types';
  import ResourceEntries from './ResourceEntries.vue';

  const props = defineProps<{
    feat: Feat;
  }>();
</script>

<style scoped></style>
