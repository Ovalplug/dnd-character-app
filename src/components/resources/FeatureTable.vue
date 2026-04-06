<template>
  <div class="table-scroll">
    <table>
      <colgroup>
        <col style="width: 60px" />
        <col style="width: 90px" />
        <col />
      </colgroup>
      <thead>
        <tr>
          <th>Level</th>
          <th>Prof Bonus</th>
          <th>Features</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(level, index) in 20" :key="index">
          <td>{{ level }}</td>
          <td>+{{ Math.floor((level - 1) / 4) + 2 }}</td>
          <td>{{ getFeaturesForLevel(props.classFeatures, level).map(f => f.name).join(', ') || '—' }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script lang="ts" setup>
import type { ClassFeatures } from '../../types';
import { getFeaturesForLevel } from '../../helperFunctions';

const props = defineProps<{
  classFeatures: ClassFeatures;
}>();
</script>

<style scoped>
  .table-scroll {
    width: 100%;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    margin-bottom: 1rem;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.88rem;
  }

  thead th {
    background: var(--color-surface);
    color: var(--color-text);
    font-weight: 600;
  }

  th,
  td {
    padding: 0.25rem 0.4rem;
    border: 1px solid rgba(107, 46, 46, 0.15);
    vertical-align: top;
    font-size: 0.88rem;
    line-height: 1.3;
  }

  th:nth-child(1),
  td:nth-child(1),
  th:nth-child(2),
  td:nth-child(2) {
    text-align: center;
  }

  tbody tr:nth-child(even) {
    background: rgba(107, 46, 46, 0.04);
  }
</style>
