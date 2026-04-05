<template>
  <NameBadge :character="props.character" />
  <StatsBar :character="props.character" />
  <OtherInfo :character="props.character" />
  <AbilityTable :character="props.character" />
  <br />
  <SkillsBonus :character="props.character" />
  <br />
</template>

<script lang="ts" setup>
  import NameBadge from './subcomponents/NameBadge.vue';
  import StatsBar from './subcomponents/StatsBar.vue';
  import AbilityTable from './subcomponents/AbilityTable.vue';
  import type { playerCharacter } from '../../../types';
  import OtherInfo from './subcomponents/OtherInfo.vue';
  import SkillsBonus from './subcomponents/SkillsBonus.vue';

  const props = defineProps<{
    character: playerCharacter;
  }>();
</script>
