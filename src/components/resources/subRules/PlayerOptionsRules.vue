<template>
  <pre>{{ props.playerOptions }}</pre>
</template>

<script lang="ts" setup>
  import type { PlayerOptions } from '../../../types';

  const props = defineProps<{
    playerOptions: PlayerOptions[];
  }>();
</script>
