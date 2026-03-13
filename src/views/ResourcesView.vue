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
      </div>
      <AllFeats v-if="show_feats" :feats="dataStore.feats" />
      <AllRaces v-if="show_races" :races="dataStore.races" :raceFluff="dataStore.raceFluff" />
      <AllBackgrounds
        v-if="show_backgrounds"
        :backgrounds="dataStore.backgrounds"
        :background-fluffs="dataStore.backgroundFluff"
      />
      <AllInvocations v-if="show_eInvocations" :invocations="dataStore.eInvocations" />
      <AllInvocations v-if="show_aInfusions" :invocations="dataStore.aInfusions" />
      <AllClasses
        v-if="show_classes"
        :classes="dataStore.classes"
        :subclasses="dataStore.subclasses"
      />
      <AllSpells v-if="show_spells" :spells="dataStore.spells" />
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

  const { debug, initDebug } = useDebug();

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
      show_spells.value
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
  background: #e0e0e0;
  z-index: 49;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.resources-header h1 {
  margin: 0;
  font-size: 2rem;
}

.dropdown-group {
  margin-left: 24px;
}

.dropdown-group select {
  font-size: 1rem;
  padding: 8px 12px;
}

.content-under-header {
  margin-top: 80px;
}

.button-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 320px;
  margin: 32px auto;
}

.button-list button {
  font-size: 1.1rem;
  padding: 12px 18px;
  border-radius: 6px;
  border: 1px solid #ccc;
  background: #f7f7f7;
  cursor: pointer;
  transition: background 0.2s;
}
.button-list button:hover {
  background: #e0e0e0;
}
</style>
