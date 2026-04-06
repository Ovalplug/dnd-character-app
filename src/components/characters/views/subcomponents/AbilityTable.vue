<template>
  <div>
    <table class="abilityTable">
      <thead>
        <tr>
          <th>
            <img
              v-if="props.character.allProficiencies?.savingThrows?.str"
              :src="profStar"
              alt="Proficient"
              class="prof-star"
            />
            <p>STR</p>
          </th>
          <th>
            <img
              v-if="props.character.allProficiencies?.savingThrows?.dex"
              :src="profStar"
              alt="Proficient"
              class="prof-star"
            />
            <p>DEX</p>
          </th>
          <th>
            <img
              v-if="props.character.allProficiencies?.savingThrows?.con"
              :src="profStar"
              alt="Proficient"
              class="prof-star"
            />
            <p>CON</p>
          </th>
          <th>
            <img
              v-if="props.character.allProficiencies?.savingThrows?.int"
              :src="profStar"
              alt="Proficient"
              class="prof-star"
            />
            <p>INT</p>
          </th>
          <th>
            <img
              v-if="props.character.allProficiencies?.savingThrows?.wis"
              :src="profStar"
              alt="Proficient"
              class="prof-star"
            />
            <p>WIS</p>
          </th>
          <th>
            <img
              v-if="props.character.allProficiencies?.savingThrows?.cha"
              :src="profStar"
              alt="Proficient"
              class="prof-star"
            />
            <p>CHA</p>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>{{ props.character.abilityScores.str }}</td>
          <td>{{ props.character.abilityScores.dex }}</td>
          <td>{{ props.character.abilityScores.con }}</td>
          <td>{{ props.character.abilityScores.int }}</td>
          <td>{{ props.character.abilityScores.wis }}</td>
          <td>{{ props.character.abilityScores.cha }}</td>
        </tr>
        <tr>
          <td>{{ formatModifier('str') }}</td>
          <td>{{ formatModifier('dex') }}</td>
          <td>{{ formatModifier('con') }}</td>
          <td>{{ formatModifier('int') }}</td>
          <td>{{ formatModifier('wis') }}</td>
          <td>{{ formatModifier('cha') }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script lang="ts" setup>
  import type { playerCharacter } from '../../../../types';
  import { calculateAbilityScoreModifier } from '../../../../helperFunctions';
  import profStar from '../../../../assets/icons/profStar.svg';

  const props = defineProps<{
    character: playerCharacter;
  }>();

  function formatModifier(ability: string) {
    const modifier = calculateAbilityScoreModifier(
      props.character.abilityScores[ability as keyof typeof props.character.abilityScores],
      props.character.proficiencyModifier,
      props.character.allProficiencies?.savingThrows?.[
        ability as keyof typeof props.character.allProficiencies.savingThrows
      ] ?? false,
      false
    );
    return modifier >= 0 ? `+${modifier}` : `${modifier}`;
  }
</script>

<style scoped>
  .abilityTable {
    width: 100%;
    border-collapse: collapse;
    margin-top: 1rem;
    table-layout: fixed;
    background: var(--color-surface);
    border-radius: var(--radius);
    overflow: hidden;
    box-shadow: var(--color-card-shadow);
  }

  .abilityTable th,
  .abilityTable td {
    padding: 0.6rem 0.75rem;
    text-align: center;
    border-bottom: 1px solid rgba(31, 27, 22, 0.1);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    position: relative;
  }

  .abilityTable th {
    font-weight: 600;
    font-size: 0.85rem;
    color: var(--color-muted);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    background: rgba(31, 27, 22, 0.04);
  }

  .abilityTable tbody tr:last-child td {
    border-bottom: none;
  }

  .abilityTable tbody tr:hover {
    background: rgba(201, 164, 75, 0.08);
  }

  .prof-star {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: contain;
    opacity: 0.2;
    pointer-events: none;
  }
</style>
