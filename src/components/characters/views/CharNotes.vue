<template>
  <article class="character-detail-view">
    <NameBadge :character="props.character" />

    <section
      v-for="definition in noteSectionDefinitions"
      :key="definition.id"
      class="character-detail-card notes-accordion"
      :class="{ 'notes-accordion--open': isSectionOpen(definition.id) }"
    >
      <div class="notes-accordion__header">
        <button
          type="button"
          class="notes-accordion__toggle"
          :aria-expanded="isSectionOpen(definition.id)"
          @click="toggleSection(definition.id)"
        >
          <div class="notes-accordion__copy">
            <p class="character-detail-kicker">{{ definition.kicker }}</p>
            <h3 class="notes-accordion__title">{{ definition.title }}</h3>
            <p class="character-detail-copy">{{ definition.description }}</p>
          </div>

          <div class="notes-accordion__meta">
            <span class="notes-accordion__count">
              {{ getSection(definition.id).entries.length }}
              {{ getSection(definition.id).entries.length === 1 ? 'note' : 'notes' }}
            </span>
            <span
              class="notes-accordion__chevron"
              :class="{ 'notes-accordion__chevron--open': isSectionOpen(definition.id) }"
            >
              ⌄
            </span>
          </div>
        </button>

        <button type="button" class="notes-accordion__add" @click="addNote(definition.id)">
          Add Note
        </button>
      </div>

      <div v-if="isSectionOpen(definition.id)" class="notes-accordion__body">
        <div class="notes-accordion__toolbar">
          <p class="notes-accordion__hint">
            Each note saves automatically shortly after you stop typing.
          </p>
          <button type="button" class="creation-secondary-button" @click="addNote(definition.id)">
            Add Note
          </button>
        </div>

        <div v-if="getSection(definition.id).entries.length" class="notes-entry-list">
          <article
            v-for="(entry, index) in getSection(definition.id).entries"
            :key="entry.id"
            class="notes-entry-card"
          >
            <div class="notes-entry-card__header">
              <div>
                <p class="notes-entry-card__label">
                  {{ entry.title.trim() || `Note ${index + 1}` }}
                </p>
                <p class="notes-entry-card__meta">{{ formatEntryMeta(entry.updatedAt) }}</p>
              </div>
              <div class="notes-entry-card__actions">
                <button
                  type="button"
                  class="notes-entry-card__move"
                  :disabled="index === 0"
                  :aria-label="`Move ${entry.title.trim() || `note ${index + 1}`} up`"
                  @click="moveNote(definition.id, entry.id, 'up')"
                >
                  <img :src="upArrow" alt="" />
                </button>
                <button
                  type="button"
                  class="notes-entry-card__move"
                  :disabled="index === getSection(definition.id).entries.length - 1"
                  :aria-label="`Move ${entry.title.trim() || `note ${index + 1}`} down`"
                  @click="moveNote(definition.id, entry.id, 'down')"
                >
                  <img :src="downArrow" alt="" />
                </button>
                <button
                  type="button"
                  class="notes-entry-card__delete"
                  @click="deleteNote(definition.id, entry.id)"
                >
                  Delete
                </button>
              </div>
            </div>

            <label class="notes-entry-card__field">
              <span class="notes-entry-card__field-label">Title</span>
              <input
                type="text"
                :value="entry.title"
                placeholder="Give this note a short title"
                @input="onTitleInput(definition.id, entry.id, $event)"
              />
            </label>

            <label class="notes-entry-card__field">
              <span class="notes-entry-card__field-label">Details</span>
              <textarea
                :value="entry.content"
                :placeholder="definition.placeholder"
                rows="6"
                @input="onNoteInput(definition.id, entry.id, $event)"
              ></textarea>
            </label>
          </article>
        </div>

        <div v-else class="notes-empty-state">
          <p class="notes-empty-state__title">No notes in this section yet.</p>
          <p class="character-detail-copy">
            Add a note card to keep this section compact until it is needed.
          </p>
        </div>
      </div>
    </section>
  </article>
</template>

