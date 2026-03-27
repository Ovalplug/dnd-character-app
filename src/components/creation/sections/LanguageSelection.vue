<template>
    <p>select a language</p>
    <AccordianHolder header="charRace">
        <pre>charRace {{ charRace }}</pre>
    </AccordianHolder>
    <AccordianHolder header="charBackground">
        <pre>charBackground {{ charBackground }}</pre>
    </AccordianHolder>
    <AccordianHolder header="currLanguages">
        <pre>currLanguages {{ currLanguages }}</pre>
        </AccordianHolder>
    <button @click="finaliseLanguages()">Next</button>
</template>
<script lang="ts" setup>

import { useCharacterStore } from '../../../stores/characterStore';
import type { Languages } from '../../../types';
import { getAllLanguages } from '../../../helperFunctions';
import AccordianHolder from '../../AccordianHolder.vue';
const store = useCharacterStore();
const emit = defineEmits<{ (e: 'nextStep'): void }>();
const charRace = store.getCharRace();
const charBackground = store.getCharBackground();
const currLanguages = getAllLanguages(charRace, charBackground);


function finaliseLanguages() {
    // for now, just add some dummy languages
    // store.updateCharacterLanguages({
    // });
    // then move to the next step
    emit('nextStep');
}

</script>