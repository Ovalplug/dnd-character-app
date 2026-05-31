<template>
  <article class="character-detail-view">
    <NameBadge :character="props.character" />

    <section class="character-detail-card character-detail-card--hero">
      <p class="character-detail-kicker">Overview</p>
      <h2 class="character-detail-title">Core character snapshot</h2>
      <p class="character-detail-copy">
        Review the essentials at a glance: vital stats, ability spread, saving throws, and trained
        skills.
      </p>
    </section>

    <div class="character-detail-grid">
      <StatsBar :character="props.character" />
      <OtherInfo :character="props.character" />
      <AbilityTable :character="props.character" />
      <SavingThrows :character="props.character" />
      <SkillsBonus :character="props.character" />
    </div>
  </article>
</template>

<script lang="ts" setup>
  import NameBadge from './subcomponents/NameBadge.vue';
  import StatsBar from './subcomponents/StatsBar.vue';
  import AbilityTable from './subcomponents/AbilityTable.vue';
  import type { playerCharacter } from '../../../types';
  import OtherInfo from './subcomponents/OtherInfo.vue';
  import SkillsBonus from './subcomponents/SkillsBonus.vue';
  import SavingThrows from './subcomponents/SavingThrows.vue';

  const props = defineProps<{
    character: playerCharacter;
  }>();
</script>
