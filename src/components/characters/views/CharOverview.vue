<template>
  <NameBadge :character="props.character" />
  <StatsBar :character="props.character" />
  <AbilityTable :character="props.character" />
</template>

<script lang="ts" setup>
  import NameBadge from './subcomponents/NameBadge.vue';
  import StatsBar from './subcomponents/StatsBar.vue';
  import AbilityTable from './subcomponents/AbilityTable.vue';
  import type { playerCharacter } from '../../../types';

  const props = defineProps<{
    character: playerCharacter;
  }>();
</script>
