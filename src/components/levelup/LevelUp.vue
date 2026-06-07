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

      <!-- Subclass unlock -->
      <SubclassSelection
        v-else-if="currentStep.id === 'subclass'"
        :subclasses="dataStore.subclasses"
        :curr-class="levelUpData.classData"
        @nextStep="onSubclassDone"
      />

      <!-- Features & table changes -->
      <LevelUpFeaturesGained
        v-else-if="
          currentStep.id === 'featuresGained' && levelUpData.classData && levelUpData.analysis
        "
        :character="character"
        :class-data="levelUpData.classData"
        :analysis="levelUpData.analysis"
        @nextStep="advanceTo(nextStepAfter('featuresGained'))"
      />

      <!-- Ability Score Improvement or Feat -->
      <LevelUpASI
        v-else-if="currentStep.id === 'asi'"
        :character="character"
        @nextStep="onASIDone"
      />

      <!-- New cantrips / spells known -->
      <LevelUpNewSpells
        v-else-if="currentStep.id === 'spells' && levelUpData.classData && levelUpData.analysis"
        :character="character"
        :class-data="levelUpData.classData"
        :analysis="levelUpData.analysis"
        @nextStep="onSpellsDone"
      />

      <!-- HP roll -->
      <LevelUpHpRoll
        v-else-if="currentStep.id === 'hpRoll' && levelUpData.classData"
        :character="character"
        :class-data="levelUpData.classData"
        @nextStep="onHpChosen"
      />

      <!-- Final summary -->
      <LevelUpSummarySection
        v-else-if="currentStep.id === 'summary' && levelUpData.classData && levelUpData.analysis"
        :character="character"
        :class-data="levelUpData.classData"
        :analysis="levelUpData.analysis"
        :subclass-data="levelUpData.subclassData"
        :hp-gain="levelUpData.hpGain"
        :ability-score-changes="levelUpData.abilityScoreChanges"
        :new-feat="levelUpData.newFeat"
        :new-cantrips="levelUpData.newCantrips"
        :new-spells="levelUpData.newSpells"
        @finishLevelUp="applyLevelUp"
      />
    </creation-step-frame>
  </div>
</template>

