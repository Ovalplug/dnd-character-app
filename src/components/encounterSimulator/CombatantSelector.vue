<template>
  <div class="combatant-selector">
    <div class="combatant-selector__container">
      <!-- Available Monsters -->
      <div class="combatant-selector__panel">
        <h3 class="combatant-selector__heading">Available Monsters</h3>
        <div class="combatant-selector__search">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search monsters..."
            class="combatant-selector__input"
          />
        </div>
        <div class="combatant-selector__list">
          <button
            v-for="(monster, idx) in filteredMonsters"
            :key="`${monster.name}-${monster.source}-${idx}`"
            class="combatant-selector__item"
            @click="selectMonster(monster)"
          >
            <span class="combatant-selector__name">{{ monster.name }}</span>
            <span class="combatant-selector__cr">CR {{ monster.cr || 0 }}</span>
          </button>
        </div>
      </div>

      <!-- Team A -->
      <div class="combatant-selector__panel">
        <h3 class="combatant-selector__heading combatant-selector__heading--allies">Allies</h3>
        <div class="combatant-selector__team-list">
          <div
            v-for="(comb, idx) in teamA"
            :key="`ally-${idx}`"
            class="combatant-selector__team-item"
          >
            <div class="combatant-selector__team-name">{{ comb.monster.name }}</div>
            <select v-model="comb.role" class="combatant-selector__role-select">
              <option v-for="role in availableRoles" :key="role" :value="role">{{ role }}</option>
            </select>
            <button class="btn--remove" @click="removeFromTeam('allies', idx)">Remove</button>
          </div>
        </div>
        <button
          class="combatant-selector__add-btn"
          @click="addToTeam('allies')"
          :disabled="!selectedMonster"
        >
          Add to Allies
        </button>
      </div>

      <!-- Team B -->
      <div class="combatant-selector__panel">
        <h3 class="combatant-selector__heading combatant-selector__heading--enemies">Enemies</h3>
        <div class="combatant-selector__team-list">
          <div
            v-for="(comb, idx) in teamB"
            :key="`enemy-${idx}`"
            class="combatant-selector__team-item"
          >
            <div class="combatant-selector__team-name">{{ comb.monster.name }}</div>
            <select v-model="comb.role" class="combatant-selector__role-select">
              <option v-for="role in availableRoles" :key="role" :value="role">{{ role }}</option>
            </select>
            <button class="btn--remove" @click="removeFromTeam('enemies', idx)">Remove</button>
          </div>
        </div>
        <button
          class="combatant-selector__add-btn"
          @click="addToTeam('enemies')"
          :disabled="!selectedMonster"
        >
          Add to Enemies
        </button>
      </div>
    </div>

    <div class="combatant-selector__footer">
      <button class="btn btn--primary" @click="emitSelection" :disabled="!canSubmit">
        Confirm Teams
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue';
  import type { Monster, CompositeRole } from '../../types';

  interface CombatantConfig {
    monster: Monster;
    role: CompositeRole;
  }

  const props = defineProps<{
    monsters: Monster[];
  }>();

  const emit = defineEmits<{
    'teams-selected': [allies: CombatantConfig[], enemies: CombatantConfig[]];
  }>();

  const searchQuery = ref('');
  const selectedMonster = ref<Monster | null>(null);
  const teamA = ref<CombatantConfig[]>([]);
  const teamB = ref<CombatantConfig[]>([]);

  const availableRoles: CompositeRole[] = [
    'Tank' as const,
    'Healer' as const,
    'DamagDealer' as const,
    'Controller' as const,
    'Tank+Healer' as const,
    'DamagDealer+Tank' as const,
  ];

  const filteredMonsters = computed(() => {
    if (!searchQuery.value) return props.monsters;
    const q = searchQuery.value.toLowerCase();
    return props.monsters.filter(m => m.name.toLowerCase().includes(q));
  });

  const canSubmit = computed(() => teamA.value.length > 0 && teamB.value.length > 0);

  function selectMonster(monster: Monster): void {
    selectedMonster.value = monster;
  }

  function addToTeam(team: 'allies' | 'enemies'): void {
    if (!selectedMonster.value) return;

    const config: CombatantConfig = {
      monster: selectedMonster.value,
      role: availableRoles[0] || ('Tank' as CompositeRole),
    };

    if (team === 'allies') {
      teamA.value.push(config);
    } else {
      teamB.value.push(config);
    }
  }

  function removeFromTeam(team: 'allies' | 'enemies', idx: number): void {
    if (team === 'allies') {
      teamA.value.splice(idx, 1);
    } else {
      teamB.value.splice(idx, 1);
    }
  }

  function emitSelection(): void {
    emit('teams-selected', teamA.value, teamB.value);
  }
