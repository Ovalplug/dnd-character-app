<template>
  <div class="bar">
    <button
      v-for="section in sections"
      :key="section.id"
      type="button"
      class="section"
      :class="{ selected: activeSection === section.id }"
      :aria-pressed="activeSection === section.id"
      :title="section.label"
      @click="selectSection(section.id)"
    >
      <img :src="section.icon" :alt="`${section.label} icon`" />
      <span class="section-label">{{ section.label }}</span>
    </button>
  </div>
</template>

<script lang="ts" setup>
  import scrollImage from '../../assets/icons/scroll.svg';
  import bagImage from '../../assets/icons/bag.svg';
  import spellbookImage from '../../assets/icons/spell-book.svg';
  import swordImage from '../../assets/icons/sword.svg';
  import penImage from '../../assets/icons/pen.svg';
  type CharacterSection = 'overview' | 'combat' | 'inventory' | 'abilities' | 'notes';

  defineProps<{
    activeSection: CharacterSection;
  }>();

  const emits = defineEmits<{
    (event: 'selectSection', section: CharacterSection): void;
  }>();

  const sections: Array<{ id: CharacterSection; label: string; icon: string }> = [
    { id: 'overview', label: 'Overview', icon: scrollImage },
    { id: 'combat', label: 'Combat', icon: swordImage },
    { id: 'abilities', label: 'Abilities', icon: spellbookImage },
    { id: 'inventory', label: 'Inventory', icon: bagImage },
    { id: 'notes', label: 'Notes', icon: penImage },
  ];

  function selectSection(section: CharacterSection) {
    emits('selectSection', section);
  }
</script>

<style scoped>
  .bar {
    display: flex;
    height: 100%;
    width: 100%;
    background: rgba(255, 255, 255, 0.72);
    border-top: 1px solid rgba(107, 46, 46, 0.12);
  }

  .section {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.25rem;
    padding: 0.75rem 0.35rem;
    cursor: pointer;
    opacity: 0.5;
    border-bottom: 2px solid transparent;
    border-top: 0;
    border-left: 0;
    border-right: 0;
    background: transparent;
    color: inherit;
    transition: opacity 0.2s;
  }

  .section img {
    width: 24px;
    height: 24px;
  }

  .section-label {
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .section.selected {
    opacity: 1;
    border-bottom: 2px solid currentColor;
  }

  @media (max-width: 520px) {
    .section-label {
      display: none;
    }
  }
</style>
