<template>
  <div>
    <h1>Look at all your pretty characters!</h1>

    <table class="characterTable">
      <thead>
        <tr>
          <th>Name</th>
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
              @click="charStore.reloadCharacter(char.id)"
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

  /* column widths */
  .characterTable th:nth-child(1),
  .characterTable td:nth-child(1) {
    width: auto;
    white-space: normal;
    word-break: break-word;
  }
  .characterTable th:nth-child(2),
  .characterTable td:nth-child(2) {
    width: 48px;
    text-align: center;
  }

  .deleteCharIcon {
    width: 16px;
    height: 16px;
    cursor: pointer;
    opacity: 0.6;
    transition: opacity 0.15s ease;
  }

  .deleteCharIcon:hover {
    opacity: 1;
  }
</style>
