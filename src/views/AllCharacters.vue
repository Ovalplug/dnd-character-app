<template>
  <div v-if="!loaded">
    <Loading message="Loading resources..." :size="96" variant="bold"></Loading>
  </div>
  <div v-else>
    <h1>Look at all your pretty creations!</h1>
    <!-- <accordian-holder header="charStore.characters">
      <pre>{{ charStore.characters }}</pre>
    </accordian-holder> -->

    <table class="characterTable">
      <caption>
        Character List
      </caption>
      <thead>
        <tr>
          <th>Name</th>
          <th>Class</th>
          <th>Lvl</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="char in charStore.characters" :key="char.id">
          <td>
            <router-link :to="`/character/${char.id}`">
              {{ char.name }}
            </router-link>
          </td>
          <td>{{ char.classes[0]?.name }}</td>
          <td>{{ char.level }}</td>
          <td>
            <img
              :src="icons.editIcon"
              alt="Edit"
              @click="openCharPopout(char)"
              class="reloadCharIcon"
            />
          </td>
        </tr>
      </tbody>
    </table>
    <br />
    <table class="characterTable">
      <caption>
        Encounter List
      </caption>
      <thead>
        <tr>
          <th>Name</th>
          <th>Updated At</th>
          <th></th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="enc in encounterStore.encounters" :key="enc.id">
          <td>
            <!-- <router-link :to="`/encounter/${enc.id}`"> -->
            {{ enc.name }}
            <!-- </router-link> -->
          </td>
          <td>{{ new Date(enc.updatedAt).toLocaleString() }}</td>
          <td>
            <img
              :src="icons.binIcon"
              alt="Run"
              @click="deleteEncounter(enc.id)"
              class="deleteCharIcon"
            />
          </td>
          <td>
            <img
              :src="icons.editIcon"
              alt="Edit"
              @click="editEncounter(enc.id)"
              class="reloadCharIcon"
            />
          </td>
        </tr>
      </tbody>
    </table>
    <br />
    <table class="characterTable">
      <caption>
        Spellbook List
      </caption>
      <thead>
        <tr>
          <th>Name</th>
          <th>Ability</th>
          <th>DC</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="spellbook in spellBookStore.spellbooks" :key="spellbook.id">
          <td>
            <router-link :to="`/spellbook/${spellbook.id}`">
              {{ spellbook.name }}
            </router-link>
          </td>
          <td>{{ spellbook.spellcastingAbility }}</td>
          <td>{{ spellbook.spellcastingDc }}</td>
          <td>
            <img
              :src="icons.binIcon"
              alt="Delete"
              @click="deleteSpellbook(spellbook.id)"
              class="deleteCharIcon"
            />
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <PopOut v-if="selectedChar" :title="selectedChar.name" @close="closeCharPopout">
    <div class="char-popout-actions">
      <p>Classes: {{ selectedChar.classes.map(c => c.name).join(', ') }}</p>
      <p>Level: {{ selectedChar.level }}</p>
      <p>Race: {{ selectedChar.race?.name }}</p>
      <p>Background: {{ selectedChar.background?.name }}</p>
      <p>Last Updated: {{ new Date(selectedChar.updatedAt).toLocaleString() }}</p>
      <p>Created: {{ new Date(selectedChar.createdAt).toLocaleString() }}</p>
      <div class="rename-row">
        <!-- <input class="rename-input" :placeholder="selectedChar.name" v-model="newName" /> -->
        <input class="rename-input" placeholder="Rename?" v-model="newName" />
        <button
          class="popout-action-btn rename-btn"
          @click="charStore.editCharacterName(selectedChar!.id, newName).then(softRefresh)"
        >
          Save
        </button>
      </div>
      <button
        class="popout-action-btn"
        @click="charStore.touchUpCharacter(selectedChar!.id).then(softRefresh)"
      >
        <img :src="icons.reloadIcon" alt="Reload" />
        Reload
      </button>
      <button class="popout-action-btn popout-action-btn--danger" @click="confirmingDelete = true">
        <img :src="icons.binIcon" alt="Delete" />
        Delete
      </button>
      <div v-if="confirmingDelete" class="delete-confirm">
        <p>
          Are you sure you want to delete <strong>{{ selectedChar!.name }}</strong
          >?
        </p>
        <p class="p2">Once deleted, this action cannot be undone.</p>
        <div class="delete-confirm-actions">
          <button
            class="popout-action-btn popout-action-btn--danger"
            @click="deleteCharacter(selectedChar!.id)"
          >
            Yes, delete
          </button>
          <button class="popout-action-btn" @click="confirmingDelete = false">Cancel</button>
        </div>
      </div>
    </div>
  </PopOut>
</template>

