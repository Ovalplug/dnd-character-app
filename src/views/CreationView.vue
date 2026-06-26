<template>
  <div>
    <h1>D&D Character Manager</h1>
  </div>

  <div v-if="!isDataLoaded">
    <Loading />
  </div>

  <div v-else>
    <div class="button-list">
      <button @click="navigateTo('/create/fullCreate')" :disabled="!isDataLoaded">
        Full Character Creation
      </button>
      <button @click="navigateTo('/create/encounter')" :disabled="!isDataLoaded">
        Encounter Creation
      </button>
      <button @click="navigateTo('/create/spellbook')" :disabled="!isDataLoaded">
        Spellbook Creation
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { useRouter } from 'vue-router';
  import { useDataStore } from '../stores/dataStore';
  import { onMounted, ref } from 'vue';
  import Loading from '../components/resources/Loading.vue';

  const router = useRouter();
  const dataStore = useDataStore();
  const isDataLoaded = ref(false);

  async function loadDataStore() {
    if (!dataStore.loaded) {
      try {
        await dataStore.init();
        isDataLoaded.value = true;
      } catch (err) {}
    } else {
      isDataLoaded.value = true;
    }
  }

  function navigateTo(path: string) {
    router.push(path);
  }

  onMounted(() => {
    loadDataStore();
  });
</script>

<style scoped>
  .deleteCharIcon {
    width: 16px;
    height: 16px;
    cursor: pointer;
    margin-left: 8px;
  }
</style>
