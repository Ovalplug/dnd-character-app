<template>
  <Loading v-if="!loaded" message="Loading backpack..." :size="96" variant="bold" />

  <div v-else-if="backpack" class="backpack-view">
    <h1>{{ backpack.name }}</h1>

    <div class="backpack-details">
      <div class="detail-card">
        <h3>Items ({{ backpack.items.length }})</h3>
        <div v-if="backpack.items.length === 0" class="empty-message">
          No items in this backpack yet. Add some from the resources.
        </div>
        <ul v-else class="item-list">
          <li v-for="item in backpack.items" :key="`${item.name}-${item.source}`" class="item-row">
            <div class="item-info" @click="selectedItemForPopout = item">
              <div class="item-name">{{ item.name }}</div>
              <div class="item-details">
                <span class="item-source">{{ item.source }}</span>
                <span v-if="item.value" class="item-value">{{ item.value }} gp</span>
                <span v-if="item.weight" class="item-weight">{{ item.weight }} lb</span>
                <span v-if="item.quantity > 1" class="item-quantity">x{{ item.quantity }}</span>
              </div>
            </div>
            <div class="item-controls">
              <button
                class="item-btn equipped-btn"
                :class="{ active: item.equipped }"
                @click="toggleEquipped(item)"
                :title="item.equipped ? 'Unequip' : 'Equip'"
              >
                E
              </button>
              <button
                v-if="item.reqAttune"
                class="item-btn attuned-btn"
                :class="{ active: item.attuned }"
                @click="toggleAttuned(item)"
                :title="item.attuned ? 'Unatune' : 'Attune'"
              >
                A
              </button>
              <button
                class="item-btn remove-btn"
                @click="removeItem(item)"
                title="Remove from backpack"
              >
                −
              </button>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </div>

  <div v-else class="backpack-error">
    <p>Backpack not found.</p>
  </div>

  <PopOut v-if="selectedItemForPopout" @close="selectedItemForPopout = null">
    <div class="item-detail">
      <h2>{{ selectedItemForPopout.name }}</h2>
      <p><strong>Source:</strong> {{ selectedItemForPopout.source }}</p>
      <p v-if="selectedItemForPopout.rarity">
        <strong>Rarity:</strong> {{ selectedItemForPopout.rarity }}
      </p>
      <p v-if="selectedItemForPopout.value">
        <strong>Value:</strong> {{ selectedItemForPopout.value }} gp
      </p>
      <p v-if="selectedItemForPopout.weight">
        <strong>Weight:</strong> {{ selectedItemForPopout.weight }} lb
      </p>
      <p v-if="selectedItemForPopout.type">
        <strong>Type:</strong> {{ selectedItemForPopout.type }}
      </p>
      <div v-if="selectedItemForPopout.entries" class="item-entries">
        <p v-for="(entry, idx) in selectedItemForPopout.entries" :key="idx">
          {{ typeof entry === 'string' ? entry : JSON.stringify(entry) }}
        </p>
      </div>
    </div>
  </PopOut>
</template>

<script lang="ts" setup>
  import { ref, onMounted, type Ref } from 'vue';
  import { useRoute } from 'vue-router';
  import { useItemStore } from '../../stores/itemStore';
  import type { Backpack, Item } from '../../types';
  import Loading from '../resources/Loading.vue';
  import PopOut from '../PopOut.vue';

  const route = useRoute();
  const itemStore = useItemStore();
  const backpack: Ref<Backpack | undefined> = ref(undefined);
  const loaded = ref(false);
  const selectedItemForPopout: Ref<Item | null> = ref(null);

  onMounted(async () => {
    const id = route.params.id as string;
    if (id) {
      try {
        backpack.value = await itemStore.getBackpackById(id);
      } catch (error) {
        console.error('Error loading backpack:', error);
      }
    }
    loaded.value = true;
  });

  function toggleEquipped(item: Item) {
    if (!backpack.value) return;
    item.equipped = !item.equipped;
    saveBackpack();
  }

  function toggleAttuned(item: Item) {
    if (!backpack.value) return;
    item.attuned = !item.attuned;
    saveBackpack();
  }

  function removeItem(item: Item) {
    if (!backpack.value) return;
    backpack.value.items = backpack.value.items.filter(
      i => !(i.name === item.name && i.source === item.source)
    );
    saveBackpack();
  }

  async function saveBackpack() {
    if (!backpack.value) return;
    try {
      await itemStore.updateBackpack(backpack.value);
    } catch (error) {
      console.error('Error saving backpack:', error);
    }
  }
