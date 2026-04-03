<template>
  <div>
    <h1>{{ props.character.name }}</h1>
  </div>
  <div class="stats-bar">
    <div class="icon-container">
      <img :src="heartImg" alt="Health Icon" class="icon" />
      <div class="hp-overlay">
        <span>{{ props.character.currHp }}</span>
        <span>{{ props.character.maxHp }}</span>
      </div>
    </div>
    <div class="icon-container">
      <img :src="shieldImg" alt="Armor Icon" class="icon" />
      <span class="ac-overlay">{{ props.character.ac }}</span>
    </div>
  </div>
  <div>
    <table class="abilityTable">
      <thead>
        <tr>
          <th>
            <img v-if="props.character.allProficiencies?.savingThrows?.str" :src="profStar" alt="Proficient" class="prof-star" />
            <p>STR</p>
          </th>
          <th>
            <img v-if="props.character.allProficiencies?.savingThrows?.dex" :src="profStar" alt="Proficient" class="prof-star" />
            <p>DEX</p>
          </th>
          <th>
            <img v-if="props.character.allProficiencies?.savingThrows?.con" :src="profStar" alt="Proficient" class="prof-star" />
            <p>CON</p>
          </th>
          <th>
            <img v-if="props.character.allProficiencies?.savingThrows?.int" :src="profStar" alt="Proficient" class="prof-star" />
            <p>INT</p>
          </th>
          <th>
            <img v-if="props.character.allProficiencies?.savingThrows?.wis" :src="profStar" alt="Proficient" class="prof-star" />
            <p>WIS</p>
          </th>
          <th>
            <img v-if="props.character.allProficiencies?.savingThrows?.cha" :src="profStar" alt="Proficient" class="prof-star" />
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
  <div>
    <img :src="artificerGear" alt="Class Icon" class="icon" />
    <img :src="barbAxe" alt="Class Icon" class="icon" />
    <img :src="bardLute" alt="Class Icon" class="icon" />
    <img :src="clericCross" alt="Class Icon" class="icon" />
    <img :src="druidLeaf" alt="Class Icon" class="icon" />
    <img :src="fighterSword" alt="Class Icon" class="icon" />
    <img :src="monkFist" alt="Class Icon" class="icon" />
    <img :src="rangerBow" alt="Class Icon" class="icon" />
    <img :src="rogueKnife" alt="Class Icon" class="icon" />
    <img :src="sorcererMagic" alt="Class Icon" class="icon" />
    <img :src="warlockEye" alt="Class Icon" class="icon" />
    <img :src="wizardSpellbook" alt="Class Icon" class="icon" />
    <img :src="paladinShield" alt="Class Icon" class="icon" />
  </div>
</template>

<script lang="ts" setup>
  import type { playerCharacter } from '../../../types';
  import { calculateAbilityScoreModifier } from '../../../helperFunctions';
  import heartImg from '../../../assets/icons/heart.svg';
  import shieldImg from '../../../assets/icons/shield.svg';
  import profStar from '../../../assets/icons/profStar.svg';

  // class icons
  import artificerGear from '../../../assets/icons/artificerGear.svg';
  import barbAxe from '../../../assets/icons/barbAxe.svg';
  import bardLute from '../../../assets/icons/bardLute.svg';
  import clericCross from '../../../assets/icons/clericCross.svg';
  import druidLeaf from '../../../assets/icons/druidLeaf.svg';
  import fighterSword from '../../../assets/icons/sword.svg';
  import monkFist from '../../../assets/icons/monkFist.svg';
  import rangerBow from '../../../assets/icons/rangerBow.svg';
  import rogueKnife from '../../../assets/icons/rogueKnife.svg';
  import sorcererMagic from '../../../assets/icons/sorcererMagic.svg';
  import warlockEye from '../../../assets/icons/warlockEye.svg';
  import wizardSpellbook from '../../../assets/icons/wizardSpellbook.svg';
  const paladinShield = shieldImg;

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

<style scoped>
  .stats-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem;
  }

  .icon-container {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .icon {
    width: 80px;
    height: 80px;
  }

  .hp-overlay {
    position: absolute;
    display: flex;
    justify-content: space-between;
    width: 60%;
    top: 50%;
    transform: translateY(-50%);
    font-weight: bold;
    font-size: 0.85rem;
    pointer-events: none;
  }

  .ac-overlay {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-weight: bold;
    font-size: 0.9rem;
    pointer-events: none;
  }

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
