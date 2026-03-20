<template>
  <div class="container">
    <button class="next-btn" @click="updateClass" :disabled="!selectedClass">Next</button>
    <table class="class-table">
      <thead>
        <tr>
          <th>Class</th>
          <th>Info</th>
          <th>Select</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(charClass, index) in sortedClasses" :key="index">
          <td>{{ charClass.name }}</td>
          <td>
            <button class="icon-btn" @click="openPopOut(index)">
              <img :src="questionIcon" alt="info" width="20" height="20" />
            </button>
          </td>
          <td>
            <input
              type="checkbox"
              :checked="selectedClassIndex === index"
              @change="selectClass(index)"
              :id="'class-' + index"
            />
          </td>
        </tr>
      </tbody>
    </table>
    <PopOut :title="classTitleForPopout" v-if="showPopOut" :onClose="closePopOut">
      <p>subclass at level: {{ selectedPopoutClass?.subclassAtLvl }}</p>
      <SingleClass
        v-if="selectedPopoutClass"
        :currClass="selectedPopoutClass"
        :currSubclasses="selectedPopoutSubclasses"
      />
    </PopOut>
    <button class="next-btn" @click="updateClass" :disabled="!selectedClass">Next</button>
  </div>
</template>

<script lang="ts" setup>
  import PopOut from '../../PopOut.vue';
  import questionIcon from '../../../assets/icons/question.svg';
  import SingleClass from '../../resources/SingleClass.vue';
  import { computed, ref } from 'vue';
  import type { Classes, Subclasses, CharClass } from '../../../types';
  import { useCharacterStore } from '../../../stores/characterStore';

  const store = useCharacterStore();

  const props = defineProps<{ classes: Classes; subclasses: Subclasses }>();
  const emit = defineEmits<{ (e: 'nextStep'): void }>();

  const sortedClasses = computed(() => {
    return [...props.classes].sort((a, b) => a.name.localeCompare(b.name));
  });

  const selectedClassIndex = ref<number | null>(null);
  const showPopOut = ref(false);
  const selectedPopoutClass = ref<CharClass | null>(null);
  const selectedPopoutSubclasses = computed(() => {
    if (!selectedPopoutClass.value) return null;
    const subclasses = props.subclasses[selectedPopoutClass.value.name];
    return subclasses === undefined ? null : subclasses;
  });

  const selectedClass = computed(() => {
    return selectedClassIndex.value !== null ? sortedClasses.value[selectedClassIndex.value] : null;
  });

  const classTitleForPopout = computed(() => {
    return selectedPopoutClass.value ? selectedPopoutClass.value.name : '';
  });

  function selectClass(index: number) {
    selectedClassIndex.value = index;
  }

  function openPopOut(index: number) {
    selectedPopoutClass.value = sortedClasses?.value[index] || null;
    showPopOut.value = true;
  }

  function closePopOut() {
    showPopOut.value = false;
    selectedPopoutClass.value = null;
  }

  function updateClass() {
    if (selectedClass.value) {
      store.updateCharacterClasses(selectedClass.value);
    }
    emit('nextStep');
  }
</script>

<style scoped>
  .class-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 1rem;
  }
  .class-table th,
  .class-table td {
    border: 1px solid #ccc;
    padding: 0.5rem;
    text-align: left;
  }
  .icon-btn {
    background: none;
    border: none;
    cursor: pointer;
  }
  .icon-btn img {
    vertical-align: middle;
  }
  .next-btn {
    margin-top: 1rem;
    padding: 0.5rem 1rem;
    font-size: 1rem;
  }
  .container {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
</style>
