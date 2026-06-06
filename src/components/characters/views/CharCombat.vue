<template>
  <article class="char-combat character-detail-view">
    <NameBadge :character="props.character" />

    <!-- ── HP / AC / Class Bar ─────────────────────────────────────── -->
    <StatsBar :character="character" />

    <!-- ── Speed / Initiative / Prof / Inspiration / Death Saves ────── -->
    <OtherInfo :character="character" />

    <!-- ── Ability Scores ─────────────────────────────────────────── -->
    <AbilityTable :character="character" />

    <!-- ── Saving Throws ──────────────────────────────────────────── -->
    <SavingThrows :character="character" />

    <!-- ── Equipped Gear ──────────────────────────────────────────── -->
    <EquippedItemsSection :character="character" />

    <!-- ── Attacks ────────────────────────────────────────────────── -->
    <AttacksTable :character="character" />

    <!-- ── Actions Reference ──────────────────────────────────────── -->
    <ActionsReference />

    <!-- ── Spellcasting ───────────────────────────────────────────── -->
    <CombatSpellcasting v-if="spellInfo.isSpellcaster" :character="character" />
  </article>
</template>

<script setup lang="ts">
  import { computed } from 'vue';
  import type { playerCharacter } from '../../../types';
  import { computeCharSpellcasting } from '../../../helperFunctions';
  import StatsBar from './subcomponents/StatsBar.vue';
  import OtherInfo from './subcomponents/OtherInfo.vue';
  import AbilityTable from './subcomponents/AbilityTable.vue';
  import SavingThrows from './subcomponents/SavingThrows.vue';
  import EquippedItemsSection from './subcomponents/EquippedItemsSection.vue';
  import AttacksTable from './subcomponents/AttacksTable.vue';
  import ActionsReference from './subcomponents/ActionsReference.vue';
  import CombatSpellcasting from './subcomponents/CombatSpellcasting.vue';
  import NameBadge from './subcomponents/NameBadge.vue';

  const props = defineProps<{
    character: playerCharacter;
  }>();

  const character = computed(() => props.character);
  const spellInfo = computed(() => computeCharSpellcasting(props.character));
</script>

<style scoped>
  .char-combat {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
</style>
