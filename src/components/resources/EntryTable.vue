<template>
  <section class="entry-table">
    <div v-if="processedTable.title" class="table-title">{{ processedTable.title }}</div>
    <div class="table-scroll">
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
    </div>
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
  .table-scroll {
    width: 100%;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
  .entry-table table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.88rem;
  }
  .table-title {
    font-size: 0.95rem;
    font-weight: bold;
    margin-bottom: 0.3rem;
    margin-top: 0.3rem;
    color: var(--color-text);
  }
  .entry-table th {
    background: var(--color-surface);
    color: var(--color-text);
    font-weight: 600;
  }
  .entry-table tbody tr:nth-child(even) {
    background: rgba(107, 46, 46, 0.04);
  }
  .entry-table th,
  .entry-table td {
    padding: 0.25rem 0.4rem;
    border: 1px solid rgba(107, 46, 46, 0.15);
    vertical-align: top;
    font-size: 0.88rem;
    line-height: 1.3;
  }
  .entry-table caption {
    caption-side: top;
    text-align: left;
    font-weight: 600;
    margin-bottom: 0.3rem;
    font-size: 0.95rem;
    color: var(--color-text);
  }
</style>
