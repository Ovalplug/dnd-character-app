<template>
  <div class="char-abilities">
    <!-- ===== CLASS FEATURES ===== -->
    <section v-for="cls in character.classes" :key="cls.name" class="ability-section">
      <div class="section-header">
        <h2 class="section-title">{{ cls.name }}</h2>
        <span class="section-badge">Level {{ classLevel(cls) }}</span>
        <span v-if="getActiveSubclass(cls)" class="subclass-pill">
          {{ getActiveSubclass(cls)?.name }}
        </span>
      </div>

      <div class="feature-list">
        <template v-for="lvl in classLevel(cls)" :key="lvl">
          <!-- Class features at this level -->
          <template
            v-for="feat in classOnlyFeatures(cls.classFeatures, lvl)"
            :key="`${cls.name}-${lvl}-${feat.name}`"
          >
            <div
              class="feature-card"
              :class="{ 'feature-card--open': isOpen(`${cls.name}-${lvl}-${feat.name}`) }"
            >
              <button class="feature-toggle" @click="toggle(`${cls.name}-${lvl}-${feat.name}`)">
                <span class="feat-name">{{ feat.name }}</span>
                <span class="feat-badges">
                  <span class="level-tag">Lvl {{ lvl }}</span>
                  <span
                    class="chevron"
                    :class="{ 'chevron--open': isOpen(`${cls.name}-${lvl}-${feat.name}`) }"
                    >▼</span
                  >
                </span>
              </button>
              <div v-if="isOpen(`${cls.name}-${lvl}-${feat.name}`)" class="feature-body">
                <ResourceEntries v-if="feat.entries?.length" :entries="feat.entries" />
                <p v-else class="muted no-desc">No description available.</p>
              </div>
            </div>
          </template>

          <!-- Subclass features at this level -->
          <template v-if="getActiveSubclass(cls) && lvl >= cls.subclassAtLvl">
            <template
              v-for="sFeat in subclassFeaturesAtLevel(getActiveSubclass(cls)!, lvl)"
              :key="`${cls.name}-sub-${lvl}-${sFeat.name}`"
            >
              <div
                class="feature-card feature-card--subclass"
                :class="{ 'feature-card--open': isOpen(`${cls.name}-sub-${lvl}-${sFeat.name}`) }"
              >
                <button
                  class="feature-toggle"
                  @click="toggle(`${cls.name}-sub-${lvl}-${sFeat.name}`)"
                >
                  <span class="feat-name">{{ sFeat.name }}</span>
                  <span class="feat-badges">
                    <span class="level-tag level-tag--subclass">
                      Lvl {{ lvl }} · {{ getActiveSubclass(cls)?.name }}
                    </span>
                    <span
                      class="chevron"
                      :class="{ 'chevron--open': isOpen(`${cls.name}-sub-${lvl}-${sFeat.name}`) }"
                      >▼</span
                    >
                  </span>
                </button>
                <div v-if="isOpen(`${cls.name}-sub-${lvl}-${sFeat.name}`)" class="feature-body">
                  <ResourceEntries v-if="sFeat.entries?.length" :entries="sFeat.entries" />
                  <p v-else class="muted no-desc">No description available.</p>
                </div>
              </div>
            </template>
          </template>
        </template>
      </div>
    </section>

    <!-- ===== RACIAL TRAITS ===== -->
    <section v-if="character.race" class="ability-section">
      <div class="section-header">
        <h2 class="section-title">{{ character.race.name }} Traits</h2>
        <span class="section-badge section-badge--race">Racial</span>
        <span v-if="character.subrace" class="subclass-pill">
          {{ character.subrace.name }}
        </span>
      </div>

      <div class="feature-list">
        <template v-for="(entry, i) in namedRaceEntries" :key="`race-${i}`">
          <div
            class="feature-card feature-card--race"
            :class="{ 'feature-card--open': isOpen(`race-${i}`) }"
          >
            <button class="feature-toggle" @click="toggle(`race-${i}`)">
              <span class="feat-name">{{ (entry as any).name }}</span>
              <span class="feat-badges">
                <span class="level-tag level-tag--race">Trait</span>
                <span class="chevron" :class="{ 'chevron--open': isOpen(`race-${i}`) }">▼</span>
              </span>
            </button>
            <div v-if="isOpen(`race-${i}`)" class="feature-body">
              <ResourceEntries
                v-if="(entry as any).entries?.length"
                :entries="(entry as any).entries"
              />
              <p v-else-if="typeof (entry as any).entry === 'string'" class="muted">
                {{ (entry as any).entry }}
              </p>
              <p v-else class="muted no-desc">No description available.</p>
            </div>
          </div>
        </template>

        <!-- Subrace traits -->
        <template v-if="character.subrace?.entries">
          <template v-for="(entry, i) in namedSubraceEntries" :key="`subrace-${i}`">
            <div
              class="feature-card feature-card--subclass"
              :class="{ 'feature-card--open': isOpen(`subrace-${i}`) }"
            >
              <button class="feature-toggle" @click="toggle(`subrace-${i}`)">
                <span class="feat-name">{{ (entry as any).name }}</span>
                <span class="feat-badges">
                  <span class="level-tag level-tag--subclass">Subrace</span>
                  <span class="chevron" :class="{ 'chevron--open': isOpen(`subrace-${i}`) }"
                    >▼</span
                  >
                </span>
              </button>
              <div v-if="isOpen(`subrace-${i}`)" class="feature-body">
                <ResourceEntries
                  v-if="(entry as any).entries?.length"
                  :entries="(entry as any).entries"
                />
                <p v-else-if="typeof (entry as any).entry === 'string'">
                  {{ (entry as any).entry }}
                </p>
                <p v-else class="muted no-desc">No description available.</p>
              </div>
            </div>
          </template>
        </template>
      </div>
    </section>

    <!-- ===== FEATS ===== -->
    <section v-if="character.feats?.length" class="ability-section">
      <div class="section-header">
        <h2 class="section-title">Feats</h2>
        <span class="section-badge">{{ character.feats.length }}</span>
      </div>

      <div class="feature-list">
        <div
          v-for="(feat, i) in character.feats"
          :key="`feat-${i}`"
          class="feature-card feature-card--feat"
          :class="{ 'feature-card--open': isOpen(`feat-${i}`) }"
        >
          <button class="feature-toggle" @click="toggle(`feat-${i}`)">
            <span class="feat-name">{{ feat.name }}</span>
            <span class="feat-badges">
              <span class="level-tag level-tag--feat">Feat</span>
              <span class="chevron" :class="{ 'chevron--open': isOpen(`feat-${i}`) }">▼</span>
            </span>
          </button>
          <div v-if="isOpen(`feat-${i}`)" class="feature-body">
            <p v-if="feat.description" class="feat-desc">{{ feat.description }}</p>
            <ResourceEntries v-if="feat.entries?.length" :entries="feat.entries" />
            <p v-if="!feat.description && !feat.entries?.length" class="muted no-desc">
              No description available.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- ===== SPELLCASTING ===== -->
    <section v-if="spellInfo.isSpellcaster" class="ability-section">
      <div class="section-header">
        <h2 class="section-title">Spellcasting</h2>
        <span class="section-badge section-badge--spell">{{ prettyCastingMode }}</span>
      </div>

      <div class="spell-info-grid">
        <div v-if="spellInfo.spellcastingAbility" class="spell-stat">
          <span class="spell-stat-label">Ability</span>
          <span class="spell-stat-value">{{
            getPrettyAbilityName(spellInfo.spellcastingAbility).toUpperCase().slice(0, 3)
          }}</span>
        </div>
        <div v-if="character.spellcasting.spellSaveDC" class="spell-stat">
          <span class="spell-stat-label">Save DC</span>
          <span class="spell-stat-value">{{ character.spellcasting.spellSaveDC }}</span>
        </div>
        <div v-if="(character.spellcasting.spellAttackBonus ?? 0) !== 0" class="spell-stat">
          <span class="spell-stat-label">Atk Bonus</span>
          <span class="spell-stat-value">+{{ character.spellcasting.spellAttackBonus }}</span>
        </div>
        <div v-if="spellInfo.cantripsKnown > 0" class="spell-stat">
          <span class="spell-stat-label">Cantrips</span>
          <span class="spell-stat-value">{{ spellInfo.cantripsKnown }}</span>
        </div>
        <div v-if="spellInfo.spellsKnownCount > 0" class="spell-stat">
          <span class="spell-stat-label">Known</span>
          <span class="spell-stat-value">{{ spellInfo.spellsKnownCount }}</span>
        </div>
        <div v-if="spellInfo.maxPrepared > 0" class="spell-stat">
          <span class="spell-stat-label">Prepared</span>
          <span class="spell-stat-value">{{ spellInfo.maxPrepared }}</span>
        </div>
      </div>

      <!-- Spell Slots -->
      <div v-if="Object.keys(spellInfo.spellSlots).length > 0" class="spell-slots">
        <h3 class="subsection-title">Spell Slots</h3>
        <div v-for="(slot, level) in spellInfo.spellSlots" :key="level" class="slot-row">
          <span class="slot-level">{{ getPrettySpellLevel(Number(level)) }}</span>
          <div class="slot-pips">
            <span
              v-for="n in slot.max"
              :key="n"
              class="slot-pip"
              :class="{ 'slot-pip--used': n <= slot.used }"
            />
          </div>
          <span class="slot-count">{{ slot.max - slot.used }}/{{ slot.max }}</span>
        </div>
      </div>

      <!-- Innate Spells -->
      <div v-if="spellInfo.innateSpells.length > 0" class="innate-spells">
        <h3 class="subsection-title">Innate Spells</h3>
        <div v-for="spell in spellInfo.innateSpells" :key="spell.name" class="innate-spell">
          <span class="innate-spell-name">{{ spell.name }}</span>
          <span class="innate-spell-meta">
            {{ getPrettyAbilityName(spell.ability) }}
          </span>
        </div>
      </div>
    </section>

    <!-- Empty state -->
    <div
      v-if="!character.classes.length && !character.race && !character.feats?.length"
      class="empty-state"
    >
      <p class="muted">No abilities to display yet. Add a class, race, or feats to get started.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue';
  import type {
    playerCharacter,
    CharClass,
    ClassFeatures,
    ClassFeature,
    Subclass,
    Entry,
  } from '../../../types';
  import {
    computeCharSpellcasting,
    getFeaturesForLevel,
    getPrettyAbilityName,
    getPrettySpellLevel,
  } from '../../../helperFunctions';
  import ResourceEntries from '../../resources/ResourceEntries.vue';

  const props = defineProps<{
    character: playerCharacter;
  }>();

  // ── Collapse state ────────────────────────────────────────────────────────
  const openKeys = ref<Set<string>>(new Set());

  function isOpen(key: string): boolean {
    return openKeys.value.has(key);
  }

  function toggle(key: string): void {
    if (openKeys.value.has(key)) {
      openKeys.value.delete(key);
    } else {
      openKeys.value.add(key);
    }
    // Trigger reactivity on the Set
    openKeys.value = new Set(openKeys.value);
  }

  // ── Class helpers ─────────────────────────────────────────────────────────
  function classLevel(cls: CharClass): number {
    return (
      props.character.classLevels[
        cls.name.toLowerCase() as keyof typeof props.character.classLevels
      ] ?? 0
    );
  }

  function classOnlyFeatures(features: ClassFeatures, level: number): ClassFeature[] {
    return getFeaturesForLevel(features, level).filter(f => !f.gainSubclassFeature);
  }

  function getActiveSubclass(cls: CharClass): Subclass | undefined {
    const subs =
      props.character.subclasses?.[cls.name] ??
      props.character.subclasses?.[cls.name.toLowerCase()];
    return subs?.[0];
  }

  function subclassFeaturesAtLevel(subclass: Subclass, level: number): ClassFeature[] {
    if (!subclass.subclassFeatures) return [];
    return getFeaturesForLevel(subclass.subclassFeatures, level);
  }

  // ── Race helpers ──────────────────────────────────────────────────────────
  function isNamedEntry(entry: Entry): boolean {
    return (
      typeof entry !== 'string' &&
      !!(entry as any).name &&
      ((entry as any).entries?.length || typeof (entry as any).entry === 'string')
    );
  }

  const namedRaceEntries = computed((): Entry[] => {
    return (props.character.race?.entries ?? []).filter(isNamedEntry);
  });

  const namedSubraceEntries = computed((): Entry[] => {
    return (props.character.subrace?.entries ?? []).filter(isNamedEntry);
  });

  // ── Spellcasting ──────────────────────────────────────────────────────────
  const spellInfo = computed(() => computeCharSpellcasting(props.character));

  const prettyCastingMode = computed(() => {
    switch (spellInfo.value.castingMode) {
      case 'known':
        return 'Known Spells';
      case 'prepared':
        return 'Prepared';
      case 'spellbook':
        return 'Spellbook';
      case 'innate':
        return 'Innate';
      default:
        return '';
    }
  });
