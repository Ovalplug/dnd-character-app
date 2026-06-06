<template>
  <div class="name-wrapper">
    <div class="name-header">
      <p class="charName" ref="nameEl">{{ props.character.name }}</p>
      <button
        v-if="props.character.name"
        type="button"
        class="edit-trigger"
        @click="openEditPopout"
        aria-label="Edit character"
      >
        <img :src="editIcon" alt="Edit character" class="edit-icon" />
      </button>
    </div>
    <p class="char-summary">
      {{ props.character.subrace ? props.character.subrace.name : '' }}
      {{ props.character.race?.name }} - {{ props.character.background?.name }}
    </p>

    <PopOut v-if="showEditPopout" :title="popoutTitle" mini @close="closeEditPopout">
      <div class="edit-popout">
        <p v-if="actionMessage" class="action-message">{{ actionMessage }}</p>

        <div v-if="activePanel === 'menu'" class="action-grid">
          <button type="button" class="action-card card" @click="setPanel('name')">
            <span class="action-card-title">Edit Name</span>
            <span class="action-card-copy">Rename this character.</span>
          </button>
          <button type="button" class="action-card card" @click="setPanel('rest')">
            <span class="action-card-title">Rest Options</span>
            <span class="action-card-copy">Apply a short or long rest.</span>
          </button>
          <button type="button" class="action-card card" @click="openFeatPanel">
            <span class="action-card-title">Manage Feats</span>
            <span class="action-card-copy">Add new feats or remove existing ones.</span>
          </button>
          <button type="button" class="action-card card" @click="setPanel('languages')">
            <span class="action-card-title">Edit Languages</span>
            <span class="action-card-copy">Update speak, read, and write flags.</span>
          </button>
          <button type="button" class="action-card action-card--muted card" @click="openItemsPanel">
            <span class="action-card-title">Manage Items</span>
            <span class="action-card-copy"
              >Add gear from the compendium or remove carried items.</span
            >
          </button>
        </div>

        <form v-else-if="activePanel === 'name'" class="edit-form" @submit.prevent="saveName">
          <label class="form-label" for="character-name-input">Character name</label>
          <input
            id="character-name-input"
            v-model="nameDraft"
            type="text"
            maxlength="60"
            placeholder="Enter a character name"
          />
          <div class="action-row">
            <button type="button" class="btn btn-ghost" @click="setPanel('menu')">Back</button>
            <button type="submit" class="btn btn-primary">Save Name</button>
          </div>
        </form>

        <div v-else-if="activePanel === 'rest'" class="edit-form">
          <label class="form-label" for="short-rest-healing">Short rest healing</label>
          <input id="short-rest-healing" v-model.number="shortRestHealing" type="number" min="0" />
          <p class="panel-copy">
            Short rest applies the healing entered above. Long rest fully restores HP and spell
            slots.
          </p>
          <div class="action-row action-row--spread">
            <button type="button" class="btn btn-ghost" @click="setPanel('menu')">Back</button>
            <div class="inline-actions">
              <button type="button" class="btn btn-ghost" @click="applyShortRest">
                Short Rest
              </button>
              <button type="button" class="btn btn-primary" @click="applyLongRest">
                Long Rest
              </button>
            </div>
          </div>
        </div>

        <div v-else-if="activePanel === 'feats'" class="edit-form edit-form--wide">
          <div class="action-row action-row--spread">
            <button type="button" class="btn btn-ghost" @click="setPanel('menu')">Back</button>
            <span class="panel-copy panel-copy--compact"
              >{{ props.character.feats.length }} feat(s)</span
            >
          </div>

          <div v-if="props.character.feats.length" class="selected-list">
            <div v-for="feat in props.character.feats" :key="featKey(feat)" class="selected-row">
              <div>
                <p class="selected-title">{{ feat.name }}</p>
                <p class="selected-copy">{{ feat.source || 'Unknown source' }}</p>
              </div>
              <button type="button" class="btn btn-danger" @click="removeFeat(feat)">Remove</button>
            </div>
          </div>
          <p v-else class="panel-copy">No feats added yet.</p>

          <label class="form-label" for="feat-search">Find a feat</label>
          <input
            id="feat-search"
            v-model="featSearch"
            type="search"
            placeholder="Search feats by name"
          />

          <p v-if="isLoadingFeats" class="panel-copy">Loading feats...</p>
          <div v-else class="available-list">
            <div v-for="feat in filteredFeats" :key="featKey(feat)" class="selected-row">
              <div>
                <p class="selected-title">{{ feat.name }}</p>
                <p class="selected-copy">{{ feat.source || 'Unknown source' }}</p>
              </div>
              <button type="button" class="btn btn-primary" @click="addFeat(feat)">Add</button>
            </div>
            <p v-if="!filteredFeats.length" class="panel-copy">No matching feats available.</p>
          </div>
        </div>

        <form
          v-else-if="activePanel === 'languages'"
          class="edit-form edit-form--wide"
          @submit.prevent="saveLanguages"
        >
          <div class="action-row action-row--spread">
            <button type="button" class="btn btn-ghost" @click="setPanel('menu')">Back</button>
            <button type="submit" class="btn btn-primary">Save Languages</button>
          </div>

          <div class="language-table">
            <div class="language-table-header">
              <span>Language</span>
              <span>Speak</span>
              <span>Read</span>
              <span>Write</span>
            </div>
            <div v-for="language in languageKeys" :key="language" class="language-row">
              <span class="language-name">{{ formatLanguageName(language) }}</span>
              <input v-model="languageForm[language].speak" type="checkbox" />
              <input v-model="languageForm[language].read" type="checkbox" />
              <input v-model="languageForm[language].write" type="checkbox" />
            </div>
          </div>
        </form>

        <div v-else-if="activePanel === 'items'" class="edit-form edit-form--wide">
          <div class="action-row action-row--spread">
            <button type="button" class="btn btn-ghost" @click="setPanel('menu')">Back</button>
            <span class="panel-copy panel-copy--compact"
              >{{ props.character.inventory.length }} item(s)</span
            >
          </div>

          <div class="items-panel-layout">
            <AccordianHolder
              header="Carried Items"
              kicker="Current Loadout"
              description="Review equipped gear, attuned items, and remove duplicates if needed."
              :count-label="`${props.character.inventory.length} total`"
              class="items-panel-accordion"
            >
              <template #default>
                <div v-if="stackedInventory.length" class="selected-list">
                  <div
                    v-for="row in stackedInventory"
                    :key="row.key"
                    class="selected-row selected-row--item"
                  >
                    <div class="selected-copy-block">
                      <div class="selected-title-row">
                        <p class="selected-title">
                          {{ getStackedItemDisplayName(row.item, row.quantity) }}
                        </p>
                        <span v-if="row.quantity > 1" class="stack-badge">x{{ row.quantity }}</span>
                      </div>
                      <div class="item-badge-row item-badge-row--compact">
                        <span
                          v-for="badge in getItemBadges(row.item)"
                          :key="`${row.key}-${badge}`"
                          class="item-badge"
                        >
                          {{ badge }}
                        </span>
                      </div>
                      <p v-if="getItemFacts(row.item)" class="selected-copy">
                        {{ getItemFacts(row.item) }}
                      </p>
                      <p class="selected-copy">{{ getItemMeta(row.item) }}</p>
                      <div class="inline-actions inline-actions--inventory">
                        <button
                          type="button"
                          class="btn btn-ghost btn-inline-toggle"
                          :class="{ 'btn-inline-toggle--active': !!row.item.equipped }"
                          @click="toggleEquipped(row.indexes[0] ?? -1)"
                        >
                          {{ row.item.equipped ? 'Equipped' : 'Equip' }}
                        </button>
                        <button
                          v-if="itemRequiresAttunement(row.item)"
                          type="button"
                          class="btn btn-ghost btn-inline-toggle"
                          :class="{ 'btn-inline-toggle--active': !!row.item.attuned }"
                          @click="toggleAttuned(row.indexes[0] ?? -1)"
                        >
                          {{ row.item.attuned ? 'Attuned' : 'Attune' }}
                        </button>
                      </div>
                    </div>
                    <button
                      type="button"
                      class="btn btn-danger item-remove-btn"
                      @click="removeItem(row.indexes[0] ?? -1)"
                    >
                      Remove
                    </button>
                  </div>
                </div>
                <p v-else class="panel-copy">No items in this inventory yet.</p>
              </template>
            </AccordianHolder>

            <section class="items-panel-card items-panel-card--search">
              <div class="items-panel-card__header items-panel-card__header--stacked">
                <div>
                  <p class="items-panel-kicker">Compendium</p>
                  <h3 class="items-panel-title">Add Items</h3>
                  <p class="panel-copy">Search by name, rarity, or item type.</p>
                </div>
                <span class="items-panel-count">{{ filteredItems.length }} shown</span>
              </div>

              <label class="form-label" for="item-search">Find an item</label>
              <input
                id="item-search"
                v-model="itemSearch"
                type="search"
                placeholder="Search weapons, armor, tools, or magic items"
              />

              <p v-if="isLoadingItems" class="panel-copy">Loading items...</p>
              <div v-else class="items-results-grid">
                <article
                  v-for="item in filteredItems"
                  :key="itemKey(item)"
                  class="item-result-card"
                >
                  <div class="item-result-card__copy">
                    <div class="selected-title-row">
                      <p class="selected-title">{{ getItemDisplayName(item) }}</p>
                    </div>
                    <div class="item-badge-row">
                      <span
                        v-for="badge in getItemBadges(item)"
                        :key="`${itemKey(item)}-${badge}`"
                        class="item-badge"
                      >
                        {{ badge }}
                      </span>
                    </div>
                    <p v-if="getItemFacts(item)" class="selected-copy">{{ getItemFacts(item) }}</p>
                    <p class="selected-copy">{{ getItemMeta(item) }}</p>
                  </div>
                  <button type="button" class="btn btn-primary item-add-btn" @click="addItem(item)">
                    Add Item
                  </button>
                </article>
                <p v-if="!filteredItems.length" class="panel-copy">No matching items available.</p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </PopOut>
  </div>
