<template>
  <!-- Top buttons -->
  <div class="tab-row">
    <button :class="['tab-btn', { 'tab-btn--active': statsSelected }]" @click="selectStats">
      Stats
    </button>
    <button :class="['tab-btn', { 'tab-btn--active': fluffSelected }]" @click="selectFluff">
      Lore
    </button>
  </div>

  <!-- base stats -->
  <div v-if="statsSelected">
    <p>
      {{ monsterSize }} {{ monsterType }},
      {{ props.monster.alignment.map(getPrettyAlignment).join(' ') }}
    </p>
    <p>AC: {{ prettyAC }}</p>
    <p>HP: {{ prettyHP }}</p>
    <p>Speed: {{ getPrettySpeed(props.monster.speed) }}</p>
    <p>Initiative: {{ monsterInitiative }}</p>
    <p>{{ prettyCR }}</p>
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
            <td>{{ prettyAbilityScores.str }}</td>
            <td>{{ prettyAbilityScores.dex }}</td>
            <td>{{ prettyAbilityScores.con }}</td>
            <td>{{ prettyAbilityScores.int }}</td>
            <td>{{ prettyAbilityScores.wis }}</td>
            <td>{{ prettyAbilityScores.cha }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-if="monster.save">
      <p>
        Saves:
        {{
          Object.entries(monster.save)
            .map(([ability, value]) => `${capitalizeFirstLetter(ability)} ${value}`)
            .join(', ')
        }}
      </p>
    </div>
    <p>Skills: {{ prettySkills }}</p>
  </div>

  <!-- Fluff -->
  <div v-if="fluffSelected">
    <h2>{{ fluff?.name }}</h2>
    <div v-if="imageRef">
      <p>{{ imageRef }}</p>
      <img :src="imageRef" :alt="`Image of ${props.monster.name}`" class="monsterImg" />
    </div>
    <ResourceEntries :entries="fluff?.entries || []" />
  </div>
</template>

<script lang="ts" setup>
  import { ref, computed } from 'vue';
  import ResourceEntries from './ResourceEntries.vue';
  import type { Monster, MonsterFluff } from '../../types.ts';
  import {
    getPrettySize,
    getPrettyAlignment,
    getPrettySpeed,
    calculateAbilityScoreModifier,
    capitalizeFirstLetter,
  } from '../../helperFunctions.ts';
  import { CR_TO_XP } from '../../constants.ts';
  const props = defineProps<{
    monster: Monster;
    fluff?: MonsterFluff;
  }>();

  const statsSelected = ref(true);
  const fluffSelected = ref(false);

  const imageRef = computed(() => {
    if (!props.fluff?.images) return null;
    else {
      // Remove any file extension and replace with .webp
      let path = props.fluff.images[0]?.href.path || props.fluff.name;
      path = path.replace(/\.[^/.]+$/, '.webp');
      const encodedName = encodeURIComponent(path);
      return `https://5e.tools/img/${encodedName}`;
    }
  });

  const prettyAC = computed(() => {
    if (!Array.isArray(props.monster.ac)) {
      return 'N/A';
    }
    return props.monster.ac
      .map(ac => {
        if (typeof ac === 'number' || typeof ac === 'string') {
          return ac;
        } else {
          return `${ac.ac} (${ac.from.join(', ')})`;
        }
      })
      .join(' or ');
  });

  const prettyHP = computed(() => {
    if (typeof props.monster.hp === 'number') {
      return props.monster.hp;
    } else if (typeof props.monster.hp === 'object' && props.monster.hp !== null) {
      return `${props.monster.hp.average} (${props.monster.hp.formula})`;
    } else {
      return 'N/A';
    }
  });

  const prettyCR = computed(() => {
    if (typeof props.monster.cr === 'object') {
      return `CR ${props.monster.cr.cr}${
        props.monster.cr.coven ? ' coven: ' + props.monster.cr.coven : ''
      }${props.monster.cr.lair ? ' lair: ' + props.monster.cr.lair : ''}`;
    } else if (typeof props.monster.cr === 'undefined') {
      return 'N/A';
    } else {
      return `CR ${props.monster.cr} (${CR_TO_XP[props.monster.cr]} XP)`;
    }
  });

  const monsterInitiative = computed(() => {
    if (props.monster.dex) {
      return `+${Math.floor((props.monster.dex - 10) / 2)}`;
    } else {
      return 'N/A';
    }
  });

  function selectStats() {
    statsSelected.value = true;
    fluffSelected.value = false;
  }

  function selectFluff() {
    statsSelected.value = false;
    fluffSelected.value = true;
  }

  const monsterSize = computed(() => {
    if (Array.isArray(props.monster.size)) {
      return props.monster.size.map(getPrettySize).join(' or ');
    } else {
      return getPrettySize(props.monster.size);
    }
  });

  const monsterType = computed(() => {
    if (typeof props.monster.type === 'string') {
      return props.monster.type;
    } else {
      return `${props.monster.type.type} (${props.monster.type?.tags?.join(', ')})`;
    }
  });

  const prettyAbilityScores = computed(() => {
    return {
      str:
        props.monster.str !== undefined
          ? `${props.monster.str} (${
              calculateAbilityScoreModifier(props.monster.str, 0, false, false) >= 0 ? '+' : ''
            }${calculateAbilityScoreModifier(props.monster.str, 0, false, false)})`
          : 'N/A',
      dex:
        props.monster.dex !== undefined
          ? `${props.monster.dex} (${
              calculateAbilityScoreModifier(props.monster.dex, 0, false, false) >= 0 ? '+' : ''
            }${calculateAbilityScoreModifier(props.monster.dex, 0, false, false)})`
          : 'N/A',
      con:
        props.monster.con !== undefined
          ? `${props.monster.con} (${
              calculateAbilityScoreModifier(props.monster.con, 0, false, false) >= 0 ? '+' : ''
            }${calculateAbilityScoreModifier(props.monster.con, 0, false, false)})`
          : 'N/A',
      int:
        props.monster.int !== undefined
          ? `${props.monster.int} (${
              calculateAbilityScoreModifier(props.monster.int, 0, false, false) >= 0 ? '+' : ''
            }${calculateAbilityScoreModifier(props.monster.int, 0, false, false)})`
          : 'N/A',
      wis:
        props.monster.wis !== undefined
          ? `${props.monster.wis} (${
              calculateAbilityScoreModifier(props.monster.wis, 0, false, false) >= 0 ? '+' : ''
            }${calculateAbilityScoreModifier(props.monster.wis, 0, false, false)})`
          : 'N/A',
      cha:
        props.monster.cha !== undefined
          ? `${props.monster.cha} (${
              calculateAbilityScoreModifier(props.monster.cha, 0, false, false) >= 0 ? '+' : ''
            }${calculateAbilityScoreModifier(props.monster.cha, 0, false, false)})`
          : 'N/A',
    };
  });

  const prettySkills = computed(() => {
    if (!props.monster.skill) return 'N/A';
    return Object.entries(props.monster.skill)
      .map(([skill, value]) => `${capitalizeFirstLetter(skill)} ${value}`)
      .join(', ');
  });
</script>

<style lang="css" scoped>
  .monsterImg {
    max-width: 100%;
    height: auto;
    margin-top: 1em;
    border-radius: 8px;
  }

  .tab-row {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .tab-btn {
    flex: 1;
    padding: 0.5rem 0.75rem;
    min-height: 44px;
    border: 1px solid rgba(107, 46, 46, 0.25);
    border-radius: 8px;
    background: var(--color-bg);
    color: var(--color-text);
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.14s, border-color 0.14s, color 0.14s;
  }

  .tab-btn--active {
    background: var(--color-primary);
    color: white;
    border-color: var(--color-primary);
  }
</style>
