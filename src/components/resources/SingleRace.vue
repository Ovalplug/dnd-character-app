<template>
  <div>
    <div>
      <p class="source-line">
        Source: {{ props.race.source }} <span class="p2">(page {{ props.race.page }})</span>
      </p>
    </div>
    <div class="tab-row">
      <button :class="['tab-btn', { 'tab-btn--active': show_fluff }]" @click="showFluff">
        Lore
      </button>
      <button :class="['tab-btn', { 'tab-btn--active': show_base }]" @click="showBase">
        Rules
      </button>
    </div>
    <div>
      <template v-if="show_base">
        <RaceExtras :race="props.race" />
        <ResourceEntries :entries="props.race.entries ?? ['No base entries available']" />
        <template v-if="props.race.subraces && props.race.subraces.length">
          <h3>Subraces</h3>
          <div v-for="(subrace, i) in props.race.subraces" :key="i" class="subrace">
            <h4>{{ subrace.name }}</h4>
            <p v-if="subrace.ability">
              <strong>Ability Scores:</strong>
              {{ getPrettyAbilityScoreValues(subrace.ability) }}
            </p>
            <ResourceEntries v-if="subrace.entries" :entries="subrace.entries" />
          </div>
        </template>
      </template>
      <ResourceEntries
        v-if="show_fluff"
        :entries="props.fluff?.entries ?? ['No fluff available']"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref } from 'vue';
  import type { Race, RaceFluff } from '../../types';
  import ResourceEntries from './ResourceEntries.vue';
  import RaceExtras from './RaceExtras.vue';
  import { getPrettyAbilityScoreValues } from '../../helperFunctions';

  const props = defineProps<{
    race: Race;
    fluff?: RaceFluff;
  }>();

  const show_fluff = ref(true);
  const show_base = ref(false);
  function showFluff() {
    show_fluff.value = true;
    show_base.value = false;
  }
  function showBase() {
    show_fluff.value = false;
    show_base.value = true;
  }
</script>

<style scoped>
  .source-line {
    margin: 0 0 0.75rem 0;
    font-size: 0.9rem;
    color: var(--color-muted);
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

  .subrace {
    margin-top: 0.75rem;
    padding: 0.75rem;
    border-radius: 8px;
    background: var(--color-surface);
    border: 1px solid rgba(107, 46, 46, 0.1);
  }

  .subrace h4 {
    margin: 0 0 0.4rem 0;
  }
</style>
