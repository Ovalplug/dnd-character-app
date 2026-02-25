<template>
  <div>
    <h1>This is where all the resources stuff will go</h1>

    <div v-if="!dataStore.loaded">
      <Loading message="Loading resources..." :size="96" variant="bold"></Loading>
    </div>

    <div v-else>
      <div v-if="debug">
        <button @click="showData('all')">All data</button>
        <button @click="showData('feats')">Feats</button>
        <button @click="showData('races')">Races</button>
        <button @click="showData('backgrounds')">Backgrounds</button>
        <button @click="showData('backgroundFluff')">Background fluff</button>
        <button @click="showData('raceFluff')">Race fluff</button>
        <button @click="showData('classes')">Classes</button>
        <button @click="showData('eInvocations')">Eldritch Invocations</button>
        <button @click="showData('aInfusions')">Artificer Infusions</button>
        <button @click="showData('subclasses')">Subclasses</button>
        <button @click="showNoData">Hide all</button>

        <pre v-if="show_rawDatasets">{{ dataStore.rawDatasets }}</pre>
        <pre v-if="show_feats">{{ dataStore.feats }}</pre>
        <pre v-if="show_races">{{ dataStore.races }}</pre>
        <pre v-if="show_backgrounds">{{ dataStore.backgrounds }}</pre>
        <pre v-if="show_backgroundFluff">{{ dataStore.backgroundFluff }}</pre>
        <pre v-if="show_raceFluff">{{ dataStore.raceFluff }}</pre>
        <pre v-if="show_classes">{{ dataStore.classes }}</pre>
        <pre v-if="show_eInvocations">{{ dataStore.eInvocations }}</pre>
        <pre v-if="show_aInfusions">{{ dataStore.aInfusions }}</pre>
        <pre v-if="show_subclasses">{{ dataStore.subclasses }}</pre>
      </div>
      <AllFeats :feats="dataStore.feats"></AllFeats>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { onMounted, ref } from 'vue';
  import { useDataStore } from '../stores/dataStore';
  import Loading from '../components/Loading.vue';
  import { useDebug } from '../composables/useDebug';
  import AllFeats from '../components/AllFeats.vue';

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
  }

  function showData(dataType: string) {
    switch (dataType) {
      case 'all':
        showNoData();
        show_rawDatasets.value = true;
        break;
      case 'feats':
        showNoData();
        show_feats.value = true;
        break;
      case 'races':
        showNoData();
        show_races.value = true;
        break;
      case 'backgrounds':
        showNoData();
        show_backgrounds.value = true;
        break;
      case 'backgroundFluff':
        showNoData();
        show_backgroundFluff.value = true;
        break;
      case 'raceFluff':
        showNoData();
        show_raceFluff.value = true;
        break;
      case 'classes':
        showNoData();
        show_classes.value = true;
        break;
      case 'eInvocations':
        showNoData();
        show_eInvocations.value = true;
        break;
      case 'aInfusions':
        showNoData();
        show_aInfusions.value = true;
        break;
      case 'subclasses':
        showNoData();
        show_subclasses.value = true;
        break;
      default:
        showNoData();
        break;
    }
  }
</script>
