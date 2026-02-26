<template>
  <div class="popout">
    <div class="popout-panel" role="dialog" :aria-label="title || 'PopOut'">
      <header class="popout-header">
        <h2 class="popout-title">{{ title }}</h2>
        <button class="popout-close" @click="handleClose" aria-label="Close">
          <img :src="closeIcon" alt="close" />
        </button>
      </header>

      <div class="popout-content">
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  //   import { defineEmits } from 'vue';
  import closeIcon from '../assets/icons/close.svg';

  const props = defineProps<{
    title?: string;
    onClose?: () => void;
  }>();

  const emit = defineEmits<{
    (e: 'close'): void;
  }>();

  function handleClose() {
    if (typeof props.onClose === 'function') props.onClose();
    emit('close');
  }
</script>

<style scoped>
  .popout {
    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    background: rgba(0, 0, 0, 0.18);
    padding: 16px;
  }
  .popout-panel {
    background: var(--ion-background-color, #fff);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
    display: flex;
    flex-direction: column;
    width: 80vw;
    height: 80vh;
    max-width: 1100px;
    max-height: 90vh;
    border-radius: 8px;
    overflow: hidden;
  }
  .popout-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  }
  .popout-title {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 600;
  }
  .popout-close {
    background: transparent;
    border: none;
    padding: 6px;
    cursor: pointer;
  }
  .popout-close img {
    width: 20px;
    height: 20px;
  }
  .popout-content {
    padding: 16px;
    overflow: auto;
    flex: 1;
  }

  /* For mobile/tablet screens, fill the parent container */
  @media (max-width: 1024px) {
    .popout-panel {
      width: 100%;
      height: 100%;
      border-radius: 0;
      box-shadow: none;
    }
  }
</style>
