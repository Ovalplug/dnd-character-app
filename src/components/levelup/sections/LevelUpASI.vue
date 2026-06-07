<template>
  <section class="creation-panel">
    <div class="creation-intro">
      <p>
        Choose how to spend your Ability Score Improvement. Increase one score by 2, split the bonus
        across two different scores, or take a feat instead.
      </p>
    </div>

    <div class="creation-actions creation-actions--top">
      <button type="button" class="creation-primary-button" :disabled="!isValid" @click="confirm">
        Continue
      </button>
    </div>

    <!-- Mode selector -->
    <div class="asi-modes card">
      <label class="toggle-row">
        <input v-model="mode" type="radio" value="plus2" name="asi-mode" />
        <span>Increase one ability score by 2</span>
      </label>
      <label class="toggle-row">
        <input v-model="mode" type="radio" value="plus1plus1" name="asi-mode" />
        <span>Increase two different ability scores by 1 each</span>
      </label>
      <label class="toggle-row">
        <input v-model="mode" type="radio" value="feat" name="asi-mode" />
        <span>Take a feat instead</span>
      </label>
    </div>

    <!-- +2 to one score -->
    <div v-if="mode === 'plus2'" class="asi-scores">
      <div
        v-for="key in scoreKeys"
        :key="key"
        class="score-row"
        :class="{ 'score-row--selected': plus2Target === key }"
      >
        <label class="score-row__label">
          <input
            type="radio"
            name="plus2-target"
            :value="key"
            :disabled="(character.abilityScores[key] ?? 0) >= 20"
            v-model="plus2Target"
          />
          {{ SCORE_LABELS[key] }}
        </label>
        <span class="score-row__current">{{ character.abilityScores[key] }}</span>
        <span class="score-row__arrow">→</span>
        <span class="score-row__new" :class="{ 'score-row__new--active': plus2Target === key }">
          {{ plus2Target === key ? Math.min(20, (character.abilityScores[key] ?? 0) + 2) : '—' }}
        </span>
      </div>
    </div>

    <!-- +1 to two scores -->
    <div v-else-if="mode === 'plus1plus1'" class="asi-scores">
      <div
        v-for="key in scoreKeys"
        :key="key"
        class="score-row"
        :class="{ 'score-row--selected': plus1Targets.includes(key) }"
      >
        <label class="score-row__label">
          <input
            type="checkbox"
            :value="key"
            :disabled="
              (character.abilityScores[key] ?? 0) >= 20 ||
              (plus1Targets.length >= 2 && !plus1Targets.includes(key))
            "
            :checked="plus1Targets.includes(key)"
            @change="togglePlus1(key)"
          />
          {{ SCORE_LABELS[key] }}
        </label>
        <span class="score-row__current">{{ character.abilityScores[key] }}</span>
        <span class="score-row__arrow">→</span>
        <span
          class="score-row__new"
          :class="{ 'score-row__new--active': plus1Targets.includes(key) }"
        >
          {{
            plus1Targets.includes(key) ? Math.min(20, (character.abilityScores[key] ?? 0) + 1) : '—'
          }}
        </span>
      </div>
      <p v-if="plus1Targets.length < 2" class="panel-copy">
        Select {{ 2 - plus1Targets.length }} more score{{
          2 - plus1Targets.length !== 1 ? 's' : ''
        }}.
      </p>
    </div>

    <!-- Feat choice -->
    <div v-else-if="mode === 'feat'" class="feat-panel">
      <div v-if="selectedFeat" class="selected-feat card">
        <div class="selected-feat__header">
          <div>
            <p class="selected-feat__name">{{ selectedFeat.name }}</p>
            <p class="panel-copy">{{ selectedFeat.source || 'Unknown source' }}</p>
          </div>
          <button type="button" class="btn btn-ghost" @click="selectedFeat = null">Change</button>
        </div>
      </div>

      <template v-else>
        <label class="form-label" for="feat-search-asi">Search feats</label>
        <input
          id="feat-search-asi"
          v-model="featSearch"
          type="search"
          placeholder="Search by name…"
        />
        <p v-if="isLoadingFeats" class="panel-copy">Loading feats…</p>
        <div v-else class="feat-list">
          <div v-for="feat in filteredFeats" :key="featKey(feat)" class="feat-row">
            <div>
              <p class="selected-title">{{ feat.name }}</p>
              <p class="panel-copy">{{ feat.source || 'Unknown source' }}</p>
            </div>
            <button type="button" class="btn btn-primary" @click="selectedFeat = feat">
              Select
            </button>
          </div>
          <p v-if="!filteredFeats.length" class="panel-copy">No matching feats.</p>
        </div>
      </template>
    </div>

    <div class="creation-actions">
      <button type="button" class="creation-primary-button" :disabled="!isValid" @click="confirm">
        Continue
      </button>
    </div>
  </section>
