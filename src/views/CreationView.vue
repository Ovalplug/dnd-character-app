<template>
  <div>
    <h1>D&D Character Manager</h1>
  </div>

  <div v-if="!isDataLoaded">
    <Loading />
  </div>

  <div v-else>
    <div class="button-list">
      <button @click="navigateTo('/create/quickCreate')" :disabled="true">
        Quick Character Creation
      </button>
      <button @click="navigateTo('/create/fullCreate')" :disabled="!isDataLoaded">
        Full Character Creation
      </button>
      <button @click="navigateTo('/create/randomCreate')" :disabled="true">Random Character</button>
      <button @click="navigateTo('/create/itemCreate')" :disabled="true">Item Creation</button>
      <button @click="navigateTo('/create/monsterCreate')" :disabled="true">
        Monster Creation
      </button>
      <button @click="navigateTo('/create/spellCreate')" :disabled="true">Spell Creation</button>
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
