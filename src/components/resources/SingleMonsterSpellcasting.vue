<template>
  <div
    v-for="(spellcasting, index) in props.spellcasting"
    :key="index"
    class="spellcasting-block"
  >
    <h3>{{ spellcasting.name }}</h3>

    <ResourceEntries :entries="spellcasting.headerEntries" />

    <!-- At Will -->
    <p v-if="spellcasting.will?.length">
      <strong>At will:</strong>
      {{ spellcasting.will.join(', ') }}
    </p>

    <!-- Daily -->
    <template v-if="spellcasting.daily">
      <p
        v-for="[frequency, spells] in dailyEntries(spellcasting.daily)"
        :key="frequency"
      >
        <strong>{{ dailyLabel(frequency) }}:</strong>
        {{ spells.join(', ') }}
      </p>
    </template>

    <!-- Spell Slots -->
    <template v-if="spellcasting.spells">
      <div
        v-for="[level, spellData] in spellEntries(spellcasting.spells)"
        :key="level"
        class="spell-level"
      >
        <p>
          <strong>{{ spellLevelLabel(level, spellData.slots) }}:</strong>
          {{ spellData.spells.join(', ') }}
        </p>
      </div>
    </template>
  </div>
</template>

<script lang="ts" setup>
import type {
  MonsterSpellcasting,
  MonsterDailySpells,
  MonsterSpell,
  MonsterSpellBreakdown,
} from '../../types.ts';

import ResourceEntries from './ResourceEntries.vue';

const props = defineProps<{
  spellcasting: MonsterSpellcasting[];
}>();

function dailyEntries(daily: MonsterDailySpells) {
  return Object.entries(daily) as [string, string[]][];
}

function spellEntries(spells: MonsterSpell) {
  return Object.entries(spells) as [string, MonsterSpellBreakdown][];
}

function dailyLabel(key: string) {
  const each = key.endsWith('e');
  const count = key.replace('e', '');

  if (each) {
    return `${count}/day each`;
  }

  return `${count}/day`;
}

function spellLevelLabel(level: string, slots?: number) {
  if (level === '0') {
    return 'Cantrips (at will)';
  }

  const suffixes: Record<string, string> = {
    '1': '1st',
    '2': '2nd',
    '3': '3rd',
  };

  const ordinal = suffixes[level] ?? `${level}th`;

  if (slots) {
    return `${ordinal} level (${slots} slots)`;
  }

  return `${ordinal} level`;
}
</script>