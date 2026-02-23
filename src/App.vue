<template>
  <nav-bar />
  <div class="app-container" v-if="loaded">
    <router-view />
  </div>
  <div v-else>Loading...</div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useCharacterStore } from './stores/characterStore'
import NavBar from './views/NavBar.vue'

const store = useCharacterStore()
const loaded = ref(false)

onMounted(async () => {
  await store.loadCharacters()
  loaded.value = true
})
</script>

<style>
.app-container {
    margin-left: 64px;
}
</style>