</template>

<script lang="ts" setup>
  import { computed, ref, onMounted, watch, nextTick } from 'vue';
  import {
    getInventoryItemBadges,
    getInventoryItemDisplayName,
    getInventoryItemFacts,
    getRefinedItemsList,
    itemRequiresAttunement,
    stackInventoryItems,
  } from '../../../../helperFunctions';
  import { useCharacterStore } from '../../../../stores/characterStore';
  import { useDataStore } from '../../../../stores/dataStore';
  import type {
    CharacterEditPanel,
    Feat,
    Item,
    LanguageAbility,
    Languages,
    playerCharacter,
  } from '../../../../types';

  import editIcon from '../../../../assets/icons/editIcon.svg';

  import AccordianHolder from '../../../AccordianHolder.vue';
  import PopOut from '../../../PopOut.vue';

  const LANGUAGE_KEYS = [
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
  ] as const;

  const props = defineProps<{
    character: playerCharacter;
  }>();

  const charStore = useCharacterStore();
  const dataStore = useDataStore();

  const nameEl = ref<HTMLElement | null>(null);
  const showEditPopout = ref(false);
  const activePanel = ref<CharacterEditPanel>('menu');
  const nameDraft = ref('');
  const shortRestHealing = ref(0);
  const featSearch = ref('');
  const itemSearch = ref('');
  const isLoadingFeats = ref(false);
  const isLoadingItems = ref(false);
  const actionMessage = ref('');
  const languageKeys = LANGUAGE_KEYS;
  const languageForm = ref<Languages>(buildLanguageForm(props.character.languages));

  const popoutTitle = computed(() => {
    switch (activePanel.value) {
      case 'name':
        return 'Edit Character Name';
      case 'rest':
        return 'Rest Options';
      case 'feats':
        return 'Manage Feats';
      case 'languages':
        return 'Edit Languages';
      case 'items':
        return 'Manage Items';
      default:
        return `${props.character.name || 'Character'} Options`;
    }
  });

  const filteredFeats = computed(() => {
    const activeIds = new Set(props.character.feats.map(feat => featKey(feat)));
    const query = featSearch.value.trim().toLowerCase();

    return [...((dataStore.filteredFeats || []) as Feat[])]
      .filter(feat => !activeIds.has(featKey(feat)))
      .filter(feat => !query || feat.name.toLowerCase().includes(query))
      .sort((left, right) => left.name.localeCompare(right.name))
      .slice(0, 24);
  });

  const filteredItems = computed(() => {
    return getRefinedItemsList(
      (dataStore.filteredItems || []) as Item[],
      [],
      [],
      [],
      'name',
      itemSearch.value.trim()
    ).slice(0, 24);
  });

  const stackedInventory = computed(() => stackInventoryItems(props.character.inventory));

  function fitName() {
    const el = nameEl.value;
    if (!el) return;
    el.style.fontSize = '';
    while (el.scrollWidth > el.offsetWidth && parseFloat(getComputedStyle(el).fontSize) > 10) {
      el.style.fontSize = parseFloat(getComputedStyle(el).fontSize) - 1 + 'px';
    }
  }

  function emptyLanguageAbility(): LanguageAbility {
    return { speak: false, read: false, write: false };
  }

  function createEmptyLanguages(): Languages {
    return {
      common: emptyLanguageAbility(),
      elvish: emptyLanguageAbility(),
      dwarvish: emptyLanguageAbility(),
      giant: emptyLanguageAbility(),
      gnomish: emptyLanguageAbility(),
      goblin: emptyLanguageAbility(),
      halfling: emptyLanguageAbility(),
      orc: emptyLanguageAbility(),
      abyssal: emptyLanguageAbility(),
      celestial: emptyLanguageAbility(),
      draconic: emptyLanguageAbility(),
      deepSpeech: emptyLanguageAbility(),
      infernal: emptyLanguageAbility(),
      primordial: emptyLanguageAbility(),
      sylvan: emptyLanguageAbility(),
      undercommon: emptyLanguageAbility(),
      thievesCant: emptyLanguageAbility(),
    };
  }

  function buildLanguageForm(languages: playerCharacter['languages']): Languages {
    const next = createEmptyLanguages();
    const source = (languages ?? {}) as Record<string, Partial<LanguageAbility>>;
    Object.entries(source).forEach(([name, ability]) => {
      next[name] = {
        speak: !!ability?.speak,
        read: !!ability?.read,
        write: !!ability?.write,
      };
    });
    return next;
  }

  function formatLanguageName(name: string): string {
    const special: Record<string, string> = {
      deepSpeech: 'Deep Speech',
      thievesCant: "Thieves' Cant",
    };
    if (special[name]) return special[name];
    return name.charAt(0).toUpperCase() + name.slice(1).replace(/([A-Z])/g, ' $1');
  }

  function featKey(feat: Feat): string {
    return `${feat.name}::${feat.source || ''}`;
  }

  function itemKey(item: Item): string {
    return `${item.name}::${item.source || ''}::${item.displayName || ''}`;
  }

  function getItemDisplayName(item: Item): string {
    return getInventoryItemDisplayName(item);
  }

  function getStackedItemDisplayName(item: Item, quantity: number): string {
    if (quantity <= 1) return getItemDisplayName(item);
    return `${quantity} x ${getItemDisplayName(item)}`;
  }

  function getItemMeta(item: Item): string {
    return item.source || 'Unknown source';
  }

  function getItemBadges(item: Item): string[] {
    return getInventoryItemBadges(item);
  }

  function getItemFacts(item: Item): string {
    return getInventoryItemFacts(item).join(' • ');
  }

  function openEditPopout() {
    showEditPopout.value = true;
    setPanel('menu');
  }

  function closeEditPopout() {
    showEditPopout.value = false;
    activePanel.value = 'menu';
    actionMessage.value = '';
    featSearch.value = '';
    itemSearch.value = '';
    shortRestHealing.value = 0;
  }

  function setPanel(panel: CharacterEditPanel) {
    activePanel.value = panel;
    actionMessage.value = '';
    if (panel === 'name') {
      nameDraft.value = props.character.name;
    }
    if (panel === 'languages') {
      languageForm.value = buildLanguageForm(props.character.languages);
    }
  }

  async function openFeatPanel() {
    setPanel('feats');
    if (dataStore.loaded) return;
    isLoadingFeats.value = true;
    try {
      await dataStore.init();
    } catch (error) {
      actionMessage.value = 'Failed to load feat data.';
    } finally {
      isLoadingFeats.value = false;
    }
  }

  async function openItemsPanel() {
    setPanel('items');
    if (dataStore.loaded) return;
    isLoadingItems.value = true;
    try {
      await dataStore.init();
    } catch (error) {
      actionMessage.value = 'Failed to load item data.';
    } finally {
      isLoadingItems.value = false;
    }
  }

  async function saveName() {
    const trimmedName = nameDraft.value.trim();
    if (!trimmedName) {
      actionMessage.value = 'Name cannot be empty.';
      return;
    }
    await charStore.editCharacterName(props.character.id, trimmedName);
    actionMessage.value = 'Character name updated.';
    setPanel('menu');
  }

  async function applyShortRest() {
    await charStore.takeShortRest(props.character.id, shortRestHealing.value);
    shortRestHealing.value = 0;
    actionMessage.value = 'Short rest applied.';
  }

  async function applyLongRest() {
    await charStore.takeLongRest(props.character.id);
    shortRestHealing.value = 0;
    actionMessage.value = 'Long rest applied.';
  }

  async function addFeat(feat: Feat) {
    await charStore.addCharacterFeat(props.character.id, feat);
    actionMessage.value = `${feat.name} added.`;
  }

  async function removeFeat(feat: Feat) {
    await charStore.removeCharacterFeat(props.character.id, feat.name, feat.source);
    actionMessage.value = `${feat.name} removed.`;
  }

  async function addItem(item: Item) {
    await charStore.addCharacterItem(props.character.id, item);
    actionMessage.value = `${getItemDisplayName(item)} added.`;
  }

  async function removeItem(index: number) {
    const item = props.character.inventory[index];
    if (!item) return;
    await charStore.removeCharacterItemAt(props.character.id, index);
    actionMessage.value = `${getItemDisplayName(item)} removed.`;
  }

  async function toggleEquipped(index: number) {
    const item = props.character.inventory[index];
    if (!item) return;
    await charStore.toggleCharacterItemEquipped(props.character.id, index);
    actionMessage.value = `${getItemDisplayName(item)} ${
      item.equipped ? 'unequipped' : 'equipped'
    }.`;
  }

  async function toggleAttuned(index: number) {
    const item = props.character.inventory[index];
    if (!item || !itemRequiresAttunement(item)) return;
    await charStore.toggleCharacterItemAttuned(props.character.id, index);
    actionMessage.value = `${getItemDisplayName(item)} ${item.attuned ? 'unattuned' : 'attuned'}.`;
  }

  async function saveLanguages() {
    await charStore.updateCharacterLanguagesById(props.character.id, languageForm.value);
    actionMessage.value = 'Languages updated.';
    setPanel('menu');
  }

  onMounted(() => nextTick(fitName));
  watch(
    () => props.character.name,
    newName => {
      if (activePanel.value !== 'name') {
        nameDraft.value = newName;
      }
      nextTick(fitName);
    }
  );
  watch(
    () => props.character.languages,
    languages => {
      if (activePanel.value === 'languages') {
        languageForm.value = buildLanguageForm(languages);
      }
    },
    { deep: true }
  );
