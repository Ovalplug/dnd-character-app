<template>
  <div class="stats-bar">
    <div class="icon-container" @click="openPopup('damage')">
      <img :src="heartImg" alt="Health Icon" class="icon" />
      <div class="hp-overlay" :class="{ 'hp-overlay--muted': props.character.tempHp > 0 }">
        <span>{{ props.character.currHp }}</span>
        <span>{{ props.character.maxHp }}</span>
      </div>
      <div v-if="props.character.tempHp > 0" class="temp-hp-badge">
        <img :src="shieldImg" alt="Temp HP" class="temp-hp-shield" />
        <span class="temp-hp-value">{{ props.character.tempHp }}</span>
      </div>
    </div>
    <div class="class-icons">
      <div
        v-for="cls in activeClasses"
        :key="cls.name"
        class="class-icon-wrapper"
        @click="openClassPopup(cls)"
      >
        <img
          :src="cls.icon"
          :alt="cls.name"
          class="class-icon"
          :style="{ width: classIconSize + 'px', height: classIconSize + 'px' }"
        />
        <span class="class-level">{{ cls.name }}:{{ cls.level }}</span>
      </div>
    </div>
    <div class="icon-container" @click="openPopup('ac')">
      <img :src="shieldImg" alt="Armor Icon" class="icon" />
      <span class="ac-overlay">{{ props.character.ac }}</span>
    </div>
  </div>
  <div>
    <PopOut v-if="popupOpen" :title="popupTitle" :mini="true" @close="closePopup">
      <TakeDamage v-if="popupType === 'damage'" :character="props.character" @close="closePopup" />
      <SingleClass
        v-if="popupType === 'class' && popupClass"
        :currClass="popupClass"
        :currSubclasses="popupSubclasses"
      />
      <UpdateAc v-if="popupType === 'ac'" :character="props.character" @close="closePopup" />
    </PopOut>
  </div>
</template>

<script lang="ts" setup>
  import PopOut from '../../../PopOut.vue';
  import TakeDamage from './TakeDamage.vue';
  import SingleClass from '../../../resources/SingleClass.vue';
  import UpdateAc from './UpdateAc.vue';

  import { computed, ref } from 'vue';
  import type { CharClass, Subclass, playerCharacter } from '../../../../types';
  import { useDataStore } from '../../../../stores/dataStore';

  import heartImg from '../../../../assets/icons/heart.svg';
  import shieldImg from '../../../../assets/icons/shield.svg';

  import artificerGear from '../../../../assets/icons/artificerGear.svg';
  import barbAxe from '../../../../assets/icons/barbAxe.svg';
  import bardLute from '../../../../assets/icons/bardLute.svg';
  import clericCross from '../../../../assets/icons/clericCross.svg';
  import druidLeaf from '../../../../assets/icons/druidLeaf.svg';
  import fighterSword from '../../../../assets/icons/sword.svg';
  import monkFist from '../../../../assets/icons/monkFist.svg';
  import rangerBow from '../../../../assets/icons/rangerBow.svg';
  import rogueKnife from '../../../../assets/icons/rogueKnife.svg';
  import sorcererMagic from '../../../../assets/icons/sorcererMagic.svg';
  import warlockEye from '../../../../assets/icons/warlockEye.svg';
  import wizardSpellbook from '../../../../assets/icons/wizardSpellbook.svg';

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

  const dataStore = useDataStore();

  const props = defineProps<{
    character: playerCharacter;
  }>();

  const popupOpen = ref(false);
  const popupType = ref('');
  const popupClass = ref<CharClass | null>(null);
  const popupSubclasses = ref<Subclass[] | null>(null);
  const popupAllowedTypes = ['damage', 'class', 'ac'];

  const popupTitle = computed(() => {
    if (popupType.value === 'class' && popupClass.value) {
      return popupClass.value.name;
    } else if (popupType.value === 'ac') {
      return 'Update AC';
    } else if (popupType.value === 'damage') {
      return `Damage ${props.character.name}`;
    }
    return '';
  });

  function openPopup(type: string) {
    if (!popupAllowedTypes.includes(type)) return;
    popupOpen.value = true;
    popupType.value = type;
  }

  function closePopup() {
    popupOpen.value = false;
    popupType.value = '';
    popupClass.value = null;
    popupSubclasses.value = null;
  }

  async function openClassPopup(cls: { name: string }) {
    if (!dataStore.loaded) {
      await dataStore.init();
    }
    const className = cls.name.charAt(0).toUpperCase() + cls.name.slice(1);
    popupClass.value =
      dataStore.classes.find(c => c.name.toLowerCase() === cls.name.toLowerCase()) ?? null;
    popupSubclasses.value = dataStore.subclasses[className] ?? null;
    openPopup('class');
  }

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
    transition: opacity 0.2s;
  }

  .hp-overlay--muted {
    opacity: 0.4;
  }

  .temp-hp-badge {
    position: absolute;
    bottom: 16px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
  }

  .temp-hp-shield {
    width: 28px;
    height: 28px;
    filter: invert(18%) sepia(95%) saturate(6000%) hue-rotate(355deg) brightness(85%) contrast(110%);
  }

  .temp-hp-value {
    position: absolute;
    font-weight: 700;
    font-size: 0.6rem;
    color: red;
    line-height: 1;
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
</style>
