<template>
  <div class="replay-viewer">
    <div class="replay-viewer__header">
      <h3 class="replay-viewer__title">Turn-by-Turn Replay</h3>
      <p class="replay-viewer__subtitle" v-if="currentTurn">
        Turn {{ currentTurnIndex + 1 }} of {{ totalTurns }}
      </p>
    </div>

    <div class="replay-viewer__controls">
      <button class="btn btn--secondary" @click="previousTurn" :disabled="currentTurnIndex <= 0">
        ← Previous
      </button>

      <button class="btn btn--primary" @click="togglePlayPause">
        {{ isPlaying ? 'Pause' : 'Play' }}
      </button>

      <button
        class="btn btn--secondary"
        @click="nextTurn"
        :disabled="currentTurnIndex >= totalTurns - 1"
      >
        Next →
      </button>

      <div class="replay-viewer__speed">
        <label class="replay-viewer__speed-label">Speed:</label>
        <input
          v-model.number="playbackSpeed"
          type="range"
          min="0.5"
          max="3"
          step="0.5"
          class="replay-viewer__speed-slider"
        />
        <span class="replay-viewer__speed-value">{{ playbackSpeed }}x</span>
      </div>
    </div>

    <div v-if="currentTurn" class="replay-viewer__content">
      <div class="replay-viewer__turn-info">
        <div class="replay-viewer__info-section">
          <h4 class="replay-viewer__section-title">
            Round {{ currentTurn.round + 1 }} / Turn {{ currentTurnIndex + 1 }}
          </h4>
          <div class="replay-viewer__combatant">
            <span class="replay-viewer__combatant-name">{{ currentTurn.combatantName }}</span>
            <span
              class="replay-viewer__combatant-team"
              :class="`team-${currentTurn.combatantTeam}`"
            >
              {{ currentTurn.combatantTeam }}
            </span>
          </div>
        </div>

        <div class="replay-viewer__action-section">
          <h4 class="replay-viewer__section-title">Action</h4>
          <div class="replay-viewer__action">
            <span class="replay-viewer__action-type">{{ currentTurn.actionTaken.type }}</span>
            <span class="replay-viewer__action-name">{{ currentTurn.actionTaken.name }}</span>
          </div>
          <p class="replay-viewer__action-desc">{{ currentTurn.actionTaken.description }}</p>
        </div>

        <div class="replay-viewer__outcome-section">
          <h4 class="replay-viewer__section-title">Outcome</h4>
          <div class="replay-viewer__outcome-stats">
            <div class="replay-viewer__stat">
              <span class="replay-viewer__stat-label">Result:</span>
              <span class="replay-viewer__stat-value">
                {{ currentTurn.outcome.success ? 'Success' : 'Failed' }}
              </span>
            </div>
            <div v-if="currentTurn.outcome.damageDealt" class="replay-viewer__stat">
              <span class="replay-viewer__stat-label">Damage Dealt:</span>
              <span class="replay-viewer__stat-value">{{ currentTurn.outcome.damageDealt }}</span>
            </div>

            <!-- Dice breakdown -->
            <div v-if="currentTurn.outcome.damageBreakdown" class="replay-viewer__dice-breakdown">
              <div class="replay-viewer__dice-expr">
                <span class="dice-expr__label">Roll:</span>
                <code class="dice-expr__value">{{
                  currentTurn.outcome.damageBreakdown.expression
                }}</code>
                <span v-if="currentTurn.outcome.damageBreakdown.isCrit" class="dice-expr__crit"
                  >CRIT</span
                >
              </div>
              <div
                v-for="(group, gi) in currentTurn.outcome.damageBreakdown.groups"
                :key="gi"
                class="replay-viewer__dice-group"
              >
                <span class="dice-group__notation">{{ group.expression }}</span>
                <span class="dice-group__rolls">[{{ group.rolls.join(', ') }}]</span>
                <span class="dice-group__subtotal">= {{ group.subtotal }}</span>
              </div>
              <div
                v-if="currentTurn.outcome.damageBreakdown.modifier !== 0"
                class="replay-viewer__dice-mod"
              >
                Modifier:
                <strong
                  >{{ currentTurn.outcome.damageBreakdown.modifier > 0 ? '+' : ''
                  }}{{ currentTurn.outcome.damageBreakdown.modifier }}</strong
                >
              </div>
              <div class="replay-viewer__dice-total">
                Raw total: <strong>{{ currentTurn.outcome.damageBreakdown.rawTotal }}</strong>
                <span
                  v-if="
                    currentTurn.outcome.damageBreakdown.total !==
                    currentTurn.outcome.damageBreakdown.rawTotal
                  "
                  class="dice-total__adjusted"
                >
                  → {{ currentTurn.outcome.damageBreakdown.total }} ({{
                    currentTurn.outcome.damageBreakdown.damageType
                  }})
                </span>
              </div>
            </div>
          </div>

          <div v-if="currentTurn.outcome.events.length > 0" class="replay-viewer__events">
            <h5 class="replay-viewer__events-title">Events</h5>
            <ul class="replay-viewer__event-list">
              <li
                v-for="(event, idx) in currentTurn.outcome.events"
                :key="idx"
                class="replay-viewer__event-item"
              >
                {{ event }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="replay-viewer__empty">
      <p>No turns to replay</p>
    </div>

    <details v-if="currentTurn" class="replay-viewer__raw">
      <summary class="replay-viewer__raw-summary">Raw turn data</summary>
      <pre class="replay-viewer__raw-pre">{{ JSON.stringify(currentTurn, null, 2) }}</pre>
    </details>

    <div class="replay-viewer__timeline">
      <div class="replay-viewer__timeline-track">
        <div
          class="replay-viewer__timeline-progress"
          :style="{ width: `${(currentTurnIndex / (totalTurns - 1 || 1)) * 100}%` }"
        ></div>
        <input
          type="range"
          min="0"
          :max="totalTurns - 1"
          :value="currentTurnIndex"
          class="replay-viewer__timeline-slider"
          @input="scrubToTurn"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, watch, onUnmounted } from 'vue';
  import type { TurnEvent } from '../../types';

  const props = defineProps<{
    turnLog: TurnEvent[];
  }>();

  const currentTurnIndex = ref(0);
  const isPlaying = ref(false);
  const playbackSpeed = ref(1);
  let playbackInterval: number | null = null;

  const totalTurns = computed(() => props.turnLog.length);
  const currentTurn = computed(() => {
    if (currentTurnIndex.value < props.turnLog.length) {
      return props.turnLog[currentTurnIndex.value];
    }
    return null;
  });

  function nextTurn(): void {
    if (currentTurnIndex.value < totalTurns.value - 1) {
      currentTurnIndex.value++;
    } else {
      isPlaying.value = false;
    }
  }

  function previousTurn(): void {
    if (currentTurnIndex.value > 0) {
      currentTurnIndex.value--;
    }
  }

  function togglePlayPause(): void {
    isPlaying.value = !isPlaying.value;
  }

  function scrubToTurn(event: Event): void {
    const target = event.target as HTMLInputElement;
    currentTurnIndex.value = parseInt(target.value, 10);
    isPlaying.value = false;
  }

  // Watch isPlaying and manage playback interval
  watch(isPlaying, playing => {
    if (playbackInterval !== null) {
      clearInterval(playbackInterval);
      playbackInterval = null;
    }

    if (playing && totalTurns.value > 0) {
      const delay = Math.max(100, 2000 / playbackSpeed.value);
      playbackInterval = window.setInterval(() => {
        nextTurn();
      }, delay);
    }
  });

  // Cleanup on unmount
  onUnmounted(() => {
    if (playbackInterval !== null) {
      clearInterval(playbackInterval);
    }
  });
