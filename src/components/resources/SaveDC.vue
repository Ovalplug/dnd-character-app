<template>
  <div v-if="saver.type === 'abilityDc'" class="save-dc">
    <p v-if="saver.attributes.length > 0">
      {{ saver.name }} save DC = 8 + proficiency +
      {{
        saver.attributes.length > 1
          ? saver.attributes.map(getPrettyAbilityName).join(' or ')
          : getPrettyAbilityName(saver.attributes[0] || '')
      }}
      modifier.
    </p>
  </div>
</template>
<script lang="ts" setup>
  import { getPrettyAbilityName } from '../../helperFunctions';

  const props = defineProps<{
    saver: {
      type: string;
      name: string;
      attributes: string[];
    };
  }>();
</script>
