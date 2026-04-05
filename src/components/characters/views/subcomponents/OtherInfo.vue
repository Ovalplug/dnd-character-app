<template>
  <div class="other-info">
    <!-- Stat pills row -->
    <div class="stat-pills">
      <div class="stat-pill stat-pill--clickable" @click="speedPopupOpen = true">
        <span class="stat-label">Speed</span>
        <div class="speed-values">
          <span class="stat-value" v-for="([label, value], i) in speedEntries" :key="label">
            <span v-if="i > 0" class="speed-sep">·</span>
            {{
              speedEntries.length > 1 && label === 'Speed' ? 'Walk' : label !== 'Speed' ? label : ''
            }}
            {{ value }}ft
          </span>
        </div>
      </div>
      <div class="stat-pill">
        <span class="stat-label">Initiative</span>
        <span class="stat-value"
          >{{ props.character.initiativeBonus >= 0 ? '+' : ''
          }}{{ props.character.initiativeBonus }}</span
        >
      </div>
      <div class="stat-pill">
        <span class="stat-label">Prof. Bonus</span>
        <span class="stat-value">+{{ props.character.proficiencyModifier }}</span>
      </div>
      <div class="stat-pill">
        <span class="stat-label">Passive Perc.</span>
        <span class="stat-value">
          {{
            props.character.passivePerception !== undefined
              ? (props.character.passivePerception >= 0 ? '+' : '') +
                props.character.passivePerception
              : 'N/A'
          }}
        </span>
      </div>
      <div
        class="stat-pill stat-pill--clickable"
        @click="toggleInspiration"
        :class="{ 'stat-pill--active': props.character.inspiration }"
      >
        <span class="stat-label">Inspiration</span>
        <img
          v-if="props.character.inspiration"
          :src="blankd20"
          alt="Inspired"
          class="inspiration-icon"
        />
        <span v-else class="stat-value">—</span>
      </div>
    </div>

    <PopOut v-if="speedPopupOpen" title="Update Speed" :mini="true" @close="speedPopupOpen = false">
      <UpdateSpeed :character="props.character" @close="speedPopupOpen = false" />
    </PopOut>

    <!-- Death Saves -->
    <div class="death-saves">
      <span class="death-saves-label">Death Saves</span>
      <div class="death-saves-rows">
        <div class="death-saves-row">
          <span class="ds-type ds-type--success">Successes</span>
          <div class="ds-pips">
            <button
              v-for="n in 3"
              :key="`s${n}`"
              class="pip pip--success"
              :class="{ 'pip--filled': n <= successes }"
              @click="toggleSuccess(n)"
              :aria-label="`Success ${n}`"
            />
          </div>
        </div>
        <div class="death-saves-row">
          <span class="ds-type ds-type--failure">Failures</span>
          <div class="ds-pips">
            <button
              v-for="n in 3"
              :key="`f${n}`"
              class="pip pip--failure"
              :class="{ 'pip--filled': n <= failures }"
              @click="toggleFailure(n)"
              :aria-label="`Failure ${n}`"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { computed, ref } from 'vue';
  import type { playerCharacter } from '../../../../types';
  import blankd20 from '../../../../assets/icons/blankd20.svg';
  import { useCharacterStore } from '../../../../stores/characterStore';
  import PopOut from '../../../PopOut.vue';
  import UpdateSpeed from './UpdateSpeed.vue';

  const characterStore = useCharacterStore();

  const props = defineProps<{
    character: playerCharacter;
  }>();

  const speedPopupOpen = ref(false);

  const successes = computed(() => props.character.deathSaves?.successes ?? 0);
  const failures = computed(() => props.character.deathSaves?.failures ?? 0);

  const speedEntries = computed(() => {
    const s = props.character.speed;
    return (
      [
        ['Speed', s.base],
        ['Fly', s.fly ?? 0],
        ['Swim', s.swim ?? 0],
        ['Climb', s.climb ?? 0],
        ['Burrow', s.burrow ?? 0],
      ] as [string, number][]
    ).filter(([, v]) => v > 0);
  });

  function toggleInspiration() {
    characterStore.toggleInspiration(props.character.id);
  }

  function toggleSuccess(n: number) {
    const newVal = successes.value === n ? n - 1 : n;
    characterStore.updateDeathSaves(props.character.id, newVal, failures.value);
  }

  function toggleFailure(n: number) {
    const newVal = failures.value === n ? n - 1 : n;
    characterStore.updateDeathSaves(props.character.id, successes.value, newVal);
  }
</script>

<style scoped>
  .other-info {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 0.25rem 0;
  }

  /* Stat pills */
  .stat-pills {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }

  .stat-pill {
    display: flex;
    flex-direction: column;
    align-items: center;
    background: var(--color-surface);
    border: 1px solid rgba(0, 0, 0, 0.08);
    border-radius: 10px;
    padding: 0.3rem 0.6rem;
    min-width: 60px;
  }

  .stat-pill--clickable {
    cursor: pointer;
    transition: background 0.15s;
  }

  .stat-pill--clickable:hover {
    background: rgba(201, 164, 75, 0.15);
  }

  .stat-pill--active {
    border-color: var(--color-accent);
    background: rgba(201, 164, 75, 0.12);
  }

  .stat-label {
    font-size: 0.6rem;
    font-weight: 600;
    color: var(--color-muted);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    white-space: nowrap;
  }

  .stat-value {
    font-size: 0.95rem;
    font-weight: 700;
    color: var(--color-text);
  }

  .speed-values {
    display: flex;
    flex-direction: row;
    gap: 0.3rem;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
  }

  .speed-sep {
    color: var(--color-muted);
    font-weight: 400;
    margin-right: 0.3rem;
  }

  .inspiration-icon {
    width: 22px;
    height: 22px;
    margin-top: 2px;
  }

  /* Death saves */
  .death-saves {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    background: var(--color-surface);
    border: 1px solid rgba(0, 0, 0, 0.08);
    border-radius: 10px;
    padding: 0.5rem 0.75rem;
  }

  .death-saves-label {
    font-size: 0.65rem;
    font-weight: 700;
    color: var(--color-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .death-saves-rows {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .death-saves-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .ds-type {
    font-size: 0.7rem;
    font-weight: 600;
    width: 62px;
    flex-shrink: 0;
  }

  .ds-type--success {
    color: #3a7d44;
  }

  .ds-type--failure {
    color: var(--color-danger);
  }

  .ds-pips {
    display: flex;
    gap: 0.35rem;
  }

  .pip {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    border: 2px solid;
    background: transparent;
    cursor: pointer;
    padding: 0;
    transition: background 0.15s, transform 0.1s;
  }

  .pip:hover {
    transform: scale(1.15);
  }

  .pip--success {
    border-color: #3a7d44;
  }

  .pip--success.pip--filled {
    background: #3a7d44;
  }

  .pip--failure {
    border-color: var(--color-danger);
  }

  .pip--failure.pip--filled {
    background: var(--color-danger);
  }
</style>
