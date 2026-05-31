<template>
  <section class="creation-panel creation-panel--compact">
    <div class="creation-intro">
      <p>Lock in a name now, or generate a few until one matches the character you have in mind.</p>
    </div>

    <div class="creation-actions creation-actions--top">
      <button type="button" class="creation-primary-button" @click="updateName">Continue</button>
    </div>

    <div class="creation-stack">
      <label class="creation-field" for="character-name">
        <span class="creation-field__label">Character Name</span>
        <input
          id="character-name"
          v-model="characterName"
          :placeholder="placeholderName"
          @keyup.enter="updateName"
        />
      </label>

      <div class="creation-actions">
        <button type="button" class="creation-secondary-button" @click="randomiseName">
          Generate random name
        </button>
        <button type="button" class="creation-primary-button" @click="updateName">Continue</button>
      </div>
    </div>
  </section>
</template>
<script lang="ts" setup>
  import { ref } from 'vue';
  import { useCharacterStore } from '../../../stores/characterStore';
  import { createRandomName } from '../../../stores/randomNames.ts';
  const store = useCharacterStore();
  const placeholderName = ref('Adventurer');
  const characterName = ref(store.currNewCharacter?.name || '');
  const emit = defineEmits<{
    (e: 'nextStep'): void;
  }>();

  function randomiseName() {
    const randomName = createRandomName();
    characterName.value = randomName;
  }

  function updateName() {
    store.updateCharacterName(characterName.value.trim() || placeholderName.value);
    emit('nextStep');
  }
</script>
