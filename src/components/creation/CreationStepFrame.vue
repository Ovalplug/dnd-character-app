<template>
  <section class="creation-step-frame">
    <header class="creation-step-frame__header">
      <div class="creation-step-frame__eyebrow-row">
        <span class="creation-step-frame__eyebrow">{{ eyebrow ?? 'Character Creation' }}</span>
        <span class="creation-step-frame__progress">Step {{ stepNumber }} of {{ totalSteps }}</span>
      </div>

      <div class="creation-step-frame__headline-row">
        <div>
          <h1 class="creation-step-frame__title">{{ title }}</h1>
          <p v-if="description" class="creation-step-frame__description">{{ description }}</p>
        </div>

        <button
          v-if="canGoBack"
          type="button"
          class="creation-step-frame__back"
          @click="$emit('previous')"
        >
          Back
        </button>
      </div>

      <div class="creation-step-frame__meter" aria-hidden="true">
        <span class="creation-step-frame__meter-fill" :style="meterStyle"></span>
      </div>
    </header>

    <div class="creation-step-frame__body">
      <move-here :key="stepKey" />
      <slot />
    </div>
  </section>
</template>

<script lang="ts" setup>
  import { computed } from 'vue';
  import MoveHere from '../MoveHere.vue';

  const props = defineProps<{
    title: string;
    description?: string;
    stepNumber: number;
    totalSteps: number;
    stepKey: string;
    canGoBack?: boolean;
    eyebrow?: string;
  }>();

  defineEmits<{
    (e: 'previous'): void;
  }>();

  const meterStyle = computed(() => ({
    width: `${Math.max(0, Math.min(100, (props.stepNumber / props.totalSteps) * 100))}%`,
  }));
</script>

<style scoped>
  .creation-step-frame {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
    border-radius: 14px;
    background: radial-gradient(circle at top right, rgba(201, 164, 75, 0.18), transparent 28%),
      linear-gradient(180deg, rgba(255, 248, 235, 0.96), rgba(239, 230, 208, 0.96));
    border: 1px solid rgba(107, 46, 46, 0.16);
    box-shadow: 0 8px 20px rgba(31, 27, 22, 0.1);
  }

  .creation-step-frame__header {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }

  .creation-step-frame__eyebrow-row,
  .creation-step-frame__headline-row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 0.75rem;
  }

  .creation-step-frame__eyebrow {
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--color-primary);
  }

  .creation-step-frame__progress {
    font-size: 0.82rem;
    color: var(--color-muted);
    white-space: nowrap;
  }

  .creation-step-frame__title {
    margin: 0;
    font-size: clamp(1.1rem, 2vw, 1.35rem);
  }

  .creation-step-frame__description {
    margin: 0.2rem 0 0;
    font-size: 0.88rem;
    color: var(--color-muted);
  }

  .creation-step-frame__back {
    flex-shrink: 0;
    padding: 0.45rem 0.85rem;
    border-radius: 8px;
    border: 1px solid rgba(107, 46, 46, 0.22);
    background: rgba(255, 252, 245, 0.92);
    color: var(--color-primary);
    font-size: 0.88rem;
    font-weight: 600;
    cursor: pointer;
  }

  .creation-step-frame__back:hover {
    background: rgba(255, 248, 235, 1);
  }

  .creation-step-frame__meter {
    width: 100%;
    height: 3px;
    overflow: hidden;
    border-radius: 999px;
    background: rgba(107, 46, 46, 0.12);
  }

  .creation-step-frame__meter-fill {
    display: block;
    height: 100%;
    border-radius: inherit;
    background: linear-gradient(90deg, var(--color-primary), var(--color-accent));
    transition: width 180ms ease;
  }

  .creation-step-frame__body {
    min-width: 0;
  }
</style>
