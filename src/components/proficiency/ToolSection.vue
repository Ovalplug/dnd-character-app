<template>
  <section v-if="props.toolProficiencies.length || props.toolChoices > 0">
    <h3>Tool Proficiencies</h3>
    <ul v-if="props.toolProficiencies.length" class="tag-list">
      <li v-for="t in props.toolProficiencies" :key="t">{{ t }}</li>
    </ul>
    <div v-if="props.toolChoices > 0" class="choices-block">
      <p>Choose {{ props.toolChoices }} additional tool(s):</p>
      <input
        v-for="n in props.toolChoices"
        :key="'tc-' + n"
        type="text"
        placeholder="Tool name…"
        :value="chosenTools[n - 1] ?? ''"
        @input="updateTool(n - 1, ($event.target as HTMLInputElement).value)"
        class="tool-input"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
  import { ref, watch } from 'vue';

  const props = defineProps<{
    toolProficiencies: string[];
    toolChoices: number;
  }>();

  const emit = defineEmits<{
    (e: 'update:choices', value: string[]): void;
  }>();

  const chosenTools = ref<string[]>(Array(props.toolChoices).fill(''));

  function updateTool(idx: number, val: string) {
    chosenTools.value[idx] = val;
    emit('update:choices', [...chosenTools.value]);
  }

  watch(
    () => props.toolChoices,
    count => {
      chosenTools.value = Array(count).fill('');
    }
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
  .choices-block {
    margin-top: 0.75rem;
  }
  .choices-block p {
    margin: 0 0 0.4rem;
    font-size: 0.9rem;
  }
  .tool-input {
    width: 100%;
    padding: 0.3rem 0.5rem;
    margin-bottom: 0.4rem;
    font-size: 0.9rem;
    border: 1px solid #aaa;
    border-radius: 4px;
  }
</style>
