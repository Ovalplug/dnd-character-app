<template>
  <section class="creation-panel">
    <div class="creation-intro">
      <p>Review the languages the build already grants, then fill any remaining picks.</p>
    </div>

    <div class="creation-actions creation-actions--top">
      <button type="button" class="creation-primary-button" @click="finaliseLanguages()">
        Continue
      </button>
    </div>

    <div class="creation-summary">
      <span class="creation-summary__label">Bonus picks remaining</span>
      <span class="creation-summary__value">{{ remainingSelectable }}</span>
    </div>

    <div class="creation-stack" v-if="grantedList.length">
      <span class="creation-summary__label">Automatically known</span>
      <div class="creation-tag-list">
        <span v-for="lang in grantedList" :key="lang" class="creation-tag">{{
          formatLanguageName(lang)
        }}</span>
      </div>
    </div>

    <div class="creation-table-wrap">
      <table class="creation-table">
        <thead>
          <tr>
            <th>Language</th>
            <th>Granted</th>
            <th class="creation-table__choice">Select</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="lang in allLanguageKeys" :key="lang">
            <td>{{ formatLanguageName(lang) }}</td>
            <td>
              <span v-if="isGranted(lang)">Yes</span>
            </td>
            <td class="creation-table__choice">
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
    </div>

    <div class="creation-actions">
      <button type="button" class="creation-primary-button" @click="finaliseLanguages()">
        Continue
      </button>
    </div>
  </section>
</template>
<script lang="ts" setup>
  import { useCharacterStore } from '../../../stores/characterStore';
  import type { Languages } from '../../../types';
  import { getAllLanguages } from '../../../helperFunctions';
  import { computed, ref } from 'vue';
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
  const existingSelections = Object.entries(store.getCharLanguages() as Languages)
    .filter(([_, ability]) => ability && (ability.speak || ability.read || ability.write))
    .map(([lang]) => lang);
  const selected = ref<string[]>(
    Array.from(new Set([...Array.from(granted), ...existingSelections]))
  );
  const maxSelectable = granted.size + anyStandard + (other ? 1 : 0);
  const grantedList = computed(() => Array.from(granted));
  const remainingSelectable = computed(() => Math.max(0, maxSelectable - selected.value.length));

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
  function formatLanguageName(lang: string) {
    const labels: Record<string, string> = {
      deepSpeech: 'Deep Speech',
      thievesCant: "Thieves' Cant",
    };
    return labels[lang] || lang.charAt(0).toUpperCase() + lang.slice(1);
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
</script>
