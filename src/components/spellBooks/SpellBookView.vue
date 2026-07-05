<template>
  <Loading v-if="!loaded" message="Loading spellbook..." :size="96" variant="bold" />

  <div v-else-if="spellbook" class="spellbook-view">
    <h1>{{ spellbook.name }}</h1>
    <AccordianHolder header="json details">
        <pre>{{ spellbook }}</pre>
    </AccordianHolder>

    <div class="spellbook-details">
      <div class="detail-card">
        <h3>Spellcasting Info</h3>
        <p><strong>Ability:</strong> {{ spellbook.spellcastingAbility }}</p>
        <p><strong>DC:</strong> {{ spellbook.spellcastingDc }}</p>
        <p><strong>Attack Bonus:</strong> {{ spellbook.spellcastingAttackBonus }}</p>
      </div>

      <div v-if="Object.keys(spellbook.spellSlots).length > 0" class="detail-card">
        <div class="slots-header">
          <h3>Spell Slots</h3>
          <button class="refresh-btn" @click="refreshSlots">
            <img :src="reloadIcon" alt="Refresh" />
            Refresh
          </button>
        </div>
        <div class="spell-slots-grid">
          <div v-for="level in 9" :key="level" v-show="spellbook?.spellSlots[level]?.max! > 0" class="spell-level-row">
            <div class="level-label">Level {{ level }}</div>
            <div class="pips-container">
              <div
                v-for="slot in spellbook.spellSlots[level]?.max || 0"
                :key="`slot-${level}-${slot}`"
                class="pip"
                :class="{ available: slot > (spellbook.spellSlots[level]?.used || 0) }"
              >
                <img
                  v-show="slot > (spellbook.spellSlots[level]?.used || 0)"
                  :src="fireIcon"
                  alt=""
                  class="pip-icon"
                />
              </div>
            </div>
            <div class="slot-controls">
              <button
                class="slot-btn cast-btn"
                @click="castSlot(level)"
                :disabled="(spellbook.spellSlots[level]?.used || 0) >= (spellbook.spellSlots[level]?.max || 0)"
              >
                Cast
              </button>
              <button
                class="slot-btn restore-btn"
                @click="restoreSlot(level)"
                :disabled="(spellbook.spellSlots[level]?.used || 0) <= 0"
              >
                Restore
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-if="spellbook.cantrips.length > 0" class="detail-card">
        <h3>Cantrips ({{ spellbook.cantrips.length }})</h3>
        <ul class="spell-list">
          <li v-for="spell in spellbook.cantrips" :key="spell.name">
            {{ spell.name }}
          </li>
        </ul>
      </div>

      <div v-if="spellbook.spellsKnown.length > 0" class="detail-card">
        <h3>Spells Known ({{ spellbook.spellsKnown.length }})</h3>
        <ul class="spell-list">
          <li v-for="spell in spellbook.spellsKnown" :key="spell.name">
            {{ spell.name }} <span class="spell-level">(Level {{ spell.level }})</span>
          </li>
        </ul>
      </div>

      <div v-if="spellbook.spellsPrepared.length > 0" class="detail-card">
        <h3>Spells Prepared ({{ spellbook.spellsPrepared.length }})</h3>
        <ul class="spell-list">
          <li v-for="spell in spellbook.spellsPrepared" :key="spell.name">
            {{ spell.name }} <span class="spell-level">(Level {{ spell.level }})</span>
          </li>
        </ul>
      </div>

      <div v-if="spellbook.innateSpells.length > 0" class="detail-card">
        <h3>Innate Spells ({{ spellbook.innateSpells.length }})</h3>
        <ul class="spell-list">
          <li v-for="spell in spellbook.innateSpells" :key="spell.name">
            {{ spell.name }}
            <span class="spell-level" v-if="spell.usesPerDay"
              >({{ spell.usesPerDay }}/day)</span
            >
          </li>
        </ul>
      </div>
    </div>
  </div>

  <div v-else class="spellbook-error">
    <p>Spellbook not found.</p>
  </div>
</template>

<script lang="ts" setup>
  import { ref, onMounted, type Ref } from 'vue';
  import { useRoute } from 'vue-router';
  import { useSpellBookStore } from '../../stores/spellBookStore';
  import type { SpellBook } from '../../types';
  import Loading from '../resources/Loading.vue';
  import reloadIcon from '../../assets/icons/reload.svg';
  import fireIcon from '../../assets/icons/fire.svg';
