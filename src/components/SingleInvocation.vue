<template>
  <div class="invocation">
    <h3 class="invocation-title">{{ invocation.name }}</h3>

    <p class="invocation-meta" v-if="invocation.source || invocation.page">
      <span v-if="invocation.source">{{ invocation.source }}</span>
      <span v-if="invocation.page"> — p. {{ invocation.page }}</span>
    </p>
    <Prerequisites class="invocation-meta" v-if="invocation.prerequisite" :prerequisites="invocation.prerequisite" />

    <div v-if="hasDescString">
      <p>{{ invocation.desc }}</p>
    </div>

    <div v-else-if="hasDescEntries">
      <ResourceEntries :entries="invocation.desc as any" />
    </div>

    <div v-if="invocation.entries && invocation.entries.length">
      <ResourceEntries :entries="invocation.entries" />
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { computed } from 'vue';
  import ResourceEntries from './ResourceEntries.vue';
  import type { Invocation } from '../types';
import Prerequisites from './Prerequisites.vue';

  const props = defineProps<{
    invocation: Invocation;
  }>();

  const invocation = props.invocation;

  const hasDescString = computed(
    () => typeof invocation.desc === 'string' && invocation.desc.length > 0
  );
  const hasDescEntries = computed(
    () => Array.isArray(invocation.desc) && invocation.desc.length > 0
  );
</script>

<style scoped>
  .invocation-title {
    margin: 0 0 0.25rem 0;
    font-weight: 700;
  }
  .invocation-meta {
    margin: 0 0 0.75rem 0;
    color: #666;
    font-size: 0.9rem;
  }
</style>
