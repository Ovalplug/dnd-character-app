<template>
  <div class="encounterHeader">
    <button @click="resetEncounter">Reset Encounter</button>
    <p>Current Initiative: {{ encounterParticipants[activeParticipantIndex]?.initiative }}</p>
    <p>Current Round: {{ combatRound }}</p>
    <button @click="nextInitiative">Next</button>
  </div>

  <div class="encounterHolder">
    <div
      v-for="(participant, index) in encounterParticipants"
      :key="`participant-${index}`"
      :class="['participant', { 'active-participant': index === activeParticipantIndex }]"
      :ref="el => participantRefs[index] = el as HTMLElement"
    >
      <div class="participantHp" @click="openMenu(index)">
        <div
          class="participantHpBar"
          :style="{
            width: `${getHpPercentage(participant)}%`,
            backgroundColor: getHpColor(participant),
          }"
        />

        <div class="participantHpText" v-if="!participant.tempHp || participant.tempHp <= 0">
          {{ participant.currentHp }} / {{ participant.maxHp }}
        </div>
        <div class="participantHpText" v-if="participant.tempHp > 0">{{ participant.tempHp }}</div>
      </div>
      <h2>
        {{ participant.name }} - <span class="p2">Initiative: {{ participant.initiative }}</span>
      </h2>
      <SingleMonster :monster="participant" :hideFluff="true" :spells="spells" />
    </div>
  </div>

  <PopOut
    v-if="menuOpen && menuIndex !== null"
    :index="menuIndex"
    :mini="true"
    :title="encounterParticipants[menuIndex]?.name"
    @close="closeMenu"
  >
    <div class="take-damage">
      <div class="value-row">
        <button class="stepper-btn" @click="damageDown" aria-label="Decrease">
          <img :src="downArrow" alt="−" class="stepper-icon" />
        </button>
        <input type="number" v-model.number="damageVal" class="value-input" min="0" />
        <button class="stepper-btn" @click="damageUp" aria-label="Increase">
          <img :src="upArrow" alt="+" class="stepper-icon" />
        </button>
      </div>
      <div class="action-row">
        <button class="action-btn damage-btn" @click="damageParticipant(menuIndex, damageVal)">
          <span class="action-label">⚔</span>
          <span>Damage</span>
        </button>
        <button class="action-btn heal-btn" @click="healParticipant(menuIndex, damageVal)">
          <span class="action-label">♥</span>
          <span>Heal</span>
        </button>
        <button class="action-btn temp-btn" @click="applyTempHp(menuIndex, damageVal)">
          <span class="action-label">🛡</span>
          <span>Temp HP</span>
        </button>
      </div>
    </div>
  </PopOut>
</template>

<script lang="ts" setup>
  import { ref, nextTick } from 'vue';
  import type { Monster, EncounterCreature, Spells } from '../../types';
  import SingleMonster from '../resources/SingleMonster.vue';

  import { diceRoll } from '../../helperFunctions.ts';
  import PopOut from '../PopOut.vue';

  import downArrow from '../../assets/icons/down-arrow.svg';
  import upArrow from '../../assets/icons/up-arrow.svg';

  const props = defineProps<{
    participants: Monster[];
    spells: Spells;
  }>();

  const activeParticipantIndex = ref(0);
  const damageVal = ref(0);
  const combatRound = ref(1);

  const participantRefs = ref<HTMLElement[]>([]);

  function damageUp() {
    damageVal.value++;
  }
  function damageDown() {
    damageVal.value = Math.max(0, damageVal.value - 1);
  }

  const encounterParticipants = ref<EncounterCreature[]>(
    props.participants
      .map(participant => {
        const hp =
          typeof participant.hp === 'number' ? participant.hp : participant.hp?.average || 0;

        return {
          ...participant,
          initiative: diceRoll([{ dType: 'd20', count: 1 }]),
          currentHp: hp,
          maxHp: hp,
          conditions: [],
          tempHp: 0,
        };
      })
      .sort((a, b) => b.initiative - a.initiative)
  );

  const menuOpen = ref<boolean>(false);
  const menuIndex = ref<number | null>(null);

  function openMenu(index: number) {
    menuIndex.value = index;
    menuOpen.value = true;
  }
  function closeMenu() {
    menuOpen.value = false;
  }

  function resetEncounter() {
    activeParticipantIndex.value = 0;

    encounterParticipants.value = props.participants
      .map(participant => {
        const hp =
          typeof participant.hp === 'number' ? participant.hp : participant.hp?.average || 0;

        return {
          ...participant,
          initiative: diceRoll([{ dType: 'd20', count: 1 }]),
          currentHp: hp,
          maxHp: hp,
          conditions: [],
          tempHp: 0,
        };
      })
      .sort((a, b) => b.initiative - a.initiative);

    nextTick(() => {
      scrollToActiveParticipant();
    });
  }

  function getHpPercentage(participant: EncounterCreature): number {
    if (!participant.maxHp) return 0;
    if (participant.tempHp > 0) return 100;

    return Math.max(0, Math.min(100, (participant.currentHp / participant.maxHp) * 100));
  }

  function getHpColor(participant: EncounterCreature): string {
    const percentage = getHpPercentage(participant);
    if (participant.tempHp > 0) return '#2196f3';
    if (percentage > 50) return '#4caf50';
    if (percentage > 25) return '#ff9800';
    return '#f44336';
  }

  function damageParticipant(index: number, damage: number) {
    const participant = encounterParticipants.value[index];
    if (!participant) return;

    const effectiveDamage = Math.max(0, damage - participant.tempHp);
    participant.tempHp = Math.max(0, participant.tempHp - damage);
    participant.currentHp = Math.max(0, participant.currentHp - effectiveDamage);
  }

  function healParticipant(index: number, heal: number) {
    const participant = encounterParticipants.value[index];
    if (!participant) return;

    participant.currentHp = Math.min(participant.maxHp, participant.currentHp + heal);
  }

  function applyTempHp(index: number, tempHp: number) {
    const participant = encounterParticipants.value[index];
    if (!participant) return;

    participant.tempHp = Math.max(0, tempHp);
  }

  function nextInitiative() {
    activeParticipantIndex.value =
      (activeParticipantIndex.value + 1) % encounterParticipants.value.length;
    if (activeParticipantIndex.value === 0) {
      combatRound.value++;
    }
    scrollToActiveParticipant();
  }

  async function scrollToActiveParticipant() {
    await nextTick();

    const activeEl = participantRefs.value[activeParticipantIndex.value];

    if (!activeEl) return;

    activeEl.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center',
    });
  }
