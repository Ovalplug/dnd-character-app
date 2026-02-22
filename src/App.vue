<template>
  <router-view v-if="loaded" />
  <div v-else>Loading...</div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useCharacterStore } from './stores/characterStore'

const store = useCharacterStore()
const loaded = ref(false)

onMounted(async () => {
  await store.loadCharacters()
  loaded.value = true
})
</script>