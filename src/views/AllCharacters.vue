<template>
  <div>
    <h1>Look at all your pretty characters!</h1>
    <accordian-holder header="charStore.characters">
      <pre>{{ charStore.characters }}</pre>
    </accordian-holder>

    <table class="characterTable">
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
              @click="openPopout(char)"
              class="reloadCharIcon"
            />
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <PopOut
    v-if="selectedChar"
    :title="selectedChar.name"
    @close="closePopout"
  >
    <div class="char-popout-actions">
      <p>Classes: {{ selectedChar.classes.map(c => c.name).join(', ') }}</p>
      <p>Level: {{ selectedChar.level }}</p>
      <p>Race: {{ selectedChar.race?.name }}</p>
      <p>Background: {{ selectedChar.background?.name }}</p>
      <p>Last Updated: {{ new Date(selectedChar.updatedAt).toLocaleString() }}</p>
      <p>Created: {{ new Date(selectedChar.createdAt).toLocaleString() }}</p>
      <button class="popout-action-btn" @click="charStore.touchUpCharacter(selectedChar!.id)">
        <img :src="icons.reloadIcon" alt="Reload" />
        Reload
      </button>
      <button class="popout-action-btn popout-action-btn--danger" @click="deleteCharacter(selectedChar!.id)">
        <img :src="icons.binIcon" alt="Delete" />
        Delete
      </button>
    </div>
  </PopOut>
</template>

<script setup lang="ts">
  import { ref } from 'vue';
  import { useCharacterStore } from '../stores/characterStore';
  import type { Character } from '../database/db';

  import binIcon from '../assets/bin-svgrepo-com.svg';
  import reloadIcon from '../assets/icons/reload.svg';
  import editIcon from '../assets/icons/editIcon.svg';
  import AccordianHolder from '../components/AccordianHolder.vue';
  import PopOut from '../components/PopOut.vue';

  const charStore = useCharacterStore();

  const icons: Record<string, string> = {
    binIcon: binIcon,
    reloadIcon: reloadIcon,
    editIcon: editIcon,
  };

  const selectedChar = ref<Character | null>(null);

  function openPopout(char: Character) {
    selectedChar.value = char;
  }

  function closePopout() {
    selectedChar.value = null;
  }

  async function deleteCharacter(id: string) {
    await charStore.deleteCharacter(id);
    closePopout();
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
</style>
