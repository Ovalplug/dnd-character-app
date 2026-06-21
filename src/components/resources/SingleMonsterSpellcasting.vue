<template>
  <div v-for="(spellcasting, index) in props.spellcasting" :key="index" class="spellcasting-block">
    <h3>{{ spellcasting.name }}</h3>

    <ResourceEntries :entries="spellcasting.headerEntries" />

    <!-- At Will -->
    <p v-if="spellcasting.will?.length">
      <strong>At will:</strong>
      <a
        v-for="(spell, i) in spellcasting.will"
        :key="spell"
        href="#"
        @click.prevent="selectSpell(spell)"
        >{{ spell }}<span v-if="i < spellcasting.will.length - 1">, </span></a
      >
    </p>

    <!-- Daily -->
    <template v-if="spellcasting.daily">
      <p v-for="[frequency, spells] in dailyEntries(spellcasting.daily)" :key="frequency">
        <strong>{{ dailyLabel(frequency) }}:</strong>
        <a v-for="(spell, i) in spells" :key="spell" href="#" @click.prevent="selectSpell(spell)"
          >{{ spell }}<span v-if="i < spells.length - 1">, </span></a
        >
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
          <a
            v-for="(spell, i) in spellData.spells"
            :key="spell"
            href="#"
            @click.prevent="selectSpell(spell)"
            >{{ spell }}<span v-if="i < spellData.spells.length - 1">, </span></a
          >
        </p>
      </div>
    </template>
  </div>

  <PopOut :title="fullSpell?.name" v-if="selectedSpell" :onClose="deselectSpell">
    <SingleSpell :spell="selectedSpell" />
  </PopOut>
</template>

<script lang="ts" setup>
  import type {
    MonsterSpellcasting,
    MonsterDailySpells,
    MonsterSpell,
    MonsterSpellBreakdown,
    Spells,
  } from '../../types.ts';

  import { computed, ref } from 'vue';

  import ResourceEntries from './ResourceEntries.vue';

  import PopOut from '../PopOut.vue';

  const props = defineProps<{
    spellcasting: MonsterSpellcasting[];
    spells: Spells;
  }>();

  const selectedSpell = ref<string | null>(null);
  function selectSpell(name: string) {
    selectedSpell.value = name.toLowerCase();
  }
  function deselectSpell() {
    selectedSpell.value = null;
  }

  const fullSpell = computed(() =>
    selectedSpell.value
      ? props.spells.find(spell => spell.name.toLowerCase() === selectedSpell.value) ?? null
      : null
  );
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
