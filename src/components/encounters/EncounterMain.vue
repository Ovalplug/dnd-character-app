<template>
  <div class="encounterHeader">
    <button @click="resetEncounter">Reset Encounter</button>
    <button @click="damageParticipant(activeParticipantIndex, 5)">
      Damage Active Participant (5)
    </button>
  </div>

  <div class="encounterHolder">
    <div
      v-for="(participant, index) in encounterParticipants"
      :key="`participant-${index}`"
      :class="['participant', { 'active-participant': index === activeParticipantIndex }]"
    >
      <div class="participantHp">
        <div
          class="participantHpBar"
          :style="{
            width: `${getHpPercentage(participant)}%`,
            backgroundColor: getHpColor(participant),
          }"
        />

        <div class="participantHpText">{{ participant.currentHp }} / {{ participant.maxHp }}</div>
      </div>

      <SingleMonster :monster="participant" :hideFluff="true" :spells="spells" />
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { ref } from 'vue';
  import type { Monster, EncounterCreature, Spells } from '../../types';
  import SingleMonster from '../resources/SingleMonster.vue';

  import { diceRoll } from '../../helperFunctions.ts';

  const props = defineProps<{
    participants: Monster[];
    spells: Spells;
  }>();

  const activeParticipantIndex = ref(0);

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
        };
      })
      .sort((a, b) => b.initiative - a.initiative)
  );

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
        };
      })
      .sort((a, b) => b.initiative - a.initiative);
  }

  function getHpPercentage(participant: EncounterCreature): number {
    if (!participant.maxHp) return 0;

    return Math.max(0, Math.min(100, (participant.currentHp / participant.maxHp) * 100));
  }

  function getHpColor(participant: EncounterCreature): string {
    const percentage = getHpPercentage(participant);

    if (percentage > 50) return '#4caf50';
    if (percentage > 25) return '#ff9800';
    return '#f44336';
  }

  function damageParticipant(index: number, damage: number) {
    const participant = encounterParticipants.value[index];
    if (!participant) return;

    participant.currentHp = Math.max(0, participant.currentHp - damage);
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
</style>
