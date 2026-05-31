<template>
  <section class="creation-panel">
    <div class="creation-intro">
      <p v-if="props.currClass">
        Choose the subclass for {{ props.currClass.name }} if it comes online at the current level.
      </p>
      <p v-else>No class has been selected yet.</p>
    </div>

    <div class="creation-actions creation-actions--top">
      <button
        type="button"
        class="creation-primary-button"
        @click="confirmSelection"
        :disabled="!selectedSubclass"
      >
        Continue
      </button>
    </div>

    <div v-if="props.currClass" class="creation-summary">
      <span class="creation-summary__label">Selected subclass</span>
      <span class="creation-summary__value">{{ selectedSubclass?.name || 'None selected' }}</span>
    </div>

    <div v-if="subclassesForCurrClass.length" class="subclass-group">
      <div class="creation-table-wrap">
        <table class="creation-table">
          <thead>
            <tr>
              <th>Subclass</th>
              <th>Info</th>
              <th class="creation-table__choice">Select</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(sub, index) in subclassesForCurrClass" :key="index">
              <td>{{ sub.name }}</td>
              <td>
                <button type="button" class="creation-icon-button" @click="openPopout(index)">
                  <img :src="questionIcon" alt="Info" />
                </button>
              </td>
              <td class="creation-table__choice">
                <input
                  type="radio"
                  name="selected-subclass"
                  @change="selectSubclass(index)"
                  :checked="selectedSubclassIndex === index"
                  :id="`subclass-${index}`"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <PopOut :title="selectedPopoutSubclass?.name" v-if="showPopOut" @close="closePopOut">
        <ResourceEntries v-if="selectedPopoutSubclass" :entries="subclassFeatureEntries" />
      </PopOut>
    </div>

    <div v-else class="creation-empty-state">
      No subclasses were found for the selected class at this step.
    </div>

    <div class="creation-actions">
      <button
        type="button"
        class="creation-primary-button"
        @click="confirmSelection"
        :disabled="!selectedSubclass"
      >
        Continue
      </button>
    </div>
  </section>
</template>

<script lang="ts" setup>
  import { computed, ref } from 'vue';
  import type { CharClass, Entries, Subclass, Subclasses } from '../../../types';
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

  const subclassFeatureEntries = computed<Entries>(() => {
    if (!selectedPopoutSubclass.value?.subclassFeatures) return [];
    return selectedPopoutSubclass.value.subclassFeatures.flat() as unknown as Entries;
  });

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

  const currentSubclassName = props.currClass
    ? store.currNewCharacter?.subclasses?.[props.currClass.name]?.[0]?.name ?? null
    : null;

  if (currentSubclassName) {
    const initialIndex = subclassesForCurrClass.value.findIndex(
      subclass => subclass.name === currentSubclassName
    );
    if (initialIndex >= 0) {
      selectedSubclassIndex.value = initialIndex;
      selectedSubclass.value = subclassesForCurrClass.value[initialIndex] || null;
    }
  }

  function openPopout(index: number) {
    selectedPopoutSubclass.value = subclassesForCurrClass.value[index] || null;
    showPopOut.value = true;
  }

  function closePopOut() {
    showPopOut.value = false;
    selectedPopoutSubclass.value = null;
  }

  function confirmSelection() {
    if (!selectedSubclass.value || !props.currClass) return;
    store.updateCharacterSubclasses(props.currClass.name, selectedSubclass.value);
    emit('nextStep');
  }

  function selectSubclass(index: number) {
    selectedSubclass.value = subclassesForCurrClass.value[index] || null;
    selectedSubclassIndex.value = index;
  }
</script>

<style scoped>
  .subclass-group {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
</style>