</script>

<style scoped>
  .combatant-selector {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
    background: var(--color-bg);
    border-radius: var(--radius);
    min-height: 500px;
  }

  .combatant-selector__container {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1rem;
    flex: 1;
    overflow-y: auto;
  }

  @media (min-width: 768px) {
    .combatant-selector__container {
      grid-template-columns: 1fr 1fr 1fr;
    }
  }

  .combatant-selector__panel {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    background: var(--color-surface);
    padding: 1rem;
    border-radius: var(--radius);
    border: 1px solid var(--color-muted);
  }

  .combatant-selector__heading {
    margin: 0;
    font-size: 0.875rem;
    font-weight: 600;
    text-transform: uppercase;
    color: var(--color-primary);
    padding-bottom: 0.5rem;
    border-bottom: 1px solid var(--color-muted);
  }

  .combatant-selector__heading--allies {
    color: #4a7c59;
  }

  .combatant-selector__heading--enemies {
    color: #c9533b;
  }

  .combatant-selector__search {
    display: flex;
  }

  .combatant-selector__input {
    flex: 1;
    padding: 0.5rem;
    background: var(--color-bg);
    border: 1px solid var(--color-muted);
    border-radius: 4px;
    color: var(--color-text);
    font-size: 0.875rem;
  }

  .combatant-selector__list {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    max-height: 300px;
    overflow-y: auto;
  }

  .combatant-selector__item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem;
    background: var(--color-bg);
    border: 1px solid var(--color-muted);
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.75rem;
    text-align: left;
    transition: all 0.2s;
  }

  .combatant-selector__item:active {
    background: var(--color-primary);
    color: var(--color-surface);
  }

  .combatant-selector__name {
    font-weight: 500;
  }

  .combatant-selector__cr {
    font-size: 0.65rem;
    opacity: 0.7;
  }

  .combatant-selector__team-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    max-height: 250px;
    overflow-y: auto;
  }

  .combatant-selector__team-item {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    padding: 0.5rem;
    background: var(--color-bg);
    border: 1px solid var(--color-muted);
    border-radius: 4px;
    font-size: 0.75rem;
  }

  .combatant-selector__team-name {
    font-weight: 500;
    color: var(--color-text);
  }

  .combatant-selector__role-select {
    padding: 0.25rem;
    background: var(--color-surface);
    border: 1px solid var(--color-muted);
    border-radius: 2px;
    font-size: 0.65rem;
    color: var(--color-text);
  }

  .btn--remove {
    padding: 0.25rem 0.5rem;
    background: var(--color-danger);
    color: white;
    border: none;
    border-radius: 2px;
    cursor: pointer;
    font-size: 0.65rem;
    transition: background 0.2s;
  }

  .btn--remove:active {
    background: #8b2e2e;
  }

  .combatant-selector__add-btn {
    padding: 0.5rem;
    background: var(--color-primary);
    color: var(--color-surface);
    border: none;
    border-radius: var(--radius);
    cursor: pointer;
    font-size: 0.75rem;
    font-weight: 500;
    transition: background 0.2s;
  }

  .combatant-selector__add-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .combatant-selector__add-btn:active:not(:disabled) {
    background: var(--color-accent);
  }

  .combatant-selector__footer {
    display: flex;
    gap: 0.75rem;
    justify-content: flex-end;
  }

  .btn {
    padding: 0.75rem 1.5rem;
    background: var(--color-primary);
    color: var(--color-surface);
    border: none;
    border-radius: var(--radius);
    cursor: pointer;
    font-weight: 500;
    transition: background 0.2s;
  }

  .btn--primary {
    background: var(--color-accent);
  }

  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn:active:not(:disabled) {
    background: #9d8739;
  }
</style>
