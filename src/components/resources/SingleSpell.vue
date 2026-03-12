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
      <strong>Source:</strong> {{ spell.source
      }}<span v-if="spell.page">, page {{ spell.page }}</span>
    </p>
    <p v-if="spell.time">
      <strong>Casting Time:</strong>
      <span v-for="t in spell.time" :key="t.unit"
        >{{ t.number }} {{ t.unit }}<span v-if="t.condition"> ({{ t.condition }})</span></span
      >
    </p>
    <p v-if="spell.range">
      <strong>Range:</strong>
      <span v-if="spell.range.type === 'point' && spell.range.distance">
        {{ spell.range.distance.amount ? spell.range.distance.amount + ' ' : ''
        }}{{ spell.range.distance.type }}
      </span>
      <span v-else>{{ spell.range.type }}</span>
    </p>
    <p v-if="spell.components">
      <strong>Components:</strong>
      <span v-if="spell.components.v">V</span><span v-if="spell.components.s">S</span
      ><span v-if="spell.components.m">M: {{ spell.components.m }}</span
      ><span v-if="spell.components.r">R</span>
    </p>
    <p v-if="spell.duration">
      <strong>Duration:</strong>
      <span v-for="d in spell.duration" :key="d.type">
        {{ d.type === 'timed' && d.duration ? d.duration.amount + ' ' + d.duration.type : d.type }}
        <span v-if="d.concentration"> (Concentration)</span>
      </span>
    </p>
    <div v-if="spell.entries">
      <strong>Description:</strong>
      <ul>
        <li v-for="(entry, idx) in spell.entries" :key="idx">{{ entry }}</li>
      </ul>
    </div>
    <p v-if="spell.damageInflict"><strong>Damage:</strong> {{ spell.damageInflict.join(', ') }}</p>
    <p v-if="spell.savingThrow">
      <strong>Saving Throw:</strong> {{ spell.savingThrow.join(', ') }}
    </p>
    <p v-if="spell.affectsCreatureType">
      <strong>Affects:</strong> {{ spell.affectsCreatureType.join(', ') }}
    </p>
    <p v-if="spell.areaTags"><strong>Area Tags:</strong> {{ spell.areaTags.join(', ') }}</p>
    <pre v-if="spell.otherSources"><strong>Other Sources:</strong> {{ spell.otherSources }}</pre>
    <pre
      v-if="spell.entriesHigherLevel"
    ><strong>Higher Level:</strong> {{ spell.entriesHigherLevel }}</pre>
    <pre v-if="spell.miscTags"><strong>Misc Tags:</strong> {{ spell.miscTags }}</pre>
  </div>
</template>

<script lang="ts" setup>
  import {
    getPrettySpellClassList,
    getPrettySpellLevel,
    getPrettySpellSchool,
  } from '../../helperFunctions';
  import type { Spell } from '../../types';

  const props = defineProps<{ spell: Spell }>();
  const spell = props.spell;
</script>
