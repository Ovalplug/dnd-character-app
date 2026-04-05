<template>
  <table class="skills-bonus">
    <thead>
      <tr>
        <th class="col-prof" title="Proficiency"></th>
        <th class="col-name">Skill</th>
        <th class="col-ability">Ability</th>
        <th class="col-mod">Modifier</th>
      </tr>
    </thead>
    <tbody>
      <tr
        v-for="row in skillRows"
        :key="row.key"
        :class="{ 'row--proficient': row.proficient, 'row--expertise': row.expertise }"
      >
        <td class="col-prof">
          <img
            v-if="row.expertise"
            :src="doubleTick"
            class="prof-icon"
            alt="Expertise"
            title="Expertise"
          />
          <img
            v-else-if="row.proficient"
            :src="singleTick"
            class="prof-icon"
            alt="Proficient"
            title="Proficient"
          />
          <span v-else class="prof-dot" aria-hidden="true"></span>
        </td>
        <td class="col-name">{{ row.name }}</td>
        <td class="col-ability">{{ row.ability }}</td>
        <td class="col-mod" :class="row.modifier >= 0 ? 'mod--pos' : 'mod--neg'">
          {{ row.modifier >= 0 ? '+' : '' }}{{ row.modifier }}
        </td>
      </tr>
    </tbody>
  </table>
</template>

<script lang="ts" setup>
  import { computed } from 'vue';
  import type { playerCharacter, PlayerSkills } from '../../../../types';
  import { SKILL_PRETTY, SKILL_ABILITY } from '../../../../constants';
  import { abilityMod } from '../../../../helperFunctions';
  import singleTick from '../../../../assets/icons/singleTick.svg';
  import doubleTick from '../../../../assets/icons/doubleTick.svg';

  const props = defineProps<{
    character: playerCharacter;
  }>();

  const skillRows = computed(() => {
    const pb = props.character.proficiencyModifier;
    return (Object.keys(SKILL_ABILITY) as (keyof PlayerSkills)[]).map(key => {
      const prof = props.character.skillProficiencies[key];
      const abilityKey = SKILL_ABILITY[key];
      const score = props.character.abilityScores[abilityKey];
      const base = abilityMod(score);
      const modifier = base + (prof.proficient ? pb : 0) + (prof.expertise ? pb : 0);
      return {
        key,
        name: SKILL_PRETTY[key],
        ability: abilityKey.toUpperCase(),
        proficient: prof.proficient,
        expertise: prof.expertise,
        modifier,
      };
    });
  });
</script>

<style scoped>
  .skills-bonus {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.875rem;
  }

  .skills-bonus thead th {
    text-align: left;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-muted);
    padding: 0.25rem 0.5rem 0.4rem;
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  }

  .skills-bonus tbody tr {
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
    transition: background 0.1s;
  }

  .skills-bonus tbody tr:hover {
    background: rgba(0, 0, 0, 0.03);
  }

  .skills-bonus tbody tr.row--proficient {
    background: rgba(107, 46, 46, 0.04);
  }

  .skills-bonus tbody tr.row--expertise {
    background: rgba(201, 164, 75, 0.08);
  }

  .skills-bonus td {
    padding: 0.3rem 0.5rem;
    vertical-align: middle;
  }

  .col-prof {
    width: 28px;
    text-align: center;
  }

  .col-ability {
    color: var(--color-muted);
    font-size: 0.78rem;
    font-variant-numeric: tabular-nums;
    width: 3rem;
  }

  .col-mod {
    font-weight: 700;
    text-align: right;
    width: 3.5rem;
    font-variant-numeric: tabular-nums;
  }

  .mod--pos {
    color: var(--color-primary);
  }

  .mod--neg {
    color: var(--color-muted);
  }

  .prof-icon {
    width: 14px;
    height: 14px;
    display: block;
    margin: 0 auto;
  }

  .prof-dot {
    display: block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    border: 1.5px solid var(--color-muted);
    margin: 0 auto;
    opacity: 0.35;
  }
</style>
