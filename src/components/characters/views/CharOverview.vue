<template>
  <article class="character-detail-view">
    <NameBadge :character="props.character" />

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
