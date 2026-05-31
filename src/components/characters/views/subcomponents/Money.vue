<template>
  <section class="money-card">
    <button class="money-header" type="button" @click="isOpen = !isOpen">
      <div class="money-header__copy">
        <p class="money-kicker">Currency</p>
        <h3>Main wallet</h3>
      </div>
      <div class="money-header__meta">
        <div class="money-summary">
          <button
            v-for="coin in DISPLAY_COINS"
            :key="coin.key"
            class="money-pill money-pill--interactive"
            type="button"
            @click.stop="beginInlineEdit('main', coin.key, props.money[coin.key])"
          >
            {{ coin.label }} {{ props.money[coin.key] }}
          </button>
        </div>
        <span class="money-chevron" :class="{ 'money-chevron--open': isOpen }">⌄</span>
      </div>
    </button>

    <div v-if="isOpen" class="money-body">
      <div class="money-section-header">
        <div>
          <p class="money-section-title">Wallets</p>
          <p class="money-section-copy">
            Track your main funds and any extra pouches or party banks.
          </p>
        </div>
        <button class="money-edit-button" type="button" @click="openEditor">Edit</button>
      </div>

      <div class="wallet-list">
        <article class="wallet-card wallet-card--main">
          <div class="wallet-card__header">
            <h4>Main wallet</h4>
            <span class="wallet-badge">Primary</span>
          </div>
          <div class="wallet-grid">
            <button
              v-for="coin in DISPLAY_COINS"
              :key="coin.key"
              class="wallet-coin wallet-coin--interactive"
              type="button"
              @click="beginInlineEdit('main', coin.key, props.money[coin.key])"
            >
              <template v-if="isInlineEditing('main', coin.key)">
                <span>{{ coin.label }}</span>
                <input
                  ref="inlineEditInput"
                  v-model="inlineEditValue"
                  class="wallet-coin-input"
                  inputmode="numeric"
                  min="0"
                  type="number"
                  @blur="saveInlineEdit"
                  @click.stop
                  @keydown.enter.prevent="saveInlineEdit"
                  @keydown.esc.prevent="cancelInlineEdit"
                />
              </template>
              <template v-else>
                <span>{{ coin.label }}</span>
                <strong>{{ props.money[coin.key] }}</strong>
              </template>
            </button>
          </div>
        </article>

        <article v-for="wallet in normalizedWallets" :key="wallet.id" class="wallet-card">
          <div class="wallet-card__header">
            <h4>{{ wallet.name }}</h4>
            <span class="wallet-badge wallet-badge--sub">Extra</span>
          </div>
          <div class="wallet-grid">
            <button
              v-for="coin in DISPLAY_COINS"
              :key="coin.key"
              class="wallet-coin wallet-coin--interactive"
              type="button"
              @click="beginInlineEdit(wallet.id, coin.key, wallet.currency[coin.key])"
            >
              <template v-if="isInlineEditing(wallet.id, coin.key)">
                <span>{{ coin.label }}</span>
                <input
                  ref="inlineEditInput"
                  v-model="inlineEditValue"
                  class="wallet-coin-input"
                  inputmode="numeric"
                  min="0"
                  type="number"
                  @blur="saveInlineEdit"
                  @click.stop
                  @keydown.enter.prevent="saveInlineEdit"
                  @keydown.esc.prevent="cancelInlineEdit"
                />
              </template>
              <template v-else>
                <span>{{ coin.label }}</span>
                <strong>{{ wallet.currency[coin.key] }}</strong>
              </template>
            </button>
          </div>
        </article>

        <p v-if="normalizedWallets.length === 0" class="wallet-empty">No extra wallets yet.</p>
      </div>
    </div>

    <PopOut v-if="isEditing" title="Edit money" mini @close="closeEditor">
      <div class="editor-shell">
        <section class="editor-section">
          <div class="editor-heading">
            <h4>Main wallet</h4>
            <p>Adjust the coins currently carried by the character.</p>
          </div>
          <div class="editor-grid">
            <label v-for="coin in EDITOR_COINS" :key="coin.key" class="editor-field">
              <span>{{ coin.label }}</span>
              <input
                :value="editState.main[coin.key]"
                inputmode="numeric"
                min="0"
                type="number"
                @input="updateCoinValue(editState.main, coin.key, $event)"
              />
            </label>
          </div>
        </section>

        <section class="editor-section">
          <div class="editor-heading editor-heading--split">
            <div>
              <h4>Additional wallets</h4>
              <p>Add side pouches, shared funds, or stash bags.</p>
            </div>
            <button
              class="money-edit-button money-edit-button--soft"
              type="button"
              @click="addWallet"
            >
              Add wallet
            </button>
          </div>

          <div v-if="editState.wallets.length === 0" class="wallet-empty wallet-empty--editor">
            No additional wallets yet.
          </div>

          <div v-for="wallet in editState.wallets" :key="wallet.id" class="editor-wallet-card">
            <div class="editor-wallet-top">
              <label class="editor-field editor-field--name">
                <span>Name</span>
                <input
                  :value="wallet.name"
                  type="text"
                  @input="updateWalletName(wallet.id, $event)"
                />
              </label>
              <button class="remove-wallet-button" type="button" @click="removeWallet(wallet.id)">
                Remove
              </button>
            </div>

            <div class="editor-grid">
              <label
                v-for="coin in EDITOR_COINS"
                :key="`${wallet.id}-${String(coin.key)}`"
                class="editor-field"
              >
                <span>{{ coin.label }}</span>
                <input
                  :value="wallet.currency[coin.key]"
                  inputmode="numeric"
                  min="0"
                  type="number"
                  @input="updateWalletCoinValue(wallet.id, coin.key, $event)"
                />
              </label>
            </div>
          </div>
        </section>

        <div class="editor-actions">
          <button
            class="money-edit-button money-edit-button--soft"
            type="button"
            @click="closeEditor"
          >
            Cancel
          </button>
          <button class="save-money-button" type="button" @click="saveMoney">Save</button>
        </div>
      </div>
    </PopOut>
  </section>
