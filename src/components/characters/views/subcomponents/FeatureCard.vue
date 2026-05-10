<template>
  <div
    class="feature-card"
    :class="[
      variant !== 'default' ? `feature-card--${variant}` : '',
      { 'feature-card--open': isOpen },
    ]"
  >
    <button class="feature-toggle" @click="isOpen = !isOpen">
      <span class="feat-name">{{ name }}</span>
      <span class="feat-badges">
        <span class="level-tag" :class="tagClass">{{ tag }}</span>
        <span class="chevron" :class="{ 'chevron--open': isOpen }">▼</span>
      </span>
    </button>
    <div v-if="isOpen" class="feature-body">
      <slot>
        <p class="muted no-desc">No description available.</p>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue';

  const props = defineProps<{
    name: string;
    tag: string;
    variant?: 'default' | 'subclass' | 'race' | 'feat';
  }>();

  const isOpen = ref(false);

  const tagClass = computed(() => {
    switch (props.variant) {
      case 'subclass':
        return 'level-tag--subclass';
      case 'race':
        return 'level-tag--race';
      case 'feat':
        return 'level-tag--feat';
      default:
        return '';
    }
  });
</script>

<style scoped>
  .feature-card {
    border-bottom: 1px solid rgba(31, 27, 22, 0.06);
  }

  .feature-card:last-child {
    border-bottom: none;
  }

  .feature-card--subclass > .feature-toggle {
    border-left: 3px solid var(--color-accent);
  }

  .feature-card--race > .feature-toggle {
    border-left: 3px solid #7aab4b;
  }

  .feature-card--feat > .feature-toggle {
    border-left: 3px solid #6b7aab;
  }

  .feature-toggle {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    padding: 0.6rem 1rem;
    background: transparent;
    border: none;
    cursor: pointer;
    text-align: left;
    color: var(--color-text);
    transition: background 0.15s;
  }

  .feature-toggle:hover {
    background: rgba(201, 164, 75, 0.06);
  }

  .feature-card--open > .feature-toggle {
    background: rgba(201, 164, 75, 0.08);
  }

  .feat-name {
    font-size: 0.9rem;
    font-weight: 600;
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .feat-badges {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    flex-shrink: 0;
  }

  .level-tag {
    font-size: 0.65rem;
    font-weight: 700;
    padding: 0.1rem 0.4rem;
    border-radius: 12px;
    background: rgba(107, 46, 46, 0.1);
    color: var(--color-primary);
    white-space: nowrap;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  .level-tag--subclass {
    background: rgba(201, 164, 75, 0.18);
    color: #7a5d1a;
  }

  .level-tag--race {
    background: rgba(74, 107, 46, 0.12);
    color: #4a6b2e;
  }

  .level-tag--feat {
    background: rgba(46, 74, 107, 0.12);
    color: #2e4a6b;
  }

  .chevron {
    font-size: 0.6rem;
    color: var(--color-muted);
    transition: transform 0.2s;
    display: inline-block;
  }

  .chevron--open {
    transform: rotate(180deg);
  }

  .feature-body {
    padding: 0.75rem 1rem 1rem;
    border-top: 1px solid rgba(31, 27, 22, 0.06);
    background: rgba(255, 255, 255, 0.4);
    font-size: 0.88rem;
    line-height: 1.6;
  }

  .feature-body :deep(p) {
    margin: 0.35rem 0;
    font-size: 0.88rem;
    color: var(--color-text);
  }

  .feature-body :deep(ul) {
    padding-left: 1.25rem;
    margin: 0.35rem 0;
  }

  .feature-body :deep(strong) {
    color: var(--color-primary);
  }

  .no-desc {
    font-style: italic;
    opacity: 0.7;
    margin: 0 !important;
  }
</style>