<script setup lang="ts">
  import { computed, ref } from 'vue';
  import { useCharacterStore } from '../stores/characterStore';
  import type { Character } from '../database/db';
  import { useEncounterStore } from '../stores/encounterStore.ts';
  import { useSpellBookStore } from '../stores/spellBookStore.ts';
  import { useRouter } from 'vue-router';

  const router = useRouter();

  import Loading from '../components/resources/Loading.vue';

  import binIcon from '../assets/bin-svgrepo-com.svg';
  import reloadIcon from '../assets/icons/reload.svg';
  import editIcon from '../assets/icons/editIcon.svg';
  import swordIcon from '../assets/icons/sword.svg';
  import AccordianHolder from '../components/AccordianHolder.vue';
  import PopOut from '../components/PopOut.vue';

  const newName = ref('');

  const charStore = useCharacterStore();
  const encounterStore = useEncounterStore();
  const spellBookStore = useSpellBookStore();

  // Load on mount
  encounterStore.loadEncounters();
  spellBookStore.loadSpellbooks();

  const loaded = computed(() => charStore.loaded && encounterStore.loaded && spellBookStore.loaded);

  const icons: Record<string, string> = {
    binIcon: binIcon,
    reloadIcon: reloadIcon,
    editIcon: editIcon,
    swordIcon: swordIcon,
  };

  const selectedChar = ref<Character | null>(null);
  const confirmingDelete = ref(false);

  function openCharPopout(char: Character) {
    selectedChar.value = char;
    confirmingDelete.value = false;
  }

  function closeCharPopout() {
    selectedChar.value = null;
    confirmingDelete.value = false;
    newName.value = '';
  }

  async function deleteCharacter(id: string) {
    await charStore.deleteCharacter(id);
    closeCharPopout();
  }

  async function softRefresh() {
    await charStore.loadCharacters();
    if (selectedChar.value) {
      selectedChar.value = charStore.characters.find(c => c.id === selectedChar.value!.id) ?? null;
    }
  }

  async function deleteEncounter(id: string) {
    await encounterStore.deleteEncounter(id);
    await encounterStore.loadEncounters();
  }

  function editEncounter(id: string) {
    console.log('Navigating to edit encounter with ID:', id);

    router.push({
      path: '/encounter/edit',
      query: {
        id: id,
      },
    });
  }

  async function deleteSpellbook(id: string) {
    await spellBookStore.deleteSpellbook(id);
    await spellBookStore.loadSpellbooks();
  }
</script>

<style scoped>
  .characterTable {
    width: 100%;
    border-collapse: collapse;
    margin-top: 1rem;
    table-layout: fixed;
    background: var(--color-surface);
    border-radius: var(--radius);
    overflow: hidden;
    box-shadow: var(--color-card-shadow);
  }

  .characterTable th,
  .characterTable td {
    padding: 0.6rem 0.75rem;
    text-align: left;
    border-bottom: 1px solid rgba(31, 27, 22, 0.1);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .characterTable th {
    font-weight: 600;
    font-size: 0.85rem;
    color: var(--color-muted);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    background: rgba(31, 27, 22, 0.04);
  }

  .characterTable tbody tr:last-child td {
    border-bottom: none;
  }

  .characterTable tbody tr:hover {
    background: rgba(201, 164, 75, 0.08);
  }

  /* Name column — takes remaining space */
  .characterTable th:nth-child(1),
  .characterTable td:nth-child(1) {
    width: auto;
    white-space: normal;
    word-break: break-word;
  }

  /* Class column */
  .characterTable th:nth-child(2),
  .characterTable td:nth-child(2) {
    width: 90px;
  }

  /* Level column */
  .characterTable th:nth-child(3),
  .characterTable td:nth-child(3) {
    width: 44px;
    text-align: center;
  }

  /* Icon columns */
  .characterTable th:nth-child(4),
  .characterTable td:nth-child(4),
  .characterTable th:nth-child(5),
  .characterTable td:nth-child(5) {
    width: 32px;
    text-align: center;
    padding: 0.4rem 0.2rem;
  }

  /* Smaller text on mobile */
  @media (max-width: 479px) {
    .characterTable th,
    .characterTable td {
      font-size: 0.78rem;
      padding: 0.5rem 0.4rem;
    }

    .characterTable th:nth-child(2),
    .characterTable td:nth-child(2) {
      width: 70px;
    }
  }

  .deleteCharIcon,
  .reloadCharIcon {
    width: 18px;
    height: 18px;
    cursor: pointer;
    opacity: 0.6;
    transition: opacity 0.15s ease;
    display: block;
    margin: 0 auto;
  }

  .deleteCharIcon:hover,
  .reloadCharIcon:hover {
    opacity: 1;
  }

  .char-popout-actions {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 0.5rem 0;
  }

  .popout-action-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.6rem 1rem;
    border: 1px solid rgba(31, 27, 22, 0.15);
    border-radius: var(--radius);
    background: var(--color-surface);
    color: var(--color-text);
    font-size: 0.9rem;
    cursor: pointer;
    transition: background 0.15s ease;
    width: 100%;
  }

  .popout-action-btn img {
    width: 18px;
    height: 18px;
    opacity: 0.7;
  }

  .popout-action-btn:hover {
    background: rgba(201, 164, 75, 0.12);
  }

  .popout-action-btn--danger {
    border-color: rgba(180, 60, 60, 0.25);
    color: #b43c3c;
  }

  .popout-action-btn--danger:hover {
    background: rgba(180, 60, 60, 0.08);
  }

  .delete-confirm {
    border: 1px solid rgba(180, 60, 60, 0.3);
    border-radius: var(--radius);
    padding: 0.75rem;
    background: rgba(180, 60, 60, 0.05);
  }

  .delete-confirm p {
    margin: 0 0 0.6rem;
    font-size: 0.9rem;
  }

  .delete-confirm-actions {
    display: flex;
    gap: 0.5rem;
  }

  .rename-row {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }

  .rename-input {
    flex: 1;
    padding: 0.55rem 0.75rem;
    border-radius: var(--radius);
    border: 1px solid rgba(31, 27, 22, 0.15);
    background: var(--color-bg);
    color: var(--color-text);
    font-size: 0.9rem;
  }

  .rename-input:focus {
    outline: none;
    border-color: var(--color-accent);
    box-shadow: 0 0 0 3px rgba(201, 164, 75, 0.15);
  }

  .rename-btn {
    white-space: nowrap;
    flex-shrink: 0;
    width: auto;
  }
</style>
