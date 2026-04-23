<template>
  <div>
    <h1>Full Character Creation</h1>
    <h2>Current Step: {{ currStep }}</h2>
    <!-- start with choosing a name (or a random one) -->
    <name-selector v-if="currStep === 'name'" @nextStep="handleNextStep" />

    <!-- then choose a background -->
    <background-selection
      v-if="currStep === 'background'"
      :backgrounds="dataStore.backgrounds"
      :background-fluffs="dataStore.backgroundFluff"
      @nextStep="handleNextStep"
    />

    <!-- then choose a race -->
    <race-selection
      v-if="currStep === 'race'"
      :races="dataStore.races"
      :raceFluff="dataStore.raceFluff"
      @nextStep="handleNextStep"
    />

    <!-- then choose a class -->
    <class-selection
      v-if="currStep === 'class'"
      :classes="dataStore.classes"
      :subclasses="dataStore.subclasses"
      @nextStep="handleNextStep"
    />

    <!-- then subclass if needed -->
    <subclass-selection
      v-if="currStep === 'subclass'"
      :subclasses="dataStore.subclasses"
      :currClass="store.getCharFullClasses()[0] || null"
      @nextStep="handleNextStep"
    />

    <!-- then choose ability scores -->
    <ability-score-selection v-if="currStep === 'abilityScores'" @nextStep="handleNextStep" />

    <!-- Then languages, proficiencies, and other details -->
    <language-selection v-if="currStep === 'language'" @nextStep="handleNextStep" />
    <proficiency-selection v-if="currStep === 'proficiency'" @nextStep="handleNextStep" />
    <spells-selection v-if="currStep === 'spells'" @nextStep="handleNextStep" />
    <summary-section v-if="currStep === 'summary'" @finishCreation="finishCreation" />
  </div>
  <br />
  <br />
  <accordian-holder :header="'character json'">
    <pre>{{ store.currNewCharacter }}</pre>
  </accordian-holder>
</template>

<script lang="ts" setup>
  import { useCharacterStore } from '../../stores/characterStore';
  import ClassSelection from './sections/ClassSelection.vue';
  import NameSelector from './sections/NameSelector.vue';
  import RaceSelection from './sections/RaceSelection.vue';
  import BackgroundSelection from './sections/BackgroundSelection.vue';
  import AbilityScoreSelection from './sections/AbilityscoreSelection.vue';
  import SubclassSelection from './sections/SubclassSelection.vue';
  import { ref } from 'vue';
  import AccordianHolder from '../AccordianHolder.vue';
  import LanguageSelection from './sections/LanguageSelection.vue';
  import ProficiencySelection from './sections/ProficiencySelection.vue';
  import SummarySection from './sections/SummarySection.vue';
  import SpellsSelection from './sections/SpellsSelection.vue';
  import router from '../../router';

  const props = defineProps<{ dataStore: any }>();
  const store = useCharacterStore();
  store.startNewCharacterCreation();

  const steps = [
    'name',
    'background',
    'race',
    'class',
    'subclass',
    'abilityScores',
    'language',
    'proficiency',
    'spells',
    'summary',
  ];
  const currStep = ref(steps[0]);

  function handleNextStep() {
    const currentIndex = steps.indexOf(currStep.value || '');
    if (currentIndex >= 0 && currentIndex < steps.length - 1) {
      currStep.value = steps[currentIndex + 1];
    }
  }

  function finishCreation() {
    // For now, just log the character and reset the creation process
    alert('Character creation complete! Check the console for details.');

    // router back to home
    router.push('/');
  }
</script>
