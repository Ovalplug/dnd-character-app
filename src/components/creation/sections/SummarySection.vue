<template>
  <section class="summary-section">
    <div class="summary-hero">
      <p class="summary-kicker">Final step</p>
      <h2>Starting equipment</h2>
      <p class="summary-copy">
        Choose the class and background gear you want to start with. Any coin included by those
        choices will be added when you save the character.
      </p>
    </div>

    <div class="creation-actions creation-actions--top">
      <button type="button" class="creation-primary-button save-button" @click="saveCharacter">
        Save Character
      </button>
    </div>

    <div v-if="equipmentSources.length === 0" class="summary-empty">
      <p>No class or background starting equipment was found.</p>
    </div>

    <div v-for="source in equipmentSources" :key="source.id" class="equipment-source">
      <div class="equipment-source__header">
        <div>
          <h3>{{ source.label }}</h3>
          <p>{{ source.kind === 'class' ? 'Class equipment' : 'Background equipment' }}</p>
        </div>
        <span class="source-badge">{{ source.kind }}</span>
      </div>

      <div v-if="source.goldAlternative" class="gold-option-card">
        <label class="toggle-row">
          <input
            :checked="!selectionState.useGoldAlternative[source.id]"
            :name="`${source.id}-gold-mode`"
            type="radio"
            @change="selectionState.useGoldAlternative[source.id] = false"
          />
          <span>Take the listed starting equipment</span>
        </label>
        <label class="toggle-row">
          <input
            :checked="selectionState.useGoldAlternative[source.id]"
            :name="`${source.id}-gold-mode`"
            type="radio"
            @change="selectionState.useGoldAlternative[source.id] = true"
          />
          <span>Take class gold instead: {{ source.goldAlternative.formula }}</span>
        </label>

        <div v-if="selectionState.useGoldAlternative[source.id]" class="gold-roll-row">
          <div class="gold-mode-switches">
            <label class="toggle-row toggle-row--compact">
              <input
                :checked="selectionState.goldInputMode[source.id] !== 'custom'"
                :name="`${source.id}-roll-mode`"
                type="radio"
                @change="selectionState.goldInputMode[source.id] = 'rolled'"
              />
              <span>Roll here</span>
            </label>
            <label class="toggle-row toggle-row--compact">
              <input
                :checked="selectionState.goldInputMode[source.id] === 'custom'"
                :name="`${source.id}-roll-mode`"
                type="radio"
                @change="selectionState.goldInputMode[source.id] = 'custom'"
              />
              <span>Custom</span>
            </label>
          </div>

          <div v-if="selectionState.goldInputMode[source.id] === 'custom'" class="gold-input-grid">
            <label v-for="coin in CUSTOM_GOLD_COINS" :key="coin.key" class="gold-input-field">
              <span>{{ coin.label }}</span>
              <input
                :value="selectionState.customGoldBySource[source.id]?.[coin.key] ?? 0"
                inputmode="numeric"
                min="0"
                type="number"
                @input="updateCustomGoldValue(source.id, coin.key, $event)"
              />
            </label>
          </div>

          <template v-else>
            <span class="gold-roll-value">{{
              formatCurrencyBreakdown(
                copperToCurrency(selectionState.rolledCopperBySource[source.id] ?? 0)
              )
            }}</span>
            <button
              type="button"
              class="secondary-button"
              @click="rollGoldAlternative(source.id, source.goldAlternative.formula)"
            >
              Reroll
            </button>
          </template>
        </div>
      </div>

      <div v-if="!selectionState.useGoldAlternative[source.id]" class="equipment-block-list">
        <div v-for="block in source.blocks" :key="block.id" class="equipment-block">
          <p class="equipment-block__title">{{ block.title }}</p>

          <div v-if="block.type === 'choice'" class="choice-list">
            <label v-for="option in block.options" :key="option.id" class="choice-card">
              <input
                v-model="selectionState.blockSelections[block.id]"
                :value="option.id"
                type="radio"
              />
              <div class="choice-card__body">
                <span class="choice-card__label">{{ option.label }}</span>

                <div v-for="entry in option.entries" :key="entry.id" class="entry-row">
                  <span v-if="entry.kind !== 'select'">{{ entry.label }}</span>
                  <div v-else class="entry-select-group">
                    <span>{{ entry.label }}</span>
                    <div class="entry-selects">
                      <select
                        v-for="slotIndex in entry.count"
                        :key="`${entry.id}-${slotIndex}`"
                        :value="getSelectedOptionValue(entry.id, slotIndex - 1)"
                        @change="updateEntrySelection(entry.id, slotIndex - 1, $event)"
                      >
                        <option
                          v-for="optionChoice in entry.options"
                          :key="optionChoice.value"
                          :value="optionChoice.value"
                        >
                          {{ optionChoice.label }}
                        </option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </label>
          </div>

          <div v-else class="fixed-list">
            <div v-for="entry in block.entries" :key="entry.id" class="entry-row">
              <span v-if="entry.kind !== 'select'">{{ entry.label }}</span>
              <div v-else class="entry-select-group">
                <span>{{ entry.label }}</span>
                <div class="entry-selects">
                  <select
                    v-for="slotIndex in entry.count"
                    :key="`${entry.id}-${slotIndex}`"
                    :value="getSelectedOptionValue(entry.id, slotIndex - 1)"
                    @change="updateEntrySelection(entry.id, slotIndex - 1, $event)"
                  >
                    <option
                      v-for="optionChoice in entry.options"
                      :key="optionChoice.value"
                      :value="optionChoice.value"
                    >
                      {{ optionChoice.label }}
                    </option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="summary-preview">
      <h3>Loadout preview</h3>
      <p class="preview-line">
        <strong>Items:</strong> {{ preview.itemLabels.join(', ') || 'None' }}
      </p>
      <p class="preview-line">
        <strong>Money:</strong> {{ formatCurrencyBreakdown(preview.currency) }}
      </p>
    </div>

    <div class="creation-actions">
      <button type="button" class="creation-primary-button save-button" @click="saveCharacter">
        Save Character
      </button>
    </div>
  </section>
