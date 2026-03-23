<template>
  <div class="container">
    <!-- <button class="next-btn" @click="confirmSelection" :disabled="!allSelected">Next</button> -->
    <div class="subclass-group">
      <table class="subclass-table">
        <thead>
          <tr>
            <th>Subclass</th>
            <th>Info</th>
            <th>Select</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(sub, index) in subclassesForCurrClass" :key="index">
            <td>{{ sub.name }}</td>
            <td>
              <button class="icon-btn" @click="openPopout(index)">
                <img :src="questionIcon" alt="Info" />
              </button>
            </td>
            <td>
              <input
                type="checkbox"
                @change="selectSubclass(index)"
                :checked="selectedSubclassIndex === index"
                :id="`subclass-${index}`"
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
    <button class="next-btn" @click="confirmSelection" :disabled="!selectedSubclass">Next</button>
  </div>
</template>

<script lang="ts" setup>
  import { computed, onMounted, ref } from 'vue';
  import type { CharClass, ClassLevels, Subclass, Subclasses } from '../../../types';
  import { useCharacterStore } from '../../../stores/characterStore';
    import questionIcon from '../../../assets/icons/question.svg';
  import ResourceEntries from '../../resources/ResourceEntries.vue';
  import PopOut from '../../PopOut.vue';

  const props = defineProps<{
    subclasses: Subclasses;
    currClass: CharClass | null;
  }>();
  const emit = defineEmits<{ (e: 'nextStep'): void }>();

  const showPopOut = ref(false);
  const selectedPopoutSubclass = ref<Subclass | null>(null);
    const selectedSubclass = ref<Subclass | null>(null);
        const selectedSubclassIndex = ref<number | null>(null);

  const store = useCharacterStore();

  const sortedSubclasses = computed(() => {
    return Object.fromEntries(
      Object.entries(props.subclasses).map(([className, subclasses]) => [
        className,
        subclasses.sort((a, b) => a.name.localeCompare(b.name)),
      ])
    );
  });

  const subclassesForCurrClass = computed(() => {
    if (!props.currClass) return [];
    //return the subclasses from sortedSubClasses that match currClass.name
    return sortedSubclasses.value[props.currClass.name] || [];
  });

    function openPopout(index: number) {
      selectedPopoutSubclass.value = subclassesForCurrClass.value[index] || null;
      showPopOut.value = true;
    }

  function closePopOut() {
    showPopOut.value = false;
    selectedPopoutSubclass.value = null;
  }

    function confirmSelection() {
      console.log('Selected subclasses:', selectedSubclass.value);
      // Update the store with the selected subclasses
      emit('nextStep');
    }

  function selectSubclass(index: number) {
    selectedSubclass.value = subclassesForCurrClass.value[index] || null;
    selectedSubclassIndex.value = index;
  }

  // Skip this step entirely if no class needs a subclass at the current level
  onMounted(() => {
    if (
      props.currClass &&
      props.currClass.subclassAtLvl >
      store.currNewCharacter!.classLevels[props.currClass.name.toLowerCase() as keyof ClassLevels]
    ) {
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
    padding: 0; /* Remove default padding */
    margin: 0; /* Remove default margin */
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .icon-btn img {
    width: 20px; /* Set a fixed width for the icon */
    height: 20px; /* Set a fixed height for the icon */
    vertical-align: middle;
  }
</style>
