<template>
  <div class="container">
    <button class="next-btn" @click="updateBackground" :disabled="!selectedBackground">Next</button>
    <table class="race-table">
      <thead>
        <tr>
          <th>Background</th>
          <th>Info</th>
          <th>Select</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(background, index) in sortedBackgrounds" :key="index">
          <td>{{ background.name }}</td>
          <td>
            <button class="icon-btn" @click="openPopOut(index)">
              <img :src="questionIcon" alt="info" width="20" height="20" />
            </button>
          </td>
          <td>
            <input
              type="checkbox"
              :checked="selectedBackgroundIndex === index"
              @change="selectBackground(index)"
              :id="'background-' + index"
            />
          </td>
        </tr>
      </tbody>
    </table>
    <PopOut :title="backgroundTitleForPopout" v-if="showPopOut" :onClose="closePopOut">
      <SingleBackground
        v-if="selectedPopoutBackground"
        :background="selectedPopoutBackground"
        :backgroundFluff="selectedBackgroundFluff"
      />
    </PopOut>
    <button class="next-btn" @click="updateBackground" :disabled="!selectedBackground">Next</button>
  </div>
</template>

<script lang="ts" setup>
  import PopOut from '../../PopOut.vue';
  import questionIcon from '../../../assets/icons/question.svg';
  import SingleBackground from '../../resources/SingleBackground.vue';
  import { computed, ref } from 'vue';
  import type { Backgrounds, BackgroundFluffs, Background } from '../../../types';
  import { useCharacterStore } from '../../../stores/characterStore';

  const store = useCharacterStore();

  const props = defineProps<{ backgrounds: Backgrounds; backgroundFluffs: BackgroundFluffs }>();
  const emit = defineEmits<{
    (e: 'nextStep'): void;
  }>();

  const sortedBackgrounds = computed(() => {
    return [...props.backgrounds].sort((a, b) => a.name.localeCompare(b.name));
  });

  const selectedBackgroundIndex = ref<number | null>(null);
  const showPopOut = ref(false);
  const selectedPopoutBackground = ref<Background | null>(null);
  const selectedBackgroundFluff = computed(() => {
    if (!selectedPopoutBackground.value) return undefined;
    let fluff = props.backgroundFluffs.find(
      fluff =>
        fluff.name === selectedPopoutBackground.value?.name &&
        fluff.source === selectedPopoutBackground.value?.source
    );
    return fluff;
  });

  const selectedBackground = computed(() => {
    return selectedBackgroundIndex.value !== null
      ? sortedBackgrounds.value[selectedBackgroundIndex.value]
      : null;
  });

  const backgroundTitleForPopout = computed(() => {
    return selectedPopoutBackground.value ? selectedPopoutBackground.value.name : '';
  });

  function selectBackground(index: number) {
    selectedBackgroundIndex.value = index;
  }

  function openPopOut(index: number) {
    selectedPopoutBackground.value = sortedBackgrounds?.value[index] || null;
    showPopOut.value = true;
  }

  function closePopOut() {
    showPopOut.value = false;
    selectedPopoutBackground.value = null;
  }

  function updateBackground() {
    if (selectedBackground.value) {
      store.updateCharacterBackground(selectedBackground.value);
    }
    emit('nextStep');
  }
</script>

<style scoped>
  .race-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 1rem;
  }
  .race-table th,
  .race-table td {
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