</template>

<script lang="ts" setup>
  import { computed, reactive, watchEffect } from 'vue';
  import { diceRoll } from '../../../helperFunctions';
  import { useDataStore } from '../../../stores/dataStore';
  import { useCharacterStore } from '../../../stores/characterStore';
  import type { Currency, Item } from '../../../types';

  type EquipmentSourceKind = 'class' | 'background';
  type CurrencyKey = keyof Currency;
  type EquipmentOptionChoice = { value: string; label: string; item: Item | null };
  type EquipmentEntry =
    | { id: string; kind: 'fixed'; label: string; quantity: number; item: Item | null }
    | { id: string; kind: 'coin'; label: string; copper: number }
    | {
        id: string;
        kind: 'select';
        label: string;
        count: number;
        options: EquipmentOptionChoice[];
      };
  type EquipmentBlock =
    | { id: string; title: string; type: 'fixed'; entries: EquipmentEntry[] }
    | { id: string; title: string; type: 'choice'; options: EquipmentBlockOption[] };
  type EquipmentBlockOption = { id: string; label: string; entries: EquipmentEntry[] };
  type EquipmentSource = {
    id: string;
    label: string;
    kind: EquipmentSourceKind;
    blocks: EquipmentBlock[];
    goldAlternative?: { formula: string };
  };

  const COPPER_PER_COIN: Record<CurrencyKey, number> = {
    cp: 1,
    sp: 10,
    ep: 50,
    gp: 100,
    pp: 1000,
  };

  const CUSTOM_GOLD_COINS: Array<{
    key: Extract<CurrencyKey, 'pp' | 'gp' | 'sp' | 'cp'>;
    label: string;
  }> = [
    { key: 'pp', label: 'Platinum' },
    { key: 'gp', label: 'Gold' },
    { key: 'sp', label: 'Silver' },
    { key: 'cp', label: 'Copper' },
  ];

  const CURATED_GROUPS: Record<string, string[]> = {
    'musical instrument': [
      'Bagpipes',
      'Drum',
      'Dulcimer',
      'Flute',
      'Horn',
      'Lute',
      'Lyre',
      'Pan Flute',
      'Shawm',
      'Viol',
    ],
    'arcane focus': ['Crystal', 'Orb', 'Rod', 'Staff', 'Wand'],
    'druidic focus': ['Sprig of Mistletoe', 'Totem', 'Wooden Staff', 'Yew Wand'],
    'holy symbol': ['Amulet', 'Emblem', 'Reliquary'],
  };

  const ITEM_LOOKUP_ALIASES: Record<string, string[]> = {
    leather: ['leather armor'],
    arrows: ['arrows (20)'],
    bolts: ['bolts (20)', 'crossbow bolts (20)'],
    'crossbow bolts': ['crossbow bolts (20)', 'bolts (20)'],
    daggers: ['dagger'],
    handaxes: ['handaxe'],
  };

  const MANUAL_ITEM_SUFFIX = ' (proper item must be added manually)';

  const store = useCharacterStore();
  const dataStore = useDataStore();
  const emit = defineEmits<{ (e: 'finishCreation'): void }>();
  const selectionState = reactive({
    blockSelections: {} as Record<string, string>,
    entrySelections: {} as Record<string, string[]>,
    useGoldAlternative: {} as Record<string, boolean>,
    goldInputMode: {} as Record<string, 'rolled' | 'custom'>,
    rolledCopperBySource: {} as Record<string, number>,
    customGoldBySource: {} as Record<string, Currency>,
  });

  const itemIndex = computed(() => {
    const index = new Map<string, Item>();
    for (const item of dataStore.items) {
      index.set(normalizeLookupKey(item.displayName ?? item.name), item);
      index.set(normalizeLookupKey(item.name), item);
    }
    return index;
  });

  const equipmentSources = computed<EquipmentSource[]>(() => {
    const currentCharacter = store.currNewCharacter;
    if (!currentCharacter) return [];

    const sources: EquipmentSource[] = [];

    currentCharacter.classes.forEach((charClass, index) => {
      const rawEquipment = (charClass as { startingEquipment?: unknown }).startingEquipment;
      const sourceId = `class-${index}-${slugify(charClass.name)}`;
      const parsed = buildClassEquipmentSource(rawEquipment, charClass.name, sourceId);
      if (parsed.blocks.length > 0 || parsed.goldAlternative) {
        sources.push({
          id: sourceId,
          label: charClass.name,
          kind: 'class',
          blocks: parsed.blocks,
          goldAlternative: parsed.goldAlternative,
        });
      }
    });

    const background = currentCharacter.background as {
      name?: string;
      startingEquipment?: unknown;
    } | null;
    if (background?.startingEquipment) {
      const sourceId = `background-${slugify(background.name ?? 'background')}`;
      const blocks = buildStructuredBlocks(background.startingEquipment, sourceId);
      if (blocks.length > 0) {
        sources.push({
          id: sourceId,
          label: background.name ?? 'Background',
          kind: 'background',
          blocks,
        });
      }
    }

    return sources;
  });

  watchEffect(() => {
    for (const source of equipmentSources.value) {
      if (source.goldAlternative && selectionState.useGoldAlternative[source.id] === undefined) {
        selectionState.useGoldAlternative[source.id] = false;
      }
      if (source.goldAlternative && selectionState.goldInputMode[source.id] === undefined) {
        selectionState.goldInputMode[source.id] = 'rolled';
      }
      if (source.goldAlternative && selectionState.rolledCopperBySource[source.id] === undefined) {
        rollGoldAlternative(source.id, source.goldAlternative.formula);
      }
      if (source.goldAlternative && selectionState.customGoldBySource[source.id] === undefined) {
        selectionState.customGoldBySource[source.id] = emptyCurrency();
      }

      for (const block of source.blocks) {
        if (block.type === 'choice') {
          if (!selectionState.blockSelections[block.id]) {
            selectionState.blockSelections[block.id] = block.options[0]?.id ?? '';
          }
          for (const option of block.options) {
            option.entries.forEach(ensureEntrySelectionDefaults);
          }
        } else {
          block.entries.forEach(ensureEntrySelectionDefaults);
        }
      }
    }
  });

  const preview = computed(() => resolveLoadout());

  function ensureEntrySelectionDefaults(entry: EquipmentEntry) {
    if (entry.kind !== 'select') return;
    const currentSelections = selectionState.entrySelections[entry.id] ?? [];
    for (let i = 0; i < entry.count; i++) {
      if (!currentSelections[i]) {
        currentSelections[i] = entry.options[i]?.value ?? entry.options[0]?.value ?? '';
      }
    }
    selectionState.entrySelections[entry.id] = currentSelections;
  }

  function getSelectedOptionValue(entryId: string, index: number): string {
    return selectionState.entrySelections[entryId]?.[index] ?? '';
  }

  function updateEntrySelection(entryId: string, index: number, event: Event) {
    const target = event.target as HTMLSelectElement;
    const currentSelections = [...(selectionState.entrySelections[entryId] ?? [])];
    currentSelections[index] = target.value;
    selectionState.entrySelections[entryId] = currentSelections;
  }

  function updateCustomGoldValue(
    sourceId: string,
    coinKey: Extract<CurrencyKey, 'pp' | 'gp' | 'sp' | 'cp'>,
    event: Event
  ) {
    const target = event.target as HTMLInputElement;
    const parsed = Number.parseInt(target.value, 10);
    const current = selectionState.customGoldBySource[sourceId] ?? emptyCurrency();
    selectionState.customGoldBySource[sourceId] = {
      ...current,
      [coinKey]: Number.isFinite(parsed) && parsed > 0 ? parsed : 0,
      ep: 0,
    };
  }

  function buildClassEquipmentSource(
    rawEquipment: unknown,
    className: string,
    sourceId: string
  ): { blocks: EquipmentBlock[]; goldAlternative?: { formula: string } } {
    if (Array.isArray(rawEquipment)) {
      return { blocks: buildStructuredBlocks(rawEquipment, sourceId) };
    }
    if (typeof rawEquipment !== 'string' || !rawEquipment.trim()) {
      return { blocks: [] };
    }

    const blocks: EquipmentBlock[] = [];
    let goldAlternative: { formula: string } | undefined;
    const lines = rawEquipment
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean)
      .filter(line => !/^you start with/i.test(line) && !/^plus anything provided/i.test(line));

    lines.forEach((line, index) => {
      if (/^alternatively,/i.test(line)) {
        const formulaMatch = line.match(/(\d+)d(\d+)(?:\s*x\s*(\d+))?\s*(cp|sp|ep|gp|pp)/i);
        if (formulaMatch) {
          goldAlternative = { formula: formulaMatch[0] };
        }
        return;
      }

      blocks.push(parseTextEquipmentLine(line, `${sourceId}-block-${index + 1}`, className));
    });

    return { blocks, goldAlternative };
  }

  function buildStructuredBlocks(rawEquipment: unknown, sourceId: string): EquipmentBlock[] {
    if (!Array.isArray(rawEquipment)) return [];

    return rawEquipment.flatMap<EquipmentBlock>((row, index) => {
      if (!row || typeof row !== 'object') return [];

      const record = row as Record<string, unknown>;
      if (Array.isArray(record._)) {
        return [
          {
            id: `${sourceId}-fixed-${index + 1}`,
            title: `Choice ${index + 1}`,
            type: 'fixed' as const,
            entries: parseStructuredEntries(record._, `${sourceId}-fixed-${index + 1}`),
          },
        ];
      }

      const optionKeys = Object.keys(record).sort();
      const options = optionKeys
        .filter(key => Array.isArray(record[key]))
        .map(key => ({
          id: `${sourceId}-choice-${index + 1}-${key}`,
          label: `${key.toUpperCase()}. ${formatEntriesLabel(record[key] as unknown[])}`,
          entries: parseStructuredEntries(
            record[key] as unknown[],
            `${sourceId}-choice-${index + 1}-${key}`
          ),
        }));

      if (options.length === 0) return [];

      return [
        {
          id: `${sourceId}-choice-${index + 1}`,
          title: `Choice ${index + 1}`,
          type: 'choice' as const,
          options,
        },
      ];
    });
  }

  function parseStructuredEntries(entries: unknown[], prefix: string): EquipmentEntry[] {
    return entries.flatMap((entry, index) =>
      parseStructuredEntry(entry, `${prefix}-entry-${index + 1}`)
    );
  }

  function parseStructuredEntry(entry: unknown, entryId: string): EquipmentEntry[] {
    if (typeof entry === 'string') {
      return parsePhraseIntoEntries(entry, entryId);
    }
    if (!entry || typeof entry !== 'object') return [];

    const record = entry as Record<string, unknown>;
    if (typeof record.special === 'string') {
      return [makeFixedEntry(entryId, record.special)];
    }

    if (typeof record.item === 'string') {
      const label = typeof record.displayName === 'string' ? record.displayName : record.item;
      const result: EquipmentEntry[] = [makeFixedEntry(entryId, label)];
      if (typeof record.containsValue === 'number') {
        result.push({
          id: `${entryId}-coin`,
          kind: 'coin',
          label: `${formatCopper(record.containsValue)} in the ${label}`,
          copper: record.containsValue,
        });
      }
      return result;
    }

    return [];
  }

  function parseTextEquipmentLine(
    line: string,
    blockId: string,
    className: string
  ): EquipmentBlock {
    const options = extractLetteredOptions(line, blockId);
    if (options.length > 0) {
      return {
        id: blockId,
        title: `${className} choice`,
        type: 'choice',
        options,
      };
    }

    return {
      id: blockId,
      title: `${className} gear`,
      type: 'fixed',
      entries: parsePhraseIntoEntries(line, blockId),
    };
  }

  function extractLetteredOptions(line: string, blockId: string): EquipmentBlockOption[] {
    const matches = Array.from(line.matchAll(/\(([a-z])\)\s*([^()]+?)(?=\s+or\s+\([a-z]\)|$)/gi));
    return matches.map((match, index) => {
      const optionKey = match[1] ?? String(index + 1);
      return {
        id: `${blockId}-option-${optionKey}`,
        label: `${optionKey.toUpperCase()}. ${cleanLabel(match[2] ?? '')}`,
        entries: parsePhraseIntoEntries(match[2] ?? '', `${blockId}-option-${index + 1}`),
      };
    });
  }

  function parsePhraseIntoEntries(phrase: string, prefix: string): EquipmentEntry[] {
    const normalizedPhrase = cleanLabel(phrase);
    const parts = normalizedPhrase
      .replace(/,\s+and\s+/gi, ', ')
      .replace(/\sand\s/gi, ', ')
      .split(',')
      .map(part => cleanLabel(part))
      .filter(Boolean);

    return parts.flatMap((part, index) => parseAtomicEntry(part, `${prefix}-part-${index + 1}`));
  }

  function parseAtomicEntry(part: string, entryId: string): EquipmentEntry[] {
    const lowered = part.toLowerCase();

    if (lowered === 'any two simple weapons') {
      return [makeSelectEntry(entryId, 'Choose two simple weapons', 2, 'simple-weapon')];
    }
    if (lowered === 'two martial weapons') {
      return [makeSelectEntry(entryId, 'Choose two martial weapons', 2, 'martial-weapon')];
    }
    if (lowered === 'two simple melee weapons') {
      return [
        makeSelectEntry(entryId, 'Choose two simple melee weapons', 2, 'simple-melee-weapon'),
      ];
    }
    if (lowered === 'any simple weapon') {
      return [makeSelectEntry(entryId, 'Choose a simple weapon', 1, 'simple-weapon')];
    }
    if (lowered === 'any martial weapon') {
      return [makeSelectEntry(entryId, 'Choose a martial weapon', 1, 'martial-weapon')];
    }
    if (lowered === 'any simple melee weapon') {
      return [makeSelectEntry(entryId, 'Choose a simple melee weapon', 1, 'simple-melee-weapon')];
    }
    if (lowered === 'any martial melee weapon') {
      return [makeSelectEntry(entryId, 'Choose a martial melee weapon', 1, 'martial-melee-weapon')];
    }
    if (lowered === 'any other musical instrument') {
      return [
        makeSelectEntry(entryId, 'Choose a musical instrument', 1, 'other musical instrument', [
          'lute',
        ]),
      ];
    }
    if (lowered === 'a musical instrument' || lowered === 'an instrument') {
      return [makeSelectEntry(entryId, 'Choose a musical instrument', 1, 'musical instrument')];
    }
    if (lowered === 'a druidic focus') {
      return [makeSelectEntry(entryId, 'Choose a druidic focus', 1, 'druidic focus')];
    }
    if (lowered === 'an arcane focus') {
      return [makeSelectEntry(entryId, 'Choose an arcane focus', 1, 'arcane focus')];
    }
    if (lowered === 'a holy symbol') {
      return [makeSelectEntry(entryId, 'Choose a holy symbol', 1, 'holy symbol')];
    }

    const quantityMatch = part.match(/^(\d+)\s+(.+)$/);
    if (quantityMatch) {
      return [makeFixedEntry(entryId, quantityMatch[2] ?? part, Number(quantityMatch[1] ?? '1'))];
    }

    return [makeFixedEntry(entryId, part)];
  }

  function makeFixedEntry(entryId: string, label: string, quantity = 1): EquipmentEntry {
    return {
      id: entryId,
      kind: 'fixed',
      label: quantity > 1 ? `${quantity} ${cleanLabel(label)}` : cleanLabel(label),
      quantity,
      item: findItemByName(label),
    };
  }

  function makeSelectEntry(
    entryId: string,
    label: string,
    count: number,
    groupKey: string,
    excludeNames: string[] = []
  ): EquipmentEntry {
    return {
      id: entryId,
      kind: 'select',
      label,
      count,
      options: getOptionsForGroup(groupKey, excludeNames),
    };
  }

  function getOptionsForGroup(
    groupKey: string,
    excludeNames: string[] = []
  ): EquipmentOptionChoice[] {
    const excluded = new Set(excludeNames.map(name => normalizeLookupKey(name)));
    const baseItems = (() => {
      switch (groupKey) {
        case 'simple-weapon':
          return dataStore.items.filter(item => item.weaponCategory === 'simple');
        case 'martial-weapon':
          return dataStore.items.filter(item => item.weaponCategory === 'martial');
        case 'simple-melee-weapon':
          return dataStore.items.filter(
            item => item.weaponCategory === 'simple' && item.type === 'M'
          );
        case 'martial-melee-weapon':
          return dataStore.items.filter(
            item => item.weaponCategory === 'martial' && item.type === 'M'
          );
        default:
          return [] as Item[];
      }
    })();

    if (baseItems.length > 0) {
      return dedupeOptionChoices(
        baseItems
          .filter(item => !excluded.has(normalizeLookupKey(item.displayName ?? item.name)))
          .map(item => ({
            value: item.name,
            label: item.displayName ?? item.name,
            item,
          }))
      );
    }

    const curatedOptions =
      CURATED_GROUPS[groupKey] ?? CURATED_GROUPS[groupKey.replace(/^other\s+/, '')] ?? [];
    return curatedOptions
      .filter(name => !excluded.has(normalizeLookupKey(name)))
      .map(name => ({
        value: name,
        label: name,
        item: findItemByName(name),
      }));
  }

  function dedupeOptionChoices(options: EquipmentOptionChoice[]): EquipmentOptionChoice[] {
    const seen = new Set<string>();
    return options.filter(option => {
      const key = normalizeLookupKey(option.label);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function findItemByName(rawName: string): Item | null {
    for (const candidate of buildLookupCandidates(rawName)) {
      const found = itemIndex.value.get(candidate);
      if (found) return found;
    }
    return null;
  }

  function buildLookupCandidates(rawName: string): string[] {
    const normalized = normalizeLookupKey(rawName);
    const candidates = new Set<string>();

    const addCandidate = (value: string | undefined) => {
      if (!value) return;
      const normalizedValue = normalizeLookupKey(value);
      if (normalizedValue) candidates.add(normalizedValue);
    };

    addCandidate(normalized);

    const quantityMatch = normalized.match(/^(\d+)\s+(.+)$/);
    if (quantityMatch) {
      const quantity = quantityMatch[1] ?? '';
      const remainder = quantityMatch[2] ?? '';
      addCandidate(remainder);
      addCandidate(`${remainder} (${quantity})`);
      singularizeLookupValue(remainder).forEach(addCandidate);
      singularizeLookupValue(remainder).forEach(value => addCandidate(`${value} (${quantity})`));
    }

    singularizeLookupValue(normalized).forEach(addCandidate);
    (ITEM_LOOKUP_ALIASES[normalized] ?? []).forEach(addCandidate);
    singularizeLookupValue(normalized).forEach(value => {
      (ITEM_LOOKUP_ALIASES[value] ?? []).forEach(addCandidate);
    });

    return [...candidates];
  }

  function singularizeLookupValue(value: string): string[] {
    const singulars = new Set<string>();

    if (value.endsWith('ies')) {
      singulars.add(`${value.slice(0, -3)}y`);
    }

    if (value.endsWith('ves')) {
      singulars.add(`${value.slice(0, -3)}f`);
      singulars.add(`${value.slice(0, -3)}fe`);
    }

    if (
      value.endsWith('s') &&
      !value.endsWith('ss') &&
      !value.endsWith('tools') &&
      !value.endsWith('clothes')
    ) {
      singulars.add(value.slice(0, -1));
    }

    return [...singulars].filter(Boolean);
  }

  function normalizeLookupKey(raw: string): string {
    return raw
      .toLowerCase()
      .replace(/[’']/g, '')
      .replace(/^[0-9]+\s+x\s+/i, '')
      .replace(/^(a|an|the)\s+/i, '')
      .replace(/\(if proficient\)/gi, '')
      .replace(/[.,]+$/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function cleanLabel(raw: string): string {
    return raw
      .replace(/\(if proficient\)/gi, '')
      .replace(/[.]+$/g, '')
      .trim();
  }

  function slugify(raw: string): string {
    return raw
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  function formatEntriesLabel(entries: unknown[]): string {
    return entries
      .map(entry => {
        if (typeof entry === 'string') return cleanLabel(entry);
        if (entry && typeof entry === 'object') {
          const record = entry as Record<string, unknown>;
          return cleanLabel(
            String(record.displayName ?? record.special ?? record.item ?? 'Equipment option')
          );
        }
        return 'Equipment option';
      })
      .join(', ');
  }

  function rollGoldAlternative(sourceId: string, formula: string) {
    const match = formula.match(/(\d+)d(\d+)(?:\s*x\s*(\d+))?\s*(cp|sp|ep|gp|pp)/i);
    if (!match) {
      selectionState.rolledCopperBySource[sourceId] = 0;
      return;
    }

    const count = Number(match[1] ?? '0');
    const dieSize = Number(match[2] ?? '0');
    const multiplier = Number(match[3] ?? '1');
    const currency = (match[4]?.toLowerCase() ?? 'gp') as CurrencyKey;
    const rolledValue =
      diceRoll([{ count, dType: `d${dieSize}` as 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20' }]) *
      multiplier;
    selectionState.rolledCopperBySource[sourceId] = rolledValue * COPPER_PER_COIN[currency];
  }

  function resolveLoadout(): { items: Item[]; currency: Currency; itemLabels: string[] } {
    const items: Item[] = [];
    const itemLabels: string[] = [];
    const currency = emptyCurrency();

    equipmentSources.value.forEach(source => {
      if (source.goldAlternative && selectionState.useGoldAlternative[source.id]) {
        if (selectionState.goldInputMode[source.id] === 'custom') {
          addCurrency(currency, selectionState.customGoldBySource[source.id] ?? emptyCurrency());
        } else {
          addCurrency(
            currency,
            copperToCurrency(selectionState.rolledCopperBySource[source.id] ?? 0)
          );
        }
        return;
      }

      source.blocks.forEach(block => {
        const entries =
          block.type === 'choice'
            ? block.options.find(option => option.id === selectionState.blockSelections[block.id])
                ?.entries ?? []
            : block.entries;

        entries.forEach(entry => resolveEntry(entry, items, itemLabels, currency));
      });
    });

    return { items, currency, itemLabels };
  }

  function resolveEntry(
    entry: EquipmentEntry,
    items: Item[],
    itemLabels: string[],
    currency: Currency
  ) {
    if (entry.kind === 'coin') {
      addCopperToCurrency(currency, entry.copper);
      return;
    }

    if (entry.kind === 'select') {
      const selectedValues = (selectionState.entrySelections[entry.id] ?? []).slice(0, entry.count);
      selectedValues.forEach(value => {
        const selectedOption = entry.options.find(option => option.value === value);
        const label = selectedOption?.label ?? value;
        items.push(makeInventoryItem(label, selectedOption?.item ?? null));
        itemLabels.push(label);
      });
      return;
    }

    if (entry.quantity <= 4 && entry.item) {
      for (let i = 0; i < entry.quantity; i++) {
        items.push(makeInventoryItem(entry.item.displayName ?? entry.item.name, entry.item));
      }
    } else {
      items.push(makeInventoryItem(entry.label, entry.item, entry.quantity));
    }
    itemLabels.push(entry.label);
  }

  function makeInventoryItem(label: string, item: Item | null, quantity = 1): Item {
    if (item && quantity === 1) {
      return JSON.parse(JSON.stringify(item));
    }

    if (item && quantity > 1) {
      return {
        ...JSON.parse(JSON.stringify(item)),
        displayName: `${quantity} x ${item.displayName ?? item.name}`,
      };
    }

    const baseLabel =
      quantity > 1 && !new RegExp(`^${quantity}\\s`).test(label) ? `${quantity} ${label}` : label;
    const manualLabel = `${baseLabel}${MANUAL_ITEM_SUFFIX}`;

    return {
      name: manualLabel,
      displayName: manualLabel,
      source: 'START',
      entries: [],
    };
  }

  function emptyCurrency(): Currency {
    return { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 };
  }

  function copperToCurrency(copper: number): Currency {
    const currency = emptyCurrency();
    addCopperToCurrency(currency, copper);
    return currency;
  }

  function addCurrency(target: Currency, source: Currency) {
    target.pp += source.pp;
    target.gp += source.gp;
    target.sp += source.sp;
    target.cp += source.cp;
  }

  function addCopperToCurrency(currency: Currency, copper: number) {
    let remaining = Math.max(0, Math.floor(copper));
    (['pp', 'gp', 'ep', 'sp', 'cp'] as CurrencyKey[]).forEach(key => {
      const value = COPPER_PER_COIN[key];
      const count = Math.floor(remaining / value);
      currency[key] += count;
      remaining -= count * value;
    });
  }

  function formatCurrencyBreakdown(currency: Currency): string {
    return CUSTOM_GOLD_COINS.map(coin => `${currency[coin.key]} ${coin.key}`).join(', ');
  }

  function formatCopper(copper: number): string {
    return formatCurrencyBreakdown(copperToCurrency(copper));
  }

  async function saveCharacter() {
    const resolved = resolveLoadout();
    store.setCreationStartingLoadout(resolved.items, resolved.currency);
    await store.finalizeCharacterCreation();
    emit('finishCreation');
  }
</script>

<style scoped>
  .summary-section {
    display: grid;
    gap: 1rem;
    padding-bottom: 1rem;
  }

  .summary-hero {
    display: grid;
    gap: 0.45rem;
    padding: 1rem;
    border-radius: 18px;
    background: linear-gradient(135deg, rgba(201, 164, 75, 0.18), rgba(107, 46, 46, 0.08)),
      var(--color-surface);
    border: 1px solid rgba(107, 46, 46, 0.14);
    box-shadow: 0 10px 24px rgba(31, 27, 22, 0.08);
  }

  .summary-kicker {
    margin: 0;
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--color-primary);
  }

  .summary-copy,
  .equipment-source__header p,
  .summary-empty p {
    margin: 0;
    color: var(--color-muted);
    line-height: 1.5;
  }

  .equipment-source,
  .summary-preview {
    border: 1px solid rgba(107, 46, 46, 0.12);
    border-radius: 18px;
    padding: 1rem;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.58), rgba(255, 255, 255, 0.82));
    box-shadow: 0 8px 22px rgba(31, 27, 22, 0.06);
  }

  .equipment-source__header {
    margin-bottom: 0.9rem;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 0.75rem;
  }

  .equipment-source__header h3,
  .summary-preview h3,
  .equipment-block__title {
    margin: 0;
  }

  .source-badge {
    flex-shrink: 0;
    padding: 0.35rem 0.6rem;
    border-radius: 999px;
    background: rgba(107, 46, 46, 0.08);
    color: var(--color-primary);
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: capitalize;
  }

  .gold-option-card,
  .equipment-block-list,
  .choice-list,
  .fixed-list,
  .entry-select-group,
  .entry-selects {
    display: grid;
    gap: 0.75rem;
  }

  .gold-option-card {
    padding: 0.85rem;
    border-radius: 14px;
    background: rgba(201, 164, 75, 0.09);
    border: 1px solid rgba(201, 164, 75, 0.2);
  }

  .toggle-row,
  .choice-card {
    display: flex;
    gap: 0.75rem;
    align-items: flex-start;
  }

  .toggle-row {
    padding: 0.15rem 0;
  }

  .toggle-row--compact {
    padding: 0;
    align-items: center;
  }

  .choice-card {
    border: 1px solid rgba(107, 46, 46, 0.1);
    border-radius: 16px;
    padding: 0.9rem;
    background: rgba(255, 255, 255, 0.72);
    transition: border-color 0.16s ease, box-shadow 0.16s ease, transform 0.16s ease;
  }

  .choice-card:has(input:checked) {
    border-color: rgba(107, 46, 46, 0.45);
    box-shadow: 0 10px 24px rgba(107, 46, 46, 0.08);
    transform: translateY(-1px);
  }

  .choice-card__body,
  .equipment-block,
  .entry-row {
    display: grid;
    gap: 0.5rem;
  }

  .choice-card__label {
    font-weight: 600;
  }

  .equipment-block {
    gap: 0.65rem;
    padding: 0.85rem;
    border-radius: 14px;
    background: rgba(244, 236, 216, 0.45);
  }

  .equipment-block__title {
    font-size: 0.8rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--color-primary);
  }

  .entry-row {
    padding: 0.65rem 0.75rem;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.58);
    border: 1px solid rgba(107, 46, 46, 0.06);
  }

  .gold-roll-row {
    display: grid;
    gap: 0.75rem;
    padding-top: 0.25rem;
  }

  .gold-mode-switches {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .gold-roll-value {
    font-weight: 700;
    color: var(--color-primary);
  }

  .gold-input-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.75rem;
  }

  .gold-input-field {
    display: grid;
    gap: 0.35rem;
    font-size: 0.82rem;
    font-weight: 600;
    color: var(--color-primary);
  }

  .gold-input-field input {
    min-height: 2.7rem;
    text-align: right;
  }

  .entry-selects {
    grid-template-columns: 1fr;
  }

  .summary-empty {
    padding: 1rem;
    border-radius: 16px;
    background: rgba(255, 255, 255, 0.7);
    border: 1px dashed rgba(107, 46, 46, 0.18);
  }

  .summary-preview {
    position: sticky;
    bottom: 0.75rem;
    z-index: 1;
    background: linear-gradient(180deg, rgba(255, 248, 236, 0.96), rgba(239, 230, 208, 0.98));
    border-color: rgba(201, 164, 75, 0.24);
  }

  .preview-line {
    margin: 0;
    line-height: 1.5;
  }

  .summary-section input[type='radio'] {
    width: 1.1rem;
    min-width: 1.1rem;
    height: 1.1rem;
    margin: 0.1rem 0 0;
    padding: 0;
    border-radius: 50%;
    accent-color: var(--color-primary);
    box-shadow: none;
    background: white;
  }

  .summary-section select {
    min-height: 2.9rem;
    border-radius: 12px;
    background: white;
    border: 1px solid rgba(107, 46, 46, 0.14);
  }

  .secondary-button {
    min-height: 2.9rem;
    border: 0;
    border-radius: 999px;
    font-weight: 700;
    cursor: pointer;
  }

  .secondary-button {
    padding: 0.7rem 1rem;
    background: rgba(107, 46, 46, 0.08);
    color: var(--color-primary);
  }

  .save-button {
    width: 100%;
  }

  @media (min-width: 640px) {
    .summary-section {
      gap: 1.15rem;
    }

    .entry-selects {
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    }

    .save-button {
      width: fit-content;
      min-width: 220px;
    }

    .gold-input-grid {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }
  }

  @media (max-width: 420px) {
    .equipment-source,
    .summary-preview,
    .summary-hero {
      padding: 0.9rem;
      border-radius: 16px;
    }

    .choice-card,
    .equipment-block,
    .entry-row {
      padding: 0.75rem;
    }
  }
</style>
