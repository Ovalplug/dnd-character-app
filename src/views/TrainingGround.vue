<template>
  <p>dice roll: {{ rollValue }}</p>
  <button @click="doDiceRoll">Roll 6d6</button>
</template>

<script lang="ts" setup>
  import { ref } from 'vue';
  import { rollDice } from '../components/encounterSimulator/diceRollFunctions';

  const rollValue = ref<number>(0);

  function doDiceRoll() {
    rollValue.value = rollDice([{ dice: 'd6', number: 6 }]);
  }
</script>
