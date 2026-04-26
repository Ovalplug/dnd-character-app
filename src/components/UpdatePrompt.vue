<template>
  <div class="update-overlay" role="dialog" aria-modal="true" aria-label="Update Available">
    <div class="update-dialog">
      <h2 class="update-title">Update Available</h2>
      <p class="update-body">
        A new version of the app is available.<br />
        <span class="update-versions">
          Current: <strong>v{{ currentVersion }}</strong> &rarr; Latest:
          <strong>v{{ latestVersion }}</strong>
        </span>
      </p>
      <div class="update-actions">
        <button class="btn btn-primary" @click="openDownload">Download Update</button>
        <button class="btn btn-secondary" @click="dismiss">Later</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { APP_VERSION } from '../constants';
  import { useUpdateChecker, dismissUpdate } from '../composables/useUpdateChecker';
  import { Capacitor } from '@capacitor/core';

  const { latestVersion, downloadUrl } = useUpdateChecker();
  const currentVersion = APP_VERSION;

  function openDownload() {
    const url = downloadUrl.value;
    if (Capacitor.isNativePlatform()) {
      window.open(url, '_system');
    } else {
      window.location.reload();
    }
  }

  function dismiss() {
    dismissUpdate();
  }
</script>

<style scoped>
  .update-overlay {
    position: fixed;
    inset: 0;
    z-index: 9999;
    background: rgba(31, 27, 22, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
  }

  .update-dialog {
    background: var(--color-surface);
    border: 2px solid var(--color-accent);
    border-radius: var(--radius);
    padding: 1.75rem 2rem;
    max-width: 380px;
    width: 100%;
    box-shadow: 0 8px 32px rgba(31, 27, 22, 0.2);
    text-align: center;
  }

  .update-title {
    color: var(--color-primary);
    margin: 0 0 0.75rem;
    font-size: 1.4rem;
  }

  .update-body {
    color: var(--color-text);
    line-height: 1.6;
    margin: 0 0 1.5rem;
  }

  .update-versions {
    display: block;
    margin-top: 0.5rem;
    font-size: 0.95rem;
    color: var(--color-muted);
  }

  .update-actions {
    display: flex;
    gap: 0.75rem;
    justify-content: center;
  }

  .btn {
    padding: 0.55rem 1.25rem;
    border: none;
    border-radius: calc(var(--radius) / 2);
    font-size: 0.95rem;
    cursor: pointer;
    font-family: var(--font-sans);
    transition: filter 0.15s;
  }

  .btn:hover {
    filter: brightness(0.9);
  }

  .btn-primary {
    background: var(--color-primary);
    color: #fff;
  }

  .btn-secondary {
    background: transparent;
    color: var(--color-muted);
    border: 1px solid var(--color-muted);
  }
</style>
