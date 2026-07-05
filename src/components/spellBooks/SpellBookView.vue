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
          <li v-for="spell in spellbook.cantrips" :key="spell.name" class="spell-item">
            <div class="spell-info" @click="selectedSpellForPopout = spell">
              {{ spell.name }}
            </div>
          </li>
        </ul>
      </div>

      <AccordianHolder v-if="spellbook.spellsPrepared.length > 0" header="Spells Prepared" class="detail-card">
        <div class="accordion-content">
          <ul class="spell-list">
            <li v-for="spell in spellbook.spellsPrepared" :key="spell.name" class="spell-item">
              <div class="spell-info" @click="selectedSpellForPopout = spell">
                {{ spell.name }} <span class="spell-level">(Level {{ spell.level }})</span>
              </div>
              <button
                class="spell-action-btn unprepare-btn"
                @click="unprepareSpell(spell)"
                title="Unprepare spell"
              >
                −
              </button>
            </li>
          </ul>
        </div>
      </AccordianHolder>

      <AccordianHolder v-if="spellbook.spellsKnown.length > 0" header="Spells Known" class="detail-card">
        <div class="accordion-content">
          <div class="spells-controls">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search spells..."
              class="search-input"
            />
            <div class="level-filter">
              <button
                class="level-btn"
                :class="{ active: selectedSpellLevel === null }"
                @click="selectedSpellLevel = null"
              >
                All
              </button>
              <button
                v-for="level in availableSpellLevels"
                :key="level"
                class="level-btn"
                :class="{ active: selectedSpellLevel === level }"
                @click="selectedSpellLevel = level"
              >
                {{ level }}
              </button>
            </div>
          </div>
          <ul class="spell-list">
            <li v-for="spell in filteredSpellsKnown" :key="spell.name" class="spell-item">
              <div class="spell-info" @click="selectedSpellForPopout = spell">
                {{ spell.name }} <span class="spell-level">(Level {{ spell.level }})</span>
              </div>
              <button
                class="spell-action-btn prepare-btn"
                @click="prepareSpell(spell)"
                :title="spellbook.spellsPrepared.some(s => s.name === spell.name) ? 'Already prepared' : 'Prepare spell'"
                :disabled="spellbook.spellsPrepared.some(s => s.name === spell.name)"
              >
                +
              </button>
            </li>
          </ul>
          <div v-if="filteredSpellsKnown.length === 0" class="no-spells">
            No spells match your filters.
          </div>
        </div>
      </AccordianHolder>
    </div>
  </div>

  <div v-else class="spellbook-error">
    <p>Spellbook not found.</p>
  </div>

  <PopOut v-if="selectedSpellForPopout" @close="selectedSpellForPopout = null">
    <SingleSpell :spell="selectedSpellForPopout" @close="selectedSpellForPopout = null" />
  </PopOut>
</template>

<script lang="ts" setup>
  import { ref, onMounted, computed, type Ref } from 'vue';
  import { useRoute } from 'vue-router';
  import { useSpellBookStore } from '../../stores/spellBookStore';
  import type { SpellBook } from '../../types';
  import Loading from '../resources/Loading.vue';
  import reloadIcon from '../../assets/icons/reload.svg';
  import fireIcon from '../../assets/icons/fire.svg';
  import AccordianHolder from '../AccordianHolder.vue';
