<template>
  <pre>{{ props.traps }}</pre>
</template>

<script lang="ts" setup>
  import type { Trap } from '../../../types';

  const props = defineProps<{
    traps: Trap[];
  }>();
</script>
