<template>
  <section class="creation-panel">
    <div class="creation-intro">
      <p>
        Class defines the character’s hit die, spell progression, and most of the choices that
        follow.
      </p>
    </div>

    <div class="creation-actions creation-actions--top">
      <button
        type="button"
        class="creation-primary-button"
        @click="updateClass"
        :disabled="!selectedClass"
      >
        Continue
      </button>
    </div>

    <div class="creation-summary">
      <span class="creation-summary__label">Selected class</span>
      <span class="creation-summary__value">{{ selectedClass?.name || 'None selected' }}</span>
    </div>

    <div class="creation-table-wrap">
      <table class="creation-table">
        <thead>
          <tr>
            <th>Class</th>
            <th>Info</th>
            <th class="creation-table__choice">Select</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(charClass, index) in sortedClasses" :key="index">
            <td>{{ charClass.name }}</td>
            <td>
              <button type="button" class="creation-icon-button" @click="openPopOut(index)">
                <img :src="questionIcon" alt="info" width="20" height="20" />
              </button>
            </td>
            <td class="creation-table__choice">
              <input
                type="radio"
                name="selected-class"
                :checked="selectedClassIndex === index"
                @change="selectClass(index)"
                :id="'class-' + index"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <PopOut :title="classTitleForPopout" v-if="showPopOut" :onClose="closePopOut">
      <p>subclass at level: {{ selectedPopoutClass?.subclassAtLvl }}</p>
      <SingleClass
        v-if="selectedPopoutClass"
        :currClass="selectedPopoutClass"
        :currSubclasses="selectedPopoutSubclasses"
      />
    </PopOut>

    <div class="creation-actions">
      <button
        type="button"
        class="creation-primary-button"
        @click="updateClass"
        :disabled="!selectedClass"
      >
        Continue
      </button>
    </div>
  </section>
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

  const selectedClassIndex = ref<number | null>(
    (() => {
      const currentClass = store.getCharFullClasses()[0];
      if (!currentClass) return null;
      const index = sortedClasses.value.findIndex(
        charClass =>
          charClass.name === currentClass.name && charClass.source === currentClass.source
      );
      return index >= 0 ? index : null;
    })()
  );
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
    if (!selectedClass.value) return;
    store.updateCharacterClasses(selectedClass.value);
    emit('nextStep');
  }
</script>
