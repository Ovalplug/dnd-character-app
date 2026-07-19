<template>
  <Loading v-if="!loaded" message="Loading items..." :size="96" variant="bold" />

  <div v-else class="items-view">
    <div class="header">
      <h1>Custom Items</h1>
      <button @click="navigateToCreate" class="create-button">+ Create New Item</button>
    </div>

    <div v-if="customItems.length === 0" class="empty-state">
      <p>No custom items yet. Create one to get started!</p>
      <button @click="navigateToCreate" class="creation-primary-button">Create First Item</button>
    </div>

    <div v-else class="items-container">
      <div class="items-grid">
        <div v-for="item in customItems" :key="item.id" class="item-card">
          <div class="item-header">
            <div class="item-title">
              <h3>{{ item.displayName || item.name }}</h3>
              <span class="item-source">{{ item.source }}</span>
            </div>
            <div
              v-if="item.rarity"
              class="item-rarity"
              :class="`rarity-${item.rarity.toLowerCase()}`"
            >
              {{ item.rarity }}
            </div>
          </div>

          <div class="item-details">
            <div v-if="item.type" class="detail-row">
              <span class="label">Type:</span>
              <span class="value">{{ item.type }}</span>
            </div>
            <div v-if="item.value" class="detail-row">
              <span class="label">Value:</span>
              <span class="value">{{ item.value }} gp</span>
            </div>
            <div v-if="item.weight" class="detail-row">
              <span class="label">Weight:</span>
              <span class="value">{{ item.weight }} lb</span>
            </div>
            <div v-if="item.armor" class="detail-row">
              <span class="label">AC:</span>
              <span class="value">{{ item.ac }}</span>
            </div>
            <div v-if="item.weapon" class="detail-row">
              <span class="label">Damage:</span>
              <span class="value">{{ item.dmg1 }} {{ item.dmgType }}</span>
            </div>
            <div v-if="item.reqAttune" class="detail-row">
              <span class="label">Attunement:</span>
              <span class="value">Required</span>
            </div>
            <div v-if="item.charges !== undefined" class="detail-row">
              <span class="label">Charges:</span>
              <span class="value">{{ item.charges }}</span>
            </div>
          </div>

          <div class="item-description">
            <p v-if="item.entries && item.entries.length > 0">
              {{ item.entries[0] }}
            </p>
            <p v-else class="no-description">No description provided</p>
          </div>

          <div class="item-actions">
            <button class="action-btn view-btn" @click="viewItem(item)" title="View Details">
              View
            </button>
            <button class="action-btn edit-btn" @click="editItem(item)" title="Edit">Edit</button>
            <button class="action-btn export-btn" @click="exportItem(item)" title="Export as JSON">
              Export
            </button>
            <button class="action-btn delete-btn" @click="confirmDelete(item)" title="Delete">
              Delete
            </button>
          </div>
        </div>
      </div>

      <div class="bulk-actions">
        <button @click="exportAll" class="creation-primary-button">Export All as JSON</button>
      </div>
    </div>
  </div>

  <!-- View Details Modal -->
  <PopOut v-if="selectedItem && !isEditing" @close="selectedItem = null">
    <div class="item-detail">
      <h2>{{ selectedItem.displayName || selectedItem.name }}</h2>
      <div class="detail-section">
        <p><strong>Source:</strong> {{ selectedItem.source }}</p>
        <p v-if="selectedItem.page"><strong>Page:</strong> {{ selectedItem.page }}</p>
        <p v-if="selectedItem.rarity"><strong>Rarity:</strong> {{ selectedItem.rarity }}</p>
        <p v-if="selectedItem.type"><strong>Type:</strong> {{ selectedItem.type }}</p>
        <p v-if="selectedItem.value"><strong>Value:</strong> {{ selectedItem.value }} gp</p>
        <p v-if="selectedItem.weight"><strong>Weight:</strong> {{ selectedItem.weight }} lb</p>
        <p v-if="selectedItem.armor"><strong>AC:</strong> {{ selectedItem.ac }}</p>
        <p v-if="selectedItem.weapon">
          <strong>Damage:</strong> {{ selectedItem.dmg1 }} {{ selectedItem.dmgType }}
        </p>
        <p v-if="selectedItem.reqAttune"><strong>Attunement:</strong> Required</p>
        <p v-if="selectedItem.charges !== undefined">
          <strong>Charges:</strong> {{ selectedItem.charges }}
        </p>
        <p v-if="selectedItem.recharge"><strong>Recharge:</strong> {{ selectedItem.recharge }}</p>
      </div>
      <div v-if="selectedItem.entries && selectedItem.entries.length > 0" class="detail-section">
        <h4>Description</h4>
        <p v-for="(entry, idx) in selectedItem.entries" :key="idx">
          {{ typeof entry === 'string' ? entry : JSON.stringify(entry) }}
        </p>
      </div>
    </div>
  </PopOut>

  <!-- Delete Confirmation Modal -->
  <PopOut v-if="itemToDelete" @close="itemToDelete = null">
    <div class="confirmation">
      <h3>Delete Item?</h3>
      <p>
        Are you sure you want to delete <strong>{{ itemToDelete.name }}</strong
        >? This cannot be undone.
      </p>
      <div class="confirmation-actions">
        <button @click="deleteItem(itemToDelete)" class="danger-button">Delete</button>
        <button @click="itemToDelete = null" class="cancel-button">Cancel</button>
      </div>
    </div>
  </PopOut>
