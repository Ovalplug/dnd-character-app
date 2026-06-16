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
  <div v-if="statsSelected" class="stats-container">
    <div class="stat-row stat-row--header">
      <p>
        {{ monsterSize }} {{ monsterType }},
        {{ props.monster.alignment.map(getPrettyAlignment).join(' ') }}
      </p>
    </div>

    <div class="stat-row">
      <p><strong>AC:</strong> {{ prettyAC }}</p>
      <p><strong>HP:</strong> {{ prettyHP }}</p>
      <p><strong>Speed:</strong> {{ getPrettySpeed(props.monster.speed) }}</p>
      <p><strong>Initiative:</strong> {{ monsterInitiative }}</p>
      <p>
        <strong>{{ prettyCR }}</strong>
      </p>
    </div>

    <div class="ability-scores-table">
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

    <div v-if="monster.save" class="saves-section">
      <p>
        <strong>Saves:</strong>
        {{
          Object.entries(monster.save)
            .map(([ability, value]) => `${capitalizeFirstLetter(ability)} ${value}`)
            .join(', ')
        }}
      </p>
    </div>

    <div v-if="monster.skill" class="skills-section">
      <p><strong>Skills:</strong> {{ prettySkills }}</p>
    </div>

    <div class="senses-section">
      <p><strong>Senses:</strong> {{ prettySenses }}</p>
    </div>

    <div v-if="props.monster.languages" class="stat-row">
      <p><strong>Languages:</strong> {{ props.monster.languages.join(', ') }}</p>
    </div>

    <div v-if="prettyResist !== 'N/A'" class="stat-row">
      <p style="margin-bottom: 0.5rem"><strong>Damage Resistances:</strong></p>
      <p>{{ prettyResist }}</p>
    </div>

    <div v-if="prettyImmune !== 'N/A'" class="stat-row">
      <p style="margin-bottom: 0.5rem"><strong>Damage Immunities:</strong></p>
      <p>{{ prettyImmune }}</p>
    </div>

    <div v-if="prettyVulnerable !== 'N/A'" class="stat-row">
      <p style="margin-bottom: 0.5rem"><strong>Damage Vulnerabilities:</strong></p>
      <p>{{ prettyVulnerable }}</p>
    </div>

    <div v-if="props.monster.trait && props.monster.trait.length">
      <h2 class="section-title">Traits</h2>
      <div class="section-content">
        <ResourceEntries :entries="props.monster.trait" />
      </div>
    </div>

    <div v-if="props.monster.action && props.monster.action.length">
      <h2 class="section-title">Actions</h2>
      <div class="section-content">
        <ResourceEntries :entries="props.monster.action" />
      </div>
    </div>

    <div v-if="props.monster.reaction && props.monster.reaction.length">
      <h2 class="section-title">Reactions</h2>
      <div class="section-content">
        <ResourceEntries :entries="props.monster.reaction" />
      </div>
    </div>

    <div v-if="props.monster.legendary && props.monster.legendary.length">
      <h2 class="section-title">Legendary Actions</h2>
      <div class="section-content">
        <ResourceEntries :entries="props.monster.legendary" />
      </div>
    </div>

    <div v-if="props.monster.mythic && props.monster.mythic.length">
      <h2 class="section-title">Mythic Actions</h2>
      <div class="section-content">
        <ResourceEntries :entries="props.monster.mythicHeader || []" />
        <ResourceEntries :entries="props.monster.mythic" />
      </div>
    </div>
  </div>

  <!-- Fluff -->
  <div v-if="fluffSelected" class="fluff-content">
    <h2 class="fluff-title">{{ fluff?.name }}</h2>
    <div v-if="imageRef">
      <img :src="imageRef" :alt="`Image of ${props.monster.name}`" class="monsterImg" />
    </div>
    <div class="section-content">
      <ResourceEntries :entries="fluff?.entries || []" />
    </div>
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
    getPrettyMonsterType,
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

  const prettySenses = computed(() => {
    if (!props.monster.senses) return `Passive Perception ${props.monster.passive}`;
    return `Passive Perception ${props.monster.passive}, ${capitalizeFirstLetter(
      props.monster.senses?.join(', ')
    )}`;
  });
  const prettyAC = computed(() => {
    if (!Array.isArray(props.monster.ac)) {
      return 'N/A';
    }
    return props.monster.ac
      .map(ac => {
        if (typeof ac === 'number' || typeof ac === 'string') {
          return ac;
        } else if (ac.special) {
          return ac.special;
        } else {
          return `${ac.ac} (${ac.from?.join(', ')})`;
        }
      })
      .join(' or ');
  });

  const prettyHP = computed(() => {
    if (typeof props.monster.hp === 'number') {
      return props.monster.hp;
    } else if (typeof props.monster.hp === 'object' && props.monster.hp !== null) {
      if (props.monster.hp.special) {
        return props.monster.hp.special;
      }
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
    return getPrettyMonsterType(props.monster.type);
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

  const formatDamageVulnerabilities = (vulnerabilities: any[] | undefined): string => {
    if (!vulnerabilities) return 'N/A';
    return vulnerabilities
      .map(item => {
        if (typeof item === 'string') {
          return item;
        } else if (typeof item === 'object' && item !== null) {
          if (item.immune) {
            return `${item.immune.join(', ')} (${item.note})`;
          } else if (item.resist) {
            return `${item.resist.join(', ')} (${item.note})`;
          } else if (item.vulnerable) {
            return `${item.vulnerable.join(', ')} (${item.note})`;
          } else if (item.conditionImmune) {
            return `${item.conditionImmune.join(', ')} (${item.note})`;
          }
        }
        return '';
      })
      .filter(Boolean)
      .join(', ');
  };

  const prettyResist = computed(() => formatDamageVulnerabilities(props.monster.resist));
  const prettyImmune = computed(() => formatDamageVulnerabilities(props.monster.immune));
  const prettyVulnerable = computed(() => formatDamageVulnerabilities(props.monster.vulnerable));
</script>

<style lang="css" scoped>
  /* Mobile-first layout */
  .stats-container {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .stat-row {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    padding: 0.75rem;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.55);
    border: 1px solid rgba(107, 46, 46, 0.1);
  }

  .stat-row p {
    margin: 0;
    font-size: 0.95rem;
    line-height: 1.4;
  }

  .stat-row--header {
    background: rgba(107, 46, 46, 0.05);
    border-color: rgba(107, 46, 46, 0.15);
    font-weight: 600;
    color: var(--color-primary);
  }

  .ability-scores-table {
    width: 100%;
    border-collapse: collapse;
    border-radius: 10px;
    overflow: hidden;
    border: 1px solid rgba(107, 46, 46, 0.12);
    background: rgba(255, 255, 255, 0.72);
    margin: 0.5rem 0;
  }

  .ability-scores-table thead {
    background: linear-gradient(135deg, rgba(107, 46, 46, 0.08), rgba(107, 46, 46, 0.05));
  }

  .ability-scores-table th {
    padding: 0.6rem 0.5rem;
    text-align: center;
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--color-primary);
    border-right: 1px solid rgba(107, 46, 46, 0.08);
  }

  .ability-scores-table th:last-child {
    border-right: none;
  }

  .ability-scores-table td {
    padding: 0.7rem 0.5rem;
    text-align: center;
    font-weight: 600;
    border-right: 1px solid rgba(107, 46, 46, 0.08);
    font-size: 0.9rem;
  }

  .ability-scores-table td:last-child {
    border-right: none;
  }

  .saves-section,
  .skills-section,
  .senses-section {
    padding: 0.75rem;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.55);
    border: 1px solid rgba(107, 46, 46, 0.1);
  }

  .saves-section p,
  .skills-section p,
  .senses-section p {
    margin: 0;
    font-size: 0.95rem;
    line-height: 1.5;
    word-break: break-word;
  }

  .resistances-grid {
    display: grid;
    gap: 0.75rem;
    margin: 0.5rem 0;
  }

  .resistance-item {
    padding: 0.65rem 0.75rem;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.55);
    border: 1px solid rgba(107, 46, 46, 0.1);
    font-size: 0.9rem;
  }

  .section-title {
    margin: 1.25rem 0 0.75rem 0;
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--color-primary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    border-bottom: 2px solid rgba(107, 46, 46, 0.15);
    padding-bottom: 0.5rem;
  }

  .section-content {
    padding: 0.75rem;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.55);
    border: 1px solid rgba(107, 46, 46, 0.1);
  }

  .fluff-content {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .fluff-title {
    margin: 0 0 0.5rem 0;
    font-size: 1.3rem;
    font-weight: 700;
    color: var(--color-primary);
  }

  .monsterImg {
    max-width: 100%;
    height: auto;
    margin: 0.5rem 0;
    border-radius: 10px;
    border: 1px solid rgba(107, 46, 46, 0.1);
    box-shadow: 0 4px 12px rgba(31, 27, 22, 0.08);
  }

  .tab-row {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .tab-btn {
    flex: 1;
    padding: 0.6rem 0.75rem;
    min-height: 44px;
    border: 1px solid rgba(107, 46, 46, 0.25);
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.55);
    color: var(--color-primary);
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .tab-btn:active {
    transform: scale(0.98);
  }

  .tab-btn--active {
    background: linear-gradient(90deg, var(--color-primary), var(--color-primary-600));
    color: white;
    border-color: var(--color-primary);
    box-shadow: 0 4px 12px rgba(107, 46, 46, 0.15);
  }

  /* Tablet breakpoint */
  @media (min-width: 600px) {
    .stats-container {
      gap: 1.25rem;
    }

    .ability-scores-table {
      margin: 1rem 0;
    }

    .resistances-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.75rem;
    }

    .section-title {
      margin: 1.5rem 0 1rem 0;
      font-size: 1.2rem;
    }
  }

  /* Desktop breakpoint */
  @media (min-width: 900px) {
    .stats-container {
      gap: 1.5rem;
      padding: 0;
    }

    .resistances-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
    }

    .section-content {
      padding: 1rem;
    }

    .tab-btn {
      padding: 0.7rem 1rem;
      font-size: 0.95rem;
    }
  }
</style>
