<template>
  <section class="creation-panel">
    <div class="summary-hero">
      <p class="summary-kicker">Ready to level up</p>
      <h2>{{ character.name }}</h2>
      <p class="summary-copy">Review the changes below, then confirm to apply them.</p>
    </div>

    <div class="creation-actions creation-actions--top">
      <button type="button" class="creation-primary-button save-button" @click="confirm">
        Apply Level Up
      </button>
    </div>

    <!-- Core stats -->
    <div class="summary-card card">
      <div class="summary-row">
        <span class="summary-label">Total level</span>
        <span class="summary-value">
          {{ currentTotalLevel }} → <strong>{{ newTotalLevel }}</strong>
        </span>
      </div>
      <div class="summary-row">
        <span class="summary-label">Class advancing</span>
        <span class="summary-value">
          {{ classData.name }} {{ analysis.currentClassLevel }} →
          <strong>{{ analysis.newClassLevel }}</strong>
          <span v-if="analysis.isNewClass" class="summary-badge">multiclass</span>
        </span>
      </div>
      <div v-if="subclassData" class="summary-row">
        <span class="summary-label">Subclass gained</span>
        <span class="summary-value"
          ><strong>{{ subclassData.name }}</strong></span
        >
      </div>
      <div class="summary-row">
        <span class="summary-label">HP increase</span>
        <span class="summary-value">
          +<strong>{{ hpGain }}</strong> ({{ character.maxHp }} → {{ character.maxHp + hpGain }})
        </span>
      </div>
      <div class="summary-row">
        <span class="summary-label">Proficiency bonus</span>
        <span class="summary-value"
          >+<strong>{{ newProficiencyBonus }}</strong></span
        >
      </div>
    </div>

    <!-- New features -->
    <div v-if="analysis.featuresGained.length" class="summary-section">
      <h3 class="summary-section__heading">Features gained</h3>
      <div class="summary-tag-row">
        <span v-for="f in analysis.featuresGained" :key="f.name" class="summary-tag">{{
          f.name
        }}</span>
      </div>
    </div>

    <!-- Table changes -->
    <div
      v-if="analysis.tableChanges.length || analysis.newSpellSlotsDescription.length"
      class="summary-section"
    >
      <h3 class="summary-section__heading">Class table changes</h3>
      <div class="summary-card card">
        <div v-for="change in analysis.tableChanges" :key="change.label" class="summary-row">
          <span class="summary-label">{{ change.label }}</span>
          <span class="summary-value">
            <span class="summary-old">{{ change.oldValue }}</span> →
            <strong>{{ change.newValue }}</strong>
          </span>
        </div>
        <div v-for="desc in analysis.newSpellSlotsDescription" :key="desc" class="summary-row">
          <span class="summary-label">Spell slots</span>
          <span class="summary-value"
            ><strong>{{ desc }}</strong></span
          >
        </div>
      </div>
    </div>

    <!-- Ability score changes -->
    <div v-if="hasAbilityChanges || newFeat" class="summary-section">
      <h3 class="summary-section__heading">Ability Score Improvement</h3>
      <div v-if="newFeat" class="summary-card card">
        <div class="summary-row">
          <span class="summary-label">Feat taken</span>
          <span class="summary-value"
            ><strong>{{ newFeat.name }}</strong></span
          >
        </div>
      </div>
      <div v-else class="summary-card card">
        <div v-for="(newScore, key) in abilityScoreChanges" :key="key" class="summary-row">
          <span class="summary-label">{{ SCORE_LABELS[key as keyof typeof SCORE_LABELS] }}</span>
          <span class="summary-value">
            {{ character.abilityScores[key as keyof typeof character.abilityScores] }} →
            <strong>{{ newScore }}</strong>
          </span>
        </div>
      </div>
    </div>

    <!-- New spells -->
    <div v-if="newCantrips.length || newSpells.length" class="summary-section">
      <h3 class="summary-section__heading">New spells</h3>
      <div class="summary-tag-row">
        <span v-for="s in newCantrips" :key="s.name" class="summary-tag summary-tag--spell"
          >{{ s.name }} <em>(cantrip)</em></span
        >
        <span v-for="s in newSpells" :key="s.name" class="summary-tag summary-tag--spell">{{
          s.name
        }}</span>
      </div>
    </div>

    <div class="creation-actions">
      <button type="button" class="creation-primary-button save-button" @click="confirm">
        Apply Level Up
      </button>
    </div>
  </section>
</template>

<script lang="ts" setup>
  import { computed } from 'vue';
  import type {
    AbilityScoreValues,
    CharClass,
    Feat,
    playerCharacter,
    Spell,
    Subclass,
  } from '../../../types';
  import type { LevelUpAnalysis } from '../levelUpHelpers';
  import { calculateProficiencyBonus } from '../../../helperFunctions';

  const props = defineProps<{
    character: playerCharacter;
    classData: CharClass;
    analysis: LevelUpAnalysis;
    subclassData: Subclass | null;
    hpGain: number;
    abilityScoreChanges: Partial<AbilityScoreValues>;
    newFeat: Feat | null;
    newCantrips: Spell[];
    newSpells: Spell[];
  }>();

  const emit = defineEmits<{ (e: 'finishLevelUp'): void }>();

  const SCORE_LABELS: Record<keyof AbilityScoreValues, string> = {
    str: 'Strength',
    dex: 'Dexterity',
    con: 'Constitution',
    int: 'Intelligence',
    wis: 'Wisdom',
    cha: 'Charisma',
  };

  const currentTotalLevel = computed(() =>
    Object.values(props.character.classLevels).reduce((sum, lvl) => sum + lvl, 0)
  );
  const newTotalLevel = computed(() => currentTotalLevel.value + 1);
  const newProficiencyBonus = computed(() => calculateProficiencyBonus(newTotalLevel.value));

  const hasAbilityChanges = computed(() => Object.keys(props.abilityScoreChanges).length > 0);

  function confirm() {
    emit('finishLevelUp');
  }
</script>

<style scoped>
  .summary-hero {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
  .summary-hero h2 {
    margin: 0;
  }
  .summary-kicker {
    font-size: 0.78rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--color-primary, #6b2e2e);
    margin: 0;
  }
  .summary-copy {
    color: var(--color-muted, #888);
    margin: 0;
  }

  .summary-section {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }
  .summary-section__heading {
    font-size: 0.88rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--color-primary, #6b2e2e);
    margin: 0;
  }

  .summary-card {
    display: flex;
    flex-direction: column;
    gap: 0;
    padding: 0;
    overflow: hidden;
  }
  .summary-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    padding: 0.72rem 1rem;
    border-bottom: 1px solid rgba(0, 0, 0, 0.07);
  }
  .summary-row:last-child {
    border-bottom: none;
  }
  .summary-label {
    font-size: 0.88rem;
    color: var(--color-muted, #888);
  }
  .summary-value {
    font-size: 0.95rem;
  }
  .summary-old {
    text-decoration: line-through;
    opacity: 0.45;
  }

  .summary-badge {
    margin-left: 0.5rem;
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--color-primary, #6b2e2e);
    border: 1px solid currentColor;
    border-radius: 4px;
    padding: 1px 5px;
  }

  .summary-tag-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  .summary-tag {
    padding: 0.3rem 0.7rem;
    border-radius: 999px;
    background: rgba(107, 46, 46, 0.1);
    color: var(--color-primary, #6b2e2e);
    font-size: 0.85rem;
    font-weight: 600;
  }
  .summary-tag--spell {
    background: rgba(46, 72, 170, 0.1);
    color: #2e48aa;
  }
</style>
