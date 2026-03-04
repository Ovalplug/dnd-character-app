<template>
  <div>
    <template v-for="(entry, i) in props.entries" :key="i">
      <p v-if="typeof entry === 'string'">{{ entry }}</p>

      <div v-else-if="entry.type === 'list'">
        <div v-if="entry.entries && entry.entries.length">
          <ResourceEntries :entries="entry.entries" />
        </div>
        <ul v-if="entry.items && entry.items.length">
          <li v-for="(item, k) in entry.items" :key="`item-${i}-${k}`">
            <div v-if="typeof item === 'string'">{{ item }}</div>
            <div v-else-if="item.type === 'item'">
              <strong v-if="item.name">{{ item.name }}</strong>
              <p v-if="item.entry && typeof item.entry === 'string'">{{ item.entry }}</p>
              <div v-else-if="item.entries && item.entries.length">
                <ResourceEntries :entries="item.entries" />
              </div>
            </div>
          </li>
        </ul>
      </div>

      <div v-else-if="entry.type === 'item'">
        <strong v-if="entry.name">{{ entry.name }}</strong>
        <p v-if="(entry as any).entry && typeof (entry as any).entry === 'string'">
          {{ (entry as any).entry }}
        </p>
        <div v-else-if="(entry as any).entries && (entry as any).entries.length">
          <ResourceEntries :entries="(entry as any).entries" />
        </div>
      </div>

      <div v-else-if="entry.type === 'table'">
        <EntryTable :table="entry" />
      </div>

      <div v-else-if="(entry as any).type === 'section'">
        <h4 v-if="(entry as any).title">{{ (entry as any).title }}</h4>
        <div v-if="(entry as any).entries && (entry as any).entries.length">
          <ResourceEntries :entries="(entry as any).entries" />
        </div>
      </div>

      <div v-else-if="(entry as any).type === 'entries'">
        <h4 v-if="(entry as any).name">{{ (entry as any).name }}</h4>
        <div v-if="(entry as any).entries && (entry as any).entries.length">
          <ResourceEntries :entries="(entry as any).entries" />
        </div>
      </div>
      <div v-else-if="(entry as any).type === 'inset'">
        <div class="inset">
          <h4 v-if="(entry as any).name || (entry as any).title">
            {{ (entry as any).name || (entry as any).title }}
          </h4>
          <p v-if="(entry as any).entry && typeof (entry as any).entry === 'string'">
            {{ (entry as any).entry }}
          </p>
          <div v-if="(entry as any).entries && (entry as any).entries.length">
            <ResourceEntries :entries="(entry as any).entries" />
          </div>
        </div>
      </div>
      <div v-else-if="(entry as any).type === 'image'">
        <!-- do nothing with images right now -->
      </div>

      <!-- catch div for unaccounted for entry types -->
      <div v-else>
        <p>Unaccounted entry type: {{ (entry as any).type || 'unknown' }}</p>
        <pre>{{ JSON.stringify(entry, null, 2) }}</pre>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
  import EntryTable from './EntryTable.vue';
  import type { Entries } from '../types';
  defineOptions({ name: 'ResourceEntries' });
  const props = defineProps<{
    entries: Entries;
  }>();
</script>

<style scoped>
  .inset {
    border-left: 3px solid var(--v-theme-border, #ccc);
    margin: 0.5rem 0;
    padding: 0.5rem 1rem;
    background: rgba(0, 0, 0, 0.02);
  }

  .inset h4 {
    margin: 0 0 0.25rem 0;
    font-weight: 600;
  }

  .inset p {
    margin: 0.25rem 0;
  }
</style>
