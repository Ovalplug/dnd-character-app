<template>
  <pre>{{ props.rules }}</pre>
</template>

<script lang="ts" setup>
  import type { Rules } from '../../../types';

  const props = defineProps<{
    rules: Rules[];
  }>();
</script>