import PopOut from '../PopOut.vue';
import SingleSpell from '../resources/SingleSpell.vue';

  const route = useRoute();
  const spellBookStore = useSpellBookStore();
  const spellbook: Ref<SpellBook | undefined> = ref(undefined);
  const loaded = ref(false);
  const searchQuery = ref('');
  const selectedSpellLevel: Ref<number | null> = ref(null);

    import type { Spell } from '../../types';
    const selectedSpellForPopout: Ref<Spell | null> = ref(null);

  const availableSpellLevels = computed(() => {
    if (!spellbook.value) return [];
    return Object.keys(spellbook.value.spellSlots)
      .map(Number)
      .filter(level => (spellbook.value!.spellSlots[level]?.max || 0) > 0)
      .sort((a, b) => a - b);
  });

  const filteredSpellsKnown = computed(() => {
    if (!spellbook.value) return [];

    let filtered = [...spellbook.value.spellsKnown];

    // Filter by available spell levels (only show spells of castable levels)
    const availableLevels = availableSpellLevels.value;
    filtered = filtered.filter(spell => availableLevels.includes(spell.level));

    // Filter by selected level
    if (selectedSpellLevel.value !== null) {
      filtered = filtered.filter(spell => spell.level === selectedSpellLevel.value);
    }

    // Filter by search query
    if (searchQuery.value.trim()) {
      const query = searchQuery.value.toLowerCase();
      filtered = filtered.filter(spell => spell.name.toLowerCase().includes(query));
    }

    // Sort by level, then by name
    filtered.sort((a, b) => {
      if (a.level !== b.level) return a.level - b.level;
      return a.name.localeCompare(b.name);
    });

    return filtered;
  });

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

  function prepareSpell(spell: Spell) {
    if (!spellbook.value) return;
    if (!spellbook.value.spellsPrepared.some(s => s.name === spell.name)) {
      spellbook.value.spellsPrepared.push(spell);
      saveSpellbook();
    }
  }

  function unprepareSpell(spell: Spell) {
    if (!spellbook.value) return;
    spellbook.value.spellsPrepared = spellbook.value.spellsPrepared.filter(s => s.name !== spell.name);
    saveSpellbook();
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

  .spell-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.8rem;
  }

  .spell-info {
    flex: 1;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .spell-info:hover {
    color: var(--color-accent);
  }

  .spell-action-btn {
    padding: 0.3rem 0.6rem;
    border: 1px solid rgba(107, 46, 46, 0.2);
    border-radius: 4px;
    background: rgba(201, 164, 75, 0.08);
    color: var(--color-primary);
    font-weight: 700;
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.15s ease;
    flex-shrink: 0;
    min-width: 2rem;
  }

  .spell-action-btn:hover:not(:disabled) {
    background: rgba(201, 164, 75, 0.16);
    border-color: var(--color-accent);
  }

  .spell-action-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .prepare-btn {
    background: rgba(107, 139, 107, 0.08);
    border-color: rgba(107, 139, 107, 0.2);
    color: #6b8b6b;
  }

  .prepare-btn:hover:not(:disabled) {
    background: rgba(107, 139, 107, 0.16);
    border-color: #6b8b6b;
  }

  .unprepare-btn {
    background: rgba(183, 59, 59, 0.08);
    border-color: rgba(183, 59, 59, 0.2);
    color: var(--color-danger);
  }

  .unprepare-btn:hover:not(:disabled) {
    background: rgba(183, 59, 59, 0.16);
    border-color: var(--color-danger);
  }

  .spell-level {
    font-size: 0.85rem;
    color: var(--color-muted);
    margin-left: 0.5rem;
  }

  .spells-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1rem;
  }

  .spells-header h3 {
    margin: 0;
  }

  .spells-controls {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
    margin-bottom: 1rem;
  }

  .search-input {
    padding: 0.6rem 0.8rem;
    border: 1px solid rgba(107, 46, 46, 0.2);
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.02);
    color: var(--color-text);
    font-size: 0.9rem;
    transition: all 0.15s ease;
  }

  .search-input:focus {
    outline: none;
    background: rgba(255, 255, 255, 0.04);
    border-color: var(--color-accent);
  }

  .search-input::placeholder {
    color: var(--color-muted);
  }

  .level-filter {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .level-btn {
    padding: 0.4rem 0.8rem;
    border: 1px solid rgba(107, 46, 46, 0.2);
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.02);
    color: var(--color-primary);
    font-weight: 600;
    font-size: 0.8rem;
    cursor: pointer;
    transition: all 0.15s ease;
    white-space: nowrap;
  }

  .level-btn:hover {
    background: rgba(107, 46, 46, 0.08);
    border-color: var(--color-primary);
  }

  .level-btn.active {
    background: var(--color-accent);
    border-color: var(--color-accent);
    color: var(--color-bg);
  }

  .no-spells {
    padding: 1rem;
    text-align: center;
    color: var(--color-muted);
    font-style: italic;
  }

  .accordion-content {
    padding: 0.5rem 0;
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