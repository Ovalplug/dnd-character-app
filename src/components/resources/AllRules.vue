<template>
  <div class="rules-container">
    <div class="section-toggles">
      <span class="filter-label">Sections</span>
      <div class="chip-row">
        <button
          v-for="section in sections"
          :key="section.key"
          class="chip"
          :class="{ 'chip--on': activeSections.includes(section.key) }"
          @click="toggleSection(section.key)"
        >
          {{ section.label }}
          <span class="chip-count">{{ section.count }}</span>
        </button>
      </div>
    </div>

    <div v-if="activeSections.length === 0" class="empty-state">
      Select one or more sections above to browse rules.
    </div>

    <div v-for="section in sections" :key="section.key">
      <div v-if="activeSections.includes(section.key)" class="section-block">
        <h2 class="section-title">{{ section.label }}</h2>
        <RulesRules v-if="section.key === 'rules'" :rules="props.rules" />
        <ActionsRules v-else-if="section.key === 'actionRules'" :actionRules="props.actionRules" />
        <ConditionsRules v-else-if="section.key === 'conditions'" :conditions="props.conditions" />
        <HazardsRules v-else-if="section.key === 'hazards'" :hazards="props.hazards" />
        <BoonsRules v-else-if="section.key === 'boons'" :boons="props.boons" />
        <DiseasesRules v-else-if="section.key === 'diseases'" :diseases="props.diseases" />
        <TrapsRules v-else-if="section.key === 'traps'" :traps="props.traps" />
        <PlayerOptionsRules
          v-else-if="section.key === 'playerOptions'"
          :playerOptions="props.playerOptions"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { ref, computed } from 'vue';
  import type {
    Boon,
    Diseases,
    Hazard,
    Rules,
    Trap,
    ActionRules,
    PlayerOptions,
    ConditionsRules as ConditionsRulesType,
  } from '../../types';
  import RulesRules from './subRules/RulesRules.vue';
  import ActionsRules from './subRules/ActionsRules.vue';
  import ConditionsRules from './subRules/ConditionsRules.vue';
  import HazardsRules from './subRules/HazardsRules.vue';
  import BoonsRules from './subRules/BoonsRules.vue';
  import DiseasesRules from './subRules/DiseasesRules.vue';
  import TrapsRules from './subRules/TrapsRules.vue';
  import PlayerOptionsRules from './subRules/PlayerOptionsRules.vue';

  const props = defineProps<{
    rules: Rules[];
    hazards: Hazard[];
    boons: Boon[];
    diseases: Diseases[];
    traps: Trap[];
    actionRules: ActionRules[];
    playerOptions: PlayerOptions[];
    conditions: ConditionsRulesType[];
  }>();

  const activeSections = ref<string[]>([]);

  const sections = computed(() => [
    { key: 'rules', label: 'Rules', count: props.rules.length },
    { key: 'actionRules', label: 'Actions', count: props.actionRules.length },
    { key: 'conditions', label: 'Conditions', count: props.conditions.length },
    { key: 'hazards', label: 'Hazards', count: props.hazards.length },
    { key: 'boons', label: 'Boons', count: props.boons.length },
    { key: 'diseases', label: 'Diseases', count: props.diseases.length },
    { key: 'traps', label: 'Traps', count: props.traps.length },
    { key: 'playerOptions', label: 'Player Options', count: props.playerOptions.length },
  ]);

  function toggleSection(key: string) {
    if (activeSections.value.includes(key)) {
      activeSections.value = activeSections.value.filter(k => k !== key);
    } else {
      activeSections.value = [...activeSections.value, key];
    }
  }
</script>

<style scoped>
  .rules-container {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .section-toggles {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    padding: 0.75rem;
    background: var(--color-surface);
    border: 1px solid rgba(107, 46, 46, 0.15);
    border-radius: 10px;
  }

  .filter-label {
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--color-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin: 0;
  }

  .chip-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }

  .chip {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.35rem 0.7rem;
    border: 1px solid rgba(107, 46, 46, 0.25);
    border-radius: 99px;
    background: var(--color-bg);
    color: var(--color-text);
    cursor: pointer;
    font-size: 0.85rem;
    min-height: 36px;
    transition: background 0.12s, color 0.12s, border-color 0.12s;
  }

  .chip--on {
    background: var(--color-primary);
    color: white;
    border-color: var(--color-primary);
  }

  .chip-count {
    font-size: 0.75rem;
    opacity: 0.7;
  }

  .chip--on .chip-count {
    opacity: 0.85;
  }

  .empty-state {
    padding: 2rem;
    text-align: center;
    color: var(--color-muted);
    font-size: 0.95rem;
  }

  .section-block {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .section-title {
    font-size: 1.2rem;
    font-weight: 700;
    margin: 0;
    padding-bottom: 0.4rem;
    border-bottom: 2px solid rgba(107, 46, 46, 0.2);
    color: var(--color-primary);
  }
</style>