</script>

<style scoped>
  .backpack-view {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    padding-bottom: 2rem;
  }

  h1 {
    margin: 0;
    color: var(--color-primary);
  }

  .backpack-details {
    display: grid;
    gap: 1.5rem;
  }

  .detail-card {
    padding: 1rem;
    border-radius: var(--radius);
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.01), transparent);
    border: 1px solid rgba(107, 46, 46, 0.12);
    box-shadow: var(--color-card-shadow);
  }

  .detail-card h3 {
    margin-top: 0;
    color: var(--color-primary);
  }

  .empty-message {
    padding: 1rem;
    text-align: center;
    color: var(--color-muted);
    font-style: italic;
  }

  .item-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }

  .item-row {
    padding: 0.8rem;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(107, 46, 46, 0.08);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.8rem;
  }

  .item-info {
    flex: 1;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .item-info:hover {
    color: var(--color-accent);
  }

  .item-name {
    font-weight: 600;
    color: var(--color-text);
    margin-bottom: 0.3rem;
  }

  .item-details {
    display: flex;
    gap: 0.8rem;
    flex-wrap: wrap;
    font-size: 0.8rem;
    color: var(--color-muted);
  }

  .item-source {
    font-weight: 500;
  }

  .item-value,
  .item-weight,
  .item-quantity {
    opacity: 0.8;
  }

  .item-controls {
    display: flex;
    gap: 0.4rem;
    flex-shrink: 0;
  }

  .item-btn {
    padding: 0.4rem 0.6rem;
    border: 1px solid rgba(107, 46, 46, 0.2);
    border-radius: 4px;
    background: rgba(255, 255, 255, 0.02);
    color: var(--color-primary);
    font-weight: 700;
    font-size: 0.75rem;
    cursor: pointer;
    transition: all 0.15s ease;
    min-width: 2rem;
  }

  .item-btn:hover {
    background: rgba(107, 46, 46, 0.08);
    border-color: var(--color-primary);
  }

  .item-btn.active {
    background: var(--color-accent);
    border-color: var(--color-accent);
    color: var(--color-bg);
  }

  .equipped-btn.active {
    background: rgba(107, 139, 107, 0.6);
    border-color: rgba(107, 139, 107, 0.8);
    color: white;
  }

  .attuned-btn.active {
    background: rgba(201, 164, 75, 0.6);
    border-color: rgba(201, 164, 75, 0.8);
    color: var(--color-bg);
  }

  .remove-btn {
    background: rgba(183, 59, 59, 0.08);
    border-color: rgba(183, 59, 59, 0.2);
    color: var(--color-danger);
  }

  .remove-btn:hover {
    background: rgba(183, 59, 59, 0.16);
    border-color: var(--color-danger);
  }

  .item-detail {
    padding: 1rem 0;
  }

  .item-detail h2 {
    margin: 0 0 1rem 0;
    color: var(--color-primary);
  }

  .item-detail p {
    margin: 0.5rem 0;
    color: var(--color-text);
  }

  .item-detail strong {
    color: var(--color-primary);
  }

  .item-entries {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid rgba(107, 46, 46, 0.1);
    color: var(--color-text);
    font-size: 0.9rem;
  }

  .backpack-error {
    padding: 2rem;
    text-align: center;
    border-radius: var(--radius);
    background: rgba(183, 59, 59, 0.08);
    border: 1px dashed rgba(183, 59, 59, 0.2);
    color: var(--color-danger);
  }
</style>
