<template>
  <div class="ability-score-selection">
    <!-- Method Selector Card -->
    <div class="method-card">
      <label class="method-label" for="score-selection">Ability Score Method</label>
      <select
        id="score-selection"
        class="styled-select method-select"
        v-model="selectedMethod"
        @change="handleMethodChange"
      >
        <option value="recommended">Recommended</option>
        <option value="custom">Custom</option>
        <option value="standard">Standard Array</option>
        <option value="point-buy">Point Buy</option>
        <option value="roll">Roll</option>
      </select>

      <!-- Dice Config -->
      <div v-if="selectedMethod === 'roll'" class="dice-config">
        <div class="dice-field">
          <label for="dice-count">Number of Dice</label>
          <input
            id="dice-count"
            class="styled-input"
            type="number"
            v-model.number="diceConfig.count"
            min="1"
          />
        </div>
        <div class="dice-field">
          <label for="dice-type">Dice Type</label>
          <select id="dice-type" class="styled-select" v-model="diceConfig.dType">
            <option value="d4">d4</option>
            <option value="d6">d6</option>
            <option value="d8">d8</option>
            <option value="d10">d10</option>
            <option value="d12">d12</option>
            <option value="d20">d20</option>
          </select>
        </div>
        <div class="dice-field dice-field--check">
          <input
            id="drop-lowest"
            type="checkbox"
            class="styled-checkbox"
            v-model="diceConfig.dropLowest"
          />
          <label for="drop-lowest">Drop Lowest</label>
        </div>
        <div class="dice-field">
          <label for="reroll-threshold">Reroll Below</label>
          <input
            id="reroll-threshold"
            class="styled-input"
            type="number"
            v-model.number="diceConfig.rerollThreshold"
            min="1"
          />
        </div>
      </div>
    </div>

    <!-- Point Buy: Points Remaining -->
    <div v-if="selectedMethod === 'point-buy'" class="points-remaining">
      Points Remaining: <strong>{{ pointBuyPointsLeft }}</strong>
      <span v-if="pointBuyError" class="error-msg">{{ pointBuyError }}</span>
    </div>

    <!-- Racial Choice Banner -->
    <div v-if="!useSetRacialBonus && chooseRacialBonusInfo" class="racial-choice-banner">
      <span
        >Racial Bonus — pick <strong>{{ chooseRacialBonusInfo.choose.count }}</strong></span
      >
      <span
        class="racial-choice-pip"
        :class="{ 'racial-choice-pip--done': chosenCount === chooseRacialBonusInfo.choose.count }"
      >
        {{ chosenCount }}/{{ chooseRacialBonusInfo.choose.count }}
      </span>
    </div>

    <!-- Unified vertical table: one row per ability score -->
    <table class="ability-table">
      <thead>
        <tr>
          <th class="col-ability">Ability</th>
          <th
            v-if="selectedMethod === 'custom' || selectedMethod === 'point-buy'"
            class="col-ctrl"
          ></th>
          <th class="col-score">
            {{
              selectedMethod === 'standard'
                ? 'Assign'
                : selectedMethod === 'roll'
                ? 'Score'
                : 'Score'
            }}
          </th>
          <th
            v-if="selectedMethod === 'custom' || selectedMethod === 'point-buy'"
            class="col-ctrl"
          ></th>
          <th class="col-racial">Racial</th>
          <th class="col-total">Total</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(score, index) in abilityNameArray"
          :key="score"
          :class="index % 2 === 1 ? 'row-alt' : ''"
        >
          <!-- Ability Name -->
          <td class="ability-name">{{ score.toUpperCase() }}</td>

          <!-- Up Arrow (custom / point-buy) -->
          <td v-if="selectedMethod === 'custom' || selectedMethod === 'point-buy'" class="col-ctrl">
            <img
              :src="upArrow"
              alt="Up"
              width="20"
              height="20"
              @click="
                selectedMethod === 'point-buy'
                  ? changePointBuy('up', score)
                  : changeValue('up', score)
              "
              :style="
                selectedMethod === 'point-buy'
                  ? {
                      opacity: canIncrease(score) ? 1 : 0.3,
                      cursor: canIncrease(score) ? 'pointer' : 'not-allowed',
                    }
                  : {}
              "
            />
          </td>

          <!-- Score Cell -->
          <td class="col-score">
            <template v-if="selectedMethod === 'standard'">
              <select
                class="styled-select score-select"
                v-model="currAbilityScores[score as keyof AbilityScoreValues]"
                @change="handleDropdownChange()"
              >
                <option v-for="value in availableValues" :key="value" :value="value">
                  {{ value }}
                </option>
              </select>
            </template>
            <template v-else-if="selectedMethod === 'roll'">
              <div class="roll-cell">
                <img :src="rollDice" alt="Roll" width="22" height="22" @click="doDiceRoll(score)" />
                <span class="score-value">{{
                  findAbilityScore(score as keyof AbilityScoreValues)
                }}</span>
              </div>
            </template>
            <template v-else>
              <span class="score-value">{{
                findAbilityScore(score as keyof AbilityScoreValues)
              }}</span>
            </template>
          </td>

          <!-- Down Arrow (custom / point-buy) -->
          <td v-if="selectedMethod === 'custom' || selectedMethod === 'point-buy'" class="col-ctrl">
            <img
              :src="downArrow"
              alt="Down"
              width="20"
              height="20"
              @click="
                selectedMethod === 'point-buy'
                  ? changePointBuy('down', score)
                  : changeValue('down', score)
              "
              :style="
                selectedMethod === 'point-buy'
                  ? {
                      opacity: canDecrease(score) ? 1 : 0.3,
                      cursor: canDecrease(score) ? 'pointer' : 'not-allowed',
                    }
                  : {}
              "
            />
          </td>

          <!-- Racial Bonus -->
          <td class="col-racial">
            <template v-if="useSetRacialBonus">
              <span class="racial-badge"
                >+{{ getRacialBonus(score as keyof AbilityScoreValues) }}</span
              >
            </template>
            <template v-else>
              <div v-if="isInChooseFrom(score)" class="racial-counter">
                <button
                  class="racial-counter-btn"
                  :disabled="chosenRacialBonuses[score as keyof AbilityScoreValues] === 0"
                  @click="decreaseChosenBonus(score as keyof AbilityScoreValues)"
                >
                  −
                </button>
                <span
                  class="racial-counter-val"
                  :class="{ 'racial-counter-val--active': chosenRacialBonuses[score as keyof AbilityScoreValues] > 0 }"
                >
                  +{{ chosenRacialBonuses[score as keyof AbilityScoreValues] }}
                </span>
                <button
                  class="racial-counter-btn"
                  :disabled="!canSelectBonus(score as keyof AbilityScoreValues)"
                  @click="increaseChosenBonus(score as keyof AbilityScoreValues)"
                >
                  +
                </button>
              </div>
              <span v-else class="racial-na">—</span>
            </template>
          </td>

          <!-- Total -->
          <td class="col-total">
            <span class="total-value">{{
              getTotalWithRacialBonus(score as keyof AbilityScoreValues)
            }}</span>
          </td>
        </tr>
      </tbody>
    </table>
    <button class="next-btn" @click="finaliseAbilities()">Next</button>
  </div>
