<template>
  <p>this is where i'll attempt to get a good ability score selection going</p>
  <Accordian :header="'Classes'">
    <pre>
    {{ store.currNewCharacter?.classes }}
    </pre>
  </Accordian>
  <Accordian :header="'Background'">
    <pre>
    {{ store.currNewCharacter?.background }}
    </pre>
  </Accordian>
  <Accordian :header="'Race'">
    <pre>
    {{ store.currNewCharacter?.race }}
    </pre>
  </Accordian>
  <Accordian :header="'currAbilityScores'">
    <p>Curr class: {{ currClass }}</p>
    <!-- <p>suggested ability scores array</p>
    <pre>{{ suggestedAbilityScores }}</pre>
    <p>ability score names</p>
    <pre>{{ abilityScoreNames }}</pre>
    <p>standard array</p>
    <pre>{{ standardArray }}</pre> -->
    <p>current ability scores</p>
    <pre>
    {{ currAbilityScores }}
    </pre>
  </Accordian>
  <div>
    <table>
      <thead>
        <tr>
          <th v-for="(score, index) in abilityNameArray" :key="`${score}-header-${index}`">
            {{ score.toUpperCase() }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td v-for="(score, index) in abilityNameArray" :key="`${score}-up-${index}`">
            <img :src="upArrow" alt="Up Arrow" width="20" height="20" @click="changeValue('up', score)"/>
          </td>
        </tr>
        <tr>
          <td v-for="(score, index) in abilityNameArray" :key="`${score}-value-${index}`">
            <p>{{ findAbilityScore(score as keyof AbilityScoreValues) }}</p>
          </td>
        </tr>
        <tr>
          <td v-for="(score, index) in abilityNameArray" :key="`${score}-down-${index}`">
            <img :src="downArrow" alt="Down Arrow" width="20" height="20" @click="changeValue('down', score)"/>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
  <pre>{{ (abilityScoreNames, standardArray) }}</pre>
</template>
<script lang="ts" setup>
  import { useCharacterStore } from '../../../stores/characterStore';
  import Accordian from '../../AccordianHolder.vue';

  import upArrow from '../../../assets/icons/up-arrow.svg';
  import downArrow from '../../../assets/icons/down-arrow.svg';

  import type { AbilityScoreValues } from '../../../types';

  import {
    suggestedAbilityScores,
    abilityScoreNames,
    standardArray,
    abilityNameArray
  } from '../../../stores/abilityScores';
  import { ref } from 'vue';
  const store = useCharacterStore();

  // const currRace = ref(store.currNewCharacter?.race?.name || '');
  const currClass = ref((store.currNewCharacter?.classes[0]?.name)?.toLowerCase() || '');

  const currAbilityScores = ref<AbilityScoreValues>({
    str: suggestedAbilityScores[currClass.value]?.str || 0,
    dex: suggestedAbilityScores[currClass.value]?.dex || 0,
    con: suggestedAbilityScores[currClass.value]?.con || 0,
    int: suggestedAbilityScores[currClass.value]?.int || 0,
    wis: suggestedAbilityScores[currClass.value]?.wis || 0,
    cha: suggestedAbilityScores[currClass.value]?.cha || 0,
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