</template>

<script lang="ts" setup>
  import { computed, nextTick, reactive, ref } from 'vue';
  import PopOut from '../../../PopOut.vue';
  import { useCharacterStore } from '../../../../stores/characterStore';
  import type { Currency, CurrencyWallet } from '../../../../types';

  type CoinKey = 'pp' | 'gp' | 'sp' | 'cp';

  const DISPLAY_COINS: Array<{ key: 'pp' | 'gp' | 'sp' | 'cp'; label: string }> = [
    { key: 'pp', label: 'PP' },
    { key: 'gp', label: 'GP' },
    { key: 'sp', label: 'SP' },
    { key: 'cp', label: 'CP' },
  ];

  const EDITOR_COINS: Array<{ key: CoinKey; label: string }> = [
    { key: 'pp', label: 'Platinum' },
    { key: 'gp', label: 'Gold' },
    { key: 'sp', label: 'Silver' },
    { key: 'cp', label: 'Copper' },
  ];

  const props = defineProps<{
    characterId?: string;
    money: Currency;
    additionalMoney?: CurrencyWallet[] | Currency;
  }>();

  type InlineEditTarget = {
    walletId: string;
    coinKey: CoinKey;
  };

  const store = useCharacterStore();
  const isOpen = ref(false);
  const isEditing = ref(false);
  const inlineEditInput = ref<HTMLInputElement | null>(null);
  const activeInlineEdit = ref<InlineEditTarget | null>(null);
  const inlineEditValue = ref('0');
  const editState = reactive<{ main: Currency; wallets: CurrencyWallet[] }>({
    main: cloneCurrency(props.money),
    wallets: normalizeWallets(props.additionalMoney),
  });

  const normalizedWallets = computed(() => normalizeWallets(props.additionalMoney));

  function cloneCurrency(currency?: Currency): Currency {
    return {
      pp: currency?.pp ?? 0,
      gp: currency?.gp ?? 0,
      ep: 0,
      sp: currency?.sp ?? 0,
      cp: currency?.cp ?? 0,
    };
  }

  function normalizeWallets(additionalMoney?: CurrencyWallet[] | Currency): CurrencyWallet[] {
    if (!additionalMoney) return [];
    if (Array.isArray(additionalMoney)) {
      return additionalMoney.map(wallet => ({
        id: wallet.id,
        name: wallet.name,
        currency: cloneCurrency(wallet.currency),
      }));
    }

    return [
      {
        id: 'legacy-wallet',
        name: 'Additional wallet',
        currency: cloneCurrency(additionalMoney),
      },
    ];
  }

  function openEditor() {
    editState.main = cloneCurrency(props.money);
    editState.wallets = normalizeWallets(props.additionalMoney);
    isEditing.value = true;
  }

  function closeEditor() {
    isEditing.value = false;
  }

  function isInlineEditing(walletId: string, coinKey: CoinKey) {
    return (
      activeInlineEdit.value?.walletId === walletId && activeInlineEdit.value?.coinKey === coinKey
    );
  }

  function beginInlineEdit(walletId: string, coinKey: CoinKey, value: number) {
    activeInlineEdit.value = { walletId, coinKey };
    inlineEditValue.value = String(value);
    void nextTick(() => {
      inlineEditInput.value?.focus();
      inlineEditInput.value?.select();
    });
  }

  function cancelInlineEdit() {
    activeInlineEdit.value = null;
  }

  async function saveInlineEdit() {
    if (!props.characterId || !activeInlineEdit.value) {
      cancelInlineEdit();
      return;
    }

    const parsed = Number.parseInt(inlineEditValue.value, 10);
    const nextValue = Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
    const nextMain = cloneCurrency(props.money);
    const nextWallets = normalizeWallets(props.additionalMoney);

    if (activeInlineEdit.value.walletId === 'main') {
      nextMain[activeInlineEdit.value.coinKey] = nextValue;
    } else {
      const wallet = nextWallets.find(entry => entry.id === activeInlineEdit.value?.walletId);
      if (!wallet) {
        cancelInlineEdit();
        return;
      }
      wallet.currency[activeInlineEdit.value.coinKey] = nextValue;
    }

    await store.updateCharacterMoney(props.characterId, nextMain, nextWallets);
    cancelInlineEdit();
  }

  function updateCoinValue(target: Currency, coinKey: CoinKey, event: Event) {
    const input = event.target as HTMLInputElement;
    const parsed = Number.parseInt(input.value, 10);
    target[coinKey] = Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  }

  function updateWalletName(walletId: string, event: Event) {
    const input = event.target as HTMLInputElement;
    const wallet = editState.wallets.find((entry: CurrencyWallet) => entry.id === walletId);
    if (!wallet) return;
    wallet.name = input.value;
  }

  function updateWalletCoinValue(walletId: string, coinKey: CoinKey, event: Event) {
    const wallet = editState.wallets.find((entry: CurrencyWallet) => entry.id === walletId);
    if (!wallet) return;
    updateCoinValue(wallet.currency, coinKey, event);
  }

  function addWallet() {
    editState.wallets.push({
      id: `wallet-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: `Wallet ${editState.wallets.length + 1}`,
      currency: cloneCurrency(),
    });
  }

  function removeWallet(walletId: string) {
    editState.wallets = editState.wallets.filter(
      (wallet: CurrencyWallet) => wallet.id !== walletId
    );
  }

  async function saveMoney() {
    if (!props.characterId) {
      closeEditor();
      return;
    }
    await store.updateCharacterMoney(
      props.characterId,
      cloneCurrency(editState.main),
      editState.wallets
    );
    closeEditor();
  }
</script>

<style scoped>
  .money-card {
    border: 1px solid rgba(107, 46, 46, 0.14);
    border-radius: 18px;
    overflow: hidden;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.74), rgba(244, 236, 216, 0.82));
    box-shadow: 0 12px 28px rgba(31, 27, 22, 0.08);
  }

  .money-header {
    width: 100%;
    border: 0;
    background: transparent;
    padding: 1rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    text-align: left;
    cursor: pointer;
  }

  .money-header__copy,
  .money-header__meta,
  .money-summary,
  .money-body,
  .wallet-list,
  .wallet-grid,
  .editor-shell,
  .editor-section,
  .editor-grid {
    display: grid;
    gap: 0.75rem;
  }

  .money-header__meta {
    justify-items: end;
  }

  .money-kicker,
  .money-section-title {
    margin: 0;
    font-size: 0.76rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--color-primary);
    font-weight: 700;
  }

  .money-header h3,
  .wallet-card__header h4,
  .editor-heading h4 {
    margin: 0;
  }

  .money-summary {
    grid-template-columns: repeat(2, minmax(0, max-content));
    gap: 0.45rem;
    justify-content: end;
  }

  .money-pill,
  .wallet-badge {
    padding: 0.35rem 0.6rem;
    border-radius: 999px;
    background: rgba(107, 46, 46, 0.08);
    color: var(--color-primary);
    font-size: 0.78rem;
    font-weight: 700;
  }

  .money-pill--interactive,
  .wallet-coin--interactive {
    border: 0;
    cursor: pointer;
    text-align: left;
    transition: transform 0.16s ease, box-shadow 0.16s ease, background-color 0.16s ease;
  }

  .money-pill--interactive:hover,
  .money-pill--interactive:focus-visible,
  .wallet-coin--interactive:hover,
  .wallet-coin--interactive:focus-visible {
    transform: translateY(-1px);
    box-shadow: 0 8px 18px rgba(107, 46, 46, 0.08);
    outline: none;
  }

  .wallet-badge--sub {
    background: rgba(201, 164, 75, 0.18);
    color: #7b5f1d;
  }

  .money-chevron {
    font-size: 1.4rem;
    line-height: 1;
    color: var(--color-primary);
    transition: transform 0.16s ease;
  }

  .money-chevron--open {
    transform: rotate(180deg);
  }

  .money-body {
    padding: 0 1rem 1rem;
  }

  .money-section-header,
  .wallet-card__header,
  .editor-heading--split,
  .editor-wallet-top,
  .editor-actions {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 0.75rem;
  }

  .money-section-copy,
  .editor-heading p,
  .wallet-empty {
    margin: 0;
    color: var(--color-muted);
    line-height: 1.45;
  }

  .money-edit-button,
  .save-money-button,
  .remove-wallet-button {
    min-height: 2.6rem;
    border: 0;
    border-radius: 999px;
    padding: 0.7rem 1rem;
    cursor: pointer;
    font-weight: 700;
  }

  .money-edit-button {
    background: rgba(107, 46, 46, 0.1);
    color: var(--color-primary);
  }

  .money-edit-button--soft,
  .remove-wallet-button {
    background: rgba(31, 27, 22, 0.08);
    color: var(--color-text);
  }

  .save-money-button {
    background: linear-gradient(90deg, var(--color-primary), var(--color-primary-600));
    color: white;
  }

  .wallet-card,
  .editor-wallet-card,
  .editor-section {
    padding: 0.9rem;
    border-radius: 16px;
    border: 1px solid rgba(107, 46, 46, 0.1);
    background: rgba(255, 255, 255, 0.68);
  }

  .wallet-card--main {
    background: linear-gradient(135deg, rgba(201, 164, 75, 0.14), rgba(255, 255, 255, 0.7));
  }

  .wallet-grid,
  .editor-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .wallet-coin,
  .editor-field {
    display: grid;
    gap: 0.35rem;
    padding: 0.65rem 0.7rem;
    border-radius: 12px;
    background: rgba(244, 236, 216, 0.42);
  }

  .wallet-coin--interactive {
    width: 100%;
  }

  .wallet-coin-input {
    width: 100%;
    min-height: 2.2rem;
    border: 1px solid rgba(107, 46, 46, 0.16);
    border-radius: 10px;
    background: white;
    padding: 0.45rem 0.6rem;
    font: inherit;
    color: var(--color-text);
  }

  .wallet-coin-input:focus {
    outline: 2px solid rgba(107, 46, 46, 0.2);
    outline-offset: 1px;
  }

  .wallet-coin span,
  .editor-field span {
    font-size: 0.78rem;
    color: var(--color-muted);
  }

  .editor-field input {
    width: 100%;
    min-height: 2.75rem;
    border-radius: 12px;
    border: 1px solid rgba(107, 46, 46, 0.12);
    background: white;
    padding: 0.65rem 0.8rem;
  }

  .editor-field--name {
    flex: 1;
    padding: 0;
    background: transparent;
  }

  .wallet-empty--editor {
    padding: 0.85rem;
    border-radius: 12px;
    background: rgba(244, 236, 216, 0.42);
  }

  @media (min-width: 700px) {
    .wallet-grid,
    .editor-grid {
      grid-template-columns: repeat(5, minmax(0, 1fr));
    }
  }

  @media (max-width: 560px) {
    .money-header,
    .money-section-header,
    .editor-heading--split,
    .editor-wallet-top,
    .editor-actions {
      flex-direction: column;
      align-items: stretch;
    }

    .money-header__meta {
      justify-items: start;
    }

    .money-summary {
      justify-content: start;
    }
  }
</style>
