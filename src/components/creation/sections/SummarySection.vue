<template>
  <section class="summary-section">
    <h2>Starting equipment</h2>
    <p class="summary-copy">
      Choose the class and background gear you want to start with. Any coin included by those
      choices will be added when you save the character.
    </p>

    <div v-if="equipmentSources.length === 0" class="summary-empty">
      <p>No class or background starting equipment was found.</p>
    </div>

    <div v-for="source in equipmentSources" :key="source.id" class="equipment-source">
      <div class="equipment-source__header">
        <h3>{{ source.label }}</h3>
        <p>{{ source.kind === 'class' ? 'Class equipment' : 'Background equipment' }}</p>
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
          <span>{{ formatCopper(selectionState.rolledCopperBySource[source.id] ?? 0) }}</span>
          <button type="button" @click="rollGoldAlternative(source.id, source.goldAlternative.formula)">
            Reroll
          </button>
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
      <p><strong>Items:</strong> {{ preview.itemLabels.join(', ') || 'None' }}</p>
      <p><strong>Money:</strong> {{ formatCurrency(preview.currency) }}</p>
    </div>

    <button type="button" class="save-button" @click="saveCharacter">Save Character</button>
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

  const store = useCharacterStore();
  const dataStore = useDataStore();
  const emit = defineEmits<{ (e: 'finishCreation'): void }>();
  const selectionState = reactive({
    blockSelections: {} as Record<string, string>,
    entrySelections: {} as Record<string, string[]>,
    useGoldAlternative: {} as Record<string, boolean>,
    rolledCopperBySource: {} as Record<string, number>,
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

    const background = currentCharacter.background as { name?: string; startingEquipment?: unknown } | null;
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
      if (
        source.goldAlternative &&
        selectionState.rolledCopperBySource[source.id] === undefined
      ) {
        rollGoldAlternative(source.id, source.goldAlternative.formula);
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
          entries: parseStructuredEntries(record[key] as unknown[], `${sourceId}-choice-${index + 1}-${key}`),
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
    return entries.flatMap((entry, index) => parseStructuredEntry(entry, `${prefix}-entry-${index + 1}`));
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

  function parseTextEquipmentLine(line: string, blockId: string, className: string): EquipmentBlock {
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
      return [makeSelectEntry(entryId, 'Choose two simple melee weapons', 2, 'simple-melee-weapon')];
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
        makeSelectEntry(entryId, 'Choose a musical instrument', 1, 'other musical instrument', ['lute']),
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

  function getOptionsForGroup(groupKey: string, excludeNames: string[] = []): EquipmentOptionChoice[] {
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

    const curatedOptions = CURATED_GROUPS[groupKey] ?? CURATED_GROUPS[groupKey.replace(/^other\s+/, '')] ?? [];
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
    const cleanedName = normalizeLookupKey(rawName);
    return itemIndex.value.get(cleanedName) ?? null;
  }

  function normalizeLookupKey(raw: string): string {
    return raw
      .toLowerCase()
      .replace(/^[0-9]+\s+x\s+/i, '')
      .replace(/^(a|an|the)\s+/i, '')
      .replace(/\(if proficient\)/gi, '')
      .replace(/[.,]+$/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function cleanLabel(raw: string): string {
    return raw.replace(/\(if proficient\)/gi, '').replace(/[.]+$/g, '').trim();
  }

  function slugify(raw: string): string {
    return raw.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
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
        addCopperToCurrency(currency, selectionState.rolledCopperBySource[source.id] ?? 0);
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

    return {
      name: quantity > 1 ? `${quantity} ${label}` : label,
      displayName: quantity > 1 ? `${quantity} ${label}` : label,
      source: 'START',
      entries: [],
    };
  }

  function emptyCurrency(): Currency {
    return { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 };
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

  function formatCurrency(currency: Currency): string {
    return (['pp', 'gp', 'ep', 'sp', 'cp'] as CurrencyKey[])
      .filter(key => currency[key] > 0)
      .map(key => `${currency[key]} ${key}`)
      .join(', ') || '0 gp';
  }

  function formatCopper(copper: number): string {
    const currency = emptyCurrency();
    addCopperToCurrency(currency, copper);
    return formatCurrency(currency);
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
  }

  .summary-copy,
  .equipment-source__header p,
  .summary-empty p {
    margin: 0;
  }

  .equipment-source,
  .summary-preview {
    border: 1px solid rgba(0, 0, 0, 0.15);
    border-radius: 12px;
    padding: 1rem;
    background: rgba(255, 255, 255, 0.6);
  }

  .equipment-source__header {
    margin-bottom: 0.75rem;
  }

  .equipment-source__header h3,
  .summary-preview h3,
  .equipment-block__title {
    margin: 0;
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

  .toggle-row,
  .choice-card {
    display: flex;
    gap: 0.75rem;
    align-items: flex-start;
  }

  .choice-card {
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 10px;
    padding: 0.75rem;
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

  .gold-roll-row {
    display: flex;
    gap: 0.75rem;
    align-items: center;
  }

  .entry-selects {
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  }

  .save-button {
    width: fit-content;
    padding: 0.7rem 1.1rem;
  }
</style>
