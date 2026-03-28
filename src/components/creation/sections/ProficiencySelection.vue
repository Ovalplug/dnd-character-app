<template>
  <div class="container">
    <!-- Saving Throws -->
    <section v-if="Object.keys(proficiencies.savingThrows).length">
      <h3>Saving Throw Proficiencies</h3>
      <ul class="tag-list">
        <li v-for="st in savingThrowList" :key="st">{{ st }}</li>
      </ul>
    </section>

    <!-- Armor -->
    <section v-if="proficiencies.armorProficiencies.length">
      <h3>Armor Proficiencies</h3>
      <ul class="tag-list">
        <li v-for="a in proficiencies.armorProficiencies" :key="a">{{ a }}</li>
      </ul>
    </section>

    <!-- Weapons -->
    <section v-if="proficiencies.weaponProficiencies.length">
      <h3>Weapon Proficiencies</h3>
      <ul class="tag-list">
        <li v-for="w in proficiencies.weaponProficiencies" :key="w">{{ w }}</li>
      </ul>
    </section>

    <!-- Fixed tool proficiencies -->
    <section v-if="proficiencies.toolProficiencies.length || proficiencies.toolChoices > 0">
      <h3>Tool Proficiencies</h3>
      <ul v-if="proficiencies.toolProficiencies.length" class="tag-list">
        <li v-for="t in proficiencies.toolProficiencies" :key="t">{{ t }}</li>
      </ul>
      <div v-if="proficiencies.toolChoices > 0" class="choices-block">
        <p>Choose {{ proficiencies.toolChoices }} additional tool(s):</p>
        <input
          v-for="n in proficiencies.toolChoices"
          :key="'tc-' + n"
          type="text"
          placeholder="Tool name…"
          :value="extraToolChoices[n - 1] ?? ''"
          @input="updateExtraTool(n - 1, ($event.target as HTMLInputElement).value)"
          class="tool-input"
        />
      </div>
    </section>

    <!-- Fixed skills -->
    <section>
      <h3>Skill Proficiencies</h3>
      <ul v-if="fixedSkills.length" class="tag-list">
        <li v-for="sk in fixedSkills" :key="sk">{{ prettySkill(sk) }}</li>
      </ul>
      <p v-else class="muted">No fixed skill proficiencies from your choices.</p>

      <!-- Free skill choices -->
      <div v-if="proficiencies.skillChoices > 0" class="choices-block">
        <p>
          Choose {{ proficiencies.skillChoices }} skill(s)
          <span v-if="proficiencies.skillChoicePool.length">
            from: {{ proficiencies.skillChoicePool.map(prettySkill).join(', ') }}
          </span>
          <span v-else>(any)</span>:
        </p>
        <div
          v-for="n in proficiencies.skillChoices"
          :key="'sc-' + n"
          class="skill-choice-row"
        >
          <select
            :value="chosenSkills[n - 1] ?? ''"
            @change="updateChosenSkill(n - 1, ($event.target as HTMLSelectElement).value)"
          >
            <option value="">— pick a skill —</option>
            <option
              v-for="opt in availableSkillOptions(n - 1)"
              :key="opt"
              :value="opt"
            >
              {{ prettySkill(opt) }}
            </option>
          </select>
        </div>
      </div>
    </section>

    <button class="next-btn" @click="save" :disabled="!canProceed">Next</button>
  </div>
</template>

