<template>
  <div class="nav-root">
    <aside
      id="sidebar"
      class="sidebar"
      :class="{ expanded: expanded, collapsed: !expanded }"
      @keydown.esc="collapse"
      tabindex="-1"
    >
      <header class="sidebar-header">
        <div class="brand-wrap">
          <button
            class="expand-btn"
            @click="toggle"
            :aria-expanded="expanded"
            :title="expanded ? 'Collapse' : 'Expand'"
          >
            <span v-if="!expanded" class="icon"
              ><img :src="menuIcon" alt="" aria-hidden="true"
            /></span>
            <span v-else class="icon"><img :src="closeIcon" alt="" aria-hidden="true" /></span>
          </button>

          <h2 class="brand" v-if="expanded">dnd-character-app</h2>
        </div>
      </header>

      <nav class="nav-list" aria-label="Main navigation">
        <ul>
          <li>
            <a
              href="#"
              class="nav-item"
              :title="!expanded ? 'Home' : ''"
              @click.prevent="navigateTo('/')"
            >
              <span class="icon">
                <img :src="homeIcon" alt="" aria-hidden="true" />
              </span>
              <span class="label" v-if="expanded">Home</span>
            </a>
          </li>

          <li>
            <a
              href="#"
              class="nav-item"
              :title="!expanded ? 'Characters' : ''"
              @click.prevent="navigateTo('/characters')"
            >
              <span class="icon">
                <img :src="usersIcon" alt="" aria-hidden="true" />
              </span>
              <span class="label" v-if="expanded">Characters</span>
            </a>
          </li>

          <li>
            <a
              href="#"
              class="nav-item"
              :title="!expanded ? 'Create' : ''"
              @click.prevent="navigateTo('/create')"
            >
              <span class="icon">
                <img :src="plusIcon" alt="" aria-hidden="true" />
              </span>
              <span class="label" v-if="expanded">Create</span>
            </a>
          </li>

          <li>
            <a
              href="#"
              class="nav-item"
              :title="!expanded ? 'Settings' : ''"
              @click.prevent="navigateTo('/settings')"
            >
              <span class="icon">
                <img :src="settingsIcon" alt="" aria-hidden="true" />
              </span>
              <span class="label" v-if="expanded">Settings</span>
            </a>
          </li>
        </ul>
      </nav>

      <footer class="sidebar-footer">
        <slot name="footer">V 0.1</slot>
      </footer>
    </aside>

    <div class="backdrop" v-if="expanded" @click="collapse" />
  </div>
</template>

<script setup lang="ts">
  import { ref, watchEffect } from 'vue';
  import router from '../router';

  import menuIcon from '../assets/icons/menu.svg';
  import closeIcon from '../assets/icons/close.svg';
  import homeIcon from '../assets/icons/home.svg';
  import usersIcon from '../assets/icons/users.svg';
  import plusIcon from '../assets/icons/plus.svg';
  import settingsIcon from '../assets/icons/settings.svg';

  // `expanded` controls whether the sidebar shows labels and takes more screen.
  // When false, the sidebar is a narrow icon-only strip for quick navigation.
  const expanded = ref(false);

  function toggle() {
    expanded.value = !expanded.value;
  }

  function collapse() {
    expanded.value = false;
  }

  function navigateTo(path: string) {
    router.push(path);
    collapse();
  }

  // On small screens, lock body scroll when expanded
  watchEffect(() => {
    if (expanded.value) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
  });
</script>

<style scoped>
  .nav-root {
    position: relative;
  }
  .nav-toggle {
    display: none;
  }
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
  .backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.45);
    z-index: 50;
  }
  .sidebar {
    position: fixed;
    left: 0;
    top: 0;
    height: 100vh;
    background: #fff;
    box-shadow: 2px 0 8px rgba(0, 0, 0, 0.08);
    z-index: 70;
    display: flex;
    flex-direction: column;
    width: 64px; /* collapsed width */
    transition: width 200ms ease, transform 200ms ease;
    overflow: visible;
  }
  .sidebar.expanded {
    width: 100%;
    max-width: 420px;
  }
  .sidebar.collapsed {
    width: 45px;
  }
  .sidebar-header {
    display: flex;
    align-items: center;
    padding: 12px;
    border-bottom: 1px solid #eee;
  }
  .brand-wrap {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .brand {
    margin: 0;
    font-size: 1rem;
  }
  .expand-btn {
    background: transparent;
    border: none;
    padding: 6px;
    border-radius: 6px;
  }
  .nav-list {
    padding: 12px 8px;
    flex: 1;
    overflow: auto;
  }
  .nav-list ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  .nav-list li {
    margin: 6px 0;
  }
  .nav-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px;
    border-radius: 8px;
    color: #111;
    text-decoration: none;
  }
  .nav-item .icon {
    display: inline-flex;
    width: 32px;
    height: 32px;
    align-items: center;
    justify-content: center;
  }
  .nav-item .label {
    white-space: nowrap;
  }
  .nav-item .icon img {
    width: 20px;
    height: 20px;
    display: block;
  }
  .nav-item:hover,
  .nav-item:focus {
    background: #f6f6f6;
  }
  .sidebar-footer {
    padding: 12px 8px;
    border-top: 1px solid #eee;
  }

  /* When expanded on mobile, make the panel full-screen */
  @media (max-width: 599px) {
    .sidebar.expanded {
      width: 100%;
      max-width: 100vw;
    }
  }

  /* On larger screens the collapsed icon strip remains visible and expanded becomes a side panel */
  @media (min-width: 600px) {
    .sidebar.expanded {
      width: 320px;
      max-width: 40vw;
    }
  }

  @media (min-width: 1024px) {
    .sidebar.expanded {
      width: 300px;
    }
  }

  /* Larger screens: display sidebar as partial panel instead of full width */
  @media (min-width: 600px) {
    .sidebar {
      width: 320px;
      max-width: 40vw;
    }
    .nav-toggle {
      left: 20px;
      top: 18px;
    }
  }

  /* On very large screens, keep behavior similar but narrower */
  @media (min-width: 1024px) {
    .sidebar {
      width: 300px;
    }
  }
</style>
