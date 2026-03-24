<template>
  <div class="accordian">
    <div class="accordian-header" @click="toggle">
      {{ props.header }}
    </div>
    <div class="accordian-content" v-if="isOpen">
      <slot>Accordian Content</slot>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { ref } from 'vue';
  const isOpen = ref(false);
  const props = defineProps<{ header: string }>();
  function toggle() {
    isOpen.value = !isOpen.value;
  }
</script>

<style scoped>
  .accordian {
    border: 1px solid #ccc;
    border-radius: 4px;
    overflow: hidden;
  }

  .accordian-header {
    background-color: #f7f7f7;
    padding: 10px;
    cursor: pointer;
    font-weight: bold;
  }

  .accordian-content {
    padding: 10px;
    background-color: #fff;
  }
</style>
