<template>
  <div>
    <h1>{{ props.character.name }}</h1>
  </div>
  <div>
    <table>
      <thead>
        <tr>
          <th>STR</th>
        <th>DEX</th>
        <th>CON</th>
        <th>INT</th>
        <th>WIS</th>
        <th>CHA</th>
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
<div>
  <img :src="heartImg" alt="Health Icon" class="icon" />
  <span>{{ props.character.currHp }} / {{ props.character.maxHp }}</span>
  <img :src="shieldImg" alt="Armor Icon" class="icon" />
  <span>{{ props.character.ac }}</span>
</div>
</template>

<script lang="ts" setup>
  import type { playerCharacter } from '../../../types';
  import { calculateAbilityScoreModifier } from '../../../helperFunctions';
  import heartImg from '../../../assets/icons/heart.svg';
  import shieldImg from '../../../assets/icons/shield.svg';

  function formatModifier(ability: string) {
    const modifier = calculateAbilityScoreModifier(
      props.character.abilityScores[ability as keyof typeof props.character.abilityScores],
      props.character.proficiencyModifier,
      props.character.allProficiencies?.savingThrows?.[
        ability as keyof typeof props.character.allProficiencies.savingThrows
      ] ?? false,
      props.character.allProficiencies?.savingThrows?.[
        ability as keyof typeof props.character.allProficiencies.savingThrows
      ] ?? false
    );
    return modifier >= 0 ? `+${modifier}` : `${modifier}`;
  }

  const props = defineProps<{
    character: playerCharacter;
  }>();
</script>
