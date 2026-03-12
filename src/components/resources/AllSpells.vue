<template>
  <ul>
    <div
      v-for="spell in props.spells"
      :key="spell.name"
      @click="selectSpell(spell)"
      class="feat-item"
    >
      <p>
        {{ spell.name }}<span class="p2"> ({{ spell.source }})</span>
      </p>
      <p class="spell_p3">
        {{ getPrettySpellSchool(spell.school) }} ({{ getPrettySpellLevel(spell.level) }})
      </p>
      <p class="spell_p3">{{ getPrettySpellClassList(spell.classes.fromClassList) }}</p>
    </div>
  </ul>
  <PopOut :title="spellTitle" v-if="selectedSpell" :onClose="deselectSpell">
    <div v-if="debug">
      <pre>{{ JSON.stringify(selectedSpell, null, 2) }}</pre>
    </div>
    <div>
      <SingleSpell :spell="selectedSpell" />
    </div>
  </PopOut>
</template>

<script lang="ts" setup>
  import type { Spell, Spells } from '../../types';
  import PopOut from '../PopOut.vue';
  import { computed, onMounted, ref } from 'vue';
  import { useDebug } from '../../composables/useDebug';
  import { useDataStore } from '../../stores/dataStore';
  import SingleSpell from './SingleSpell.vue';
  import {
    getPrettySpellLevel,
    getPrettySpellSchool,
    getPrettySpellClassList,
  } from '../../helperFunctions';

  const { debug, initDebug } = useDebug();
  const dataStore = useDataStore();

  const props = defineProps<{
    spells: Spells;
  }>();
  props.spells.sort((a, b) => a.name.localeCompare(b.name));
  const selectedSpell = ref<Spell | null>(null);

  const spellTitle = computed(() => {
    return selectedSpell.value ? selectedSpell.value.name : '';
  });

  function selectSpell(spell: Spell) {
    selectedSpell.value = spell;
  }

  function deselectSpell() {
    selectedSpell.value = null;
  }

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
</script>

<style scoped></style>
