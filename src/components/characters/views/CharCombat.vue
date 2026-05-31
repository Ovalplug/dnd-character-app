<template>
  <article class="char-combat character-detail-view">
    <NameBadge :character="props.character" />

    <section class="character-detail-card character-detail-card--hero">
      <p class="character-detail-kicker">Combat</p>
      <h2 class="character-detail-title">Battle-ready reference</h2>
      <p class="character-detail-copy">
        Keep the most important combat information in one place, from defenses and attacks to spells
        and actions.
      </p>
    </section>

    <!-- ── HP / AC / Class Bar ─────────────────────────────────────── -->
    <StatsBar :character="character" />

    <!-- ── Speed / Initiative / Prof / Inspiration / Death Saves ────── -->
    <OtherInfo :character="character" />

    <!-- ── Ability Scores ─────────────────────────────────────────── -->
    <AbilityTable :character="character" />

    <!-- ── Saving Throws ──────────────────────────────────────────── -->
    <SavingThrows :character="character" />

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
  import AttacksTable from './subcomponents/AttacksTable.vue';
  import ActionsReference from './subcomponents/ActionsReference.vue';
  import CombatSpellcasting from './subcomponents/CombatSpellcasting.vue';
  import NameBadge from './subcomponents/NameBadge.vue';

  const props = defineProps<{
    character: playerCharacter;
  }>();

  const spellInfo = computed(() => computeCharSpellcasting(props.character));
</script>

<style scoped>
  .char-combat {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
</style>
