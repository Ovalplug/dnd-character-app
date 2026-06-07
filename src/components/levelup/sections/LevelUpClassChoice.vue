<template>
  <section class="creation-panel">
    <div class="creation-intro">
      <p v-if="currentClasses.length">
        {{ character.name }} is currently <strong>{{ currentClassSummary }}</strong
        >. Choose a class to advance in, or multiclass into a new one.
      </p>
    </div>

    <div class="creation-actions creation-actions--top">
      <button
        type="button"
        class="creation-primary-button"
        :disabled="!selectedClass"
        @click="confirm"
      >
        Continue
      </button>
    </div>

    <!-- Existing classes -->
    <div v-if="currentClasses.length" class="levelup-section">
      <h3 class="levelup-section__heading">Continue existing class</h3>
      <div class="creation-table-wrap">
        <table class="creation-table">
          <thead>
            <tr>
              <th>Class</th>
              <th>Current level</th>
              <th>Info</th>
              <th class="creation-table__choice">Select</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="cls in currentClasses" :key="cls.name">
              <td>{{ cls.name }}</td>
              <td>{{ character.classLevels[cls.name.toLowerCase() as keyof ClassLevels] ?? 0 }}</td>
              <td>
                <button type="button" class="creation-icon-button" @click="openPopout(cls)">
                  <img :src="questionIcon" alt="Info" width="20" height="20" />
                </button>
              </td>
              <td class="creation-table__choice">
                <input
                  type="radio"
                  name="levelup-class"
                  :checked="selectedClass?.name === cls.name"
                  @change="selectedClass = cls"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Multiclass option -->
    <div class="levelup-section">
      <h3 class="levelup-section__heading">Multiclass into a new class</h3>
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
            <tr v-for="cls in availableMulticlasses" :key="cls.name">
              <td>{{ cls.name }}</td>
              <td>
                <button type="button" class="creation-icon-button" @click="openPopout(cls)">
                  <img :src="questionIcon" alt="Info" width="20" height="20" />
                </button>
              </td>
              <td class="creation-table__choice">
                <input
                  type="radio"
                  name="levelup-class"
                  :checked="selectedClass?.name === cls.name"
                  @change="selectedClass = cls"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <PopOut v-if="popoutClass" :title="popoutClass.name" @close="popoutClass = null">
      <SingleClass :curr-class="popoutClass" :curr-subclasses="popoutSubclasses" />
    </PopOut>

    <div class="creation-actions">
      <button
        type="button"
        class="creation-primary-button"
        :disabled="!selectedClass"
        @click="confirm"
      >
        Continue
      </button>
    </div>
  </section>
</template>

<script lang="ts" setup>
  import { computed, ref } from 'vue';
  import type { CharClass, ClassLevels, playerCharacter, Subclasses } from '../../../types';
  import PopOut from '../../PopOut.vue';
  import SingleClass from '../../resources/SingleClass.vue';
  import questionIcon from '../../../assets/icons/question.svg';

  const props = defineProps<{
    character: playerCharacter;
    classes: CharClass[];
    subclasses: Subclasses;
  }>();

  const emit = defineEmits<{
    (e: 'nextStep', classData: CharClass): void;
  }>();

  const selectedClass = ref<CharClass | null>(
    props.character.classes.length === 1 ? props.character.classes[0] ?? null : null
  );

  const popoutClass = ref<CharClass | null>(null);

  const currentClasses = computed(() =>
    props.classes.filter(cls =>
      props.character.classes.some(c => c.name.toLowerCase() === cls.name.toLowerCase())
    )
  );

  const availableMulticlasses = computed(() =>
    [...props.classes]
      .filter(
        cls => !props.character.classes.some(c => c.name.toLowerCase() === cls.name.toLowerCase())
      )
      .sort((a, b) => a.name.localeCompare(b.name))
  );

  const currentClassSummary = computed(() => {
    return props.character.classes
      .map(cls => {
        const lvl = props.character.classLevels[cls.name.toLowerCase() as keyof ClassLevels] ?? 0;
        return `${cls.name} ${lvl}`;
      })
      .join(' / ');
  });

  const popoutSubclasses = computed(() => {
    if (!popoutClass.value) return null;
    return props.subclasses[popoutClass.value.name] ?? null;
  });

  function openPopout(cls: CharClass) {
    popoutClass.value = cls;
  }

  function confirm() {
    if (!selectedClass.value) return;
    emit('nextStep', selectedClass.value);
  }
</script>

<style scoped>
  .levelup-section {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .levelup-section__heading {
    font-size: 0.9rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--color-primary, #6b2e2e);
    margin: 0;
  }
</style>
