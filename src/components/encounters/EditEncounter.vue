<template>
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
            <td class="clickable" @click="editCreatureName(monster)">{{ monster.name }}</td>
            <td class="clickable" @click="editHP(monster)">{{ monster.currentHp }}/{{ monster.maxHp }}</td>
            <td class="clickable" @click="editInitiative(monster)">{{ monster.initiative }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- popouts -->
    <PopOut v-if="showEditName" title="Edit Name" :mini="true" @close="closeEditName">
      <div class="edit-container">
        <div class="input-group">
          <label>Name:</label>
          <input v-model="newName" placeholder="New Name" />
        </div>
        <button @click="saveNewName(); closeEditName()">Save</button>
      </div>
    </PopOut>

    <PopOut v-if="showEditHP" title="Edit HP" :mini="true" @close="closeEditHP">
      <div class="hp-edit-container">
        <div class="input-group">
          <label>Current HP:</label>
          <input v-model.number="newCurrentHp" type="number" placeholder="Current HP" />
        </div>
        <div class="input-group">
          <label>Max HP:</label>
          <input v-model.number="newMaxHp" type="number" placeholder="Max HP" />
        </div>
        <button @click="saveNewHP(); closeEditHP()">Save</button>
      </div>
    </PopOut>

    <PopOut v-if="showEditInitiative" title="Edit Initiative" :mini="true" @close="closeEditInitiative">
      <div class="edit-container">
        <div class="input-group">
          <label>Initiative:</label>
          <input v-model.number="newInitiative" type="number" placeholder="Initiative" />
        </div>
        <div class="button-group">
          <button @click="saveNewInitiative(); closeEditInitiative()">Save</button>
          <button class="secondary" @click="rollInitiative">Roll Initiative</button>
        </div>
      </div>
    </PopOut>
  </div>
</template>

<script lang="ts" setup>
  import { computed, ref, onMounted, toRaw } from 'vue';
  import { useRoute } from 'vue-router';
  import { useEncounterStore } from '../../stores/encounterStore.ts';
  import { diceRoll } from '../../helperFunctions';

  import AccordianHolder from '../AccordianHolder.vue';
  import PopOut from '../PopOut.vue';

  const encounterStore = useEncounterStore();
  encounterStore.loadEncounters();
  const route = useRoute();
  const creatureToEdit = ref<any>(null);
  const showEditName = ref<boolean>(false);
  const newName = ref<string>('');
  const showEditHP = ref<boolean>(false);
  const newMaxHp = ref<number>(0);
  const newCurrentHp = ref<number>(0);
  const showEditInitiative = ref<boolean>(false);
  const newInitiative = ref<number>(0);

  // Get the encounter id from ?id=abc123
  const encounterId = computed(() => route.query.id as string | undefined);
  const encounter = ref<any>(null);

  // Name editing
  function editCreatureName(creature: any) {
    creatureToEdit.value = creature;
    showEditName.value = true;
    newName.value = creature.name;
  }

  function closeEditName() {
    showEditName.value = false;
    newName.value = '';
  }

  function saveNewName() {
    if (creatureToEdit.value) {
      creatureToEdit.value.name = newName.value;
      encounterStore.updateThisEncounter(toRaw(encounter.value));
    }
  }

  // HP editing (both current and max)
  function editHP(creature: any) {
    creatureToEdit.value = creature;
    showEditHP.value = true;
    newCurrentHp.value = creature.currentHp;
    newMaxHp.value = creature.maxHp;
  }

  function closeEditHP() {
    showEditHP.value = false;
    newCurrentHp.value = 0;
    newMaxHp.value = 0;
  }

  function saveNewHP() {
    if (creatureToEdit.value) {
      creatureToEdit.value.currentHp = newCurrentHp.value;
      creatureToEdit.value.maxHp = newMaxHp.value;
      encounterStore.updateThisEncounter(toRaw(encounter.value));
    }
  }

  // Initiative editing
  function editInitiative(creature: any) {
    creatureToEdit.value = creature;
    showEditInitiative.value = true;
    newInitiative.value = creature.initiative;
  }

  function closeEditInitiative() {
    showEditInitiative.value = false;
    newInitiative.value = 0;
  }

  function saveNewInitiative() {
    if (creatureToEdit.value) {
      creatureToEdit.value.initiative = newInitiative.value;
      encounterStore.updateThisEncounter(toRaw(encounter.value));
    }
  }

  function rollInitiative() {
    const rolled = diceRoll([{ count: 1, dType: 'd20', modifier: 0 }]);
    newInitiative.value = rolled;
  }

  onMounted(async () => {
    if (!encounterId.value) return;
    encounter.value = await encounterStore.getEncounterById(encounterId.value);
  });
</script>

<style scoped>
.styled-table table {
  width: 100%;
  border-collapse: collapse;
}

.styled-table th {
  background-color: #f0f0f0;
  padding: 12px;
  text-align: left;
  font-weight: bold;
  border-bottom: 2px solid #333;
}

.styled-table td {
  padding: 10px 12px;
  border-bottom: 1px solid #ddd;
}

.styled-table tbody tr:hover {
  background-color: #f9f9f9;
}

.clickable {
  cursor: pointer;
  color: #0066cc;
  font-weight: 500;
  transition: background-color 0.2s;
}

.clickable:hover {
  background-color: #e6f2ff;
  text-decoration: underline;
}

.edit-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.input-group label {
  font-weight: 500;
  font-size: 14px;
}

.input-group input {
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
}

.edit-container button,
.hp-edit-container button {
  padding: 8px 16px;
  background-color: #0066cc;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
}

.edit-container button:hover,
.hp-edit-container button:hover {
  background-color: #0052a3;
}

.hp-edit-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.hp-edit-container button {
  margin-top: 8px;
}

.button-group {
  display: flex;
  gap: 8px;
}

.button-group button {
  flex: 1;
  padding: 8px 16px;
  background-color: #0066cc;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
}

.button-group button:hover {
  background-color: #0052a3;
}

.button-group button.secondary {
  background-color: #6c757d;
}

.button-group button.secondary:hover {
  background-color: #5a6268;
}
</style>
