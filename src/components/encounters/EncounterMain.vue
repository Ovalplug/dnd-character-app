<template>
    <div class="encounterHeader">
        <button @click="resetEncounter">Reset Encounter</button>
    </div>
    <div class="encounterHolder">
        <div v-for="(participant, index) in encounterParticipants" :key="`participant-${index}`" :class="['participant', { 'active-participant': index === activeParticipantIndex }]">
            <div class="participantHp">{{ participant.currentHp }}</div>
            <SingleMonster :monster="participant" :hideFluff="true" />
        </div>

    </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import type { Monster, EncounterCreature } from '../../types';
import SingleMonster from '../resources/SingleMonster.vue';

const props = defineProps<{
    participants: Monster[];
}>();

const activeParticipantIndex = ref(0);
const encounterParticipants = ref<EncounterCreature[]>(props.participants.map(participant => ({
    ...participant,
    initiative: 0,
    currentHp: 0,
    maxHp: typeof participant.hp === 'number' ? participant.hp : participant.hp?.average || 0,
    conditions: [],
})));

function resetEncounter() {
    activeParticipantIndex.value = 0;
    encounterParticipants.value = props.participants.map(participant => ({
        ...participant,
        initiative: 0,
        currentHp: typeof participant.hp === 'number' ? participant.hp : participant.hp?.average || 0,
        maxHp: typeof participant.hp === 'number' ? participant.hp : participant.hp?.average || 0,
        conditions: [],
    }));
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

    /* Mobile */
    width: calc(100vw - 5rem);

    overflow-y: auto;
}

.active-participant {
    border: 2px solid var(--color-primary);
    background-color: var(--color-surface);
}

.participantHp {
    font-size: 1.5rem;
    font-weight: bold;
    text-align: center;
    padding: 0.5rem;
    border-bottom: 1px solid rgba(107, 46, 46, 0.12);
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