</script>

<style scoped>
  .char-abilities {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    padding-bottom: 2rem;
  }

  /* ── Section ── */
  .ability-section {
    background: var(--color-surface);
    border-radius: var(--radius);
    box-shadow: var(--color-card-shadow);
    overflow: hidden;
  }

  .section-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid rgba(31, 27, 22, 0.08);
    flex-wrap: wrap;
  }

  .section-title {
    font-size: 1rem;
    font-weight: 700;
    color: var(--color-primary);
    margin: 0;
    flex: 1;
    min-width: 0;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .section-badge {
    font-size: 0.7rem;
    font-weight: 700;
    padding: 0.15rem 0.5rem;
    border-radius: 20px;
    background: rgba(107, 46, 46, 0.1);
    color: var(--color-primary);
    white-space: nowrap;
  }

  .section-badge--race {
    background: rgba(74, 107, 46, 0.12);
    color: #4a6b2e;
  }

  .section-badge--spell {
    background: rgba(46, 74, 107, 0.12);
    color: #2e4a6b;
  }

  .subclass-pill {
    font-size: 0.72rem;
    font-weight: 600;
    padding: 0.15rem 0.55rem;
    border-radius: 20px;
    background: rgba(201, 164, 75, 0.18);
    color: #7a5d1a;
    border: 1px solid rgba(201, 164, 75, 0.3);
    white-space: nowrap;
  }

  /* ── Feature list ── */
  .feature-list {
    display: flex;
    flex-direction: column;
  }

  /* ── Feature card ── */
  .feature-card {
    border-bottom: 1px solid rgba(31, 27, 22, 0.06);
  }

  .feature-card:last-child {
    border-bottom: none;
  }

  .feature-card--subclass .feature-toggle {
    border-left: 3px solid var(--color-accent);
  }

  .feature-card--race .feature-toggle {
    border-left: 3px solid #7aab4b;
  }

  .feature-card--feat .feature-toggle {
    border-left: 3px solid #6b7aab;
  }

  /* ── Toggle button ── */
  .feature-toggle {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    padding: 0.6rem 1rem;
    background: transparent;
    border: none;
    cursor: pointer;
    text-align: left;
    color: var(--color-text);
    transition: background 0.15s;
  }

  .feature-toggle:hover {
    background: rgba(201, 164, 75, 0.06);
  }

  .feature-card--open > .feature-toggle {
    background: rgba(201, 164, 75, 0.08);
  }

  .feat-name {
    font-size: 0.9rem;
    font-weight: 600;
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .feat-badges {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    flex-shrink: 0;
  }

  /* ── Level tags ── */
  .level-tag {
    font-size: 0.65rem;
    font-weight: 700;
    padding: 0.1rem 0.4rem;
    border-radius: 12px;
    background: rgba(107, 46, 46, 0.1);
    color: var(--color-primary);
    white-space: nowrap;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  .level-tag--subclass {
    background: rgba(201, 164, 75, 0.18);
    color: #7a5d1a;
  }

  .level-tag--race {
    background: rgba(74, 107, 46, 0.12);
    color: #4a6b2e;
  }

  .level-tag--feat {
    background: rgba(46, 74, 107, 0.12);
    color: #2e4a6b;
  }

  /* ── Chevron ── */
  .chevron {
    font-size: 0.6rem;
    color: var(--color-muted);
    transition: transform 0.2s;
    display: inline-block;
  }

  .chevron--open {
    transform: rotate(180deg);
  }

  /* ── Feature body ── */
  .feature-body {
    padding: 0.75rem 1rem 1rem;
    border-top: 1px solid rgba(31, 27, 22, 0.06);
    background: rgba(255, 255, 255, 0.4);
    font-size: 0.88rem;
    line-height: 1.6;
  }

  .feature-body :deep(p) {
    margin: 0.35rem 0;
    font-size: 0.88rem;
    color: var(--color-text);
  }

  .feature-body :deep(ul) {
    padding-left: 1.25rem;
    margin: 0.35rem 0;
  }

  .feature-body :deep(strong) {
    color: var(--color-primary);
  }

  .no-desc {
    font-style: italic;
    opacity: 0.7;
    margin: 0 !important;
  }

  /* ── Spellcasting ── */
  .spell-info-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid rgba(31, 27, 22, 0.06);
  }

  .spell-stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    background: rgba(46, 74, 107, 0.06);
    border: 1px solid rgba(46, 74, 107, 0.12);
    border-radius: 10px;
    padding: 0.35rem 0.75rem;
    min-width: 60px;
  }

  .spell-stat-label {
    font-size: 0.6rem;
    font-weight: 700;
    color: #2e4a6b;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .spell-stat-value {
    font-size: 1rem;
    font-weight: 700;
    color: var(--color-text);
  }

  .subsection-title {
    font-size: 0.8rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-muted);
    margin: 0 0 0.5rem;
  }

  /* ── Spell slots ── */
  .spell-slots {
    padding: 0.75rem 1rem;
    border-bottom: 1px solid rgba(31, 27, 22, 0.06);
  }

  .slot-row {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.25rem 0;
  }

  .slot-level {
    font-size: 0.78rem;
    font-weight: 600;
    color: var(--color-text);
    min-width: 90px;
  }

  .slot-pips {
    display: flex;
    gap: 0.3rem;
    flex: 1;
  }

  .slot-pip {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: rgba(46, 74, 107, 0.25);
    border: 1.5px solid rgba(46, 74, 107, 0.4);
    display: inline-block;
    transition: background 0.15s;
  }

  .slot-pip--used {
    background: rgba(31, 27, 22, 0.12);
    border-color: rgba(31, 27, 22, 0.15);
  }

  .slot-count {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--color-muted);
    min-width: 36px;
    text-align: right;
  }

  /* ── Innate spells ── */
  .innate-spells {
    padding: 0.75rem 1rem;
  }

  .innate-spell {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.3rem 0;
    border-bottom: 1px solid rgba(31, 27, 22, 0.05);
    font-size: 0.88rem;
  }

  .innate-spell:last-child {
    border-bottom: none;
  }

  .innate-spell-name {
    font-weight: 600;
  }

  .innate-spell-meta {
    font-size: 0.75rem;
    color: var(--color-muted);
  }

  /* ── Empty state ── */
  .empty-state {
    text-align: center;
    padding: 3rem 1rem;
    background: var(--color-surface);
    border-radius: var(--radius);
    box-shadow: var(--color-card-shadow);
  }
</style>