</script>

<style scoped>
  .replay-viewer {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    padding: 1.5rem;
    background: var(--color-surface);
    border-radius: var(--radius);
  }

  .replay-viewer__header {
    text-align: center;
    border-bottom: 1px solid var(--color-muted);
    padding-bottom: 1rem;
  }

  .replay-viewer__title {
    margin: 0 0 0.5rem;
    font-size: 1.25rem;
    color: var(--color-primary);
  }

  .replay-viewer__subtitle {
    margin: 0;
    font-size: 0.875rem;
    color: var(--color-muted);
  }

  .replay-viewer__controls {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
    align-items: center;
  }

  .replay-viewer__speed {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .replay-viewer__speed-label {
    font-size: 0.875rem;
    color: var(--color-text);
  }

  .replay-viewer__speed-slider {
    width: 100px;
    cursor: pointer;
  }

  .replay-viewer__speed-value {
    min-width: 40px;
    font-size: 0.875rem;
    color: var(--color-text);
    font-weight: 600;
  }

  .replay-viewer__content {
    display: grid;
    gap: 1.5rem;
  }

  .replay-viewer__turn-info {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1.5rem;
  }

  .replay-viewer__info-section,
  .replay-viewer__action-section,
  .replay-viewer__outcome-section {
    padding: 1rem;
    background: var(--color-bg);
    border-radius: 8px;
    border-left: 3px solid var(--color-accent);
  }

  .replay-viewer__section-title {
    margin: 0 0 0.75rem;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-primary);
    text-transform: uppercase;
  }

  .replay-viewer__combatant {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .replay-viewer__combatant-name {
    font-weight: 600;
    color: var(--color-text);
  }

  .replay-viewer__combatant-team {
    font-size: 0.75rem;
    font-weight: 600;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    text-transform: uppercase;
  }

  .team-allies {
    background: rgba(107, 46, 46, 0.2);
    color: var(--color-primary);
  }

  .team-enemies {
    background: rgba(185, 59, 59, 0.2);
    color: var(--color-danger);
  }

  .replay-viewer__action {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .replay-viewer__action-type {
    font-size: 0.75rem;
    color: var(--color-muted);
    text-transform: uppercase;
  }

  .replay-viewer__action-name {
    font-weight: 600;
    color: var(--color-text);
  }

  .replay-viewer__action-desc {
    margin: 0.5rem 0 0;
    font-size: 0.875rem;
    color: var(--color-text);
    font-style: italic;
  }

  .replay-viewer__outcome-stats {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .replay-viewer__stat {
    display: flex;
    justify-content: space-between;
    font-size: 0.875rem;
  }

  .replay-viewer__stat-label {
    color: var(--color-muted);
  }

  .replay-viewer__stat-value {
    font-weight: 600;
    color: var(--color-text);
  }

  .replay-viewer__events {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid var(--color-muted);
  }

  .replay-viewer__events-title {
    margin: 0 0 0.5rem;
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--color-primary);
    text-transform: uppercase;
  }

  .replay-viewer__event-list {
    margin: 0;
    padding: 0 0 0 1.5rem;
    list-style: disc;
  }

  .replay-viewer__event-item {
    font-size: 0.875rem;
    color: var(--color-text);
    margin-bottom: 0.25rem;
  }

  .replay-viewer__empty {
    padding: 2rem;
    text-align: center;
    color: var(--color-muted);
  }

  /* Dice breakdown */
  .replay-viewer__dice-breakdown {
    margin-top: 0.75rem;
    padding: 0.625rem;
    background: var(--color-bg);
    border-radius: 6px;
    font-size: 0.8rem;
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }

  .replay-viewer__dice-expr {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    flex-wrap: wrap;
  }

  .dice-expr__label {
    color: var(--color-muted);
    font-size: 0.72rem;
  }
  .dice-expr__value {
    font-family: 'Courier New', monospace;
    color: var(--color-text);
  }
  .dice-expr__crit {
    padding: 0.1rem 0.4rem;
    background: var(--color-danger);
    color: #fff;
    border-radius: 4px;
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.05em;
  }

  .replay-viewer__dice-group {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding-left: 0.5rem;
    border-left: 2px solid var(--color-accent);
  }

  .dice-group__notation {
    color: var(--color-muted);
    min-width: 48px;
    font-size: 0.72rem;
  }
  .dice-group__rolls {
    font-family: 'Courier New', monospace;
    color: var(--color-text);
    flex: 1;
  }
  .dice-group__subtotal {
    font-weight: 600;
    color: var(--color-accent);
  }

  .replay-viewer__dice-mod {
    color: var(--color-muted);
    font-size: 0.78rem;
    padding-left: 0.5rem;
  }
  .replay-viewer__dice-total {
    padding-top: 0.25rem;
    border-top: 1px solid var(--color-muted);
    font-size: 0.78rem;
    color: var(--color-text);
  }
  .dice-total__adjusted {
    color: var(--color-primary);
    margin-left: 0.25rem;
  }

  .replay-viewer__raw {
    border: 1px solid var(--color-muted);
    border-radius: var(--radius);
    background: var(--color-surface);
    overflow: hidden;
  }

  .replay-viewer__raw-summary {
    padding: 0.5rem 0.75rem;
    cursor: pointer;
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--color-muted);
    text-transform: uppercase;
    user-select: none;
  }

  .replay-viewer__raw-pre {
    margin: 0;
    padding: 0.75rem;
    background: var(--color-bg);
    font-family: 'Courier New', monospace;
    font-size: 0.72rem;
    color: var(--color-text);
    overflow-x: auto;
    max-height: 320px;
    overflow-y: auto;
    white-space: pre;
  }

  .replay-viewer__timeline {
    padding: 1rem 0;
    border-top: 1px solid var(--color-muted);
  }

  .replay-viewer__timeline-track {
    position: relative;
    height: 6px;
    background: var(--color-bg);
    border-radius: 3px;
    overflow: hidden;
  }

  .replay-viewer__timeline-progress {
    position: absolute;
    height: 100%;
    background: var(--color-accent);
    transition: width 0.1s;
    pointer-events: none;
  }

  .replay-viewer__timeline-slider {
    position: relative;
    width: 100%;
    height: 100%;
    cursor: pointer;
    appearance: none;
    background: transparent;
    border: none;
    padding: 0;
    margin: 0;
  }

  .replay-viewer__timeline-slider::-webkit-slider-thumb {
    appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: var(--color-primary);
    cursor: pointer;
    box-shadow: 0 0 4px rgba(0, 0, 0, 0.3);
  }

  .replay-viewer__timeline-slider::-moz-range-thumb {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: var(--color-primary);
    cursor: pointer;
    border: none;
    box-shadow: 0 0 4px rgba(0, 0, 0, 0.3);
  }
</style>
