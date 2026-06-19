<template>
  <pre>{{ props.hazards }}</pre>
</template>

<script lang="ts" setup>
  import type { Hazard } from '../../../types';

  const props = defineProps<{
    hazards: Hazard[];
  }>();
</script>
