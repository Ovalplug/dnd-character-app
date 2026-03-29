<template>
  <section v-if="displayList.length">
    <h3>Saving Throw Proficiencies</h3>
    <ul class="tag-list">
      <li v-for="st in displayList" :key="st">{{ st }}</li>
    </ul>
  </section>
</template>

<script setup lang="ts">
  import { computed } from 'vue';
  import type { SavingThrow } from '../../types';
  import { SAVE_PRETTY } from '../../constants';

  const props = defineProps<{
    savingThrows: Partial<Record<SavingThrow, boolean>>;
  }>();

  const displayList = computed(() =>
    (Object.keys(props.savingThrows) as SavingThrow[])
      .filter(k => props.savingThrows[k])
      .map(k => SAVE_PRETTY[k])
  );
</script>

<style scoped>
  section {
    padding: 0.75rem;
    border: 1px solid #ccc;
    border-radius: 6px;
  }
  h3 {
    margin: 0 0 0.5rem;
    font-size: 1rem;
  }
  .tag-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    list-style: none;
    padding: 0;
    margin: 0;
  }
  .tag-list li {
    background: #e8e8e8;
    border-radius: 4px;
    padding: 0.2rem 0.5rem;
    font-size: 0.9rem;
    text-transform: capitalize;
  }
</style>
