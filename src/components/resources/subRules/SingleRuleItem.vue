<template>
  <div class="rule-item">
    <p class="rule-meta" v-if="props.item.source || props.item.page">
      <span v-if="props.item.source">{{ props.item.source }}</span>
      <span v-if="props.item.page"> — p. {{ props.item.page }}</span>
    </p>
    <div v-if="props.item.entries && props.item.entries.length">
      <ResourceEntries :entries="props.item.entries" />
    </div>
  </div>
</template>

<script lang="ts" setup>
  import ResourceEntries from '../ResourceEntries.vue';
  import type { Entries } from '../../../types';

  export type RulesBaseItem = {
    name: string;
    source: string;
    page?: number;
    entries?: Entries;
    [key: string]: unknown;
  };

  const props = defineProps<{
    item: RulesBaseItem;
  }>();
</script>

<style scoped>
  .rule-item {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .rule-meta {
    margin: 0 0 0.5rem 0;
    color: var(--color-muted);
    font-size: 0.9rem;
  }
</style>
