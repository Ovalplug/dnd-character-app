<template>
  <article class="character-detail-view">
    <NameBadge :character="props.character" />

    <section class="character-detail-card character-detail-card--hero">
      <p class="character-detail-kicker">Notes</p>
      <h2 class="character-detail-title">Story hooks and campaign reference</h2>
      <p class="character-detail-copy">
        Keep narrative details together here so the player can quickly review backstory, notes, and
        key relationships.
      </p>
    </section>

    <section class="character-detail-card">
      <p class="character-detail-kicker">Campaign Notes</p>
      <p
        v-if="character.notes?.trim()"
        class="character-detail-copy character-detail-copy--prewrap"
      >
        {{ character.notes }}
      </p>
      <p v-else class="muted">No campaign notes saved yet.</p>
    </section>

    <section class="character-detail-card">
      <p class="character-detail-kicker">Backstory</p>
      <p
        v-if="character.backstory?.trim()"
        class="character-detail-copy character-detail-copy--prewrap"
      >
        {{ character.backstory }}
      </p>
      <p v-else class="muted">No backstory has been recorded yet.</p>
    </section>

    <section class="character-detail-card">
      <p class="character-detail-kicker">Allies and Organizations</p>
      <ul v-if="allies.length" class="character-detail-list">
        <li v-for="ally in allies" :key="ally" class="character-detail-list__item">{{ ally }}</li>
      </ul>
      <p v-else class="muted">No allies or organizations are listed yet.</p>
    </section>
  </article>
</template>

<script lang="ts" setup>
  import { computed } from 'vue';
  import NameBadge from './subcomponents/NameBadge.vue';
  import type { playerCharacter } from '../../../types';

  const props = defineProps<{
    character: playerCharacter;
  }>();

  const allies = computed(() =>
    (props.character.alliesAndOrganizations || []).filter(ally => ally.trim().length > 0)
  );
</script>
