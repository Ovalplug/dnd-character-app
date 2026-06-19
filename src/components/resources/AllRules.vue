<template>
    <!-- options here -->
</template>

<script lang="ts" setup>
  import type { Boon, Diseases, Hazard, Rules, Trap, ActionRules, PlayerOptions, ConditionsRules } from '../../types';

  const props = defineProps<{
    rules: Rules[];
    hazards: Hazard[];
    boons: Boon[];
    diseases: Diseases[];
    traps: Trap[];
    actionRules: ActionRules[];
    playerOptions: PlayerOptions[];
    conditions: ConditionsRules[];
  }>();
</script>
