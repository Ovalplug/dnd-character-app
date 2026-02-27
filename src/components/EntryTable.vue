<template>
  <section class="entry-table">
    <table>
      <caption v-if="table.caption">
        {{
          table.caption
        }}
      </caption>

      <thead v-if="hasColLabels">
        <tr>
          <th v-for="(label, ci) in table.colLabels" :key="`h-${ci}`" :class="colClass(ci)">
            <span v-html="label"></span>
          </th>
        </tr>
      </thead>

      <tbody>
        <tr v-for="(row, ri) in table.rows" :key="`r-${ri}`">
          <td v-for="(cell, ci) in row" :key="`c-${ri}-${ci}`" :class="colClass(ci)">
            <span v-html="cell"></span>
          </td>
        </tr>
      </tbody>
    </table>
  </section>
</template>

<script setup lang="ts">
  import type { EntryTable } from '../types';
  defineOptions({ name: 'EntryTable' });

  const props = defineProps<{ table: EntryTable }>();

  const table = props.table;

  const hasColLabels = !!(table.colLabels && table.colLabels.length > 0);

  function colClass(index: number) {
    if (!table.colStyles) return '';
    return table.colStyles[index] || '';
  }
</script>

<style scoped>
  .entry-table table {
    width: 100%;
    border-collapse: collapse;
  }
  .entry-table th,
  .entry-table td {
    padding: 0.35rem 0.5rem;
    border: 1px solid var(--table-border, #ddd);
    vertical-align: top;
  }
  .entry-table caption {
    caption-side: top;
    text-align: left;
    font-weight: 600;
    margin-bottom: 0.5rem;
  }
</style>
