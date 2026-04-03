<template>
  <div class="name-wrapper">
    <p class="charName" ref="nameEl">{{ props.character.name }}</p>
  </div>
  <div class="stats-bar">
    <div class="icon-container">
      <img :src="heartImg" alt="Health Icon" class="icon" />
      <div class="hp-overlay">
        <span>{{ props.character.currHp }}</span>
        <span>{{ props.character.maxHp }}</span>
      </div>
    </div>
    <div class="class-icons">
      <div v-for="cls in activeClasses" :key="cls.name" class="class-icon-wrapper">
        <img :src="cls.icon" :alt="cls.name" class="class-icon" :style="{ width: classIconSize + 'px', height: classIconSize + 'px' }" />
        <span class="class-level">{{ cls.level }}</span>
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

</template>

<script lang="ts" setup>
  import { computed, ref, onMounted, watch, nextTick } from 'vue';
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

  const classIconMap: Record<string, string> = {
    artificer: artificerGear,
    barbarian: barbAxe,
    bard: bardLute,
    cleric: clericCross,
    druid: druidLeaf,
    fighter: fighterSword,
    monk: monkFist,
    paladin: shieldImg,
    ranger: rangerBow,
    rogue: rogueKnife,
    sorcerer: sorcererMagic,
    warlock: warlockEye,
    wizard: wizardSpellbook,
  };

  const props = defineProps<{
    character: playerCharacter;
  }>();

  const nameEl = ref<HTMLElement | null>(null);

  function fitName() {
    const el = nameEl.value;
    if (!el) return;
    el.style.fontSize = '';
    while (el.scrollWidth > el.offsetWidth && parseFloat(getComputedStyle(el).fontSize) > 10) {
      el.style.fontSize = parseFloat(getComputedStyle(el).fontSize) - 1 + 'px';
    }
  }

  onMounted(() => nextTick(fitName));
  watch(() => props.character.name, () => nextTick(fitName));

  const activeClasses = computed(() => {
    if (!props.character.classLevels) return [];
    return Object.entries(props.character.classLevels)
      .filter(([, level]) => level > 0)
      .map(([name, level]) => ({ name, level, icon: classIconMap[name] }));
  });

  const classIconSize = computed(() => {
    const count = activeClasses.value.length;
    if (count <= 1) return 60;
    if (count <= 2) return 50;
    if (count <= 3) return 42;
    return 32;
  });

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

  .class-icons {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
    gap: 0.25rem;
    flex: 1;
    padding: 0 0.5rem;
  }

  .class-icon-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.1rem;
  }

  .class-icon {
    object-fit: contain;
  }

  .class-level {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--color-muted);
    line-height: 1;
  }

  .name-wrapper {
    overflow: hidden;
    padding: 0.5rem 1rem 0.25rem;
  }

  .charName {
    margin: 0;
    font-size: 1.9rem;
    font-weight: 700;
    white-space: nowrap;
    overflow: hidden;
    letter-spacing: 0.03em;
    text-transform: capitalize;
    color: var(--color-primary);
    text-shadow: 0 1px 0 rgba(201, 164, 75, 0.4);
    border-bottom: 2px solid var(--color-accent);
    padding-bottom: 0.2rem;
  }
</style>
