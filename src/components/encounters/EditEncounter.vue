<template>
    <p>encounters edit will go here</p>

    <div v-if="!encounter">
        Loading...
    </div>

    <pre v-else>
{{ encounter }}
    </pre>
</template>

<script lang="ts" setup>
import { computed, ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useEncounterStore } from '../../stores/encounterStore.ts';

const encounterStore = useEncounterStore();
encounterStore.loadEncounters();
const route = useRoute();

// Get the encounter id from ?id=abc123
const encounterId = computed(() => route.query.id as string | undefined);
const encounter = ref<any>(null);

onMounted(async () => {
    if (!encounterId.value) return;

    encounter.value = await encounterStore.getEncounterById(encounterId.value);
});
</script>