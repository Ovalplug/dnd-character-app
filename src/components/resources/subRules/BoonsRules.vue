<template>
  <pre>{{ props.boons }}</pre>
</template>

<script lang="ts" setup>
  import type { Boon } from '../../../types';

  const props = defineProps<{
    boons: Boon[];
  }>();
</script>
