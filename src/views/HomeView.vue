<template>
  <div v-if="!dataStore.loaded" class="content-under-header">
    <Loading message="Loading..." :size="96" variant="bold" />
  </div>
  <div v-else class="home-root">
    <h1 class="home-title">D&D Companion</h1>
    <p class="home-subtitle">What are you doing today?</p>

    <div class="home-grid">
      <button class="home-card" @click="router.push('/encounters')">
        <img :src="swordIcon" class="home-card-icon" alt="" />
        <span class="home-card-label">Encounters</span>
        <span class="home-card-sub">Run or manage combat</span>
      </button>

      <button class="home-card" @click="router.push('/resources')">
        <img :src="bookIcon" class="home-card-icon" alt="" />
        <span class="home-card-label">Resources</span>
        <span class="home-card-sub">Spells, monsters, items &amp; more</span>
      </button>

      <button class="home-card" @click="router.push('/characters')">
        <img :src="usersIcon" class="home-card-icon" alt="" />
        <span class="home-card-label">Characters</span>
        <span class="home-card-sub">View your characters</span>
      </button>

      <button class="home-card" @click="router.push('/create')">
        <img :src="plusIcon" class="home-card-icon" alt="" />
        <span class="home-card-label">Create</span>
        <span class="home-card-sub">New encounter, spellbook, item</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
  import Loading from '../components/resources/Loading.vue';
  import { useDataStore } from '../stores/dataStore';
  import { useRouter } from 'vue-router';
  import { onMounted } from 'vue';

  import swordIcon from '../assets/icons/sword.svg?url';
  import bookIcon from '../assets/icons/book.svg?url';
  import usersIcon from '../assets/icons/users.svg?url';
  import plusIcon from '../assets/icons/plus.svg?url';

  const router = useRouter();
  const dataStore = useDataStore();

  onMounted(async () => {
    if (!dataStore.loaded) {
      try {
        await dataStore.init();
      } catch (err) {
        console.error('Failed to load data store', err);
      }
    }
  });
</script>

<style scoped>
  .home-root {
    padding: 1rem 0.5rem 2rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .home-title {
    margin: 0;
    color: var(--color-primary);
    font-size: clamp(1.6rem, 5vw, 2.4rem);
  }

  .home-subtitle {
    margin: 0 0 1rem;
    color: var(--color-muted);
    font-size: 1rem;
  }

  .home-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
  }

  .home-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    padding: 1.25rem 0.75rem;
    border-radius: var(--radius);
    border: 1px solid rgba(107, 46, 46, 0.18);
    background: var(--color-surface);
    box-shadow: var(--color-card-shadow);
    cursor: pointer;
    transition: transform 0.15s ease, box-shadow 0.15s ease;
    text-align: center;
    color: var(--color-text);
    font-family: inherit;
  }

  .home-card:hover,
  .home-card:focus-visible {
    transform: translateY(-2px);
    box-shadow: 0 10px 24px rgba(31, 27, 22, 0.12);
    border-color: var(--color-primary);
    outline: none;
  }

  .home-card:active {
    transform: translateY(0);
  }

  .home-card-icon {
    width: 40px;
    height: 40px;
    opacity: 0.75;
  }

  .home-card-label {
    font-weight: 700;
    font-size: 1rem;
    color: var(--color-primary);
  }

  .home-card-sub {
    font-size: 0.78rem;
    color: var(--color-muted);
    line-height: 1.3;
  }

  @media (min-width: 600px) {
    .home-grid {
      grid-template-columns: repeat(4, 1fr);
    }
  }
</style>
