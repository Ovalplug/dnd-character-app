<template>
  <div class="full-creation">
    <creation-step-frame
      :title="currentStep.title"
      :description="currentStep.description"
      :step-number="currentStepNumber"
      :total-steps="steps.length"
      :step-key="currentStep.id"
      :can-go-back="canGoBack"
      @previous="handlePreviousStep"
    >
      <component
        :is="currentStep.component"
        :key="currentStep.id"
        v-bind="currentStep.props"
        @nextStep="handleNextStep"
        @finishCreation="finishCreation"
      />
    </creation-step-frame>

    <accordian-holder header="character json">
      <pre class="character-json">{{ store.currNewCharacter }}</pre>
    </accordian-holder>
  </div>
</template>

<script lang="ts" setup>
  import { computed } from 'vue';
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
  import CreationStepFrame from './CreationStepFrame.vue';
  import router from '../../router';

  type CreationStepId =
    | 'name'
    | 'background'
    | 'race'
    | 'class'
    | 'subclass'
    | 'abilityScores'
    | 'language'
    | 'proficiency'
    | 'spells'
    | 'summary';

  type CreationStep = {
    id: CreationStepId;
    title: string;
    description: string;
    component: unknown;
    props?: Record<string, unknown>;
  };

  const props = defineProps<{ dataStore: any }>();
  const store = useCharacterStore();
  store.startNewCharacterCreation();

  const steps = computed<CreationStep[]>(() => [
    {
      id: 'name',
      title: 'Choose a name',
      description:
        'Start with a name you like, or roll until you find one that fits the character.',
      component: NameSelector,
    },
    {
      id: 'background',
      title: 'Pick a background',
      description:
        'Set the character’s origin and the story hooks that shape early proficiencies and equipment.',
      component: BackgroundSelection,
      props: {
        backgrounds: props.dataStore.backgrounds,
        backgroundFluffs: props.dataStore.backgroundFluff,
      },
    },
    {
      id: 'race',
      title: 'Choose a race',
      description:
        'Select ancestry traits, movement, and any subrace details before you build the rest of the sheet.',
      component: RaceSelection,
      props: {
        races: props.dataStore.races,
        raceFluff: props.dataStore.raceFluff,
      },
    },
    {
      id: 'class',
      title: 'Select a class',
      description:
        'Choose the class that drives the character’s core mechanics, proficiencies, and spell progression.',
      component: ClassSelection,
      props: {
        classes: props.dataStore.classes,
        subclasses: props.dataStore.subclasses,
      },
    },
    {
      id: 'subclass',
      title: 'Confirm a subclass',
      description:
        'If the chosen class needs a subclass at this level, lock it in here. Otherwise this step will skip itself.',
      component: SubclassSelection,
      props: {
        subclasses: props.dataStore.subclasses,
        currClass: store.getCharFullClasses()[0] || null,
      },
    },
    {
      id: 'abilityScores',
      title: 'Set ability scores',
      description:
        'Use a recommended spread, standard array, point buy, manual entry, or dice rolls and apply racial bonuses.',
      component: AbilityScoreSelection,
    },
    {
      id: 'language',
      title: 'Choose languages',
      description:
        'Review what the character already knows, then fill any open language picks from race or background.',
      component: LanguageSelection,
    },
    {
      id: 'proficiency',
      title: 'Finalize proficiencies',
      description:
        'Confirm saving throws and fill any remaining skill or tool choices before the build is locked in.',
      component: ProficiencySelection,
    },
    {
      id: 'spells',
      title: 'Prepare spellcasting',
      description:
        'Choose cantrips, known spells, or prepared spells based on the character’s casting rules.',
      component: SpellsSelection,
    },
    {
      id: 'summary',
      title: 'Review starting loadout',
      description:
        'Resolve equipment choices, gold alternatives, and save the completed character.',
      component: SummarySection,
    },
  ]);
  const currStep = ref<CreationStepId>(steps.value[0]!.id);
  const currentStepIndex = computed(() =>
    steps.value.findIndex(step => step.id === currStep.value)
  );
  const currentStepNumber = computed(() => currentStepIndex.value + 1);
  const currentStep = computed<CreationStep>(
    () => steps.value[currentStepIndex.value] ?? steps.value[0]!
  );
  const canGoBack = computed(() => currentStepIndex.value > 0);

  function shouldSkipStep(stepId: CreationStepId) {
    if (stepId !== 'subclass') return false;

    const currentClass = store.getCharFullClasses()[0];
    if (!currentClass || !store.currNewCharacter) return true;

    const classLevel =
      store.currNewCharacter.classLevels[
        currentClass.name.toLowerCase() as keyof typeof store.currNewCharacter.classLevels
      ];

    return currentClass.subclassAtLvl > classLevel;
  }

  function findStepIndex(startIndex: number, direction: 1 | -1) {
    let nextIndex = startIndex + direction;

    while (nextIndex >= 0 && nextIndex < steps.value.length) {
      const candidateStep = steps.value[nextIndex];
      if (candidateStep && !shouldSkipStep(candidateStep.id)) {
        return nextIndex;
      }
      nextIndex += direction;
    }

    return -1;
  }

  function handleNextStep() {
    const nextIndex = findStepIndex(currentStepIndex.value, 1);
    if (nextIndex !== -1) {
      currStep.value = steps.value[nextIndex]!.id;
    }
  }

  function handlePreviousStep() {
    const previousIndex = findStepIndex(currentStepIndex.value, -1);
    if (previousIndex !== -1) {
      currStep.value = steps.value[previousIndex]!.id;
    }
  }

  function finishCreation() {
    // For now, just log the character and reset the creation process
    alert('Character creation complete! Check the console for details.');

    // router back to home
    router.push('/');
  }
</script>

<style scoped>
  .full-creation {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .character-json {
    margin: 0;
    white-space: pre-wrap;
    word-break: break-word;
  }
</style>
