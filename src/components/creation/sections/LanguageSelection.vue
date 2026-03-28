<template>
  <div class="container">
    <div style="margin-bottom: 1em">
      <strong>Languages granted by race/background:</strong>
      <span v-for="lang in Array.from(granted)" :key="lang" style="margin-right: 0.5em">{{
        lang
      }}</span>
    </div>
    <div style="margin-bottom: 1em">
      <strong>Additional picks allowed:</strong>
      <span>{{ anyStandard + (other ? 1 : 0) }}</span>
    </div>
    <table class="language-table">
      <thead>
        <tr>
          <th>Language</th>
          <th>Granted</th>
          <th>Select</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="lang in allLanguageKeys" :key="lang">
          <td>{{ lang }}</td>
          <td>
            <span v-if="isGranted(lang)">✔️</span>
          </td>
          <td>
            <input
              type="checkbox"
              :checked="selected.includes(lang)"
              :disabled="
                isGranted(lang) ||
                (!selected.includes(lang) && selected.length >= maxSelectable) ||
                !isSelectable(lang)
              "
              @change="toggleLanguage(lang)"
            />
          </td>
        </tr>
      </tbody>
    </table>
    <button class="next-btn" @click="finaliseLanguages()">Next</button>
  </div>
</template>
<script lang="ts" setup>
  import { useCharacterStore } from '../../../stores/characterStore';
  import type { Languages } from '../../../types';
  import { getAllLanguages } from '../../../helperFunctions';
  import { ref } from 'vue';
  const store = useCharacterStore();
  const emit = defineEmits<{ (e: 'nextStep'): void }>();
  const charRace = store.getCharRace();
  const charBackground = store.getCharBackground();

  // --- Language selection logic ---
  const allLanguageKeys = [
    'common',
    'elvish',
    'dwarvish',
    'giant',
    'gnomish',
    'goblin',
    'halfling',
    'orc',
    'abyssal',
    'celestial',
    'draconic',
    'deepSpeech',
    'infernal',
    'primordial',
    'sylvan',
    'undercommon',
    'thievesCant',
  ];

  function parseCurrLanguages(curr: any[]): {
    granted: Set<string>;
    anyStandard: number;
    other: boolean;
  } {
    const granted = new Set<string>();
    let anyStandard = 0;
    let other = false;
    curr.forEach(obj => {
      Object.entries(obj).forEach(([key, val]) => {
        if (key === 'anyStandard' && typeof val === 'number') {
          anyStandard += val;
        } else if (key === 'other' && val) {
          other = true;
        } else if (val === true) {
          granted.add(key);
        }
      });
    });
    return { granted, anyStandard, other };
  }

  const currLanguagesRaw = getAllLanguages(charRace, charBackground);
  const { granted, anyStandard, other } = parseCurrLanguages(
    Array.isArray(currLanguagesRaw) ? currLanguagesRaw : [currLanguagesRaw]
  );
  const selected = ref<string[]>(Array.from(granted));
  const maxSelectable = granted.size + anyStandard + (other ? 1 : 0);

  function isGranted(lang: string) {
    return granted.has(lang);
  }
  function isSelectable(lang: string) {
    if (isGranted(lang)) return false;
    if (lang === 'thievesCant' && !store.isRogue()) return false;
    return true;
  }
  function toggleLanguage(lang: string) {
    if (isGranted(lang)) return;
    if (selected.value.includes(lang)) {
      selected.value = selected.value.filter(l => l !== lang);
    } else {
      if (selected.value.length < maxSelectable) {
        selected.value.push(lang);
      }
    }
  }
  function buildLanguagesObj(selectedArr: string[]): Languages {
    const base: Languages = {
      common: { speak: false, read: false, write: false },
      elvish: { speak: false, read: false, write: false },
      dwarvish: { speak: false, read: false, write: false },
      giant: { speak: false, read: false, write: false },
      gnomish: { speak: false, read: false, write: false },
      goblin: { speak: false, read: false, write: false },
      halfling: { speak: false, read: false, write: false },
      orc: { speak: false, read: false, write: false },
      abyssal: { speak: false, read: false, write: false },
      celestial: { speak: false, read: false, write: false },
      draconic: { speak: false, read: false, write: false },
      deepSpeech: { speak: false, read: false, write: false },
      infernal: { speak: false, read: false, write: false },
      primordial: { speak: false, read: false, write: false },
      sylvan: { speak: false, read: false, write: false },
      undercommon: { speak: false, read: false, write: false },
      thievesCant: { speak: false, read: false, write: false },
    };
    selectedArr.forEach(lang => {
      if (base[lang]) {
        base[lang].speak = true;
        base[lang].read = true;
        base[lang].write = true;
      }
    });
    if (store.isRogue()) {
      base.thievesCant.speak = true;
      base.thievesCant.read = true;
      base.thievesCant.write = true;
    }
    return base;
  }
  function finaliseLanguages() {
    store.updateCharacterLanguages(buildLanguagesObj(selected.value));
    emit('nextStep');
  }
  // ...existing code...
</script>

<style scoped>
  .language-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 1rem;
  }
  .language-table th,
  .language-table td {
    border: 1px solid #ccc;
    padding: 0.5rem;
    text-align: left;
  }
  .next-btn {
    margin-top: 1rem;
    padding: 0.5rem 1rem;
    font-size: 1rem;
  }
  .container {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
</style>