</template>
<script lang="ts" setup>
  import { ref, computed } from 'vue';
  import { useCharacterStore } from '../../../stores/characterStore';
  // import Accordian from '../../AccordianHolder.vue';

  import upArrow from '../../../assets/icons/up-arrow.svg';
  import downArrow from '../../../assets/icons/down-arrow.svg';
  import rollDice from '../../../assets/icons/roll-dice.svg';

  import type { AbilityScoreValues, DiceTypes, Ability, FixedAbilityBonus } from '../../../types';

  import {
    suggestedAbilityScores,
    // abilityScoreNames,
    standardArray,
    abilityNameArray,
  } from '../../../stores/abilityScores';

  import { diceRoll } from '../../../helperFunctions';

  function finaliseAbilities() {
    // Save the final ability scores to the store, including racial bonuses
    const finalScores: AbilityScoreValues = {
      str: getTotalWithRacialBonus('str'),
      dex: getTotalWithRacialBonus('dex'),
      con: getTotalWithRacialBonus('con'),
      int: getTotalWithRacialBonus('int'),
      wis: getTotalWithRacialBonus('wis'),
      cha: getTotalWithRacialBonus('cha'),
    };
    store.setNewCharAbilityScores(finalScores);
    emit('nextStep');
  }

  // --- Point Buy Logic ---
  // Standard 27-point buy rules: 8-15, cost increases for higher values
  const pointBuyCosts: Record<number, number> = {
    8: 0,
    9: 1,
    10: 2,
    11: 3,
    12: 4,
    13: 5,
    14: 7,
    15: 9,
  };
  const POINT_BUY_MIN = 8;
  const POINT_BUY_MAX = 15;
  const POINT_BUY_TOTAL = 27;
  function getPointBuyTotal(scores: AbilityScoreValues): number {
    return Object.values(scores).reduce((sum, val) => sum + (pointBuyCosts[val] ?? 100), 0);
  }
  const pointBuyError = ref('');
  const pointBuyPointsLeft = computed(() => {
    return POINT_BUY_TOTAL - getPointBuyTotal(currAbilityScores.value);
  });
  const canIncrease = (score: string): boolean => {
    const val = currAbilityScores.value[score as keyof AbilityScoreValues];
    if (val >= POINT_BUY_MAX) return false;
    // Check if increasing would exceed points
    const nextVal = val + 1;
    const costDiff = (pointBuyCosts[nextVal] ?? 100) - (pointBuyCosts[val] ?? 100);
    return pointBuyPointsLeft.value >= costDiff;
  };
  const canDecrease = (score: string): boolean => {
    const val = currAbilityScores.value[score as keyof AbilityScoreValues];
    return val > POINT_BUY_MIN;
  };
  const changePointBuy = (direction: 'up' | 'down', abilityName: string) => {
    pointBuyError.value = '';
    const val = currAbilityScores.value[abilityName as keyof AbilityScoreValues];
    if (direction === 'up') {
      if (!canIncrease(abilityName)) {
        pointBuyError.value = 'Cannot increase further or not enough points.';
        return;
      }
      currAbilityScores.value[abilityName as keyof AbilityScoreValues] = val + 1;
    } else if (direction === 'down') {
      if (!canDecrease(abilityName)) {
        pointBuyError.value = 'Cannot decrease below 8.';
        return;
      }
      currAbilityScores.value[abilityName as keyof AbilityScoreValues] = val - 1;
    }
  };
  const store = useCharacterStore();
  const emit = defineEmits<{ (e: 'nextStep'): void }>();
  const currClass = ref(store.currNewCharacter?.classes[0]?.name?.toLowerCase() || '');
  // currRaceBonus can be an array of objects, or a single object
  const currRaceBonus = ref<Ability[]>(
    Array.isArray(store.currNewCharacter?.race?.ability)
      ? (store.currNewCharacter.race.ability as Ability[])
      : []
  );
  const useSetRacialBonus = computed(() => {
    // currRaceBonus is an array, check if any entry has a 'choose' key
    if (!Array.isArray(currRaceBonus.value)) return false;
    // If any object in the array has a 'choose' property, return false
    return !currRaceBonus.value.some(
      bonus => bonus && typeof bonus === 'object' && 'choose' in bonus
    );
  });

  const currAbilityScores = ref<AbilityScoreValues>({
    str: suggestedAbilityScores[currClass.value]?.str || 0,
    dex: suggestedAbilityScores[currClass.value]?.dex || 0,
    con: suggestedAbilityScores[currClass.value]?.con || 0,
    int: suggestedAbilityScores[currClass.value]?.int || 0,
    wis: suggestedAbilityScores[currClass.value]?.wis || 0,
    cha: suggestedAbilityScores[currClass.value]?.cha || 0,
  });
  const selectedMethod = ref('custom');
  const availableValues = ref([0, ...standardArray]);

  const diceConfig = ref({
    count: 4,
    dType: 'd6' as keyof DiceTypes, // Explicitly cast to keyof DiceTypes
    dropLowest: true,
    rerollThreshold: 1,
  });

  function changeValue(direction: string, abilityName: string) {
    if (direction === 'up') {
      currAbilityScores.value[abilityName as keyof AbilityScoreValues] =
        (currAbilityScores.value[abilityName as keyof AbilityScoreValues] || 0) + 1;
    } else if (direction === 'down') {
      currAbilityScores.value[abilityName as keyof AbilityScoreValues] =
        (currAbilityScores.value[abilityName as keyof AbilityScoreValues] || 0) - 1;
    }
  }

  function findAbilityScore(abilityName: keyof AbilityScoreValues): number {
    return currAbilityScores.value[abilityName] || 0;
  }

  function handleMethodChange() {
    switch (selectedMethod.value) {
      case 'custom':
        // Keep current scores, allow manual adjustment
        break;
      case 'recommended':
        // Set to recommended ability scores
        currAbilityScores.value = {
          str: suggestedAbilityScores[currClass.value]?.str || 0,
          dex: suggestedAbilityScores[currClass.value]?.dex || 0,
          con: suggestedAbilityScores[currClass.value]?.con || 0,
          int: suggestedAbilityScores[currClass.value]?.int || 0,
          wis: suggestedAbilityScores[currClass.value]?.wis || 0,
          cha: suggestedAbilityScores[currClass.value]?.cha || 0,
        };
        break;
      case 'standard':
        // Set to 0 for all, and allow user to assign standard array values
        currAbilityScores.value = {
          str: 0,
          dex: 0,
          con: 0,
          int: 0,
          wis: 0,
          cha: 0,
        };
        break;
      case 'point-buy':
        // Reset scores for point buy method
        currAbilityScores.value = {
          str: 8,
          dex: 8,
          con: 8,
          int: 8,
          wis: 8,
          cha: 8,
        };
        break;
      case 'roll':
        // Implement rolling logic here (e.g., roll 4d6 and drop the lowest)
        break;
    }
  }

  function handleDropdownChange() {
    const usedValues = Object.values(currAbilityScores.value);
    availableValues.value = [0, ...standardArray.filter(value => !usedValues.includes(value))];
  }

  function doDiceRoll(score: string) {
    const rolledScore = diceRoll(
      [{ count: diceConfig.value.count, dType: diceConfig.value.dType, modifier: 0 }],
      diceConfig.value.dropLowest,
      [diceConfig.value.rerollThreshold]
    );

    currAbilityScores.value[score as keyof AbilityScoreValues] = rolledScore ?? 0; // Ensure a default value of 0
  }

  // --- Racial Bonus Logic ---
  // For races with 'choose', allow user to assign up to N points to any ability
  const chosenRacialBonuses = ref<AbilityScoreValues>({
    str: 0,
    dex: 0,
    con: 0,
    int: 0,
    wis: 0,
    cha: 0,
  });

  function isChooseBonus(obj: any): obj is { choose: { from: string[]; count: number } } {
    return (
      obj &&
      typeof obj === 'object' &&
      'choose' in obj &&
      obj.choose &&
      typeof obj.choose === 'object' &&
      Array.isArray(obj.choose.from)
    );
  }

  const chooseRacialBonusInfo = computed(() => {
    if (!Array.isArray(currRaceBonus.value)) return null;
    return currRaceBonus.value.find(isChooseBonus) ?? null;
  });

  const chosenCount = computed(() =>
    Object.values(chosenRacialBonuses.value).reduce((sum, v) => sum + v, 0)
  );

  function isInChooseFrom(score: string): boolean {
    return chooseRacialBonusInfo.value?.choose.from.includes(score) ?? false;
  }

  function canSelectBonus(_score: keyof AbilityScoreValues): boolean {
    if (!chooseRacialBonusInfo.value) return false;
    return chosenCount.value < chooseRacialBonusInfo.value.choose.count;
  }

  function increaseChosenBonus(score: keyof AbilityScoreValues) {
    if (!canSelectBonus(score)) return;
    chosenRacialBonuses.value[score] = (chosenRacialBonuses.value[score] || 0) + 1;
  }

  function decreaseChosenBonus(score: keyof AbilityScoreValues) {
    if ((chosenRacialBonuses.value[score] || 0) <= 0) return;
    chosenRacialBonuses.value[score] = chosenRacialBonuses.value[score] - 1;
  }

  function isFixedAbilityBonus(obj: any): obj is FixedAbilityBonus {
    return obj && typeof obj === 'object' && !('choose' in obj);
  }

  function getRacialBonus(score: keyof AbilityScoreValues) {
    if (useSetRacialBonus.value) {
      // Find the first object that is a FixedAbilityBonus
      const bonusObj = currRaceBonus.value.find(isFixedAbilityBonus);
      return bonusObj && typeof bonusObj[score] === 'number' ? bonusObj[score]! : 0;
    } else {
      return chosenRacialBonuses.value[score] || 0;
    }
  }

  function getTotalWithRacialBonus(score: keyof AbilityScoreValues) {
    return (currAbilityScores.value[score] || 0) + getRacialBonus(score);
  }