<script lang="ts" setup>
  import { computed, onBeforeUnmount, ref, watch } from 'vue';
  import downArrow from '../../../assets/icons/down-arrow.svg';
  import upArrow from '../../../assets/icons/up-arrow.svg';
  import NameBadge from './subcomponents/NameBadge.vue';
  import type { CharacterNoteSection, CharacterNoteSectionId } from '../../../database/db';
  import { useCharacterStore } from '../../../stores/characterStore';
  import type { playerCharacter } from '../../../types';

  const props = defineProps<{
    character: playerCharacter;
  }>();

  const characterStore = useCharacterStore();

  const noteSectionDefinitions: Array<{
    id: CharacterNoteSectionId;
    kicker: string;
    title: string;
    description: string;
    placeholder: string;
  }> = [
    {
      id: 'characterDescription',
      kicker: 'Character Description',
      title: 'Appearance, mannerisms, and identity',
      description:
        'Store quick notes about how the character looks, sounds, or presents themselves so roleplay details stay easy to reference.',
      placeholder:
        'Describe posture, voice, signature habits, visual details, or the way this character tends to enter a room.',
    },
    {
      id: 'campaignNotes',
      kicker: 'Campaign Notes',
      title: 'Hooks, clues, and session reminders',
      description:
        'Use separate cards for quest leads, unresolved mysteries, travel plans, or anything the player wants to revisit fast.',
      placeholder:
        'Track party leads, quest hooks, NPC clues, or anything you want quick access to during play.',
    },
    {
      id: 'backstory',
      kicker: 'Backstory',
      title: 'History, motivations, and past events',
      description:
        'Break larger character history into smaller notes so the important pieces are easier to scan than one large block of text.',
      placeholder:
        'Write a backstory detail, past relationship, defining event, ideal, regret, or long-term motivation.',
    },
    {
      id: 'alliesAndOrganizations',
      kicker: 'Allies and Organizations',
      title: 'Contacts, factions, and obligations',
      description:
        'Keep one card per ally, group, patron, rival network, or organization the character needs to remember.',
      placeholder:
        'Add a person, faction, guild, church, order, or any relationship worth keeping close at hand.',
    },
  ];

  const sections = ref<CharacterNoteSection[]>(createEmptySections());
  const openSectionIds = ref<CharacterNoteSectionId[]>([]);
  const loading = ref(false);
  const saving = ref(false);
  const saveMode = ref<'auto' | 'manual'>('manual');
  const pendingAutoSave = ref(false);
  const saveError = ref('');
  const lastSavedAt = ref<number | null>(null);
  const baseline = ref<CharacterNoteSection[]>(createEmptySections());
  const hydrating = ref(false);
  let autoSaveTimer: number | null = null;
  let loadSequence = 0;

  const sectionsById = computed(
    () => new Map(sections.value.map(section => [section.id, section] as const))
  );

  const hasChanges = computed(
    () => JSON.stringify(sections.value) !== JSON.stringify(baseline.value)
  );

  const statusMessage = computed(() => {
    if (loading.value) return 'Loading notes...';
    if (saveError.value) return saveError.value;
    if (saving.value) {
      return saveMode.value === 'auto' ? 'Autosaving notes...' : 'Saving notes now.';
    }
    if (pendingAutoSave.value && hasChanges.value) return 'Changes queued for autosave.';
    if (hasChanges.value) return 'You have unsaved changes.';
    if (lastSavedAt.value) return 'All notes are saved.';
    return 'Notes are ready. Changes will autosave.';
  });

  const lastSavedLabel = computed(() => {
    if (!lastSavedAt.value) return '';
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(lastSavedAt.value);
  });

  function createEmptySections(): CharacterNoteSection[] {
    return noteSectionDefinitions.map(definition => ({
      id: definition.id,
      entries: [],
    }));
  }

  function cloneSections(nextSections: CharacterNoteSection[]): CharacterNoteSection[] {
    return nextSections.map(section => ({
      id: section.id,
      entries: section.entries.map(entry => ({ ...entry })),
    }));
  }

  function normalizeSections(nextSections: CharacterNoteSection[]): CharacterNoteSection[] {
    const sectionMap = new Map(nextSections.map(section => [section.id, section] as const));
    return noteSectionDefinitions.map(definition => ({
      id: definition.id,
      entries: (sectionMap.get(definition.id)?.entries || []).map(entry => ({ ...entry })),
    }));
  }

  function applySections(nextSections: CharacterNoteSection[]) {
    const normalizedSections = normalizeSections(nextSections);
    sections.value = cloneSections(normalizedSections);
    baseline.value = cloneSections(normalizedSections);
  }

  function clearAutoSaveTimer() {
    if (autoSaveTimer !== null) {
      window.clearTimeout(autoSaveTimer);
      autoSaveTimer = null;
    }
  }

  function scheduleAutoSave() {
    clearAutoSaveTimer();
    if (loading.value || hydrating.value || !hasChanges.value) {
      pendingAutoSave.value = false;
      return;
    }

    pendingAutoSave.value = true;
    autoSaveTimer = window.setTimeout(() => {
      autoSaveTimer = null;
      if (hasChanges.value) {
        void saveNotes('auto');
      } else {
        pendingAutoSave.value = false;
      }
    }, 1000);
  }

  function getSection(sectionId: CharacterNoteSectionId): CharacterNoteSection {
    return sectionsById.value.get(sectionId) ?? { id: sectionId, entries: [] };
  }

  function isSectionOpen(sectionId: CharacterNoteSectionId) {
    return openSectionIds.value.includes(sectionId);
  }

  function toggleSection(sectionId: CharacterNoteSectionId) {
    openSectionIds.value = isSectionOpen(sectionId)
      ? openSectionIds.value.filter(id => id !== sectionId)
      : [...openSectionIds.value, sectionId];
  }

  function setSections(nextSections: CharacterNoteSection[]) {
    sections.value = normalizeSections(nextSections);
  }

  function addNote(sectionId: CharacterNoteSectionId) {
    const timestamp = Date.now();
    setSections(
      sections.value.map(section =>
        section.id === sectionId
          ? {
              ...section,
              entries: [
                ...section.entries,
                {
                  id: crypto.randomUUID(),
                  title: '',
                  content: '',
                  createdAt: timestamp,
                  updatedAt: timestamp,
                },
              ],
            }
          : section
      )
    );

    if (!isSectionOpen(sectionId)) {
      openSectionIds.value = [...openSectionIds.value, sectionId];
    }
  }

  function updateNote(sectionId: CharacterNoteSectionId, entryId: string, content: string) {
    const timestamp = Date.now();
    setSections(
      sections.value.map(section =>
        section.id === sectionId
          ? {
              ...section,
              entries: section.entries.map(entry =>
                entry.id === entryId ? { ...entry, content, updatedAt: timestamp } : entry
              ),
            }
          : section
      )
    );
  }

  function updateNoteTitle(sectionId: CharacterNoteSectionId, entryId: string, title: string) {
    const timestamp = Date.now();
    setSections(
      sections.value.map(section =>
        section.id === sectionId
          ? {
              ...section,
              entries: section.entries.map(entry =>
                entry.id === entryId ? { ...entry, title, updatedAt: timestamp } : entry
              ),
            }
          : section
      )
    );
  }

  function moveNote(sectionId: CharacterNoteSectionId, entryId: string, direction: 'up' | 'down') {
    setSections(
      sections.value.map(section => {
        if (section.id !== sectionId) return section;
        const currentIndex = section.entries.findIndex(entry => entry.id === entryId);
        if (currentIndex === -1) return section;

        const nextIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
        if (nextIndex < 0 || nextIndex >= section.entries.length) return section;

        const reorderedEntries = [...section.entries];
        const [movedEntry] = reorderedEntries.splice(currentIndex, 1);
        if (!movedEntry) return section;
        reorderedEntries.splice(nextIndex, 0, movedEntry);

        return {
          ...section,
          entries: reorderedEntries,
        };
      })
    );
  }

  function deleteNote(sectionId: CharacterNoteSectionId, entryId: string) {
    setSections(
      sections.value.map(section =>
        section.id === sectionId
          ? {
              ...section,
              entries: section.entries.filter(entry => entry.id !== entryId),
            }
          : section
      )
    );
  }

  function onNoteInput(sectionId: CharacterNoteSectionId, entryId: string, event: Event) {
    const target = event.target as HTMLTextAreaElement | null;
    updateNote(sectionId, entryId, target?.value || '');
  }

  function onTitleInput(sectionId: CharacterNoteSectionId, entryId: string, event: Event) {
    const target = event.target as HTMLInputElement | null;
    updateNoteTitle(sectionId, entryId, target?.value || '');
  }

  function formatEntryMeta(updatedAt: number) {
    return `Editable note • updated ${new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(updatedAt)}`;
  }

  async function loadNotes() {
    const currentLoad = ++loadSequence;
    clearAutoSaveTimer();
    loading.value = true;
    saveError.value = '';
    pendingAutoSave.value = false;
    hydrating.value = true;

    try {
      const notes = await characterStore.getCharacterNotes(props.character.id);
      if (currentLoad !== loadSequence) return;
      applySections(notes?.sections ?? createEmptySections());
      lastSavedAt.value = notes?.updatedAt ?? null;
    } finally {
      if (currentLoad === loadSequence) {
        hydrating.value = false;
        loading.value = false;
      }
    }
  }

  async function saveNotes(mode: 'auto' | 'manual' = 'manual') {
    clearAutoSaveTimer();
    pendingAutoSave.value = false;
    saveMode.value = mode;
    saving.value = true;
    saveError.value = '';

    try {
      const savedNotes = await characterStore.saveCharacterNotes(props.character.id, {
        sections: cloneSections(sections.value),
      });

      if (!savedNotes) {
        throw new Error('Could not save notes for this character.');
      }

      applySections(savedNotes.sections);
      lastSavedAt.value = savedNotes.updatedAt;
    } catch (error) {
      saveError.value =
        error instanceof Error
          ? error.message
          : 'Could not save notes. Your changes are still on screen.';
    } finally {
      saving.value = false;
      if (!saveError.value && hasChanges.value) {
        scheduleAutoSave();
      }
    }
  }

  watch(
    () => props.character.id,
    () => {
      void loadNotes();
    },
    { immediate: true }
  );

  watch(
    sections,
    () => {
      if (hydrating.value) return;
      saveError.value = '';
      scheduleAutoSave();
    },
    { deep: true }
  );

  onBeforeUnmount(() => {
    clearAutoSaveTimer();
  });
