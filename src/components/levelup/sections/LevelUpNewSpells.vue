<template>
  <section class="creation-panel">
    <div class="creation-intro">
      <p v-if="analysis.castingMode === 'prepared'">
        As a <strong>{{ castingModeName }}</strong
        >, your prepared spell list changes after each long rest. No spell selections are needed at
        level-up — you'll prepare your spells as normal.
      </p>
      <p v-else>
        Choose any new spells gained at this level for
        <strong>{{ classData.name }} {{ analysis.newClassLevel }}</strong
        >.
      </p>
    </div>

    <div class="creation-actions creation-actions--top">
      <button type="button" class="creation-primary-button" :disabled="!isValid" @click="confirm">
        Continue
      </button>
    </div>

    <!-- Prepared casters: nothing to pick, just show slot info -->
    <template v-if="analysis.castingMode === 'prepared'">
      <div v-if="analysis.newSpellSlotsDescription.length" class="slots-info card">
        <p class="slots-info__heading">New spell slots at this level</p>
        <div v-for="desc in analysis.newSpellSlotsDescription" :key="desc" class="slots-info__row">
          <span>{{ desc }}</span>
        </div>
      </div>
    </template>

    <!-- Cantrip picker -->
    <template v-if="analysis.cantripsDelta > 0">
      <div class="spells-section">
        <h3 class="spells-section__heading">
          Choose new cantrip{{ analysis.cantripsDelta !== 1 ? 's' : '' }}
          <span class="limit-badge"
            >{{ selectedCantrips.length }} / {{ analysis.cantripsDelta }}</span
          >
        </h3>
        <p class="panel-copy">
          Pick {{ analysis.cantripsDelta }} new cantrip{{
            analysis.cantripsDelta !== 1 ? 's' : ''
          }}
          from the {{ classData.name }} spell list.
        </p>

        <p v-if="isLoadingSpells" class="panel-copy">Loading spells…</p>
        <LearnSpells
          v-else
          :spells="classCantrips"
          :limit="analysis.cantripsDelta"
          :model-value="selectedCantrips"
          @update:model-value="selectedCantrips = $event"
        />
      </div>
    </template>

    <!-- Spells known / spellbook picker -->
    <template v-if="analysis.spellsKnownDelta > 0">
      <div class="spells-section">
        <h3 class="spells-section__heading">
          <template v-if="analysis.castingMode === 'spellbook'"> Add to spellbook </template>
          <template v-else>
            Learn new spell{{ analysis.spellsKnownDelta !== 1 ? 's' : '' }}
          </template>
          <span class="limit-badge">
            {{ selectedSpells.length }} / {{ analysis.spellsKnownDelta }}
          </span>
        </h3>
        <p class="panel-copy">
          <template v-if="analysis.castingMode === 'spellbook'">
            Add {{ analysis.spellsKnownDelta }} spell{{
              analysis.spellsKnownDelta !== 1 ? 's' : ''
            }}
            to your spellbook (free copies gained at level-up per the rules).
          </template>
          <template v-else>
            Choose {{ analysis.spellsKnownDelta }} new spell{{
              analysis.spellsKnownDelta !== 1 ? 's' : ''
            }}. These replace nothing — existing spells stay.
          </template>
        </p>

        <p v-if="isLoadingSpells" class="panel-copy">Loading spells…</p>
        <LearnSpells
          v-else
          :spells="classLeveledSpells"
          :limit="analysis.spellsKnownDelta"
          :model-value="selectedSpells"
          @update:model-value="selectedSpells = $event"
        />
      </div>
    </template>

    <div class="creation-actions">
      <button type="button" class="creation-primary-button" :disabled="!isValid" @click="confirm">
        Continue
      </button>
    </div>
  </section>
</template>

<script lang="ts" setup>
  import { computed, onMounted, ref } from 'vue';
  import type { CharClass, playerCharacter, Spell } from '../../../types';
  import type { LevelUpAnalysis } from '../levelUpHelpers';
  import { useDataStore } from '../../../stores/dataStore';
  import LearnSpells from '../../creation/sections/LearnSpells.vue';

  const props = defineProps<{
    character: playerCharacter;
    classData: CharClass;
    analysis: LevelUpAnalysis;
  }>();

  const emit = defineEmits<{
    (e: 'nextStep', cantrips: Spell[], spells: Spell[]): void;
  }>();

  const dataStore = useDataStore();
  const isLoadingSpells = ref(false);
  const selectedCantrips = ref<string[]>([]);
  const selectedSpells = ref<string[]>([]);

  onMounted(async () => {
    if (!dataStore.loaded) {
      isLoadingSpells.value = true;
      try {
        await dataStore.init();
      } finally {
        isLoadingSpells.value = false;
      }
    }
  });

  const castingModeName = computed(() => {
    switch (props.analysis.castingMode) {
      case 'prepared':
        return 'prepared caster';
      case 'spellbook':
        return 'spellbook caster';
      case 'known':
        return 'known-spell caster';
      default:
        return 'caster';
    }
  });

  const className = computed(() => props.classData.name.toLowerCase());

  const allClassSpells = computed<Spell[]>(() => {
    return dataStore.spells.filter((spell: Spell) => {
      const fromClassList: unknown[] = (spell.classes?.fromClassList as unknown[]) ?? [];
      return fromClassList.some(
        (c: unknown) => (c as { name?: string }).name?.toLowerCase() === className.value
      );
    });
  });

  const classCantrips = computed<Spell[]>(() => allClassSpells.value.filter(s => s.level === 0));

  const classLeveledSpells = computed<Spell[]>(() =>
    allClassSpells.value.filter(s => s.level > 0 && s.level <= props.analysis.maxSpellSlotLevel)
  );

  const isValid = computed(() => {
    if (props.analysis.castingMode === 'prepared') return true;
    const cantripsFilled =
      props.analysis.cantripsDelta === 0 ||
      selectedCantrips.value.length === props.analysis.cantripsDelta;
    const spellsFilled =
      props.analysis.spellsKnownDelta === 0 ||
      selectedSpells.value.length === props.analysis.spellsKnownDelta;
    return cantripsFilled && spellsFilled;
  });

  function confirm() {
    if (!isValid.value) return;

    const cantripObjs = selectedCantrips.value
      .map(name => dataStore.spells.find((s: Spell) => s.name === name))
      .filter(Boolean) as Spell[];

    const spellObjs = selectedSpells.value
      .map(name => dataStore.spells.find((s: Spell) => s.name === name))
      .filter(Boolean) as Spell[];

    emit('nextStep', cantripObjs, spellObjs);
  }
</script>

<style scoped>
  .spells-section {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .spells-section__heading {
    font-size: 0.9rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--color-primary, #6b2e2e);
    margin: 0;
    display: flex;
    align-items: center;
    gap: 0.6rem;
  }

  .limit-badge {
    font-size: 0.78rem;
    font-weight: 600;
    padding: 1px 6px;
    border-radius: 999px;
    background: rgba(107, 46, 46, 0.1);
    color: var(--color-primary, #6b2e2e);
    text-transform: none;
    letter-spacing: 0;
  }

  .panel-copy {
    margin: 0;
    font-size: 0.88rem;
    color: var(--color-muted, #888);
  }

  .slots-info {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 1rem;
  }

  .slots-info__heading {
    font-weight: 700;
    margin: 0;
    font-size: 0.9rem;
  }

  .slots-info__row {
    font-size: 0.95rem;
    color: var(--color-primary, #6b2e2e);
    font-weight: 600;
  }
</style>