<script lang="ts" setup>
  import { computed, onMounted, ref } from 'vue';
  import { useRouter } from 'vue-router';
  import type {
    AbilityScoreValues,
    CharClass,
    Feat,
    playerCharacter,
    Spell,
    Subclass,
  } from '../../types';
  import { useCharacterStore } from '../../stores/characterStore';
  import { useDataStore } from '../../stores/dataStore';
  import CreationStepFrame from '../creation/CreationStepFrame.vue';
  import SubclassSelection from '../creation/sections/SubclassSelection.vue';
  import LevelUpClassChoice from './sections/LevelUpClassChoice.vue';
  import LevelUpFeaturesGained from './sections/LevelUpFeaturesGained.vue';
  import LevelUpASI from './sections/LevelUpASI.vue';
  import LevelUpNewSpells from './sections/LevelUpNewSpells.vue';
  import LevelUpHpRoll from './sections/LevelUpHpRoll.vue';
  import LevelUpSummarySection from './sections/LevelUpSummarySection.vue';
  import { computeLevelUpAnalysis, type LevelUpAnalysis } from './levelUpHelpers';

  const props = defineProps<{ character: playerCharacter }>();

  const router = useRouter();
  const characterStore = useCharacterStore();
  const dataStore = useDataStore();

  onMounted(() => {
    if (!dataStore.loaded) dataStore.init();
  });

  // ── Collected data ────────────────────────────────────────────────────────────
  type LevelUpData = {
    classData: CharClass | null;
    analysis: LevelUpAnalysis | null;
    subclassData: Subclass | null;
    hpGain: number;
    abilityScoreChanges: Partial<AbilityScoreValues>;
    newFeat: Feat | null;
    newCantrips: Spell[];
    newSpells: Spell[];
  };

  const levelUpData = ref<LevelUpData>({
    classData: null,
    analysis: null,
    subclassData: null,
    hpGain: 0,
    abilityScoreChanges: {},
    newFeat: null,
    newCantrips: [],
    newSpells: [],
  });

  // ── Step definitions ──────────────────────────────────────────────────────────
  type LevelUpStepId =
    | 'classChoice'
    | 'subclass'
    | 'featuresGained'
    | 'asi'
    | 'spells'
    | 'hpRoll'
    | 'summary';

  const ALL_STEP_META: Record<LevelUpStepId, { title: string; description: string }> = {
    classChoice: {
      title: 'Choose a class to advance',
      description: 'Continue leveling an existing class or branch into a new multiclass.',
    },
    subclass: {
      title: 'Choose a subclass',
      description: 'This level unlocks a subclass for this class. Lock in your archetype.',
    },
    featuresGained: {
      title: 'Features & table changes',
      description: 'Review everything your character gains at this level.',
    },
    asi: {
      title: 'Ability Score Improvement',
      description: 'Increase your ability scores or take a feat.',
    },
    spells: {
      title: 'New spells',
      description: 'Pick the cantrips and spells your character gains at this level.',
    },
    hpRoll: {
      title: 'Gain hit points',
      description: 'Roll, average, or manually enter the HP you gain for this level.',
    },
    summary: {
      title: 'Review & confirm',
      description: 'Confirm all changes before they are applied to your character sheet.',
    },
  };

  const activeStepIds = ref<LevelUpStepId[]>(['classChoice', 'hpRoll', 'summary']);

  const steps = computed(() => activeStepIds.value.map(id => ({ id, ...ALL_STEP_META[id] })));
  const totalSteps = computed(() => steps.value.length);
  const currStepId = ref<LevelUpStepId>('classChoice');
  const currentStepIndex = computed(() => steps.value.findIndex(s => s.id === currStepId.value));
  const currentStepNumber = computed(() => currentStepIndex.value + 1);
  const currentStep = computed(() => steps.value[currentStepIndex.value] ?? steps.value[0]!);
  const canGoBack = computed(() => currentStepIndex.value > 0);

  // ── Step helpers ──────────────────────────────────────────────────────────────
  function advanceTo(id: LevelUpStepId) {
    currStepId.value = id;
  }

  function nextStepAfter(id: LevelUpStepId): LevelUpStepId {
    const idx = activeStepIds.value.indexOf(id);
    return activeStepIds.value[idx + 1] ?? 'summary';
  }

  function buildStepSequence(analysis: LevelUpAnalysis): LevelUpStepId[] {
    const seq: LevelUpStepId[] = ['classChoice'];
    if (analysis.needsSubclass) seq.push('subclass');
    const hasSomethingToShow =
      analysis.featuresGained.length > 0 ||
      analysis.tableChanges.length > 0 ||
      analysis.newSpellSlotsDescription.length > 0;
    if (hasSomethingToShow) seq.push('featuresGained');
    if (analysis.hasASI) seq.push('asi');
    if (
      analysis.isSpellcaster &&
      (analysis.cantripsDelta > 0 ||
        analysis.spellsKnownDelta > 0 ||
        analysis.castingMode === 'prepared')
    ) {
      seq.push('spells');
    }
    seq.push('hpRoll');
    seq.push('summary');
    return seq;
  }

  // ── Step event handlers ───────────────────────────────────────────────────────
  function onClassChosen(cls: CharClass) {
    const analysis = computeLevelUpAnalysis(props.character, cls);
    levelUpData.value.classData = cls;
    levelUpData.value.analysis = analysis;
    levelUpData.value.subclassData = null;
    levelUpData.value.abilityScoreChanges = {};
    levelUpData.value.newFeat = null;
    levelUpData.value.newCantrips = [];
    levelUpData.value.newSpells = [];

    activeStepIds.value = buildStepSequence(analysis);

    if (analysis.needsSubclass) {
      const classKey = cls.name.toLowerCase() as keyof typeof props.character.classLevels;
      characterStore.currNewCharacter = {
        ...props.character,
        classes: props.character.classes.some(c => c.name.toLowerCase() === cls.name.toLowerCase())
          ? props.character.classes
          : [...props.character.classes, cls],
        classLevels: {
          ...props.character.classLevels,
          [classKey]: analysis.newClassLevel,
        },
      };
      advanceTo('subclass');
    } else {
      advanceTo(nextStepAfter('classChoice'));
    }
  }

  function onSubclassDone() {
    const chosen = characterStore.currNewCharacter?.subclasses?.[levelUpData.value.classData!.name];
    levelUpData.value.subclassData = chosen?.[0] ?? null;
    advanceTo(nextStepAfter('subclass'));
  }

  function onASIDone(changes: Partial<AbilityScoreValues>, feat: Feat | null) {
    levelUpData.value.abilityScoreChanges = changes;
    levelUpData.value.newFeat = feat;
    advanceTo(nextStepAfter('asi'));
  }

  function onSpellsDone(cantrips: Spell[], spells: Spell[]) {
    levelUpData.value.newCantrips = cantrips;
    levelUpData.value.newSpells = spells;
    advanceTo(nextStepAfter('spells'));
  }

  function onHpChosen(hpGain: number) {
    levelUpData.value.hpGain = hpGain;
    advanceTo('summary');
  }

  async function applyLevelUp() {
    const {
      classData,
      subclassData,
      hpGain,
      abilityScoreChanges,
      newFeat,
      newCantrips,
      newSpells,
    } = levelUpData.value;
    if (!classData) return;

    await characterStore.applyLevelUp(props.character.id, classData, hpGain, {
      subclass: subclassData ?? undefined,
      abilityScoreChanges,
      newFeat: newFeat ?? undefined,
      newCantrips,
      newSpells,
    });

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
