<template>
  <!-- save DCs -->
  <div v-if="saver.type === 'abilityDc'" class="save-dc">
    <p v-if="saver.attributes.length > 0 && !calculated">
      {{ saver.name }} save DC = 8 + proficiency +
      {{
        saver.attributes.length > 1
          ? saver.attributes.map(getPrettyAbilityName).join(' or ')
          : getPrettyAbilityName(saver.attributes[0] || '')
      }}
      modifier.
    </p>
    <p v-if="calculated && longForm">DC {{ currDC }} for {{ saver.name }} saves.</p>
    <p v-else-if="calculated">DC {{ currDC }}</p>
  </div>
  <!-- attack modifiers -->
  <div v-if="saver.type === 'abilityAttackMod'" class="save-dc">
    <p v-if="saver.attributes.length > 0 && !calculated">
      Spell attack modifier = proficiency +
      {{
        saver.attributes.length > 1
          ? saver.attributes.map(getPrettyAbilityName).join(' or ')
          : getPrettyAbilityName(saver.attributes[0] || '')
      }}
      modifier.
    </p>
    <p v-if="calculated && longForm">
      {{ currModifier >= 0 ? '+' : '' }}{{ currModifier }} to hit with {{ saver.name }} attacks.
    </p>
    <p v-else-if="calculated">{{ currModifier >= 0 ? '+' : '' }}{{ currModifier }}</p>
  </div>
</template>
<script lang="ts" setup>
  import { computed } from 'vue';
  import {
    getPrettyAbilityName,
    calculateAttackModifier,
    calculateDc,
  } from '../../helperFunctions';

  const currModifier = computed(() => {
    return calculateAttackModifier(props.proficiency || 0, props.modifier || 0);
  });

  const currDC = computed(() => {
    return calculateDc(props.proficiency || 0, props.modifier || 0);
  });

  const props = defineProps<{
    saver: {
      type: string;
      name: string;
      attributes: string[];
    };
    calculated?: boolean;
    longForm?: boolean;
    proficiency?: number;
    modifier?: number;
  }>();
</script>
