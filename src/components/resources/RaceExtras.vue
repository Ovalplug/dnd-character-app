<template>
  <p v-if="props.race.size"><strong>Size:</strong> {{ getPrettySize(props.race.size) }}</p>
  <p v-if="props.race.speed"><strong>Speed:</strong> {{ getPrettySpeed(props.race.speed) }}</p>
  <p v-if="props.race.ability">
    <strong>Ability Scores:</strong> {{ getPrettyAbilityScoreValues(props.race.ability) }}
  </p>
  <pre>{{ props.race }}</pre>
</template>

<script setup lang="ts">
  import type { Race } from '../../types';
  import {
    getPrettySize,
    getPrettyAbilityScoreValues,
    getPrettySpeed,
  } from '../../helperFunctions';

  const props = defineProps<{
    race: Race;
  }>();
</script>
