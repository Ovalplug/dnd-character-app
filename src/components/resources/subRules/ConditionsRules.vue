<template>
  <pre>{{ props.conditions }}</pre>
</template>

<script lang="ts" setup>
  import type { ConditionsRules } from '../../../types';

  const props = defineProps<{
    conditions: ConditionsRules[];
  }>();
</script>
