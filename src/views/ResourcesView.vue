<template>
  <div>
    <div class="resources-header">
      <h1>Resources</h1>
      <div v-if="dataSelected" class="dropdown-group">
        <select @change="onDropdownChange($event)" :value="selectedType">
          <option value="races">Races</option>
          <option value="backgrounds">Backgrounds</option>
          <option value="classes">Classes</option>
          <option value="feats">Feats</option>
          <option value="eInvocations">Eldritch Invocations</option>
          <option value="aInfusions">Artificer Infusions</option>
          <option value="spells">Spells</option>
          <option value="items">Items</option>
          <option value="monsters">Monsters</option>
          <option value="rules">Rules</option>
        </select>
      </div>
    </div>

    <div v-if="!dataStore.loaded" class="content-under-header">
      <Loading message="Loading resources..." :size="96" variant="bold"></Loading>
    </div>

    <div v-else class="content-under-header">
      <div v-if="!dataSelected" class="button-list">
        <button @click="showData('races')">Races</button>
        <button @click="showData('backgrounds')">Backgrounds</button>
        <button @click="showData('classes')">Classes</button>
        <button @click="showData('feats')">Feats</button>
        <button @click="showData('eInvocations')">Eldritch Invocations</button>
        <button @click="showData('aInfusions')">Artificer Infusions</button>
        <button @click="showData('spells')">Spells</button>
        <button @click="showData('items')">Items</button>
        <button @click="showData('monsters')">Monsters</button>
        <button @click="showData('rules')">Rules</button>
      </div>
      <AllFeats v-if="show_feats" :feats="dataStore.filteredFeats" />
      <AllRaces
        v-if="show_races"
        :races="dataStore.filteredRaces"
        :raceFluff="dataStore.raceFluff"
      />
      <AllBackgrounds
        v-if="show_backgrounds"
        :backgrounds="dataStore.filteredBackgrounds"
        :background-fluffs="dataStore.backgroundFluff"
      />
      <AllInvocations v-if="show_eInvocations" :invocations="dataStore.filteredEInvocations" />
      <AllInvocations v-if="show_aInfusions" :invocations="dataStore.filteredAInfusions" />
      <AllClasses
        v-if="show_classes"
        :classes="dataStore.filteredClasses"
        :subclasses="dataStore.filteredSubclasses"
      />
      <AllSpells v-if="show_spells" :spells="dataStore.filteredSpells" />
      <AllItems v-if="show_items" :items="dataStore.filteredItems" />
      <AllMonsters
        v-if="show_monsters"
        :monsters="dataStore.monsters"
        :monsterFluff="dataStore.monsterFluff"
        :spells="dataStore.spells"
      />
      <AllRules
        v-if="show_rules"
        :rules="dataStore.rules"
        :hazards="dataStore.hazards"
        :boons="dataStore.boons"
        :diseases="dataStore.diseases"
        :traps="dataStore.traps"
        :actionRules="dataStore.actionRules"
        :playerOptions="dataStore.playerOptions"
        :conditions="dataStore.conditions"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { onMounted, ref, computed } from 'vue';
  import { useDataStore } from '../stores/dataStore';
  import Loading from '../components/resources/Loading.vue';
  import { useDebug } from '../composables/useDebug';
  import AllFeats from '../components/resources/AllFeats.vue';
  import AllRaces from '../components/resources/AllRaces.vue';
  import AllBackgrounds from '../components/resources/AllBackgrounds.vue';
  import AllInvocations from '../components/resources/AllInvocations.vue';
  import AllClasses from '../components/resources/AllClasses.vue';
  import AllSpells from '../components/resources/AllSpells.vue';
  import AllItems from '../components/resources/AllItems.vue';
  import AllMonsters from '../components/resources/AllMonsters.vue';
  import AllRules from '../components/resources/AllRules.vue';
  const { initDebug } = useDebug();

  const dataStore = useDataStore();

  const show_rawDatasets = ref(false);
  const show_feats = ref(false);
  const show_races = ref(false);
  const show_backgrounds = ref(false);
  const show_backgroundFluff = ref(false);
  const show_raceFluff = ref(false);
  const show_classes = ref(false);
  const show_eInvocations = ref(false);
  const show_aInfusions = ref(false);
  const show_subclasses = ref(false);
  const show_spells = ref(false);
  const show_items = ref(false);
  const show_monsters = ref(false);
  const show_rules = ref(false);
  // Track which data type is currently selected
  const selectedType = ref('');

  // Computed: is any data selected?
  const dataSelected = computed(() => {
    return (
      show_feats.value ||
      show_races.value ||
      show_backgrounds.value ||
      show_backgroundFluff.value ||
      show_raceFluff.value ||
      show_classes.value ||
      show_eInvocations.value ||
      show_aInfusions.value ||
      show_subclasses.value ||
      show_spells.value ||
      show_items.value ||
      show_monsters.value ||
      show_rules.value
    );
  });

  function onDropdownChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    showData(value);
  }

  onMounted(async () => {
    await initDebug();
    if (!dataStore.loaded) {
      try {
        await dataStore.init();
      } catch (err) {
        // keep this simple; devs can improve error handling/UI later
        // eslint-disable-next-line no-console
        console.error('Failed to load data store', err);
      }
    }
  });

  function showNoData() {
    show_rawDatasets.value = false;
    show_feats.value = false;
    show_races.value = false;
    show_backgrounds.value = false;
    show_backgroundFluff.value = false;
    show_raceFluff.value = false;
    show_classes.value = false;
    show_eInvocations.value = false;
    show_aInfusions.value = false;
    show_subclasses.value = false;
    show_spells.value = false;
    show_items.value = false;
    show_monsters.value = false;
    show_rules.value = false;
  }

  function showData(dataType: string) {
    showNoData();
    switch (dataType) {
      case 'all':
        show_rawDatasets.value = true;
        selectedType.value = '';
        break;
      case 'feats':
        show_feats.value = true;
        selectedType.value = 'feats';
        break;
      case 'races':
        show_races.value = true;
        selectedType.value = 'races';
        break;
      case 'backgrounds':
        show_backgrounds.value = true;
        selectedType.value = 'backgrounds';
        break;
      case 'backgroundFluff':
        show_backgroundFluff.value = true;
        selectedType.value = 'backgroundFluff';
        break;
      case 'raceFluff':
        show_raceFluff.value = true;
        selectedType.value = 'raceFluff';
        break;
      case 'classes':
        show_classes.value = true;
        selectedType.value = 'classes';
        break;
      case 'eInvocations':
        show_eInvocations.value = true;
        selectedType.value = 'eInvocations';
        break;
      case 'aInfusions':
        show_aInfusions.value = true;
        selectedType.value = 'aInfusions';
        break;
      case 'subclasses':
        show_subclasses.value = true;
        selectedType.value = 'subclasses';
        break;
      case 'spells':
        show_spells.value = true;
        selectedType.value = 'spells';
        break;
      case 'items':
        show_items.value = true;
        selectedType.value = 'items';
        break;
      case 'monsters':
        show_monsters.value = true;
        selectedType.value = 'monsters';
        break;
      case 'rules':
        show_rules.value = true;
        selectedType.value = 'rules';
        break;
      default:
        selectedType.value = '';
        break;
    }
  }
</script>

<style scoped>
  .resources-header {
    position: fixed;
    top: 0;
    left: 40px;
    width: calc(100% - 40px);
    background: var(--color-surface);
    border-bottom: 1px solid rgba(107, 46, 46, 0.12);
    z-index: 49;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    box-shadow: 0 2px 8px rgba(31, 27, 22, 0.08);
  }

  .resources-header h1 {
    margin: 0;
    font-size: clamp(1.2rem, 4vw, 1.6rem);
  }

  .dropdown-group {
    margin-left: 12px;
  }

  .dropdown-group select {
    font-size: 0.95rem;
    padding: 8px 12px;
    border-radius: 8px;
    border: 1px solid rgba(107, 46, 46, 0.25);
    background: var(--color-bg);
    color: var(--color-text);
    min-height: 44px;
    cursor: pointer;
  }

  .dropdown-group select:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(107, 46, 46, 0.15);
    border-color: var(--color-primary);
  }

  .content-under-header {
    margin-top: 72px;
  }
</style>
