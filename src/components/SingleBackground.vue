<template>
  <div class="single-background">
    <h2>
      {{ props.background.name }}<span class="p2"> ({{ props.background.source }})</span>
    </h2>

    <div class="background-entries">
      <button @click="showFluff">Fluff</button>
      <button @click="showBase">Base</button>
      <ResourceEntries :entries="entries" />
      <div v-if="entries.length === 0">
        <pre>{{ JSON.stringify(props.background, null, 2) }}</pre>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import type { Background, BackgroundFluff } from '../types';
  import { computed, ref } from 'vue';
  import ResourceEntries from './ResourceEntries.vue';

  const props = defineProps<{ background: Background; backgroundFluff?: BackgroundFluff }>();

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

  const entries = computed(() => {
    if (show_base.value) {
      const b: any = props.background || {};
      if (Array.isArray(b.entries)) return b.entries;
      if (Array.isArray(b.desc)) return b.desc;
      if (typeof b.desc === 'string') return [b.desc];
      return [];
    }
    if (show_fluff.value) {
      const f: any = props.backgroundFluff || {};
      if (Array.isArray(f.entries)) return f.entries;
      if (Array.isArray(f.desc)) return f.desc;
      if (typeof f.desc === 'string') return [f.desc];
      return [];
    }
    return [];
  });
</script>

<style scoped>
  .single-background h2 {
    margin: 0 0 0.5rem 0;
  }

  .background-entries .entry {
    margin-bottom: 0.75rem;
  }

  pre {
    white-space: pre-wrap;
    background: #f8f8f8;
    padding: 0.5rem;
    border-radius: 4px;
  }
</style>
