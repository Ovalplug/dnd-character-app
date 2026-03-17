<template>
  <div>
    <h1>D&D Character Manager</h1>

    <button @click="createCharacter">New Character</button>
    <input type="text" :placeholder="createRandomName()" v-model="newCharName" />
  </div>

  <div class="button-list">
    <button @click="navigateTo('/create/quickCreate')" :disabled="true">Quick Character Creation</button>
    <button @click="navigateTo('/create/fullCreate')" >Full Character Creation</button>
    <button @click="navigateTo('/create/randomCreate')" :disabled="true">Random Character</button>
    <button @click="navigateTo('/create/itemCreate')" :disabled="true">Item Creation</button>
    <button @click="navigateTo('/create/monsterCreate')" :disabled="true">Monster Creation</button>
    <button @click="navigateTo('/create/spellCreate')" :disabled="true">Spell Creation</button>
  </div>
</template>

<script setup lang="ts">
  import { ref } from 'vue';
  import { useCharacterStore } from '../stores/characterStore';
  import { useRouter } from 'vue-router';

  import { createRandomName } from '../stores/randomNames.ts';

  const charStore = useCharacterStore();
  const router = useRouter();
  const newCharName = ref('');

  async function createCharacter() {
    if (!newCharName.value.trim()) {
      newCharName.value = `New Character ${charStore.characters.length + 1}`;
    }

    const id = await charStore.createCharacter(newCharName.value);
    router.push(`/character/${id}`);
  }

  function navigateTo(path: string) {
    router.push(path);
  }
</script>

<style scoped>
  .deleteCharIcon {
    width: 16px;
    height: 16px;
    cursor: pointer;
    margin-left: 8px;
  }
</style>
