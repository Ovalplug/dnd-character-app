<template>
  <NameBadge :character="props.character" />
  <h1>Character Notes</h1>
</template>

<script lang="ts" setup>
  import NameBadge from './subcomponents/NameBadge.vue';
  import type { playerCharacter } from '../../../types';

  const props = defineProps<{
    character: playerCharacter;
  }>();
</script>