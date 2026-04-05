<template>
  <div class="name-wrapper">
    <p class="charName" ref="nameEl">{{ props.character.name }}</p>
    <p>
      {{ props.character.subrace ? props.character.subrace.name : '' }}
      {{ props.character.race?.name }} - {{ props.character.background?.name }}
    </p>
  </div>
</template>

<script lang="ts" setup>
  import { ref, onMounted, watch, nextTick } from 'vue';
  import type { playerCharacter } from '../../../../types';

  const props = defineProps<{
    character: playerCharacter;
  }>();

  const nameEl = ref<HTMLElement | null>(null);

  function fitName() {
    const el = nameEl.value;
    if (!el) return;
    el.style.fontSize = '';
    while (el.scrollWidth > el.offsetWidth && parseFloat(getComputedStyle(el).fontSize) > 10) {
      el.style.fontSize = parseFloat(getComputedStyle(el).fontSize) - 1 + 'px';
    }
  }

  onMounted(() => nextTick(fitName));
  watch(
    () => props.character.name,
    () => nextTick(fitName)
  );
</script>

<style scoped>
  .name-wrapper {
    overflow: hidden;
    padding: 0.5rem 1rem 0.25rem;
  }

  .charName {
    margin: 0;
    font-size: 1.9rem;
    font-weight: 700;
    white-space: nowrap;
    overflow: hidden;
    letter-spacing: 0.03em;
    text-transform: capitalize;
    color: var(--color-primary);
    text-shadow: 0 1px 0 rgba(201, 164, 75, 0.4);
    border-bottom: 2px solid var(--color-accent);
    padding-bottom: 0.2rem;
  }
</style>
