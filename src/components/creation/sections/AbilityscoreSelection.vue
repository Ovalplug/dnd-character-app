<template>
  <p>this is where i'll attempt to get a good ability score selection going</p>
  <div>
    <div>
      <label for="score-selection">Select Ability Score Method:</label>
      <select id="score-selection" v-model="selectedMethod" @change="handleMethodChange">
        <option value="recommended">Recommended</option>
        <option value="custom">Custom</option>
        <option value="standard">Standard Array</option>
        <option value="point-buy">Point Buy</option>
        <option value="roll">Roll</option>
      </select>
      <div v-if="selectedMethod === 'roll'">
        <label for="dice-count">Number of Dice:</label>
        <input id="dice-count" type="number" v-model.number="diceConfig.count" min="1" />

        <label for="dice-type">Dice Type:</label>
        <select id="dice-type" v-model="diceConfig.dType">
          <option value="d4">d4</option>
          <option value="d6">d6</option>
          <option value="d8">d8</option>
          <option value="d10">d10</option>
          <option value="d12">d12</option>
          <option value="d20">d20</option>
        </select>

        <label for="drop-lowest">Drop Lowest:</label>
        <input id="drop-lowest" type="checkbox" v-model="diceConfig.dropLowest" />

        <label for="reroll-threshold">Reroll Values Below:</label>
        <input id="reroll-threshold" type="number" v-model.number="diceConfig.rerollThreshold" min="1" />
      </div>
    </div>
  </div>
  <table>
    <thead>
      <tr>
        <th v-for="(score, index) in abilityNameArray" :key="`${score}-header-${index}`">
          {{ score.toUpperCase() }}
        </th>
      </tr>
    </thead>
    <tbody>
      <tr
        v-if="
          selectedMethod !== 'standard' &&
          selectedMethod !== 'recommended' &&
          selectedMethod !== 'roll'
        "
      >
        <td v-for="(score, index) in abilityNameArray" :key="`${score}-up-${index}`">
          <img
            :src="upArrow"
            alt="Up Arrow"
            width="20"
            height="20"
            @click="changeValue('up', score)"
          />
        </td>
      </tr>
      <tr v-if="selectedMethod === 'standard'">
        <td v-for="(score, index) in abilityNameArray" :key="`${score}-dropdown-${index}`">
          <select
            v-model="currAbilityScores[score as keyof AbilityScoreValues]"
            @change="handleDropdownChange()"
          >
            <option v-for="value in availableValues" :key="value" :value="value">
              {{ value }}
            </option>
          </select>
        </td>
      </tr>
      <tr v-if="selectedMethod === 'roll'">
        <td v-for="(score, index) in abilityNameArray" :key="`${score}-roll-${index}`">
          <img :src="rollDice" alt="Roll Dice" width="20" height="20" @click="doDiceRoll(score)" />
        </td>
      </tr>
      <tr>
        <td v-for="(score, index) in abilityNameArray" :key="`${score}-value-${index}`">
          <p>{{ findAbilityScore(score as keyof AbilityScoreValues) }}</p>
        </td>
      </tr>
      <tr
        v-if="
          selectedMethod !== 'standard' &&
          selectedMethod !== 'recommended' &&
          selectedMethod !== 'roll'
        "
      >
        <td v-for="(score, index) in abilityNameArray" :key="`${score}-down-${index}`">
          <img
            :src="downArrow"
            alt="Down Arrow"
            width="20"
            height="20"
            @click="changeValue('down', score)"
          />
        </td>
      </tr>
    </tbody>
  </table>
  <pre>{{ (abilityScoreNames, standardArray) }}</pre>
