<template>
  <div>
    <h1>D&D Character Manager</h1>

    <button @click="createCharacter">New Character</button>
    <input type="text" placeholder="Search..." v-model="newCharName" />

    <div v-for="char in charStore.characters" :key="char.id">
      <router-link :to="`/character/${char.id}`">
        {{ char.name }} (Level {{ char.level }})
      </router-link>
      <img
        :src="icons.binIcon"
        alt="Delete"
        @click="charStore.deleteCharacter(char.id)"
        class="deleteCharIcon"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref } from 'vue';
  import { useCharacterStore } from '../stores/characterStore';
  import { useRouter } from 'vue-router';

  import binIcon from '../assets/bin-svgrepo-com.svg';

  const charStore = useCharacterStore();
  const router = useRouter();
  const newCharName = ref('');

  const icons: Record<string, string> = {
    binIcon: binIcon,
  };

  async function createCharacter() {
    if (!newCharName.value.trim()) {
      newCharName.value = `New Character ${charStore.characters.length + 1}`;
    }

    const id = await charStore.createCharacter(newCharName.value);
    router.push(`/character/${id}`);
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
