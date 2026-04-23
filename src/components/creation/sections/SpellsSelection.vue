<template>
  <div class="spells-selection">
    <h2>Spellcasting</h2>

    <!-- Non-spellcaster -->
    <div v-if="!profile || !profile.isSpellcaster" class="no-spells">
      <p>Your character has no spellcasting from their class, race, or background.</p>
      <button class="next-btn" @click="emit('nextStep')">Next</button>
    </div>

    <!-- Spellcaster -->
    <template v-else>
      <!-- Summary banner -->
      <div class="profile-summary">
        <p>
          <strong>Spellcasting type:</strong> {{ castingTypeLabel }}
          <span v-if="profile.spellcastingAbility">
            &nbsp;| <strong>Ability:</strong> {{ prettyAbility(profile.spellcastingAbility) }}
          </span>
        </p>
        <p><strong>Sources:</strong> {{ profile.sources.join(', ') }}</p>

        <!-- Spell slots -->
        <div v-if="Object.keys(profile.spellSlots).length > 0" class="spell-slots">
          <strong>Spell Slots at level {{ characterLevel }}:</strong>
          <span v-for="(slot, lvl) in profile.spellSlots" :key="lvl" class="slot-badge">
            {{ ordinal(Number(lvl)) }}: {{ slot.max }}
          </span>
        </div>
      </div>

      <!-- Innate / granted spells (race / background) -->
      <div v-if="profile.innateSpells.length > 0" class="section">
        <h3>Granted Spells (Race / Background)</h3>
        <p class="hint">
          These spells are granted by your race or background. They do not count against your spells
          known and cannot be swapped.
        </p>
        <table class="spells-table">
          <thead>
            <tr>
              <th>Spell</th>
              <th>Granted at level</th>
              <th>Casting ability</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(s, i) in profile.innateSpells" :key="i">
              <td>{{ s.name }}</td>
              <td>{{ s.level }}</td>
              <td>{{ prettyAbility(s.ability) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Expanded spell list (background, e.g. Strixhaven) -->
      <div v-if="profile.expandedSpellNames.length > 0" class="section">
        <h3>Expanded Spell List</h3>
        <p class="hint">
          These spells are added to your class spell list and can be prepared or learned normally.
        </p>
        <ul class="expanded-list">
          <li v-for="name in profile.expandedSpellNames" :key="name">{{ name }}</li>
        </ul>
      </div>

      <!-- Known / prepared spells (class casters) -->
      <div v-if="profile.canLearnSpells" class="section">
        <h3>
          {{ isPrepared ? 'Prepared Spells' : 'Known Spells' }}
          <span v-if="spellLimit > 0" class="limit-badge"
            >({{ selectedSpells.length }} / {{ spellLimit }})</span
          >
        </h3>
        <p class="hint">
          <template v-if="isPrepared">
            You prepare spells each day. Select your starting prepared spells below.
          </template>
          <template v-else> Select the spells you know at character creation. </template>
        </p>

        <!-- Filter controls -->
        <div class="filters">
          <input v-model="searchVal" placeholder="Search spells…" class="search-input" />
          <select v-model="filterLevel">
            <option value="">All levels</option>
            <option v-for="lvl in availableSlotLevels" :key="lvl" :value="lvl">
              {{ lvl === 0 ? 'Cantrip' : ordinal(lvl) + ' level' }}
            </option>
          </select>
        </div>

        <!-- Spell list -->
        <div class="spell-scroll">
          <table class="spells-table">
            <thead>
              <tr>
                <th>Spell</th>
                <th>Level</th>
                <th>School</th>
                <th>Select</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="spell in filteredSpells"
                :key="spell.name"
                :class="{ selected: isSelected(spell.name) }"
              >
                <td>{{ spell.name }}</td>
                <td>{{ spell.level === 0 ? 'Cantrip' : ordinal(spell.level) }}</td>
                <td>{{ getPrettySpellSchool(spell.school) }}</td>
                <td>
                  <input
                    type="checkbox"
                    :checked="isSelected(spell.name)"
                    :disabled="
                      !isSelected(spell.name) &&
                      spellLimit > 0 &&
                      selectedSpells.length >= spellLimit
                    "
                    @change="toggleSpell(spell.name)"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <button class="next-btn" @click="save">Next</button>
    </template>
  </div>
</template>

<script lang="ts" setup>
  import { computed, onMounted, ref } from 'vue';
  import { useCharacterStore } from '../../../stores/characterStore';
  import { useDataStore } from '../../../stores/dataStore';
  import { getPrettySpellSchool, getPrettyAbilityName } from '../../../helperFunctions';
  import type { SpellcastingProfile } from '../../../types';
  import type { Spell } from '../../../types';

  const emit = defineEmits<{ (e: 'nextStep'): void }>();

  const store = useCharacterStore();
  const dataStore = useDataStore();

  // Computed once on mount
  const profile = ref<SpellcastingProfile | null>(null);

  onMounted(() => {
    profile.value = store.computeAndApplySpellcasting();
  });

  const characterLevel = computed(() => {
    if (!store.currNewCharacter) return 1;
    return Object.values(store.currNewCharacter.classLevels).reduce((s, v) => s + v, 0) || 1;
  });

  const castingTypeLabel = computed(() => {
    switch (profile.value?.castingType) {
      case 'full':
        return 'Full caster';
      case 'half':
        return 'Half caster';
      case 'third':
        return '1/3 caster (subclass)';
      case 'pact':
        return 'Pact magic (Warlock)';
      case 'innate':
        return 'Innate spells only';
      default:
        return 'None';
    }
  });

  // Whether this caster prepares spells (Cleric, Druid, Paladin, Wizard) vs. knows them
  const isPrepared = computed(() => {
    const cls = store.currNewCharacter?.classes[0]?.name?.toLowerCase() ?? '';
    return ['cleric', 'druid', 'paladin', 'wizard', 'artificer'].includes(cls);
  });

  // Maximum spells: for simplicity allow cantrips + up to max slot level spells at creation.
  // Derived from class table if available, otherwise a sensible default.
  const spellLimit = computed(() => {
    if (!profile.value?.canLearnSpells) return 0;
    // Warlock/Bard/Ranger/Sorcerer know a fixed number; others prepare
    // Use 0 to mean "no hard cap enforced here" (preparers)
    if (isPrepared.value) return 0;
    // 1/3 casters at level 3 know 3 spells + cantrips
    if (profile.value.castingType === 'third') return characterLevel.value <= 2 ? 0 : 4;
    return 0;
  });

  // Slot levels available to this character (for filter)
  const availableSlotLevels = computed(() => {
    const lvls = [0]; // cantrips always
    if (!profile.value) return lvls;
    for (const slotLvl of Object.keys(profile.value.spellSlots)) {
      lvls.push(Number(slotLvl));
    }
    return lvls;
  });

  // Filter state
  const searchVal = ref('');
  const filterLevel = ref<number | ''>('');

  // Spells from dataStore filtered to class spell list
  const classSpells = computed<Spell[]>(() => {
    if (!profile.value?.canLearnSpells) return [];
    const className = store.currNewCharacter?.classes[0]?.name?.toLowerCase() ?? '';
    return dataStore.spells.filter((spell: Spell) => {
      const classesField = spell.classes;
      if (!classesField) return false;
      // The spells-full.json stores classes under spell.classes.fromClassList or similar
      const fromClassList: any[] = classesField.fromClassList ?? [];
      const fromSubclass: any[] = classesField.fromSubclassList ?? [];
      const inClass = fromClassList.some((c: any) => c.name?.toLowerCase() === className);
      const inSubclass =
        fromSubclass.length > 0 && store.currNewCharacter?.subclasses
          ? Object.values(store.currNewCharacter.subclasses)
              .flat()
              .some(sub =>
                fromSubclass.some(
                  (sc: any) =>
                    sc.subclassShortName?.toLowerCase() === sub.shortName?.toLowerCase() ||
                    sc.subclassName?.toLowerCase() === sub.name?.toLowerCase()
                )
              )
          : false;
      // Include expanded spells from background
      const inExpanded = profile.value!.expandedSpellNames.includes(spell.name);
      return inClass || inSubclass || inExpanded;
    });
  });

  const filteredSpells = computed<Spell[]>(() => {
    let list = classSpells.value;
    if (filterLevel.value !== '') {
      list = list.filter(s => s.level === Number(filterLevel.value));
    }
    if (searchVal.value.trim()) {
      const q = searchVal.value.toLowerCase();
      list = list.filter(s => s.name.toLowerCase().includes(q));
    }
    return list.slice(0, 200); // Cap for performance
  });

  // Selected spells
  const selectedSpells = ref<string[]>([]);

  function isSelected(name: string): boolean {
    return selectedSpells.value.includes(name);
  }

  function toggleSpell(name: string) {
    const idx = selectedSpells.value.indexOf(name);
    if (idx !== -1) {
      selectedSpells.value.splice(idx, 1);
    } else {
      selectedSpells.value.push(name);
    }
  }

  function prettyAbility(ab: string): string {
    return getPrettyAbilityName(ab);
  }

  function ordinal(n: number): string {
    if (n === 1) return '1st';
    if (n === 2) return '2nd';
    if (n === 3) return '3rd';
    return `${n}th`;
  }

  function save() {
    if (store.currNewCharacter && profile.value?.canLearnSpells) {
      const spellObjs = selectedSpells.value
        .map(name => dataStore.spells.find((s: Spell) => s.name === name))
        .filter(Boolean) as Spell[];
      if (isPrepared.value) {
        store.currNewCharacter.spellcasting.preparedSpells = spellObjs;
      } else {
        store.currNewCharacter.spellcasting.knownSpells = spellObjs;
      }
    }
    emit('nextStep');
  }
</script>

<style scoped>
  .spells-selection {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    max-width: 860px;
    margin: 0 auto;
  }

  .no-spells {
    text-align: center;
    padding: 2rem;
  }

  .profile-summary {
    background: var(--color-background-soft, #f4f4f4);
    border-radius: 6px;
    padding: 0.75rem 1rem;
  }

  .spell-slots {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    margin-top: 0.4rem;
    align-items: center;
  }

  .slot-badge {
    background: #5865f2;
    color: #fff;
    border-radius: 4px;
    padding: 0.1rem 0.5rem;
    font-size: 0.85rem;
  }

  .section {
    border-top: 1px solid var(--color-border, #ccc);
    padding-top: 0.75rem;
  }

  .hint {
    font-size: 0.875rem;
    color: var(--color-text-muted, #666);
    margin-bottom: 0.5rem;
  }

  .spells-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.9rem;
  }

  .spells-table th,
  .spells-table td {
    border: 1px solid var(--color-border, #ccc);
    padding: 0.35rem 0.6rem;
    text-align: left;
  }

  .spells-table tr.selected {
    background: #e8f0fe;
  }

  .spell-scroll {
    max-height: 360px;
    overflow-y: auto;
  }

  .filters {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
    flex-wrap: wrap;
  }

  .search-input {
    flex: 1;
    min-width: 160px;
    padding: 0.35rem 0.6rem;
    border: 1px solid var(--color-border, #ccc);
    border-radius: 4px;
  }

  .expanded-list {
    columns: 3;
    list-style: disc inside;
    font-size: 0.9rem;
    padding: 0;
  }

  .limit-badge {
    font-weight: normal;
    font-size: 0.85rem;
    color: var(--color-text-muted, #666);
  }

  .next-btn {
    align-self: flex-end;
    padding: 0.5rem 1.25rem;
    font-size: 1rem;
  }
</style>