</template>
<script lang="ts" setup>
  import { useCharacterStore } from '../../../stores/characterStore';
  // import Accordian from '../../AccordianHolder.vue';

  import upArrow from '../../../assets/icons/up-arrow.svg';
  import downArrow from '../../../assets/icons/down-arrow.svg';
  import rollDice from '../../../assets/icons/roll-dice.svg';

  import type { AbilityScoreValues } from '../../../types';

  import {
    suggestedAbilityScores,
    abilityScoreNames,
    standardArray,
    abilityNameArray,
  } from '../../../stores/abilityScores';

  import { diceRoll } from '../../../helperFunctions';

  import { ref } from 'vue';
  const store = useCharacterStore();
  const emit = defineEmits<{ (e: 'nextStep'): void }>();
  const currClass = ref(store.currNewCharacter?.classes[0]?.name?.toLowerCase() || '');

  const currAbilityScores = ref<AbilityScoreValues>({
    str: suggestedAbilityScores[currClass.value]?.str || 0,
    dex: suggestedAbilityScores[currClass.value]?.dex || 0,
    con: suggestedAbilityScores[currClass.value]?.con || 0,
    int: suggestedAbilityScores[currClass.value]?.int || 0,
    wis: suggestedAbilityScores[currClass.value]?.wis || 0,
    cha: suggestedAbilityScores[currClass.value]?.cha || 0,
  });
  const selectedMethod = ref('custom');
  const availableValues = ref([0, ...standardArray]);

  const diceConfig = ref({
    count: 4,
    dType: 'd6',
    dropLowest: true,
    rerollThreshold: 1,
  });

  function changeValue(direction: string, abilityName: string) {
    if (direction === 'up') {
      currAbilityScores.value[abilityName as keyof AbilityScoreValues] =
        (currAbilityScores.value[abilityName as keyof AbilityScoreValues] || 0) + 1;
    } else if (direction === 'down') {
      currAbilityScores.value[abilityName as keyof AbilityScoreValues] =
        (currAbilityScores.value[abilityName as keyof AbilityScoreValues] || 0) - 1;
    }
  }

  function findAbilityScore(abilityName: keyof AbilityScoreValues): number {
    return currAbilityScores.value[abilityName] || 0;
  }

  function handleMethodChange() {
    console.log(`Selected method: ${selectedMethod.value}`);
    switch (selectedMethod.value) {
      case 'custom':
        // Keep current scores, allow manual adjustment
        break;
      case 'recommended':
        // Set to recommended ability scores
        currAbilityScores.value = {
          str: suggestedAbilityScores[currClass.value]?.str || 0,
          dex: suggestedAbilityScores[currClass.value]?.dex || 0,
          con: suggestedAbilityScores[currClass.value]?.con || 0,
          int: suggestedAbilityScores[currClass.value]?.int || 0,
          wis: suggestedAbilityScores[currClass.value]?.wis || 0,
          cha: suggestedAbilityScores[currClass.value]?.cha || 0,
        };
        break;
      case 'standard':
        // Set to 0 for all, and allow user to assign standard array values
        currAbilityScores.value = {
          str: 0,
          dex: 0,
          con: 0,
          int: 0,
          wis: 0,
          cha: 0,
        };
        break;
      case 'point-buy':
        // Reset scores for point buy method
        currAbilityScores.value = {
          str: 8,
          dex: 8,
          con: 8,
          int: 8,
          wis: 8,
          cha: 8,
        };
        break;
      case 'roll':
        // Implement rolling logic here (e.g., roll 4d6 and drop the lowest)
        break;
    }
  }

  function handleDropdownChange() {
    const usedValues = Object.values(currAbilityScores.value);
    availableValues.value = [0, ...standardArray.filter(value => !usedValues.includes(value))];
  }

  function doDiceRoll(score: string) {
    const rolledScore = diceRoll(
      [{ count: diceConfig.value.count, dType: diceConfig.value.dType, modifier: 0 }],
      diceConfig.value.dropLowest,
      [diceConfig.value.rerollThreshold]
    );

    currAbilityScores.value[score as keyof AbilityScoreValues] = rolledScore ?? 0; // Ensure a default value of 0
  }
</script>

<style scoped>
  table {
    width: 100%;
    border-collapse: collapse;
    text-align: center;
    margin: 1rem 0;
  }

  th {
    background-color: #f4f4f4;
    padding: 0.5rem;
    border: 1px solid #ddd;
  }

  td {
    padding: 0.5rem;
    border: 1px solid #ddd;
  }

  img {
    cursor: pointer;
    transition: transform 0.2s ease;
  }

  img:hover {
    transform: scale(1.2);
  }

  p {
    margin: 0.5rem 0;
    font-size: 1rem;
    font-weight: bold;
  }
</style>
