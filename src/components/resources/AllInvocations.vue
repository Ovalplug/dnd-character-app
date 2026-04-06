<template>
  <div v-if="debug">
    <pre>{{ props.invocations }}</pre>
  </div>
  <div>
    <ul class="resource-list">
      <div
        v-for="invocation in orderedInvocations"
        :key="invocation.name"
        class="invocation-item"
        @click="selectInvocation(invocation)"
        tabindex="0"
        @keydown.enter="selectInvocation(invocation)"
        role="button"
      >
        <p>
          {{ invocation.name }}<span class="p2"> ({{ invocation.source }})</span>
        </p>
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
