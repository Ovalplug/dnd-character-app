<template>
  <div class="character-wrapper">
    <div ref="contentRef" class="character-content">
      <component :is="activeSectionComponent" :key="activeSection" :character="character" />
    </div>
    <div class="bar-content">
      <CharacterBar :active-section="activeSection" @selectSection="toggleSection" />
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { computed, nextTick, ref, watch } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import CharacterBar from './CharacterBar.vue';
  import CharAbilities from './views/CharAbilities.vue';
  import CharCombat from './views/CharCombat.vue';
  import CharInventory from './views/CharInventory.vue';
  import CharNotes from './views/CharNotes.vue';
  import CharOverview from './views/CharOverview.vue';

  import type { playerCharacter } from '../../types';

  const props = defineProps<{
    character: playerCharacter;
  }>();

  type CharacterSection = 'overview' | 'combat' | 'inventory' | 'abilities' | 'notes';

  const sectionComponents: Record<CharacterSection, unknown> = {
    overview: CharOverview,
    combat: CharCombat,
    inventory: CharInventory,
    abilities: CharAbilities,
    notes: CharNotes,
  };

  const route = useRoute();
  const router = useRouter();
  const contentRef = ref<HTMLElement | null>(null);
  const activeSection = ref<CharacterSection>('overview');
  const activeSectionComponent = computed(() => sectionComponents[activeSection.value]);

  function resolveSection(section: unknown): CharacterSection | null {
    return typeof section === 'string' && section in sectionComponents
      ? (section as CharacterSection)
      : null;
  }

  function getStorageKey(characterId: string) {
    return `character-view-section:${characterId}`;
  }

  function readStoredSection(characterId: string): CharacterSection | null {
    const stored = window.localStorage.getItem(getStorageKey(characterId));
    return resolveSection(stored);
  }

  function persistSection(section: CharacterSection) {
    window.localStorage.setItem(getStorageKey(props.character.id), section);
  }

  function syncRouteSection(section: CharacterSection) {
    if (route.query.section === section) return;
    router.replace({
      query: {
        ...route.query,
        section,
      },
    });
  }

  function resolveInitialSection(): CharacterSection {
    return (
      resolveSection(route.query.section) ?? readStoredSection(props.character.id) ?? 'overview'
    );
  }

  activeSection.value = resolveInitialSection();

  watch(
    () => route.query.section,
    querySection => {
      const resolved = resolveSection(querySection);
      if (resolved && resolved !== activeSection.value) {
        activeSection.value = resolved;
      }
    }
  );

  watch(
    () => props.character.id,
    characterId => {
      const nextSection =
        resolveSection(route.query.section) ?? readStoredSection(characterId) ?? 'overview';
      activeSection.value = nextSection;
    }
  );

  watch(
    activeSection,
    section => {
      persistSection(section);
      syncRouteSection(section);
    },
    { immediate: true }
  );

  async function toggleSection(section: string) {
    if (!(section in sectionComponents)) return;
    activeSection.value = section as CharacterSection;
    await nextTick();
    if (contentRef.value) {
      contentRef.value.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }
</script>

<style scoped>
  .character-wrapper {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  .character-content {
    flex: 1 1 0;
    overflow-y: auto;
    overflow-x: hidden;
  }

  .bar-content {
    flex: 0 0 auto;
  }
</style>
