<template>
  <div class="container">
    <button class="next-btn" @click="confirmSelection" :disabled="!allSelected">Next</button>
    <div v-for="cls in classesNeedingSubclass" :key="cls.name" class="subclass-group">
      <h3>Choose a subclass for {{ cls.name }}</h3>
      <table class="subclass-table">
        <thead>
          <tr>
            <th>Subclass</th>
            <th>Select</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(sub, i) in availableSubclasses(cls.name)" :key="i">
            <td>{{ sub.name }}</td>
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
    </div>
    <button class="next-btn" @click="confirmSelection" :disabled="!allSelected">Next</button>
  </div>
</template>

<script lang="ts" setup>
  import { computed, onMounted, reactive } from 'vue';
  import type { CharClass, ClassLevels, Subclass, Subclasses } from '../../../types';
  import { useCharacterStore } from '../../../stores/characterStore';

  const props = defineProps<{ subclasses: Subclasses }>();
  const emit = defineEmits<{ (e: 'nextStep'): void }>();

  const store = useCharacterStore();

  // Classes where the character's current level equals the class's subclassAtLvl
  const classesNeedingSubclass = computed<CharClass[]>(() => {
    if (!store.currNewCharacter) return [];
    return store.currNewCharacter.classes.filter(cls => {
      const level = store.currNewCharacter!.classLevels[cls.name.toLowerCase() as keyof ClassLevels];
      return level === cls.subclassAtLvl;
    });
  });

  const selectedSubclasses = reactive<Record<string, Subclass>>({});

  const allSelected = computed(() =>
    classesNeedingSubclass.value.every(cls => selectedSubclasses[cls.name] !== undefined)
  );

  function availableSubclasses(className: string) {
    return props.subclasses[className] ?? [];
  }

  function selectSubclass(className: string, subclass: Subclass) {
    selectedSubclasses[className] = subclass;
  }

  function confirmSelection() {
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
  }
</style>