import AccordianHolder from '../AccordianHolder.vue';

  const route = useRoute();
  const spellBookStore = useSpellBookStore();
  const spellbook: Ref<SpellBook | undefined> = ref(undefined);
  const loaded = ref(false);

  onMounted(async () => {
    const id = route.params.id as string;
    if (id) {
      try {
        spellbook.value = await spellBookStore.getSpellbookById(id);
      } catch (error) {
        console.error('Error loading spellbook:', error);
      }
    }
    loaded.value = true;
  });

  function castSlot(level: number) {
    if (!spellbook.value?.spellSlots[level]) return;
    const slotInfo = spellbook.value.spellSlots[level];
    if (slotInfo.used < slotInfo.max) {
      slotInfo.used += 1;
      saveSpellbook();
    }
  }

  function restoreSlot(level: number) {
    if (!spellbook.value?.spellSlots[level]) return;
    const slotInfo = spellbook.value.spellSlots[level];
    if (slotInfo.used > 0) {
      slotInfo.used -= 1;
      saveSpellbook();
    }
  }

  async function refreshSlots() {
    if (!spellbook.value) return;
    Object.keys(spellbook.value.spellSlots).forEach(level => {
      spellbook.value!.spellSlots[parseInt(level)]!.used = 0;
    });
    await saveSpellbook();
  }

  async function saveSpellbook() {
    if (!spellbook.value) return;
    try {
      await spellBookStore.updateSpellbook(spellbook.value);
    } catch (error) {
      console.error('Error saving spellbook:', error);
    }
  }
</script>

<style scoped>
  .spellbook-view {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    padding-bottom: 2rem;
  }

  .spellbook-details {
    display: grid;
    gap: 1.5rem;
  }

  .detail-card {
    padding: 1rem;
    border-radius: var(--radius);
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.01), transparent);
    border: 1px solid rgba(107, 46, 46, 0.12);
    box-shadow: var(--color-card-shadow);
  }

  .detail-card h3 {
    margin-top: 0;
    color: var(--color-primary);
  }

  .detail-card p {
    margin: 0.5rem 0;
    color: var(--color-text);
  }

  .detail-card strong {
    color: var(--color-primary);
  }

  .slots-table {
    width: 100%;
    border-collapse: collapse;
  }

  .slots-table td {
    padding: 0.5rem;
    border-bottom: 1px solid rgba(107, 46, 46, 0.1);
  }

  .slots-table td:first-child {
    font-weight: 600;
    width: 50%;
  }

  .slots-table td:last-child {
    text-align: right;
  }

  .spell-slots-grid {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
  }

  .slots-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 0.5rem;
  }

  .slots-header h3 {
    margin: 0;
  }

  .refresh-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.8rem;
    border: 1px solid rgba(107, 46, 46, 0.2);
    border-radius: 8px;
    background: rgba(201, 164, 75, 0.08);
    color: var(--color-primary);
    font-weight: 600;
    font-size: 0.85rem;
    cursor: pointer;
    transition: all 0.15s ease;
    white-space: nowrap;
  }

  .refresh-btn:hover {
    background: rgba(201, 164, 75, 0.16);
    border-color: var(--color-accent);
  }

  .refresh-btn img {
    width: 16px;
    height: 16px;
  }

  .spell-level-row {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .level-label {
    font-weight: 600;
    color: var(--color-primary);
    min-width: 4.5rem;
  }

  .pips-container {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
    flex: 1;
    min-width: 200px;
  }

  .slot-controls {
    display: flex;
    gap: 0.5rem;
  }

  .slot-btn {
    padding: 0.4rem 0.8rem;
    border: 1px solid rgba(107, 46, 46, 0.2);
    border-radius: 6px;
    background: rgba(201, 164, 75, 0.08);
    color: var(--color-primary);
    font-weight: 600;
    font-size: 0.8rem;
    cursor: pointer;
    transition: all 0.15s ease;
    white-space: nowrap;
  }

  .slot-btn:hover:not(:disabled) {
    background: rgba(201, 164, 75, 0.16);
    border-color: var(--color-accent);
  }

  .slot-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .cast-btn {
    background: rgba(183, 59, 59, 0.08);
    border-color: rgba(183, 59, 59, 0.2);
    color: var(--color-danger);
  }

  .cast-btn:hover:not(:disabled) {
    background: rgba(183, 59, 59, 0.16);
    border-color: var(--color-danger);
  }

  .restore-btn {
    background: rgba(107, 139, 107, 0.08);
    border-color: rgba(107, 139, 107, 0.2);
    color: #6b8b6b;
  }

  .restore-btn:hover:not(:disabled) {
    background: rgba(107, 139, 107, 0.16);
    border-color: #6b8b6b;
  }

  .pip {
    width: 1.5rem;
    height: 1.5rem;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.04);
    border: 2px solid rgba(107, 46, 46, 0.3);
    cursor: pointer;
    transition: all 0.15s ease;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .pip:hover {
    background: rgba(107, 46, 46, 0.08);
    border-color: var(--color-primary);
  }

  .pip.available {
    background: rgba(201, 164, 75, 0.12);
    border-color: var(--color-accent);
  }

  .pip.available:hover {
    background: rgba(201, 164, 75, 0.2);
    box-shadow: 0 0 8px rgba(201, 164, 75, 0.3);
  }

  .pip-icon {
    width: 1rem;
    height: 1rem;
    opacity: 0.8;
  }

  .spell-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }

  .spell-list li {
    padding: 0.6rem 0.8rem;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(107, 46, 46, 0.08);
  }

  .spell-level {
    font-size: 0.85rem;
    color: var(--color-muted);
    margin-left: 0.5rem;
  }

  .spellbook-error {
    padding: 2rem;
    text-align: center;
    border-radius: var(--radius);
    background: rgba(183, 59, 59, 0.08);
    border: 1px dashed rgba(183, 59, 59, 0.2);
    color: var(--color-danger);
  }
</style>