<script lang="ts" setup>
  import { computed, ref } from 'vue';
  import { useCharacterStore } from '../../../stores/characterStore';
  import { computeAllProficiencies } from '../../../helperFunctions';
  import type { AllProficiencies, PlayerSkills, SavingThrow } from '../../../types';

  const store = useCharacterStore();
  const emit = defineEmits<{ (e: 'nextStep'): void }>();

  const classes = store.getCharFullClasses();
  const race = store.getCharRace();
  const background = store.getCharBackground();
  const feats = store.getCharFeats();

  const proficiencies = ref<AllProficiencies>(
    computeAllProficiencies(classes, race, background, feats)
  );

  // --- Extra tool choices (free-text) ---
  const extraToolChoices = ref<string[]>(
    Array(proficiencies.value.toolChoices).fill('')
  );
  function updateExtraTool(idx: number, val: string) {
    extraToolChoices.value[idx] = val;
  }

  // --- Skill choices ---
  const chosenSkills = ref<(keyof PlayerSkills | '')[]>(
    Array(proficiencies.value.skillChoices).fill('')
  );
  function updateChosenSkill(idx: number, val: string) {
    chosenSkills.value[idx] = val as keyof PlayerSkills | '';
  }

  // Skills already granted by fixed proficiencies
  const fixedSkills = computed(() =>
    (Object.keys(proficiencies.value.skills) as (keyof PlayerSkills)[]).filter(
      k => proficiencies.value.skills[k].proficient
    )
  );

  // Pool to pick from (filtered by: not already proficient, not already chosen in another slot)
  function availableSkillOptions(slotIndex: number): (keyof PlayerSkills)[] {
    const pool: (keyof PlayerSkills)[] =
      proficiencies.value.skillChoicePool.length > 0
        ? proficiencies.value.skillChoicePool
        : (Object.keys(proficiencies.value.skills) as (keyof PlayerSkills)[]);

    const alreadyChosen = chosenSkills.value
      .filter((v, i) => v !== '' && i !== slotIndex)
      .map(v => v as keyof PlayerSkills);

    return pool.filter(
      sk => !proficiencies.value.skills[sk].proficient && !alreadyChosen.includes(sk)
    );
  }

  // Saving throw display names
  const SAVE_PRETTY: Record<SavingThrow, string> = {
    str: 'Strength', dex: 'Dexterity', con: 'Constitution',
    int: 'Intelligence', wis: 'Wisdom', cha: 'Charisma',
  };
  const savingThrowList = computed(() =>
    (Object.keys(proficiencies.value.savingThrows) as SavingThrow[])
      .filter(k => proficiencies.value.savingThrows[k])
      .map(k => SAVE_PRETTY[k])
  );

  const SKILL_PRETTY: Record<keyof PlayerSkills, string> = {
    acrobatics: 'Acrobatics',
    animalHandling: 'Animal Handling',
    arcana: 'Arcana',
    athletics: 'Athletics',
    deception: 'Deception',
    history: 'History',
    insight: 'Insight',
    intimidation: 'Intimidation',
    investigation: 'Investigation',
    medicine: 'Medicine',
    nature: 'Nature',
    perception: 'Perception',
    performance: 'Performance',
    persuasion: 'Persuasion',
    religion: 'Religion',
    sleightOfHand: 'Sleight of Hand',
    stealth: 'Stealth',
    survival: 'Survival',
  };
  function prettySkill(key: keyof PlayerSkills): string {
    return SKILL_PRETTY[key] ?? key;
  }

  // Only allow Next when all choice slots are filled
  const canProceed = computed(() => {
    const allSkillsFilled = chosenSkills.value.every(v => v !== '');
    const allToolsFilled = extraToolChoices.value.every(v => v.trim() !== '');
    return allSkillsFilled && allToolsFilled;
  });

  function save() {
    // Apply chosen skills
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
  section {
    padding: 0.75rem;
    border: 1px solid #ccc;
    border-radius: 6px;
  }
  h3 {
    margin: 0 0 0.5rem;
    font-size: 1rem;
  }
  .tag-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    list-style: none;
    padding: 0;
    margin: 0;
  }
  .tag-list li {
    background: #e8e8e8;
    border-radius: 4px;
    padding: 0.2rem 0.5rem;
    font-size: 0.9rem;
    text-transform: capitalize;
  }
  .choices-block {
    margin-top: 0.75rem;
  }
  .choices-block p {
    margin: 0 0 0.4rem;
    font-size: 0.9rem;
  }
  .skill-choice-row select,
  .tool-input {
    width: 100%;
    padding: 0.3rem 0.5rem;
    margin-bottom: 0.4rem;
    font-size: 0.9rem;
    border: 1px solid #aaa;
    border-radius: 4px;
  }
  .muted {
    color: #888;
    font-size: 0.875rem;
  }
  .next-btn {
    align-self: flex-end;
    padding: 0.5rem 1.25rem;
    font-size: 1rem;
  }
</style>

