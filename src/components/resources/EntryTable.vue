<template>
  <section class="entry-table">
    <div v-if="processedTable.title" class="table-title">{{ processedTable.title }}</div>
    <table>
      <caption v-if="processedTable.caption">
        {{
          processedTable.caption
        }}
      </caption>

      <thead v-if="hasColLabels">
        <tr>
          <th
            v-for="(label, ci) in processedTable.colLabels"
            :key="`h-${ci}`"
            :class="colClass(ci)"
          >
            <span v-html="label"></span>
          </th>
        </tr>
      </thead>

      <tbody>
        <tr v-for="(row, ri) in processedTable.rows" :key="`r-${ri}`">
          <td v-for="(cell, ci) in row" :key="`c-${ri}-${ci}`" :class="colClass(ci)">
            <span v-html="renderCell(cell)"></span>
          </td>
        </tr>
      </tbody>
    </table>
  </section>
</template>

<script setup lang="ts">
  import { computed } from 'vue';
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

    // If cell is an object with type 'bonus' and a value property
    if (cell && typeof cell === 'object' && cell.type === 'bonus' && cell.value !== undefined) {
      return `+${cell.value}`;
    }

    // If cell is an object with type 'dice' and a toRoll array
    if (cell && typeof cell === 'object' && cell.type === 'dice' && Array.isArray(cell.toRoll)) {
      return cell.toRoll
        .map((roll: { number: number; faces: number }) => `${roll.number}d${roll.faces}`)
        .join(', ');
    }

    // If cell is an object with type 'bonusSpeed' and a value property
    if (
      cell &&
      typeof cell === 'object' &&
      cell.type === 'bonusSpeed' &&
      cell.value !== undefined
    ) {
      return `+${cell.value}ft`;
    }

    // Fallback: try to JSON.stringify or empty string
    return typeof cell === 'object' ? JSON.stringify(cell) : '';
  }

  const processedTable = computed(() => {
    // Clone the table to avoid mutating the original data
    const newTable = { ...table, rows: [...table.rows] };

    // Ensure colLabels exists and check if there is only one column or if 'haveLevels' is true
    if (table.colLabels && (table.colLabels.length === 1 || table.haveLevels)) {
      // Add a "Levels" column label
      newTable.colLabels = ['Level', ...table.colLabels];

      // Add levels 1 to 20 as the first column in each row
      newTable.rows = table.rows.map((row, index) => [String(index + 1), ...row]);
    }

    return newTable;
  });
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
