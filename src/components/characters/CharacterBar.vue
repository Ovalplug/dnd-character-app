<template>
  <div class="bar">
    <div class="section" :class="{ selected: overview }" @click="selectSection('overview')">
      <img :src="scrollImage" alt="overview icon" />
    </div>
    <div class="section" :class="{ selected: combat }" @click="selectSection('combat')">
      <img :src="swordImage" alt="combat icon" />
    </div>
    <div class="section" :class="{ selected: abilities }" @click="selectSection('abilities')">
      <img :src="spellbookImage" alt="abilities icon" />
    </div>
    <div class="section" :class="{ selected: inventory }" @click="selectSection('inventory')">
      <img :src="bagImage" alt="inventory icon" />
    </div>
    <div class="section" :class="{ selected: notes }" @click="selectSection('notes')">
      <img :src="penImage" alt="notes icon" />
    </div>
  </div>
</template>

<script lang="ts" setup>
  import scrollImage from '../../assets/icons/scroll.svg';
  import bagImage from '../../assets/icons/bag.svg';
  import spellbookImage from '../../assets/icons/spell-book.svg';
  import swordImage from '../../assets/icons/sword.svg';
  import penImage from '../../assets/icons/pen.svg';

  import { ref } from 'vue';

  const emits = defineEmits<{
    (event: 'selectSection', section: string): void;
  }>();

  const overview = ref(true);
  const combat = ref(false);
  const inventory = ref(false);
  const abilities = ref(false);
  const notes = ref(false);

  function selectSection(section: string) {
    switch (section) {
      case 'overview':
        overview.value = true;
        combat.value = false;
        inventory.value = false;
        abilities.value = false;
        notes.value = false;
        break;
      case 'combat':
        overview.value = false;
        combat.value = true;
        inventory.value = false;
        abilities.value = false;
        notes.value = false;
        break;
      case 'inventory':
        overview.value = false;
        combat.value = false;
        inventory.value = true;
        abilities.value = false;
        notes.value = false;
        break;
      case 'abilities':
        overview.value = false;
        combat.value = false;
        inventory.value = false;
        abilities.value = true;
        notes.value = false;
        break;
      case 'notes':
        overview.value = false;
        combat.value = false;
        inventory.value = false;
        abilities.value = false;
        notes.value = true;
        break;

      default:
        overview.value = true;
        combat.value = false;
        inventory.value = false;
        abilities.value = false;
        notes.value = false;
        break;
    }
    emits('selectSection', section);
  }
</script>

<style scoped>
  .bar {
    display: flex;
    height: 100%;
    width: 100%;
  }

  .section {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    opacity: 0.5;
    border-bottom: 2px solid transparent;
    transition: opacity 0.2s;
  }

  .section img {
    width: 24px;
    height: 24px;
  }

  .section.selected {
    opacity: 1;
    border-bottom: 2px solid currentColor;
  }
</style>