</template>

<script lang="ts" setup>
  import { computed, onMounted, ref } from 'vue';
  import type { AbilityScoreValues, Feat, playerCharacter } from '../../../types';
  import { useDataStore } from '../../../stores/dataStore';

  const props = defineProps<{ character: playerCharacter }>();

  const emit = defineEmits<{
    (e: 'nextStep', abilityChanges: Partial<AbilityScoreValues>, feat: Feat | null): void;
  }>();

  const SCORE_LABELS: Record<keyof AbilityScoreValues, string> = {
    str: 'Strength',
    dex: 'Dexterity',
    con: 'Constitution',
    int: 'Intelligence',
    wis: 'Wisdom',
    cha: 'Charisma',
  };

  const scoreKeys = Object.keys(SCORE_LABELS) as (keyof AbilityScoreValues)[];

  const mode = ref<'plus2' | 'plus1plus1' | 'feat'>('plus2');
  const plus2Target = ref<keyof AbilityScoreValues | null>(null);
  const plus1Targets = ref<(keyof AbilityScoreValues)[]>([]);
  const selectedFeat = ref<Feat | null>(null);
  const featSearch = ref('');
  const isLoadingFeats = ref(false);

  const dataStore = useDataStore();

  onMounted(async () => {
    if (!dataStore.loaded) {
      isLoadingFeats.value = true;
      try {
        await dataStore.init();
      } finally {
        isLoadingFeats.value = false;
      }
    }
  });

  const filteredFeats = computed<Feat[]>(() => {
    const query = featSearch.value.toLowerCase().trim();
    const feats: Feat[] = dataStore.feats ?? [];
    if (!query) return feats.slice(0, 50);
    return feats.filter(f => f.name.toLowerCase().includes(query)).slice(0, 50);
  });

  const isValid = computed(() => {
    if (mode.value === 'plus2') return plus2Target.value !== null;
    if (mode.value === 'plus1plus1') return plus1Targets.value.length === 2;
    return selectedFeat.value !== null;
  });

  function togglePlus1(key: keyof AbilityScoreValues) {
    const idx = plus1Targets.value.indexOf(key);
    if (idx !== -1) {
      plus1Targets.value.splice(idx, 1);
    } else if (plus1Targets.value.length < 2) {
      plus1Targets.value.push(key);
    }
  }

  function featKey(feat: Feat): string {
    return `${feat.name}::${feat.source ?? ''}`;
  }

  function confirm() {
    if (!isValid.value) return;

    if (mode.value === 'feat') {
      emit('nextStep', {}, selectedFeat.value);
      return;
    }

    const changes: Partial<AbilityScoreValues> = {};
    if (mode.value === 'plus2' && plus2Target.value) {
      changes[plus2Target.value] = Math.min(
        20,
        (props.character.abilityScores[plus2Target.value] ?? 0) + 2
      );
    } else if (mode.value === 'plus1plus1') {
      for (const key of plus1Targets.value) {
        changes[key] = Math.min(20, (props.character.abilityScores[key] ?? 0) + 1);
      }
    }

    emit('nextStep', changes, null);
  }
</script>

<style scoped>
  .asi-modes {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 1rem;
  }

  .asi-scores {
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .score-row {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.7rem 1rem;
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
    border-radius: 0;
    transition: background 0.1s;
  }

  .score-row:first-child {
    border-radius: 10px 10px 0 0;
  }

  .score-row:last-child {
    border-bottom: none;
    border-radius: 0 0 10px 10px;
  }

  .score-row--selected {
    background: rgba(107, 46, 46, 0.06);
  }

  .score-row__label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex: 1;
    font-weight: 600;
  }

  .score-row__current {
    width: 2.5rem;
    text-align: center;
    font-size: 1.1rem;
    font-weight: 700;
  }

  .score-row__arrow {
    opacity: 0.4;
  }

  .score-row__new {
    width: 2.5rem;
    text-align: center;
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--color-muted, #aaa);
  }

  .score-row__new--active {
    color: var(--color-primary, #6b2e2e);
  }

  .feat-panel {
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
  }

  .feat-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    max-height: 18rem;
    overflow-y: auto;
  }

  .feat-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.6rem 0;
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  }

  .feat-row:last-child {
    border-bottom: none;
  }

  .selected-feat {
    padding: 0.9rem 1rem;
  }

  .selected-feat__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }

  .selected-feat__name {
    font-weight: 700;
    margin: 0;
  }

  .panel-copy {
    margin: 0;
    font-size: 0.83rem;
    color: var(--color-muted, #888);
  }

  .selected-title {
    font-weight: 700;
    font-size: 0.95rem;
    margin: 0;
  }
</style>
