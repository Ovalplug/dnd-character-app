<template>
  <div class="single-spell">
    <h2>{{ spell.name }}</h2>
    <p class="spell_p3">
      <strong>School:</strong> {{ getPrettySpellSchool(spell.school) }} ({{
        getPrettySpellLevel(spell.level)
      }})
    </p>
    <p class="spell_p3">
      <strong>Classes:</strong> {{ getPrettySpellClassList(spell.classes?.fromClassList ?? []) }}
    </p>
    <p v-if="spell.source">
      <strong>Source: </strong> {{ spell.source
      }}<span v-if="spell.page">, page {{ spell.page }}</span>
    </p>
    <p v-if="spell.time">
      <strong>Casting Time: </strong>
      <span v-for="t in spell.time" :key="t.unit"
        >{{ t.number }} {{ t.unit }}<span v-if="t.condition"> ({{ t.condition }})</span></span
      >
    </p>
    <p v-if="spell.range">
      <strong>Range: </strong>
      <span v-if="spell.range.type === 'point' && spell.range.distance">
        {{ spell.range.distance.amount ? spell.range.distance.amount + ' ' : ''
        }}{{ spell.range.distance.type }}
      </span>
      <span v-else>{{ spell.range.type }}</span>
    </p>
    <p v-if="spell.components">
      <strong>Components: </strong>
      <span v-if="spell.components.v">V</span><span v-if="spell.components.s">S</span
      ><span v-if="spell.components.m">M ({{ spell.components.m }})</span
      ><span v-if="spell.components.r">R</span>
    </p>
    <p v-if="spell.duration">
      <strong>Duration: </strong>
      <span v-for="d in spell.duration" :key="d.type">
        {{ d.type === 'timed' && d.duration ? d.duration.amount + ' ' + d.duration.type : d.type }}
        <span v-if="d.concentration"> (Concentration)</span>
      </span>
    </p>
    <p v-if="spell.savingThrow">
      <strong>Saving Throw: </strong> {{ spell.savingThrow.join(', ') }}
    </p>
    <div v-if="spell.entries">
      <ResourceEntries :entries="spell.entries" />
    </div>
    <div v-if="spell.entriesHigherLevel" class="inset">
      <ResourceEntries :entries="spell.entriesHigherLevel" />
    </div>
  </div>
</template>

<script lang="ts" setup>
  import {
    getPrettySpellClassList,
    getPrettySpellLevel,
    getPrettySpellSchool,
  } from '../../helperFunctions';
  import type { Spell } from '../../types';
  import ResourceEntries from './ResourceEntries.vue';

  const props = defineProps<{ spell: Spell }>();
  const spell = props.spell;
</script>

<style scoped>
  .single-spell p {
    margin: 0.2rem 0;
  }

  .inset {
    border-left: 3px solid var(--color-accent);
    margin: 0.75rem 0;
    padding: 0.5rem 0.75rem;
    background: rgba(107, 46, 46, 0.04);
    border-radius: 0 6px 6px 0;
  }
</style>
