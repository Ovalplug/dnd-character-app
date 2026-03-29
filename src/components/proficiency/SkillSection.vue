<template>
  <section>
    <h3>Skill Proficiencies</h3>
    <ul v-if="fixedSkills.length" class="tag-list">
      <li v-for="sk in fixedSkills" :key="sk">{{ prettySkill(sk) }}</li>
    </ul>
    <p v-else class="muted">No fixed skill proficiencies from your choices.</p>

    <div v-if="props.skillChoices > 0" class="choices-block">
      <p>
        Choose {{ props.skillChoices }} skill(s)
        <span v-if="props.skillChoicePool.length">
          from: {{ props.skillChoicePool.map(prettySkill).join(', ') }}
        </span>
        <span v-else>(any)</span>:
      </p>
      <div v-for="n in props.skillChoices" :key="'sc-' + n" class="skill-choice-row">
        <select
          :value="chosenSkills[n - 1] ?? ''"
          @change="updateSkill(n - 1, ($event.target as HTMLSelectElement).value)"
        >
          <option value="">— pick a skill —</option>
          <option v-for="opt in availableOptions(n - 1)" :key="opt" :value="opt">
            {{ prettySkill(opt) }}
          </option>
        </select>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
  import { computed, ref, watch } from 'vue';
  import type { PlayerSkills } from '../../types';
  import { SKILL_PRETTY } from '../../constants';

  const props = defineProps<{
    skills: PlayerSkills;
    skillChoices: number;
    skillChoicePool: (keyof PlayerSkills)[];
  }>();

  const emit = defineEmits<{
    (e: 'update:choices', value: (keyof PlayerSkills | '')[]): void;
  }>();

  const chosenSkills = ref<(keyof PlayerSkills | '')[]>(Array(props.skillChoices).fill(''));

  watch(
    () => props.skillChoices,
    count => {
      chosenSkills.value = Array(count).fill('');
    }
  );

  function updateSkill(idx: number, val: string) {
    chosenSkills.value[idx] = val as keyof PlayerSkills | '';
    emit('update:choices', [...chosenSkills.value]);
  }

  const fixedSkills = computed(() =>
    (Object.keys(props.skills) as (keyof PlayerSkills)[]).filter(k => props.skills[k].proficient)
  );

  function availableOptions(slotIndex: number): (keyof PlayerSkills)[] {
    const pool: (keyof PlayerSkills)[] =
      props.skillChoicePool.length > 0
        ? props.skillChoicePool
        : (Object.keys(props.skills) as (keyof PlayerSkills)[]);

    const alreadyChosen = chosenSkills.value
      .filter((v, i) => v !== '' && i !== slotIndex)
      .map(v => v as keyof PlayerSkills);

    return pool.filter(sk => !props.skills[sk].proficient && !alreadyChosen.includes(sk));
  }

  function prettySkill(key: keyof PlayerSkills): string {
    return SKILL_PRETTY[key] ?? key;
  }
</script>

<style scoped>
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
  .skill-choice-row select {
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
</style>
