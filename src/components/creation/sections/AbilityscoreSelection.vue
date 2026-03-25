<template>
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
        <input
          id="reroll-threshold"
          type="number"
          v-model.number="diceConfig.rerollThreshold"
          min="1"
        />
      </div>
    </div>
  </div>
  <table v-if="selectedMethod !== 'point-buy'">
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
  <table v-else-if="selectedMethod === 'point-buy'">
    <thead>
      <tr>
        <th v-for="(score, index) in abilityNameArray" :key="`${score}-header-pb-${index}`">
          {{ score.toUpperCase() }}
        </th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td v-for="(score, index) in abilityNameArray" :key="`${score}-up-pb-${index}`">
          <img
            :src="upArrow"
            alt="Up Arrow"
            width="20"
            height="20"
            @click="changePointBuy('up', score)"
            :style="{
              opacity: canIncrease(score) ? 1 : 0.3,
              cursor: canIncrease(score) ? 'pointer' : 'not-allowed',
            }"
          />
        </td>
      </tr>
      <tr>
        <td v-for="(score, index) in abilityNameArray" :key="`${score}-value-pb-${index}`">
          <p>{{ currAbilityScores[score as keyof AbilityScoreValues] }}</p>
        </td>
      </tr>
      <tr>
        <td v-for="(score, index) in abilityNameArray" :key="`${score}-down-pb-${index}`">
          <img
            :src="downArrow"
            alt="Down Arrow"
            width="20"
            height="20"
            @click="changePointBuy('down', score)"
            :style="{
              opacity: canDecrease(score) ? 1 : 0.3,
              cursor: canDecrease(score) ? 'pointer' : 'not-allowed',
            }"
          />
        </td>
      </tr>
    </tbody>
  </table>
  <div v-if="selectedMethod === 'point-buy'" style="margin-bottom: 1rem">
    <strong>Points Remaining: {{ pointBuyPointsLeft }}</strong>
    <span v-if="pointBuyError" style="color: red; margin-left: 1rem">{{ pointBuyError }}</span>
  </div>
  <p>this next bit has the racial bonuses...</p>
  <pre>{{ currRaceBonus }}</pre>
  <pre>{{ useSetRacialBonus }}</pre>
</template>
<script lang="ts" setup>
  import { ref, computed } from 'vue';
  import { useCharacterStore } from '../../../stores/characterStore';
  // import Accordian from '../../AccordianHolder.vue';

  import upArrow from '../../../assets/icons/up-arrow.svg';
  import downArrow from '../../../assets/icons/down-arrow.svg';
  import rollDice from '../../../assets/icons/roll-dice.svg';

  import type { AbilityScoreValues, DiceTypes, Race } from '../../../types';

  import {
    suggestedAbilityScores,
    abilityScoreNames,
    standardArray,
    abilityNameArray,
  } from '../../../stores/abilityScores';

  import { diceRoll } from '../../../helperFunctions';

  // --- Point Buy Logic ---
  // Standard 27-point buy rules: 8-15, cost increases for higher values
  const pointBuyCosts: Record<number, number> = {
    8: 0,
    9: 1,
    10: 2,
    11: 3,
    12: 4,
    13: 5,
    14: 7,
    15: 9,
  };
  const POINT_BUY_MIN = 8;
  const POINT_BUY_MAX = 15;
  const POINT_BUY_TOTAL = 27;
  function getPointBuyTotal(scores: AbilityScoreValues): number {
    return Object.values(scores).reduce((sum, val) => sum + (pointBuyCosts[val] ?? 100), 0);
  }
  const pointBuyError = ref('');
  const pointBuyPointsLeft = computed(() => {
    return POINT_BUY_TOTAL - getPointBuyTotal(currAbilityScores.value);
  });
  const canIncrease = (score: string): boolean => {
    const val = currAbilityScores.value[score as keyof AbilityScoreValues];
    if (val >= POINT_BUY_MAX) return false;
    // Check if increasing would exceed points
    const nextVal = val + 1;
    const costDiff = (pointBuyCosts[nextVal] ?? 100) - (pointBuyCosts[val] ?? 100);
    return pointBuyPointsLeft.value >= costDiff;
  };
  const canDecrease = (score: string): boolean => {
    const val = currAbilityScores.value[score as keyof AbilityScoreValues];
    return val > POINT_BUY_MIN;
  };
  const changePointBuy = (direction: 'up' | 'down', abilityName: string) => {
    pointBuyError.value = '';
    const val = currAbilityScores.value[abilityName as keyof AbilityScoreValues];
    if (direction === 'up') {
      if (!canIncrease(abilityName)) {
        pointBuyError.value = 'Cannot increase further or not enough points.';
        return;
      }
      currAbilityScores.value[abilityName as keyof AbilityScoreValues] = val + 1;
    } else if (direction === 'down') {
      if (!canDecrease(abilityName)) {
        pointBuyError.value = 'Cannot decrease below 8.';
        return;
      }
      currAbilityScores.value[abilityName as keyof AbilityScoreValues] = val - 1;
    }
  };
  const store = useCharacterStore();
  const emit = defineEmits<{ (e: 'nextStep'): void }>();
  const currClass = ref(store.currNewCharacter?.classes[0]?.name?.toLowerCase() || '');
  const currRaceBonus = ref(store.currNewCharacter?.race?.ability || []);
  const useSetRacialBonus = computed(() => {
    // currRaceBonus is an array, check if any entry has a 'choose' key
    if (!Array.isArray(currRaceBonus.value)) return false;
    // If any object in the array has a 'choose' property, return false
    return !currRaceBonus.value.some(bonus => bonus && typeof bonus === 'object' && 'choose' in bonus);
  });

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
    dType: 'd6' as keyof DiceTypes, // Explicitly cast to keyof DiceTypes
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