</script>

<style scoped>
  .name-wrapper {
    overflow: hidden;
    padding: 0.5rem 1rem 0.25rem;
  }

  .name-header {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .charName {
    margin: 0;
    font-size: 1.9rem;
    font-weight: 700;
    white-space: nowrap;
    overflow: hidden;
    letter-spacing: 0.03em;
    text-transform: capitalize;
    color: var(--color-primary);
    text-shadow: 0 1px 0 rgba(201, 164, 75, 0.4);
    border-bottom: 2px solid var(--color-accent);
    padding-bottom: 0.2rem;
    flex: 1;
  }

  .char-summary {
    margin: 0.45rem 0 0;
  }

  .edit-trigger {
    border: 1px solid rgba(107, 46, 46, 0.16);
    background: var(--color-surface);
    border-radius: 999px;
    width: 2.25rem;
    height: 2.25rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: var(--color-card-shadow);
    flex: 0 0 auto;
  }

  .edit-icon {
    width: 1rem;
    height: 1rem;
  }

  .edit-popout {
    display: flex;
    flex-direction: column;
    gap: 0.9rem;
    min-width: min(78vw, 34rem);
  }

  .action-message {
    margin: 0;
    padding: 0.7rem 0.8rem;
    border-radius: 10px;
    background: rgba(201, 164, 75, 0.16);
    color: var(--color-primary);
    font-size: 0.9rem;
    font-weight: 600;
  }

  .action-grid {
    display: grid;
    gap: 0.75rem;
    grid-template-columns: repeat(auto-fit, minmax(13rem, 1fr));
  }

  .action-card {
    text-align: left;
    padding: 0.9rem;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    background: linear-gradient(180deg, rgba(201, 164, 75, 0.12), rgba(255, 255, 255, 0.3));
    border-color: rgba(107, 46, 46, 0.12);
  }

  .action-card--muted {
    background: linear-gradient(180deg, rgba(122, 107, 87, 0.12), rgba(255, 255, 255, 0.3));
  }

  .action-card-title,
  .selected-title,
  .language-name {
    font-size: 0.95rem;
    font-weight: 700;
    color: var(--color-text);
  }

  .action-card-copy,
  .selected-copy,
  .panel-copy {
    margin: 0;
    font-size: 0.83rem;
    color: var(--color-muted);
  }

  .panel-copy--compact {
    font-weight: 600;
  }

  .edit-form {
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
  }

  .edit-form--wide {
    min-width: min(82vw, 40rem);
  }

  .action-row {
    display: flex;
    gap: 0.6rem;
    flex-wrap: wrap;
  }

  .action-row--spread {
    align-items: center;
    justify-content: space-between;
  }

  .inline-actions {
    display: flex;
    gap: 0.6rem;
    flex-wrap: wrap;
  }

  .items-panel-layout {
    display: grid;
    gap: 0.85rem;
  }

  .items-panel-card {
    display: grid;
    gap: 0.8rem;
    padding: 0.85rem;
    border-radius: 14px;
    background: rgba(255, 255, 255, 0.46);
    border: 1px solid rgba(107, 46, 46, 0.08);
  }

  .items-panel-card__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .items-panel-card__header--stacked {
    align-items: stretch;
  }

  .items-panel-accordion {
    border-radius: 14px;
  }

  .items-panel-kicker,
  .items-panel-count {
    margin: 0;
    font-size: 0.76rem;
    color: var(--color-muted);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .items-panel-title {
    margin: 0.1rem 0 0;
    font-size: 1.02rem;
    color: var(--color-text);
  }

  .selected-list,
  .available-list {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }

  .selected-row {
    display: flex;
    gap: 0.8rem;
    align-items: flex-start;
    padding: 0.7rem 0.8rem;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.5);
    border: 1px solid rgba(107, 46, 46, 0.08);
    flex-direction: column;
  }

  .selected-row--item {
    justify-content: space-between;
  }

  .selected-title,
  .selected-copy {
    margin: 0;
  }

  .selected-copy-block {
    display: grid;
    gap: 0.35rem;
    width: 100%;
  }

  .selected-title-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .stack-badge {
    padding: 0.12rem 0.45rem;
    border-radius: 999px;
    background: rgba(107, 46, 46, 0.08);
    border: 1px solid rgba(107, 46, 46, 0.12);
    color: var(--color-primary);
    font-size: 0.78rem;
    font-weight: 700;
  }

  .inline-actions--inventory {
    gap: 0.45rem;
  }

  .item-badge-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
  }

  .item-badge-row--compact {
    gap: 0.3rem;
  }

  .item-badge {
    padding: 0.14rem 0.48rem;
    border-radius: 999px;
    background: rgba(107, 46, 46, 0.08);
    border: 1px solid rgba(107, 46, 46, 0.1);
    color: var(--color-primary);
    font-size: 0.75rem;
    font-weight: 700;
  }

  .btn-inline-toggle {
    min-width: 0;
  }

  .btn-inline-toggle--active {
    background: rgba(201, 164, 75, 0.18);
    border-color: rgba(201, 164, 75, 0.45);
    color: var(--color-primary);
  }

  .item-remove-btn,
  .item-add-btn {
    width: 100%;
    justify-content: center;
  }

  .items-results-grid {
    display: grid;
    gap: 0.7rem;
  }

  .item-result-card {
    display: grid;
    gap: 0.7rem;
    padding: 0.8rem;
    border-radius: 12px;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.62), rgba(201, 164, 75, 0.08));
    border: 1px solid rgba(107, 46, 46, 0.08);
  }

  .item-result-card__copy {
    display: grid;
    gap: 0.4rem;
  }

  .language-table {
    display: flex;
    flex-direction: column;
    border: 1px solid rgba(107, 46, 46, 0.12);
    border-radius: 12px;
    overflow: hidden;
  }

  .language-table-header,
  .language-row {
    display: grid;
    grid-template-columns: minmax(0, 1.7fr) repeat(3, 0.8fr);
    align-items: center;
    gap: 0.5rem;
    padding: 0.7rem 0.8rem;
  }

  .language-table-header {
    background: rgba(107, 46, 46, 0.08);
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-primary);
  }

  .language-row {
    border-top: 1px solid rgba(107, 46, 46, 0.08);
  }

  @media (max-width: 640px) {
    .edit-popout,
    .edit-form--wide {
      min-width: 0;
    }

    .language-table-header,
    .language-row {
      grid-template-columns: minmax(0, 1.4fr) repeat(3, 0.7fr);
      font-size: 0.8rem;
    }
  }

  @media (min-width: 720px) {
    .items-panel-layout {
      grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr);
      align-items: start;
    }

    .selected-row {
      flex-direction: row;
      align-items: center;
    }

    .item-remove-btn {
      width: auto;
    }

    .item-result-card {
      grid-template-columns: minmax(0, 1fr) auto;
      align-items: center;
    }

    .item-add-btn {
      width: auto;
      min-width: 7rem;
    }
  }
</style>
