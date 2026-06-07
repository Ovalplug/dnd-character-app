<template>
  <div class="level-up">
    <creation-step-frame
      :title="currentStep.title"
      :description="currentStep.description"
      :step-number="currentStepNumber"
      :total-steps="totalSteps"
      :step-key="currentStep.id"
      :can-go-back="canGoBack"
      eyebrow="Level Up"
      @previous="handlePrevious"

    >
      <!-- Class choice -->
      <LevelUpClassChoice
        v-if="currentStep.id === 'classChoice'"
        :character="character"
        :classes="dataStore.classes"
        :subclasses="dataStore.subclasses"
        @nextStep="onClassChosen"
      />

      <!-- Subclass (only when a new subclass unlocks) -->
      <SubclassSelection
        v-else-if="currentStep.id === 'subclass'"
        :subclasses="dataStore.subclasses"
        :curr-class="levelUpData.classData"
        @nextStep="onSubclassDone"
      />

      <!-- HP roll -->
      <LevelUpHpRoll
        v-else-if="currentStep.id === 'hpRoll' && levelUpData.classData"
        :character="character"
        :class-data="levelUpData.classData"
        @nextStep="onHpChosen"
      />

      <!-- Summary -->
      <LevelUpSummarySection
        v-else-if="currentStep.id === 'summary' && levelUpData.classData"
        :character="character"
        :class-data="levelUpData.classData"
        :subclass-data="levelUpData.subclassData"
        :hp-gain="levelUpData.hpGain"
        @finishLevelUp="applyLevelUp"
      />
    </creation-step-frame>
  </div>
</template>

<script lang="ts" setup>
  import { computed, ref } from 'vue';
  import { useRouter } from 'vue-router';
  import type { CharClass, playerCharacter, Subclass } from '../../types';
  import { useCharacterStore } from '../../stores/characterStore';
  import { useDataStore } from '../../stores/dataStore';
  import CreationStepFrame from '../creation/CreationStepFrame.vue';
  import SubclassSelection from '../creation/sections/SubclassSelection.vue';
  import LevelUpClassChoice from './sections/LevelUpClassChoice.vue';
  import LevelUpHpRoll from './sections/LevelUpHpRoll.vue';
  import LevelUpSummarySection from './sections/LevelUpSummarySection.vue';

  const props = defineProps<{ character: playerCharacter }>();

  const router = useRouter();
  const characterStore = useCharacterStore();
  const dataStore = useDataStore();

  type LevelUpStepId = 'classChoice' | 'subclass' | 'hpRoll' | 'summary';

  const levelUpData = ref<{
    classData: CharClass | null;
    subclassData: Subclass | null;
    hpGain: number;
  }>({
    classData: null,
    subclassData: null,
    hpGain: 0,
  });

  // ── Step definitions ─────────────────────────────────────────────────────────
  const allSteps: Array<{ id: LevelUpStepId; title: string; description: string }> = [
    {
      id: 'classChoice',
      title: 'Choose a class to advance',
      description: 'Continue leveling an existing class or branch into a new multiclass.',
    },
    {
      id: 'subclass',
      title: 'Choose a subclass',
      description: 'This level unlocks a subclass. Lock in your archetype before continuing.',
    },
    {
      id: 'hpRoll',
      title: 'Gain hit points',
      description: 'Roll, average, or manually enter the HP you gain for this level.',
    },
    {
      id: 'summary',
      title: 'Review level up',
      description: 'Confirm all changes before they are applied to your character.',
    },
  ];

  // The step sequence, starting without subclass; it gets injected after classChoice if needed
  const activeStepIds = ref<LevelUpStepId[]>(['classChoice', 'hpRoll', 'summary']);

  const steps = computed(() => allSteps.filter(s => activeStepIds.value.includes(s.id)));
  const totalSteps = computed(() => steps.value.length);

  const currStepId = ref<LevelUpStepId>('classChoice');
  const currentStepIndex = computed(() => steps.value.findIndex(s => s.id === currStepId.value));
  const currentStepNumber = computed(() => currentStepIndex.value + 1);
  const currentStep = computed(() => steps.value[currentStepIndex.value] ?? steps.value[0]!);
  const canGoBack = computed(() => currentStepIndex.value > 0);

  // ── Helpers ───────────────────────────────────────────────────────────────────
  function needsSubclassAtLevel(cls: CharClass, newLevel: number): boolean {
    if (newLevel !== cls.subclassAtLvl) return false;
    const existing = props.character.subclasses?.[cls.name];
    return !existing || existing.length === 0;
  }

  function advanceTo(id: LevelUpStepId) {
    currStepId.value = id;
  }

  // ── Step handlers ─────────────────────────────────────────────────────────────
  function onClassChosen(cls: CharClass) {
    levelUpData.value.classData = cls;
    levelUpData.value.subclassData = null;

    // Determine new class level (may be 1 if multiclassing)
    const currentLevel =
      (props.character.classLevels[cls.name.toLowerCase() as keyof typeof props.character.classLevels] ??
        0);
    const newLevel = currentLevel + 1;

    if (needsSubclassAtLevel(cls, newLevel)) {
      // Inject subclass step if not present
      if (!activeStepIds.value.includes('subclass')) {
        activeStepIds.value = ['classChoice', 'subclass', 'hpRoll', 'summary'];
      }
      // Prime the store's currNewCharacter temporarily so SubclassSelection can read it
      characterStore.currNewCharacter = {
        ...props.character,
        classes: props.character.classes.some(
          c => c.name.toLowerCase() === cls.name.toLowerCase()
        )
          ? props.character.classes
          : [...props.character.classes, cls],
        classLevels: {
          ...props.character.classLevels,
          [cls.name.toLowerCase()]: newLevel,
        },
      };
      advanceTo('subclass');
    } else {
      activeStepIds.value = ['classChoice', 'hpRoll', 'summary'];
      advanceTo('hpRoll');
    }
  }

  function onSubclassDone() {
    // SubclassSelection writes to store.currNewCharacter.subclasses
    const chosen = characterStore.currNewCharacter?.subclasses?.[levelUpData.value.classData!.name];
    levelUpData.value.subclassData = chosen?.[0] ?? null;
    advanceTo('hpRoll');
  }

  function onHpChosen(hpGain: number) {
    levelUpData.value.hpGain = hpGain;
    advanceTo('summary');
  }

  async function applyLevelUp() {
    const { classData, subclassData, hpGain } = levelUpData.value;
    if (!classData) return;
    await characterStore.applyLevelUp(
      props.character.id,
      classData,
      hpGain,
      subclassData ?? undefined
    );
    // Clear any temporary currNewCharacter
    characterStore.currNewCharacter = null;
    router.push(`/character/${props.character.id}`);
  }

  function handlePrevious() {
    const prevIndex = currentStepIndex.value - 1;
    if (prevIndex >= 0) {
      currStepId.value = steps.value[prevIndex]!.id;
    }
  }
</script>

<style scoped>
  .level-up {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }
</style>
