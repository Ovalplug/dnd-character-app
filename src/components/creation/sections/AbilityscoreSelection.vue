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
  <Accordian :header="'Suggested Ability Scores'">
    <pre>
    {{ suggestedAbilityScores }}
    </pre>
  </Accordian>
</template>
<script lang="ts" setup>
  import { suggestedAbilityScores } from '../../../stores/abilityScores';
  import { useCharacterStore } from '../../../stores/characterStore';
  import Accordian from '../../AccordianHolder.vue';
  const store = useCharacterStore();
</script>