</script>

<style scoped>
  .encounterHeader {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border: 1px solid rgba(107, 46, 46, 0.12);
    height: 10%;
  }

  .encounterHolder {
    display: flex;
    flex-direction: row;
    gap: 0.5rem;

    width: 100%;
    height: 90%;

    overflow-x: auto;
    overflow-y: hidden;

    padding: 0.5rem;
    box-sizing: border-box;

    scroll-snap-type: x mandatory;
  }

  .participant {
    flex-shrink: 0;

    display: flex;
    flex-direction: column;

    border: 1px solid rgba(107, 46, 46, 0.12);

    height: 100%;

    scroll-snap-align: start;

    width: calc(100vw - 5rem);

    overflow-y: auto;
  }

  .active-participant {
    border: 2px solid var(--color-primary);
    background-color: var(--color-surface);
  }

  .participantHp {
    position: relative;

    height: 3rem;
    min-height: 3rem;

    border-bottom: 1px solid rgba(107, 46, 46, 0.12);
    background-color: #2b2b2b;

    overflow: hidden;
  }

  .participantHpBar {
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;

    transition: width 0.3s ease, background-color 0.3s ease;
  }

  .participantHpText {
    position: relative;
    z-index: 1;

    display: flex;
    align-items: center;
    justify-content: center;

    width: 100%;
    height: 100%;

    font-size: 1.25rem;
    font-weight: bold;
    color: white;

    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
  }

  /* Tablet */
  @media (min-width: 768px) {
    .participant {
      width: 350px;
    }
  }

  /* Desktop */
  @media (min-width: 1200px) {
    .participant {
      width: 400px;
    }
  }
  /* ------------------ */
  /* damage section */
  .take-damage {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.25rem;
    padding: 0.5rem 0.25rem;
  }

  /* ── Value stepper ── */
  .value-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .stepper-btn {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    border: 2px solid var(--color-accent);
    background: var(--color-surface);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.15s, transform 0.1s;
    flex-shrink: 0;
  }

  .stepper-btn:active {
    background: var(--color-accent);
    transform: scale(0.93);
  }

  .stepper-icon {
    width: 20px;
    height: 20px;
  }

  .value-input {
    width: 80px;
    text-align: center;
    font-size: 2rem;
    font-weight: 700;
    color: var(--color-text);
    background: var(--color-surface);
    border: 2px solid rgba(31, 27, 22, 0.15);
    border-radius: 10px;
    padding: 0.3rem 0.4rem;
    /* hide browser spinners */
    appearance: textfield;
    -moz-appearance: textfield;
  }
  .value-input::-webkit-outer-spin-button,
  .value-input::-webkit-inner-spin-button {
    -webkit-appearance: none;
  }
  .value-input:focus {
    outline: none;
    border-color: var(--color-accent);
    box-shadow: 0 0 0 3px rgba(201, 164, 75, 0.2);
  }

  /* ── Action buttons ── */
  .action-row {
    display: flex;
    gap: 0.6rem;
    width: 100%;
  }

  .action-btn {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.2rem;
    padding: 0.65rem 0.4rem;
    border-radius: 10px;
    border: none;
    font-weight: 700;
    font-size: 0.8rem;
    cursor: pointer;
    transition: filter 0.15s, transform 0.1s;
    letter-spacing: 0.02em;
  }

  .action-btn:active {
    filter: brightness(0.88);
    transform: scale(0.97);
  }

  .action-label {
    font-size: 1.3rem;
    line-height: 1;
  }

  .damage-btn {
    background: var(--color-danger);
    color: #fff;
  }

  .heal-btn {
    background: #3a7a4b;
    color: #fff;
  }

  .temp-btn {
    background: var(--color-accent);
    color: #1f1b16;
  }
</style>
