<template>
  <div class="container">
    <button class="next-btn" @click="confirmSelection" :disabled="!allSelected">Next</button>
    <div v-for="cls in classesNeedingSubclass" :key="cls.name" class="subclass-group">
      <h3>Choose a subclass for {{ cls.name }}</h3>
      <table class="subclass-table">
        <thead>
          <tr>
            <th>Subclass</th>
            <th>Info</th>
            <th>Select</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(sub, index) in availableSubclasses(cls.name)" :key="index">
            <td>{{ sub.name }}</td>
            <td>
              <button class="icon-btn" @click="openPopout(sub)">
                <img :src="questionIcon" alt="Info" />
              </button>
            </td>
            <td>
              <input
                type="checkbox"
                :checked="selectedSubclasses[cls.name]?.name === sub.name"
                @change="selectSubclass(cls.name, sub)"
              />
            </td>
          </tr>
        </tbody>
      </table>
      <PopOut :title="selectedPopoutSubclass?.name" v-if="showPopOut" @close="closePopOut">
        <ResourceEntries
          v-if="selectedPopoutSubclass"
          :entries="selectedPopoutSubclass?.subclassFeatures || ['error...']"
        />
      </PopOut>
    </div>
    <button class="next-btn" @click="confirmSelection" :disabled="!allSelected">Next</button>
  </div>
</template>

<script lang="ts" setup>
  import { computed, onMounted, reactive, ref } from 'vue';
  import type { CharClass, ClassLevels, Subclass, Subclasses } from '../../../types';
  import { useCharacterStore } from '../../../stores/characterStore';
  import questionIcon from '../../../assets/icons/question.svg';
  import ResourceEntries from '../../resources/ResourceEntries.vue';
  import PopOut from '../../PopOut.vue';

  const props = defineProps<{ subclasses: Subclasses }>();
  const emit = defineEmits<{ (e: 'nextStep'): void }>();

  const showPopOut = ref(false);
  const selectedPopoutSubclass = ref<Subclass | null>(null);

  const store = useCharacterStore();

  // Classes where the character's current level equals the class's subclassAtLvl
  const classesNeedingSubclass = computed<CharClass[]>(() => {
    if (!store.currNewCharacter) return [];
    return store.currNewCharacter.classes.filter(cls => {
      const level =
        store.currNewCharacter!.classLevels[cls.name.toLowerCase() as keyof ClassLevels];
      return level === cls.subclassAtLvl;
    });
  });

  const selectedSubclasses = reactive<Record<string, Subclass>>({});

  const allSelected = computed(() =>
    classesNeedingSubclass.value.every(cls => selectedSubclasses[cls.name] !== undefined)
  );

  function openPopout(subclass: Subclass) {
    selectedPopoutSubclass.value = subclass;
    showPopOut.value = true;
  }

  function closePopOut() {
    showPopOut.value = false;
    selectedPopoutSubclass.value = null;
  }

  function availableSubclasses(className: string) {
    return props.subclasses[className] ?? [];
  }

  function selectSubclass(className: string, subclass: Subclass) {
    selectedSubclasses[className] = subclass;
  }

  function confirmSelection() {
    if (!allSelected.value) {
      alert('Please select a subclass for all required classes.');
      return;
    }

    for (const [className, subclass] of Object.entries(selectedSubclasses)) {
      store.updateCharacterSubclasses(className, subclass);
    }
    emit('nextStep');
  }

  // Skip this step entirely if no class needs a subclass at the current level
  onMounted(() => {
    if (classesNeedingSubclass.value.length === 0) {
      emit('nextStep');
    }
  });
</script>

<style scoped>
  .container {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .subclass-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .subclass-table {
    width: 100%;
    border-collapse: collapse;
  }

  .subclass-table th,
  .subclass-table td {
    border: 1px solid #ccc;
    padding: 0.4rem 0.75rem;
    text-align: left;
  }

  .next-btn {
    align-self: flex-end;
    padding: 0.5rem 1rem;
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }

  .next-btn:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }

  .icon-btn {
    background: none;
    border: none;
    cursor: pointer;
  }
  .icon-btn img {
    vertical-align: middle;
  }
</style>
