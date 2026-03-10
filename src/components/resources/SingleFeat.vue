<template>
  <div>
    <p>
      Source: {{ props.feat.source }} <span class="p2">(page {{ props.feat.page }})</span>
    </p>
    <Prerequisites v-if="props.feat.prerequisite" :prerequisites="prerequisitesData" />
  </div>
  <div>
    <ResourceEntries :entries="props.feat.entries ?? []" />
  </div>
</template>

<script setup lang="ts">
  import type { Feat } from '../../types';
  import ResourceEntries from './ResourceEntries.vue';
  import Prerequisites from './Prerequisites.vue';
  import { computed } from 'vue';

  const props = defineProps<{
    feat: Feat;
  }>();

  const prerequisitesData = computed(() => {
    if (!props.feat.prerequisite) return [];
    const prereq = props.feat.prerequisite;
    const items = Array.isArray(prereq) ? prereq : [prereq];
    return items.map(item =>
      typeof item === 'string' ? { type: 'prerequisite', feat: item } : item
    );
  });
</script>

<style scoped></style>