</script>

<style scoped>
  .notes-status-card {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    align-items: flex-end;
    flex-wrap: wrap;
  }

  .notes-status-card__copy {
    display: grid;
    gap: 0.3rem;
  }

  .notes-status-card__timestamp {
    margin: 0;
    color: var(--color-muted);
    font-size: 0.85rem;
  }

  .notes-actions {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
    margin-left: auto;
  }

  .notes-accordion {
    padding: 0;
    overflow: hidden;
  }

  .notes-accordion__toggle {
    width: 100%;
    flex: 1 1 auto;
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    padding: 1.2rem 1.3rem;
    border: 0;
    background: transparent;
    text-align: left;
    cursor: pointer;
  }

  .notes-accordion__header {
    display: flex;
    gap: 0.9rem;
    align-items: stretch;
    padding: 0.8rem 0.8rem 0 0.8rem;
  }

  .notes-accordion__add {
    align-self: center;
    border: 0;
    border-radius: 999px;
    padding: 0.7rem 1rem;
    background: rgba(107, 46, 46, 0.08);
    color: var(--color-primary);
    font-weight: 700;
    cursor: pointer;
    white-space: nowrap;
  }

  .notes-accordion__copy {
    display: grid;
    gap: 0.35rem;
  }

  .notes-accordion__title {
    margin: 0;
    font-size: 1.15rem;
    color: var(--color-text);
  }

  .notes-accordion__meta {
    display: flex;
    align-items: center;
    gap: 0.85rem;
    margin-left: auto;
    white-space: nowrap;
  }

  .notes-accordion__count {
    border-radius: 999px;
    padding: 0.35rem 0.7rem;
    background: rgba(107, 46, 46, 0.1);
    color: var(--color-primary);
    font-size: 0.85rem;
    font-weight: 700;
  }

  .notes-accordion__chevron {
    font-size: 1.5rem;
    line-height: 1;
    color: var(--color-primary);
    transition: transform 0.2s ease;
  }

  .notes-accordion__chevron--open {
    transform: rotate(180deg);
  }

  .notes-accordion__body {
    display: grid;
    gap: 1rem;
    padding: 0 1.3rem 1.3rem;
    border-top: 1px solid rgba(107, 46, 46, 0.12);
  }

  .notes-accordion__toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    padding-top: 1rem;
    flex-wrap: wrap;
  }

  .notes-accordion__hint {
    margin: 0;
    color: var(--color-muted);
  }

  .notes-entry-list {
    display: grid;
    gap: 0.9rem;
  }

  .notes-entry-card {
    display: grid;
    gap: 0.75rem;
    padding: 1rem;
    border-radius: 16px;
    background: rgba(255, 255, 255, 0.7);
    border: 1px solid rgba(107, 46, 46, 0.12);
  }

  .notes-entry-card__header {
    display: flex;
    justify-content: space-between;
    gap: 0.8rem;
    align-items: flex-start;
    flex-wrap: wrap;
  }

  .notes-entry-card__label,
  .notes-entry-card__meta,
  .notes-empty-state__title {
    margin: 0;
  }

  .notes-entry-card__actions {
    display: flex;
    gap: 0.45rem;
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  .notes-entry-card__label {
    font-weight: 700;
    color: var(--color-text);
  }

  .notes-entry-card__meta {
    font-size: 0.85rem;
    color: var(--color-muted);
  }

  .notes-entry-card__field {
    display: grid;
    gap: 0.4rem;
  }

  .notes-entry-card__field-label {
    font-size: 0.82rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--color-primary);
  }

  .notes-entry-card__field input,
  .notes-entry-card__field textarea {
    width: 100%;
    border-radius: 12px;
    padding: 0.85rem 0.95rem;
    font: inherit;
    color: var(--color-text);
    background: rgba(255, 255, 255, 0.82);
    border: 1px solid rgba(107, 46, 46, 0.14);
    box-sizing: border-box;
  }

  .notes-entry-card__field input:focus,
  .notes-entry-card__field textarea:focus {
    outline: 2px solid rgba(107, 46, 46, 0.2);
    outline-offset: 1px;
  }

  .notes-entry-card__move,
  .notes-entry-card__delete {
    border: 0;
    border-radius: 999px;
    padding: 0.45rem 0.8rem;
    font-weight: 700;
    cursor: pointer;
  }

  .notes-entry-card__move {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2.25rem;
    height: 2.25rem;
    padding: 0;
    background: rgba(107, 46, 46, 0.08);
    color: var(--color-primary);
  }

  .notes-entry-card__move img {
    width: 1rem;
    height: 1rem;
  }

  .notes-entry-card__move:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  .notes-entry-card__delete {
    background: rgba(128, 27, 27, 0.1);
    color: #7c1d1d;
  }

  .notes-entry-card__field textarea {
    min-height: 8rem;
    resize: vertical;
    line-height: 1.55;
  }

  .notes-empty-state {
    display: grid;
    gap: 0.35rem;
    padding: 1rem;
    border-radius: 16px;
    background: rgba(255, 255, 255, 0.56);
    border: 1px dashed rgba(107, 46, 46, 0.2);
  }

  @media (max-width: 720px) {
    .notes-actions {
      width: 100%;
    }

    .notes-actions button {
      flex: 1 1 0;
    }

    .notes-accordion__toggle,
    .notes-accordion__header,
    .notes-accordion__toolbar,
    .notes-entry-card__header {
      align-items: stretch;
    }

    .notes-accordion__header,
    .notes-accordion__toggle,
    .notes-accordion__meta {
      flex-direction: column;
    }

    .notes-accordion__meta {
      margin-left: 0;
      align-items: flex-start;
    }

    .notes-accordion__add,
    .notes-accordion__toolbar button,
    .notes-entry-card__actions,
    .notes-entry-card__move,
    .notes-entry-card__delete {
      width: 100%;
    }

    .notes-entry-card__actions {
      justify-content: stretch;
    }
  }
</style>
