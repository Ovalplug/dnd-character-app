<template>
  <div v-if="character">
    <h2>{{ character.name }}</h2>
    <p>Level {{ character.level }}</p>
  </div>

  <div v-else>
    Character not found.
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useCharacterStore } from '../stores/characterStore'
import { computed } from 'vue'

const route = useRoute()
const store = useCharacterStore()

const characterId = computed(() => String(route.params.id))

const character = computed(() =>
  store.characters.find(c => c.id === characterId.value)
)
</script>