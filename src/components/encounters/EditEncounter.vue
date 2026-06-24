<template>
  <p>encounters edit will go here</p>

  <div v-if="!encounter">Loading...</div>
  <div v-else>
    <!-- json for debugging -->
    <AccordianHolder header="json">
      <pre>{{ encounter }}</pre>
    </AccordianHolder>

    <!-- actual content -->
     <div class="styled-table">
        <table>
            <thead>
                <tr>
                    <th>Creature Name</th>
                    <th>HP</th>
                    <th>Initiative</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="monster in encounter.monsters" :key="monster.id">
                    <td @click="editCreatureName(monster)">{{ monster.name }}</td>
                    <td>{{ monster.maxHp }}</td>
                    <td>{{ monster.initiative }}</td>
                </tr>
            </tbody>
        </table>
     </div>

     <!-- popouts -->
      <PopOut v-if="editName" title="Edit Name" :mini="true" @close="closeEditName">
        <input v-model="newName" placeholder="New Name" />
        <button @click="saveNewName(); closeEditName()">Save</button>
      </PopOut>
  </div>
</template>

<script lang="ts" setup>
  import { computed, ref, onMounted } from 'vue';
  import { useRoute } from 'vue-router';
  import { useEncounterStore } from '../../stores/encounterStore.ts';

  import AccordianHolder from '../AccordianHolder.vue';
  import PopOut from '../PopOut.vue';

  const encounterStore = useEncounterStore();
  encounterStore.loadEncounters();
  const route = useRoute();
  const creatureToEdit = ref<any>(null);
  const editName = ref<boolean>(false);
    const newName = ref<string>('');
    const editMaxHp = ref<boolean>(false);
    const newMaxHp = ref<number>(0);
    const editInitiative = ref<boolean>(false);
    const newInitiative = ref<number>(0);

  // Get the encounter id from ?id=abc123
  const encounterId = computed(() => route.query.id as string | undefined);
  const encounter = ref<any>(null);

    function editCreatureName(creature: any) {
        creatureToEdit.value = creature;
        editName.value = true;
        newName.value = creature.name;
    }
    function closeEditName() {
        editName.value = false;
        newName.value = '';
    }
    function saveNewName() {
        if (creatureToEdit.value) {
            creatureToEdit.value.name = newName.value;
            // Save the updated encounter to the store
            encounterStore.updateThisEncounter(encounter.value);
        }
    }

  onMounted(async () => {
    if (!encounterId.value) return;

    encounter.value = await encounterStore.getEncounterById(encounterId.value);
  });
</script>
