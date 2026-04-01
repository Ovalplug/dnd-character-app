<template>
  <h1>{{ props.character.name }}</h1>
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
    </tbody>
  </table>
</template>

<script lang="ts" setup>
  import type { playerCharacter } from '../../../types';

  const props = defineProps<{
    character: playerCharacter;
  }>();
</script>
