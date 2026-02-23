<script setup lang="ts">
  import { computed } from 'vue';
  import type { PropType } from 'vue';

  const props = defineProps({
    message: { type: String, default: 'Preparing your adventure...' },
    size: { type: Number, default: 72 },
    variant: { type: String as PropType<'subtle' | 'bold'>, default: 'subtle' },
    gif: { type: String, default: new URL('../assets/loadingDice.gif', import.meta.url).href },
  });

  const variantClass = computed(() => (props.variant === 'bold' ? 'bold' : 'subtle'));
</script>

<template>
  <div class="loading" :class="variantClass" role="status" aria-live="polite">
    <img
      :src="props.gif"
      :width="props.size"
      :height="props.size"
      class="d20"
      alt="Loading animation"
      aria-hidden="true"
    />

    <div class="message">{{ props.message }}</div>
  </div>
</template>

<style scoped>
  .loading {
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    gap: 0.6rem;
    color: var(--text, #efe6d6);
    font-family: ui-rounded, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial;
  }

  .d20 {
    transform-origin: 50% 50%;
    animation: rock 1.6s ease-in-out infinite;
    display: block;
  }

  .gem {
    fill: url(#g1);
    stroke: rgba(0, 0, 0, 0.28);
    stroke-width: 1.5;
    filter: url(#glow);
  }

  .edge {
    fill: none;
    stroke: rgba(0, 0, 0, 0.18);
    stroke-width: 0.9;
  }

  .num {
    font-size: 26px;
    font-weight: 700;
    fill: rgba(25, 10, 0, 0.9);
    font-family: serif;
    pointer-events: none;
  }

  .message {
    font-size: 0.95rem;
    color: rgba(230, 220, 200, 0.95);
    text-align: center;
    max-width: 18rem;
  }

  /* subtle vs bold variants */
  .loading.subtle .d20 {
    opacity: 0.98;
  }
  .loading.bold .d20 {
    transform: scale(1.06);
    filter: drop-shadow(0 6px 12px rgba(0, 0, 0, 0.35));
  }
  .loading.bold .message {
    font-weight: 600;
  }

  @keyframes rock {
    0% {
      transform: rotate(-6deg);
    }
    50% {
      transform: rotate(6deg);
    }
    100% {
      transform: rotate(-6deg);
    }
  }

  /* responsiveness */
  @media (max-width: 420px) {
    .num {
      font-size: 20px;
    }
    .message {
      max-width: 12rem;
      font-size: 0.9rem;
    }
  }
</style>

<!--
Usage:
<Loading message="Summoning your party..." :size="96" variant="bold" />
Props: `message` (string), `size` (number px), `variant` ('subtle'|'bold')
-->
