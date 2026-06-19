<template>
  <div>
    <ul class="resource-list">
      <div
        v-for="item in sorted"
        :key="item.name + item.source"
        class="rule-item"
        @click="selected = item"
        tabindex="0"
        @keydown.enter="selected = item"
        role="button"
      >
        <p>
          {{ item.name }}<span class="p2"> ({{ item.source }})</span>
        </p>
      </div>
    </ul>
    <PopOut :title="selected?.name" v-if="selected" :onClose="() => (selected = null)">
      <SingleRuleItem :item="selected" />
    </PopOut>
  </div>
</template>

<script lang="ts" setup>
  import { computed, ref } from 'vue';
  import type { Diseases } from '../../../types';
  import PopOut from '../../PopOut.vue';
  import SingleRuleItem from './SingleRuleItem.vue';

  const props = defineProps<{ diseases: Diseases[] }>();
  const sorted = computed(() => [...props.diseases].sort((a, b) => a.name.localeCompare(b.name)));
  const selected = ref<Diseases | null>(null);
</script>

<style scoped>
  .resource-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  .rule-item {
    cursor: pointer;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid rgba(107, 46, 46, 0.12);
    min-height: 44px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    transition: background 0.14s;
  }
  .rule-item:hover,
  .rule-item:focus-visible {
    background: var(--color-surface);
    outline: none;
  }
  .rule-item p {
    margin: 0;
    font-size: 0.95rem;
  }
</style>
