<template>
  <div v-if="debug">
    <pre>{{ props.invocations }}</pre>
  </div>
  <div>
    <div class="search-row">
      <input v-model="searchVal" type="search" placeholder="Search invocations…" class="search-input" />
    </div>
    <ul class="resource-list">
      <div
        v-for="invocation in filteredInvocations"
        :key="invocation.name"
        class="rl-item"
        @click="selectInvocation(invocation)"
        tabindex="0"
        @keydown.enter="selectInvocation(invocation)"
        role="button"
      >
        <div class="rl-item__body">
          <span class="rl-item__name">{{ invocation.name }}</span>
          <div class="rl-item__tags">
            <span v-if="invocation.source" class="rl-tag rl-tag--source">{{ invocation.source }}</span>
            <span v-if="getInvocationPrereq(invocation)" class="rl-tag">{{ getInvocationPrereq(invocation) }}</span>
          </div>
        </div>
      </div>
    </ul>
    <PopOut :title="invocationTitle" v-if="selectedInvocation" :onClose="deselectInvocation">
      <div v-if="debug">
        <pre>{{ JSON.stringify(selectedInvocation, null, 2) }}</pre>
      </div>
      <div>
        <SingleInvocation :invocation="selectedInvocation" />
      </div>
    </PopOut>
  </div>
</template>

<script lang="ts" setup>
  import { computed, onMounted, ref } from 'vue';
  import { useDataStore } from '../../stores/dataStore';
  import { useDebug } from '../../composables/useDebug';
  import type { Invocations } from '../../types';
  import PopOut from '../PopOut.vue';
  import SingleInvocation from './SingleInvocation.vue';

  const { debug, initDebug } = useDebug();

  const dataStore = useDataStore();

  const props = defineProps<{
    invocations: Invocations;
  }>();

  const orderedInvocations = computed(() => {
    return [...props.invocations].sort((a, b) => a.name.localeCompare(b.name));
  });

  const searchVal = ref('');

  const filteredInvocations = computed(() => {
    if (!searchVal.value.trim()) return orderedInvocations.value;
    const q = searchVal.value.trim().toLowerCase();
    return orderedInvocations.value.filter(i => i.name.toLowerCase().includes(q));
  });

  const selectedInvocation = ref<Invocations[number] | null>(null);
  const invocationTitle = computed(() => {
    return selectedInvocation.value ? selectedInvocation.value.name : '';
  });

  function selectInvocation(invocation: Invocations[number]) {
    selectedInvocation.value = invocation;
  }

  function deselectInvocation() {
    selectedInvocation.value = null;
  }

  function getInvocationPrereq(invocation: Invocations[number]): string {
    const prereq = invocation.prerequisite;
    if (!prereq) return '';
    if (typeof prereq === 'string') return prereq;
    if (Array.isArray(prereq)) {
      const parts: string[] = [];
      for (const p of prereq) {
        if (typeof p === 'string') parts.push(p);
        else if (p.level) parts.push(`Lvl ${p.level}`);
        else if (p.feat) parts.push(`Feat`);
        else if (p.spellcasting) parts.push('Spellcasting');
        else if (p.pact) parts.push(`Pact of ${p.pact}`);
      }
      return parts.length ? parts.join(', ') : 'Has prerequisites';
    }
    return '';
  }

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

<style scoped>
  .search-row {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    margin-bottom: 0.5rem;
  }

  .search-input {
    flex: 1;
    padding: 0.6rem 0.8rem;
    border: 1px solid var(--color-muted);
    border-radius: 8px;
    background: var(--color-surface);
    color: var(--color-text);
    font-size: 1rem;
    min-height: 44px;
  }

  .search-input:focus {
    outline: 2px solid var(--color-primary);
    outline-offset: 1px;
  }

  .resource-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .invocation-item {
    cursor: pointer;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid rgba(107, 46, 46, 0.12);
    min-height: 44px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    transition: background 0.14s;
  }

  .invocation-item:hover,
  .invocation-item:focus-visible {
    background: var(--color-surface);
    outline: none;
  }

  .invocation-item p {
    margin: 0;
    font-size: 0.95rem;
  }
</style>