</template>

<script setup lang="ts">
  import { ref, onMounted } from 'vue';
  import { useItemStore } from '../../stores/itemStore';
  import { useRouter } from 'vue-router';
  import type { CustomItem } from '../../types';
  import Loading from '../resources/Loading.vue';
  import PopOut from '../PopOut.vue';

  const router = useRouter();
  const itemStore = useItemStore();
  const customItems = ref<CustomItem[]>([]);
  const loaded = ref(false);
  const selectedItem = ref<CustomItem | null>(null);
  const itemToDelete = ref<CustomItem | null>(null);
  const isEditing = ref(false);

  onMounted(async () => {
    try {
      await itemStore.loadCustomItems();
      customItems.value = itemStore.customItems;
    } catch (error) {
      console.error('Error loading items:', error);
    }
    loaded.value = true;
  });

  function navigateToCreate() {
    router.push('/create/item');
  }

  function viewItem(item: CustomItem) {
    selectedItem.value = item;
  }

  function editItem(item: CustomItem) {
    router.push(`/items/${item.id}/edit`);
  }

  function confirmDelete(item: CustomItem) {
    itemToDelete.value = item;
  }

  async function deleteItem(item: CustomItem) {
    try {
      await itemStore.deleteCustomItem(item.id);
      customItems.value = itemStore.customItems;
      itemToDelete.value = null;
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  }

  function exportItem(item: CustomItem) {
    const dataStr = JSON.stringify(item, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${item.name.replace(/\s+/g, '-').toLowerCase()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function exportAll() {
    const dataStr = JSON.stringify(customItems.value, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `custom-items-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
</script>

<style scoped>
  .items-view {
    display: flex;
    flex-direction: column;
    gap: 2rem;
    padding: 2rem;
    padding-bottom: 4rem;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .header h1 {
    margin: 0;
  }

  .create-button {
    padding: 0.8rem 1.5rem;
    background: var(--color-primary);
    color: white;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .create-button:hover {
    background: #8b3e3e;
  }

  .empty-state {
    text-align: center;
    padding: 3rem 2rem;
    border-radius: 8px;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.01), transparent);
    border: 1px solid rgba(107, 46, 46, 0.12);
  }

  .empty-state p {
    color: var(--color-muted);
    margin-bottom: 1.5rem;
  }

  .items-container {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .items-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 1.5rem;
  }

  .item-card {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1.5rem;
    border-radius: 8px;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.02), rgba(255, 255, 255, 0.01));
    border: 1px solid rgba(107, 46, 46, 0.12);
    transition: all 0.15s ease;
  }

  .item-card:hover {
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.02));
    border-color: rgba(107, 46, 46, 0.2);
  }

  .item-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
  }

  .item-title h3 {
    margin: 0;
    color: var(--color-primary);
  }

  .item-source {
    font-size: 0.85rem;
    color: var(--color-muted);
  }

  .item-rarity {
    padding: 0.3rem 0.8rem;
    border-radius: 4px;
    font-size: 0.85rem;
    font-weight: 600;
    white-space: nowrap;
  }

  .rarity-common {
    background: rgba(100, 100, 100, 0.2);
    color: #999;
  }

  .rarity-uncommon {
    background: rgba(107, 139, 107, 0.2);
    color: #6b8b6b;
  }

  .rarity-rare {
    background: rgba(100, 150, 200, 0.2);
    color: #6496c8;
  }

  .rarity-very\ rare {
    background: rgba(150, 100, 200, 0.2);
    color: #9664c8;
  }

  .rarity-legendary {
    background: rgba(200, 150, 50, 0.2);
    color: #c89632;
  }

  .rarity-artifact {
    background: rgba(200, 50, 50, 0.2);
    color: #c83232;
  }

  .item-details {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .detail-row {
    display: flex;
    gap: 0.5rem;
    font-size: 0.9rem;
  }

  .detail-row .label {
    font-weight: 600;
    color: var(--color-primary);
    min-width: 80px;
  }

  .detail-row .value {
    color: var(--color-text);
  }

  .item-description {
    padding: 0.8rem;
    border-radius: 4px;
    background: rgba(255, 255, 255, 0.01);
    border: 1px solid rgba(107, 46, 46, 0.08);
    font-size: 0.9rem;
    line-height: 1.4;
  }

  .item-description p {
    margin: 0;
  }

  .no-description {
    color: var(--color-muted);
    font-style: italic;
  }

  .item-actions {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.5rem;
  }

  .action-btn {
    padding: 0.6rem;
    border: 1px solid rgba(107, 46, 46, 0.2);
    border-radius: 6px;
    background: transparent;
    color: var(--color-primary);
    font-weight: 600;
    font-size: 0.85rem;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .action-btn:hover {
    background: rgba(107, 46, 46, 0.08);
    border-color: var(--color-primary);
  }

  .delete-btn:hover {
    background: rgba(183, 59, 59, 0.1);
    border-color: var(--color-danger);
    color: var(--color-danger);
  }

  .bulk-actions {
    display: flex;
    justify-content: center;
    gap: 1rem;
  }

  .creation-primary-button {
    padding: 0.8rem 1.5rem;
    border: none;
    border-radius: 8px;
    background: var(--color-primary);
    color: white;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .creation-primary-button:hover {
    background: #8b3e3e;
  }

  .item-detail {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .item-detail h2 {
    margin: 0;
    color: var(--color-primary);
  }

  .item-detail h4 {
    margin: 0 0 0.5rem 0;
    color: var(--color-primary);
  }

  .detail-section {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .detail-section p {
    margin: 0;
    line-height: 1.6;
  }

  .confirmation {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    text-align: center;
  }

  .confirmation h3 {
    margin: 0;
    color: var(--color-danger);
  }

  .confirmation-actions {
    display: flex;
    gap: 1rem;
    justify-content: center;
  }

  .danger-button {
    padding: 0.8rem 1.5rem;
    background: var(--color-danger);
    color: white;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .danger-button:hover {
    opacity: 0.9;
  }

  .cancel-button {
    padding: 0.8rem 1.5rem;
    background: transparent;
    color: var(--color-primary);
    border: 1px solid rgba(107, 46, 46, 0.2);
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .cancel-button:hover {
    background: rgba(107, 46, 46, 0.08);
  }
</style>
