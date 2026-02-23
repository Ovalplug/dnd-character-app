<template>
  <div>
    <h1>Look at all your pretty characters!</h1>

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
  //   import { ref } from 'vue';
  import { useCharacterStore } from '../stores/characterStore';
  //   import { useRouter } from 'vue-router';

  import binIcon from '../assets/bin-svgrepo-com.svg';

  const charStore = useCharacterStore();

  const icons: Record<string, string> = {
    binIcon: binIcon,
  };
</script>

<style scoped>
  .deleteCharIcon {
    width: 16px;
    height: 16px;
    cursor: pointer;
    margin-left: 8px;
  }
</style>
