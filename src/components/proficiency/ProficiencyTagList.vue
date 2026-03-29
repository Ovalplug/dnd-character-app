<template>
  <section v-if="props.items.length">
    <h3>{{ props.title }}</h3>
    <ul class="tag-list">
      <li v-for="item in props.items" :key="item">{{ item }}</li>
    </ul>
  </section>
</template>

<script setup lang="ts">
  const props = defineProps<{
    title: string;
    items: string[];
  }>();
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
