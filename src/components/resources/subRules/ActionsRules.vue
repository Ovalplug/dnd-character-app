<template>
  <pre>{{ props.actionRules }}</pre>
</template>

<script lang="ts" setup>
  import type { ActionRules } from '../../../types';

  const props = defineProps<{
    actionRules: ActionRules[];
  }>();
</script>
