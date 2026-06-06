<template>
  <section class="accordian" :class="{ 'accordian--open': isOpen }">
    <button type="button" class="accordian-header" :aria-expanded="isOpen" @click="toggle">
      <div class="accordian-copy">
        <p v-if="props.kicker" class="accordian-kicker">{{ props.kicker }}</p>
        <div v-if="$slots.header" class="accordian-title-slot">
          <slot name="header"></slot>
        </div>
        <p v-else class="accordian-title">{{ props.header }}</p>
        <p v-if="props.description" class="accordian-description">{{ props.description }}</p>
      </div>

      <div class="accordian-meta">
        <slot name="meta">
          <span v-if="props.countLabel" class="accordian-count">{{ props.countLabel }}</span>
        </slot>
        <span class="accordian-chevron" :class="{ 'accordian-chevron--open': isOpen }">⌄</span>
      </div>
    </button>

    <div v-if="isOpen" class="accordian-content">
      <slot>Accordian Content</slot>
    </div>
  </section>
</template>

<script lang="ts" setup>
  import { ref } from 'vue';
  const props = withDefaults(
    defineProps<{
      header: string;
      kicker?: string;
      description?: string;
      countLabel?: string;
      defaultOpen?: boolean;
    }>(),
    {
      kicker: undefined,
      description: undefined,
      countLabel: undefined,
      defaultOpen: false,
    }
  );
  const isOpen = ref(props.defaultOpen);

  function toggle() {
    isOpen.value = !isOpen.value;
  }
</script>

<style scoped>
  .accordian {
    border: 1px solid rgba(107, 46, 46, 0.08);
    border-radius: 14px;
    overflow: hidden;
    background: rgba(255, 255, 255, 0.46);
  }

  .accordian-header {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    padding: 0.85rem;
    cursor: pointer;
    border: none;
    background: transparent;
    text-align: left;
    color: inherit;
  }

  .accordian-copy {
    display: grid;
    gap: 0.12rem;
    min-width: 0;
  }

  .accordian-kicker,
  .accordian-count {
    margin: 0;
    font-size: 0.76rem;
    color: var(--color-muted, #6f6257);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .accordian-title,
  .accordian-title-slot :deep(*) {
    margin: 0;
    font-size: 1rem;
    font-weight: 700;
    color: var(--color-text, #1f1b16);
  }

  .accordian-title-slot {
    min-width: 0;
  }

  .accordian-description {
    margin: 0;
    font-size: 0.83rem;
    color: var(--color-muted, #6f6257);
  }

  .accordian-meta {
    display: flex;
    align-items: center;
    gap: 0.55rem;
    flex: 0 0 auto;
  }

  .accordian-count {
    padding: 0.2rem 0.65rem;
    border-radius: 999px;
    background: rgba(107, 46, 46, 0.08);
    border: 1px solid rgba(107, 46, 46, 0.12);
    color: var(--color-primary, #6b2e2e);
    font-weight: 700;
  }

  .accordian-chevron {
    color: var(--color-primary, #6b2e2e);
    font-size: 1.15rem;
    line-height: 1;
    transition: transform 0.16s ease;
  }

  .accordian-chevron--open {
    transform: rotate(180deg);
  }

  .accordian-content {
    padding: 0 0.85rem 0.85rem;
  }

  @media (max-width: 640px) {
    .accordian-header {
      align-items: flex-start;
    }

    .accordian-meta {
      gap: 0.35rem;
    }
  }
</style>
