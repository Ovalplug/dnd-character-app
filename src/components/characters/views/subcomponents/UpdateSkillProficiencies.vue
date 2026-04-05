<template>
  <div class="update-skills">
    <table class="skills-edit-table">
      <thead>
        <tr>
          <th class="col-name">Skill</th>
          <th class="col-toggle">Prof.</th>
          <th class="col-toggle">Expert.</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="key in skillKeys" :key="key">
          <td class="col-name">{{ SKILL_PRETTY[key] }}</td>
          <td class="col-toggle">
            <button
              class="toggle-btn"
              :class="{ 'toggle-btn--on': local[key].proficient }"
              @click="toggleProficient(key)"
              :aria-label="`Toggle ${SKILL_PRETTY[key]} proficiency`"
              :aria-pressed="local[key].proficient"
            >
              {{ local[key].proficient ? '✓' : '—' }}
            </button>
          </td>
          <td class="col-toggle">
            <button
              class="toggle-btn toggle-btn--expert"
              :class="{ 'toggle-btn--on': local[key].expertise }"
              @click="toggleExpertise(key)"
              :disabled="!local[key].proficient"
              :aria-label="`Toggle ${SKILL_PRETTY[key]} expertise`"
              :aria-pressed="local[key].expertise"
            >
              {{ local[key].expertise ? '✓✓' : '—' }}
            </button>
          </td>
        </tr>
      </tbody>
    </table>
    <div class="action-row">
      <button class="action-btn" @click="save">Save</button>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { reactive } from 'vue';
  import type { playerCharacter, PlayerSkills } from '../../../../types';
  import { SKILL_PRETTY } from '../../../../constants';
  import { useCharacterStore } from '../../../../stores/characterStore';

  const props = defineProps<{ character: playerCharacter }>();
  const emit = defineEmits<{ (e: 'close'): void }>();

  const charStore = useCharacterStore();

  const skillKeys = Object.keys(SKILL_PRETTY) as (keyof PlayerSkills)[];

  // Deep-copy current proficiencies into local reactive state
  const local = reactive(
    Object.fromEntries(
      skillKeys.map(key => [key, { ...props.character.skillProficiencies[key] }])
    ) as PlayerSkills
  );

  function toggleProficient(key: keyof PlayerSkills) {
    local[key].proficient = !local[key].proficient;
    // Expertise requires proficiency
    if (!local[key].proficient) local[key].expertise = false;
  }

  function toggleExpertise(key: keyof PlayerSkills) {
    if (!local[key].proficient) return;
    local[key].expertise = !local[key].expertise;
  }

  function save() {
    charStore.updateSkillProficiencies(props.character.id, { ...local } as PlayerSkills);
    emit('close');
  }
</script>

<style scoped>
  .update-skills {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 0.25rem 0;
  }

  .skills-edit-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.875rem;
  }

  .skills-edit-table thead th {
    text-align: left;
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-muted);
    padding: 0.2rem 0.5rem 0.35rem;
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  }

  .skills-edit-table td {
    padding: 0.2rem 0.5rem;
    border-bottom: 1px solid rgba(0, 0, 0, 0.04);
    vertical-align: middle;
  }

  .col-name {
    width: 100%;
  }

  .col-toggle {
    text-align: center;
    width: 56px;
  }

  .toggle-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 26px;
    border-radius: 6px;
    border: 1.5px solid rgba(0, 0, 0, 0.15);
    background: transparent;
    color: var(--color-muted);
    font-size: 0.8rem;
    font-weight: 700;
    cursor: pointer;
    transition: background 0.12s, border-color 0.12s, color 0.12s;
  }

  .toggle-btn--on {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: #fff;
  }

  .toggle-btn--expert.toggle-btn--on {
    background: var(--color-accent);
    border-color: var(--color-accent);
    color: #111;
  }

  .toggle-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .action-row {
    display: flex;
    justify-content: flex-end;
    padding-top: 0.25rem;
  }

  .action-btn {
    padding: 0.5rem 1.25rem;
    border-radius: 8px;
    border: none;
    background: var(--color-primary);
    color: #fff;
    font-weight: 700;
    font-size: 0.9rem;
    cursor: pointer;
    transition: background 0.15s;
  }

  .action-btn:hover {
    background: var(--color-primary-600);
  }
</style>
