<template>
  <div class="container">
    <SavingThrowSection :saving-throws="proficiencies.savingThrows" />
    <ProficiencyTagList title="Armor Proficiencies" :items="proficiencies.armorProficiencies" />
    <ProficiencyTagList title="Weapon Proficiencies" :items="proficiencies.weaponProficiencies" />
    <ToolSection
      :tool-proficiencies="proficiencies.toolProficiencies"
      :tool-choices="proficiencies.toolChoices"
      @update:choices="extraToolChoices = $event"
    />
    <SkillSection
      :skills="proficiencies.skills"
      :skill-choices="proficiencies.skillChoices"
      :skill-choice-pool="proficiencies.skillChoicePool"
      @update:choices="chosenSkills = $event"
    />
    <button class="next-btn" @click="save" :disabled="!canProceed">Next</button>
  </div>
</template>

<script lang="ts" setup>
  import { computed, ref } from 'vue';
  import { useCharacterStore } from '../../../stores/characterStore';
  import { computeAllProficiencies } from '../../../helperFunctions';
  import type { AllProficiencies, PlayerSkills } from '../../../types';
  import SavingThrowSection from '../../proficiency/SavingThrowSection.vue';
  import ProficiencyTagList from '../../proficiency/ProficiencyTagList.vue';
  import ToolSection from '../../proficiency/ToolSection.vue';
  import SkillSection from '../../proficiency/SkillSection.vue';

  const store = useCharacterStore();
  const emit = defineEmits<{ (e: 'nextStep'): void }>();

  const proficiencies = ref<AllProficiencies>(
    computeAllProficiencies(
      store.getCharFullClasses(),
      store.getCharRace(),
      store.getCharBackground(),
      store.getCharFeats()
    )
  );

  const extraToolChoices = ref<string[]>([]);
  const chosenSkills = ref<(keyof PlayerSkills | '')[]>([]);

  const canProceed = computed(() => {
    const allSkillsFilled =
      chosenSkills.value.length === proficiencies.value.skillChoices &&
      chosenSkills.value.every(v => v !== '');
    const allToolsFilled =
      extraToolChoices.value.length === proficiencies.value.toolChoices &&
      extraToolChoices.value.every(v => v.trim() !== '');
    return allSkillsFilled && allToolsFilled;
  });

  function save() {
    const finalProficiencies: AllProficiencies = {
      ...proficiencies.value,
      skills: { ...proficiencies.value.skills },
      toolProficiencies: [
        ...proficiencies.value.toolProficiencies,
        ...extraToolChoices.value.filter(t => t.trim() !== ''),
      ],
    };
    for (const sk of chosenSkills.value) {
      if (sk) finalProficiencies.skills[sk].proficient = true;
    }
    store.updateAllProficiencies(finalProficiencies);
    emit('nextStep');
  }
</script>

<style scoped>
  .container {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    max-width: 600px;
    margin: 0 auto;
  }
  .next-btn {
    align-self: flex-end;
    padding: 0.5rem 1.25rem;
    font-size: 1rem;
  }
</style>
