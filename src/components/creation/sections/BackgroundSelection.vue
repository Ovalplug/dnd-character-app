<template>
  <section class="creation-panel">
    <div class="creation-intro">
      <p>
        Background shapes your origin, early skills, and the gear options you will review at the
        end.
      </p>
    </div>

    <div class="creation-actions creation-actions--top">
      <button
        type="button"
        class="creation-primary-button"
        @click="updateBackground"
        :disabled="!selectedBackground"
      >
        Continue
      </button>
    </div>

    <div class="creation-summary">
      <span class="creation-summary__label">Selected background</span>
      <span class="creation-summary__value">{{ selectedBackground?.name || 'None selected' }}</span>
    </div>

    <div class="creation-table-wrap">
      <table class="creation-table">
        <thead>
          <tr>
            <th>Background</th>
            <th>Info</th>
            <th class="creation-table__choice">Select</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(background, index) in sortedBackgrounds" :key="index">
            <td>{{ background.name }}</td>
            <td>
              <button type="button" class="creation-icon-button" @click="openPopOut(index)">
                <img :src="questionIcon" alt="info" width="20" height="20" />
              </button>
            </td>
            <td class="creation-table__choice">
              <input
                type="radio"
                name="selected-background"
                :checked="selectedBackgroundIndex === index"
                @change="selectBackground(index)"
                :id="'background-' + index"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <PopOut :title="backgroundTitleForPopout" v-if="showPopOut" :onClose="closePopOut">
      <SingleBackground
        v-if="selectedPopoutBackground"
        :background="selectedPopoutBackground"
        :backgroundFluff="selectedBackgroundFluff"
      />
    </PopOut>

    <div class="creation-actions">
      <button
        type="button"
        class="creation-primary-button"
        @click="updateBackground"
        :disabled="!selectedBackground"
      >
        Continue
      </button>
    </div>
  </section>
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

  const selectedBackgroundIndex = ref<number | null>(
    (() => {
      const currentBackground = store.getCharBackground();
      if (!currentBackground) return null;
      return sortedBackgrounds.value.findIndex(
        background =>
          background.name === currentBackground.name &&
          background.source === currentBackground.source
      );
    })()
  );
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
    if (!selectedBackground.value) return;
    store.updateCharacterBackground(selectedBackground.value);
    emit('nextStep');
  }
</script>
