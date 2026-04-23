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
              :src="icons.binIcon"
              alt="Delete"
              @click="charStore.deleteCharacter(char.id)"
              class="deleteCharIcon"
            />
          </td>
          <td>
            <img
              :src="icons.reloadIcon"
              alt="Reload"
              @click="charStore.touchUpCharacter(char.id)"
              class="reloadCharIcon"
            />
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
  //   import { ref } from 'vue';
  import { useCharacterStore } from '../stores/characterStore';
  //   import { useRouter } from 'vue-router';

  import binIcon from '../assets/bin-svgrepo-com.svg';
  import reloadIcon from '../assets/icons/reload.svg';
import AccordianHolder from '../components/AccordianHolder.vue';

  const charStore = useCharacterStore();

  const icons: Record<string, string> = {
    binIcon: binIcon,
    reloadIcon: reloadIcon,
  };
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
</style>