</script>

<style scoped>
  /* ── Root ─────────────────────────────────────────────────── */
  .ability-score-selection {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  /* ── Method Selector Card ─────────────────────────────────── */
  .method-card {
    background: var(--color-surface, #efe6d0);
    border: 1px solid rgba(107, 46, 46, 0.2);
    border-radius: var(--radius, 12px);
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .method-label {
    font-weight: 700;
    font-size: 0.82rem;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--color-primary, #6b2e2e);
  }

  /* ── Styled Select ────────────────────────────────────────── */
  .styled-select {
    appearance: none;
    -webkit-appearance: none;
    background-color: var(--color-bg, #f4ecd8);
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b2e2e' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 0.6rem center;
    background-size: 12px;
    border: 1.5px solid rgba(107, 46, 46, 0.35);
    border-radius: 8px;
    padding: 0.5rem 2rem 0.5rem 0.65rem;
    font-size: 0.95rem;
    color: var(--color-text, #1f1b16);
    cursor: pointer;
    width: 100%;
    transition: border-color 0.15s, box-shadow 0.15s;
  }

  .styled-select:focus {
    outline: none;
    border-color: var(--color-primary, #6b2e2e);
    box-shadow: 0 0 0 3px rgba(107, 46, 46, 0.15);
  }

  .method-select {
    font-size: 1rem;
    font-weight: 600;
  }

  /* Compact select inside table cells */
  .score-select {
    padding: 0.25rem 1.5rem 0.25rem 0.4rem;
    font-size: 0.82rem;
    border-radius: 6px;
    min-width: 3.2rem;
    background-position: right 0.3rem center;
    background-size: 10px;
  }

  /* ── Styled Number Input ──────────────────────────────────── */
  .styled-input {
    background-color: var(--color-bg, #f4ecd8);
    border: 1.5px solid rgba(107, 46, 46, 0.35);
    border-radius: 8px;
    padding: 0.5rem 0.6rem;
    font-size: 0.95rem;
    color: var(--color-text, #1f1b16);
    width: 100%;
    transition: border-color 0.15s, box-shadow 0.15s;
  }

  .styled-input:focus {
    outline: none;
    border-color: var(--color-primary, #6b2e2e);
    box-shadow: 0 0 0 3px rgba(107, 46, 46, 0.15);
  }

  .styled-checkbox {
    width: 1.1rem;
    height: 1.1rem;
    accent-color: var(--color-primary, #6b2e2e);
    cursor: pointer;
    flex-shrink: 0;
  }

  /* ── Dice Config Grid ─────────────────────────────────────── */
  .dice-config {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.65rem;
    padding-top: 0.5rem;
    border-top: 1px solid rgba(107, 46, 46, 0.15);
  }

  .dice-field {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .dice-field label {
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--color-muted, #7a6b57);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .dice-field--check {
    flex-direction: row;
    align-items: center;
    gap: 0.5rem;
    padding-top: 1.2rem; /* align with other fields */
  }

  .dice-field--check label {
    text-transform: none;
    font-size: 0.88rem;
    letter-spacing: 0;
  }

  /* ── Table ────────────────────────────────────────────────── */
  .ability-table {
    width: 100%;
    border-collapse: collapse;
    background: var(--color-surface, #efe6d0);
    border-radius: var(--radius, 12px);
    overflow: hidden;
    box-shadow: var(--color-card-shadow, 0 6px 18px rgba(31, 27, 22, 0.06));
    table-layout: fixed;
  }

  .ability-table thead th {
    background-color: var(--color-primary, #6b2e2e);
    color: #f4ecd8;
    padding: 0.6rem 0.4rem;
    font-size: 0.8rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    text-align: center;
  }

  .ability-table tbody td {
    padding: 0.55rem 0.35rem;
    border-bottom: 1px solid rgba(107, 46, 46, 0.08);
    text-align: center;
    vertical-align: middle;
  }

  .ability-table tbody tr:last-child td {
    border-bottom: none;
  }

  /* Alternating row tint */
  .row-alt td {
    background-color: rgba(107, 46, 46, 0.03);
  }

  /* ── Column Widths ─────────────────────────────────────────── */
  .col-ability {
    width: 3.8rem;
  }

  .col-ctrl {
    width: 2.2rem;
  }

  .col-racial {
    width: 5rem;
  }

  .col-total {
    width: 3.5rem;
  }

  /* ── Ability Name Cell ─────────────────────────────────────── */
  .ability-name {
    font-size: 0.72rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--color-primary, #6b2e2e);
    text-align: left;
    padding-left: 0.6rem !important;
    white-space: nowrap;
  }

  /* ── Score Value ────────────────────────────────────────────── */
  .score-value {
    display: inline-block;
    font-size: 1.15rem;
    font-weight: 700;
    color: var(--color-text, #1f1b16);
    min-width: 1.5rem;
  }

  /* ── Roll Cell ─────────────────────────────────────────────── */
  .roll-cell {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.45rem;
  }

  /* ── Racial Bonus ──────────────────────────────────────────── */
  .racial-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: var(--color-accent, #c9a44b);
    color: #2a1f08;
    font-size: 0.88rem;
    font-weight: 800;
    border-radius: 99px;
    padding: 0.15rem 0.55rem;
    min-width: 2.2rem;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.18);
    letter-spacing: 0.02em;
  }

  /* ── Total Value ────────────────────────────────────────────── */
  .total-value {
    display: inline-block;
    font-size: 1.2rem;
    font-weight: 800;
    color: var(--color-primary, #6b2e2e);
    min-width: 1.5rem;
  }

  /* ── Points Remaining ─────────────────────────────────────── */
  .points-remaining {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
    background: var(--color-surface, #efe6d0);
    border: 1.5px solid var(--color-accent, #c9a44b);
    border-radius: 8px;
    padding: 0.55rem 0.85rem;
    font-size: 0.9rem;
    color: var(--color-text, #1f1b16);
  }

  .points-remaining strong {
    font-size: 1.1rem;
    color: #9a7620;
  }

  .error-msg {
    color: var(--color-danger, #b73b3b);
    font-size: 0.88rem;
    font-weight: 600;
  }

  /* ── Arrow / Dice Images ──────────────────────────────────── */
  img {
    cursor: pointer;
    display: block;
    margin: 0 auto;
    transition: transform 0.15s ease, opacity 0.15s ease;
  }

  img:hover {
    transform: scale(1.25);
  }

  /* ── Racial Choice Banner ────────────────────────────────── */
  .racial-choice-banner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: rgba(201, 164, 75, 0.1);
    border: 1.5px solid rgba(201, 164, 75, 0.4);
    border-radius: 8px;
    padding: 0.5rem 0.85rem;
    font-size: 0.9rem;
    color: var(--color-text, #1f1b16);
  }

  .racial-choice-pip {
    font-weight: 800;
    font-size: 0.88rem;
    color: var(--color-muted, #7a6b57);
    background: rgba(107, 46, 46, 0.07);
    border-radius: 99px;
    padding: 0.2rem 0.65rem;
    transition: background 0.2s, color 0.2s;
  }

  .racial-choice-pip--done {
    background: var(--color-accent, #c9a44b);
    color: #2a1f08;
  }

  /* ── Racial Toggle Button ────────────────────────────────── */
  .racial-counter {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.15rem;
  }

  .racial-counter-btn {
    appearance: none;
    -webkit-appearance: none;
    background: transparent;
    border: 1.5px solid rgba(201, 164, 75, 0.45);
    border-radius: 99px;
    width: 1.4rem;
    height: 1.4rem;
    font-size: 0.95rem;
    line-height: 1;
    font-weight: 700;
    color: var(--color-muted, #7a6b57);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    transition: background 0.15s, color 0.15s, border-color 0.15s;
    font-family: inherit;
    flex-shrink: 0;
  }

  .racial-counter-btn:hover:not(:disabled) {
    background: rgba(201, 164, 75, 0.15);
    border-color: var(--color-accent, #c9a44b);
    color: #9a7620;
  }

  .racial-counter-btn:disabled {
    opacity: 0.25;
    cursor: not-allowed;
  }

  .racial-counter-val {
    font-size: 0.85rem;
    font-weight: 700;
    color: var(--color-muted, #7a6b57);
    min-width: 1.6rem;
    text-align: center;
    transition: color 0.15s;
  }

  .racial-counter-val--active {
    color: #9a7620;
  }

  .racial-na {
    color: var(--color-muted, #7a6b57);
    font-size: 0.95rem;
    opacity: 0.4;
  }

  /* ── Responsive ───────────────────────────────────────────── */
  @media (max-width: 480px) {
    .ability-table thead th {
      padding: 0.45rem 0.2rem;
      font-size: 0.68rem;
    }

    .ability-table tbody td {
      padding: 0.4rem 0.2rem;
    }

    .ability-name {
      font-size: 0.65rem;
      padding-left: 0.35rem !important;
    }

    .score-value {
      font-size: 1rem;
    }

    .total-value {
      font-size: 1rem;
    }

    .racial-badge {
      font-size: 0.75rem;
      padding: 0.1rem 0.38rem;
      min-width: 1.8rem;
    }

    .score-select {
      font-size: 0.75rem;
    }

    .col-ctrl {
      width: 1.8rem;
    }

    .col-racial {
      width: 4rem;
    }

    .col-total {
      width: 2.8rem;
    }

    .col-ability {
      width: 3rem;
    }
  }
</style>
