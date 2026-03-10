<template>
  <section class="entry-table">
    <div v-if="table.title" class="table-title">{{ table.title }}</div>
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
            <span v-html="renderCell(cell)"></span>
          </td>
        </tr>
      </tbody>
    </table>
  </section>
</template>

<script setup lang="ts">
  import type { EntryTable } from '../../types';
  defineOptions({ name: 'EntryTable' });

  const props = defineProps<{ table: EntryTable }>();

  const table = props.table;

  const hasColLabels = !!(table.colLabels && table.colLabels.length > 0);

  function colClass(index: number) {
    if (!table.colStyles) return '';
    return table.colStyles[index] || '';
  }

  function renderCell(cell: any): string {
    // If cell is a string or number, just return as string
    if (typeof cell === 'string' || typeof cell === 'number') {
      return String(cell);
    }
    // If cell is an object with type 'cell' and a roll property
    if (cell && typeof cell === 'object' && cell.type === 'cell' && cell.roll) {
      // Support for exact roll, range, etc. For now, just show exact
      if (cell.roll.exact !== undefined) {
        return String(cell.roll.exact);
      }
      // If other roll types (e.g., min/max), display as needed
      if (cell.roll.min !== undefined && cell.roll.max !== undefined) {
        return `${cell.roll.min}-${cell.roll.max}`;
      }
      if (cell.roll.min !== undefined) {
        return String(cell.roll.min);
      }
      if (cell.roll.max !== undefined) {
        return String(cell.roll.max);
      }
    }
    // Fallback: try to JSON.stringify or empty string
    return typeof cell === 'object' ? JSON.stringify(cell) : '';
  }
</script>

<style scoped>
  .entry-table table {
    width: 100%;
    border-collapse: collapse;
  }
  .table-title {
    font-size: 1.1rem;
    font-weight: bold;
    margin-bottom: 0.5rem;
    margin-top: 0.5rem;
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
