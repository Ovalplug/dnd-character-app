<template>
  <NameBadge :character="props.character" />
  <Money
    :character-id="props.character.id"
    :money="props.character.currency"
    :additional-money="props.character.additionalCurrency"
  />
</template>

<script lang="ts" setup>
  import NameBadge from './subcomponents/NameBadge.vue';
  import type { playerCharacter } from '../../../types';
  import Money from './subcomponents/Money.vue';

  const props = defineProps<{
    character: playerCharacter;
  }>();
</script>
