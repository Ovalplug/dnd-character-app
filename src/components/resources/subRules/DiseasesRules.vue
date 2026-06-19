<template>
  <pre>{{ props.diseases }}</pre>
</template>

<script lang="ts" setup>
  import type { Diseases } from '../../../types';

  const props = defineProps<{
    diseases: Diseases[];
  }>();
</script>
