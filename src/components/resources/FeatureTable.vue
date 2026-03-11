<template>
  <table>
    <thead>
      <tr>
        <th>Level</th>
        <th>Proficiency Bonus</th>
        <th>Features</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="(level, index) in 20" :key="index">
        <td>{{ level }}</td>
        <td>+{{ Math.floor((level - 1) / 4) + 2 }}</td>
        <td>Coming soon</td>
      </tr>
    </tbody>
  </table>
</template>

<style scoped>
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 1rem 0;
    font-size: 1rem;
    text-align: left;
  }

  thead {
    background-color: #f4f4f4;
    font-weight: bold;
  }

  th,
  td {
    padding: 0.75rem;
    border: 1px solid #ddd;
  }

  tr:nth-child(even) {
    background-color: #f9f9f9;
  }
</style>
