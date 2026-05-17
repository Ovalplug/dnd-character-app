<template>
  <section v-if="characterLanguages.length" class="ability-section">
    <div class="section-header">
      <h2 class="section-title">Languages</h2>
      <span class="section-badge section-badge--lang">{{ characterLanguages.length }}</span>
    </div>
    <div class="language-list">
      <div v-for="lang in characterLanguages" :key="lang.name" class="language-entry">
        <span class="language-name">{{ formatLanguageName(lang.name) }}</span>
        <span class="language-abilities">
          <span v-if="lang.ability.speak" class="lang-tag">Speak</span>
          <span v-if="lang.ability.read" class="lang-tag">Read</span>
          <span v-if="lang.ability.write" class="lang-tag">Write</span>
        </span>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
  import { computed } from 'vue';
  import type { playerCharacter } from '../../../../types';

  const props = defineProps<{
    character: playerCharacter;
  }>();

  function formatLanguageName(name: string): string {
    const special: Record<string, string> = {
      deepSpeech: 'Deep Speech',
      thievesCant: "Thieves' Cant",
    };
    if (special[name]) return special[name];
    return name.charAt(0).toUpperCase() + name.slice(1).replace(/([A-Z])/g, ' $1');
  }

  const characterLanguages = computed(() => {
    const langs = props.character.languages as Record<
      string,
      { speak: boolean; read: boolean; write: boolean }
    >;
    return Object.entries(langs)
      .filter(([, ability]) => ability.speak || ability.read || ability.write)
      .map(([name, ability]) => ({ name, ability }));
  });
</script>

<style scoped>
  .ability-section {
    background: var(--color-surface);
    border-radius: var(--radius);
    box-shadow: var(--color-card-shadow);
    overflow: hidden;
  }

  .section-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid rgba(31, 27, 22, 0.08);
    flex-wrap: wrap;
  }

  .section-title {
    font-size: 1rem;
    font-weight: 700;
    color: var(--color-primary);
    margin: 0;
    flex: 1;
    min-width: 0;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .section-badge {
    font-size: 0.7rem;
    font-weight: 700;
    padding: 0.15rem 0.5rem;
    border-radius: 20px;
    background: rgba(107, 46, 46, 0.1);
    color: var(--color-primary);
    white-space: nowrap;
  }

  .section-badge--lang {
    background: rgba(107, 74, 46, 0.12);
    color: #6b4a2e;
  }

  .language-list {
    display: flex;
    flex-direction: column;
    padding: 0.25rem 0;
  }

  .language-entry {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.45rem 1rem;
    border-bottom: 1px solid rgba(31, 27, 22, 0.05);
    gap: 0.5rem;
  }

  .language-entry:last-child {
    border-bottom: none;
  }

  .language-name {
    font-size: 0.88rem;
    font-weight: 600;
    color: var(--color-text);
    text-transform: capitalize;
  }

  .language-abilities {
    display: flex;
    gap: 0.3rem;
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  .lang-tag {
    font-size: 0.65rem;
    font-weight: 700;
    padding: 0.1rem 0.4rem;
    border-radius: 10px;
    background: rgba(107, 74, 46, 0.1);
    color: #6b4a2e;
    border: 1px solid rgba(107, 74, 46, 0.2);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
</style>
