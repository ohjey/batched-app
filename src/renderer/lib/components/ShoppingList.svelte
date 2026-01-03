<script lang="ts">
  import type { ConsolidatedIngredient } from '../../../shared/types';
  import { pluralizeUnit } from '../../../shared/formatters';

  interface Props {
    ingredients: ConsolidatedIngredient[];
    onDone: () => void;
    onDelete: (keys: string[]) => void;
    onExportSuccess: () => void;
  }

  let { ingredients, onDone, onDelete, onExportSuccess }: Props = $props();

  let exporting = $state(false);
  let exported = $state(false);

  // Selection mode state
  let selectionMode = $state(false);
  let selectedKeys: Set<string> = $state(new Set());
  let showDeleteConfirm = $state(false);
  let showClearConfirm = $state(false);
  let deleteTarget: 'bulk' | string | null = $state(null);
  let lastClickedIndex: number | null = $state(null);

  function getIngredientKey(ing: ConsolidatedIngredient): string {
    return `${ing.ingredient.canonicalName}:${ing.note || ''}`;
  }

  function formatIngredientName(ing: ConsolidatedIngredient): string {
    return ing.note ? `${ing.ingredient.displayName} (${ing.note})` : ing.ingredient.displayName;
  }

  function getImageUrl(imagePath: string): string {
    return `/${imagePath}`;
  }

  async function handleExport() {
    exporting = true;
    try {
      await window.api.shopping.exportReminders($state.snapshot(ingredients));
      exported = true;
      onExportSuccess();
    } catch (err) {
      console.error('Failed to export to Reminders:', err);
      alert('Failed to export to Apple Reminders. Make sure you have granted permission.');
    }
    exporting = false;
  }

  // Keyboard shortcut for Cmd+A / Ctrl+A to select all
  $effect(() => {
    if (!selectionMode) return;

    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'a') {
        e.preventDefault();
        selectAll();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  // Selection mode functions
  function exitSelectionMode() {
    selectionMode = false;
    selectedKeys = new Set();
    lastClickedIndex = null;
  }

  function handleItemSelect(index: number, e: MouseEvent) {
    const key = getIngredientKey(ingredients[index]);

    // Auto-enter selection mode on first selection
    if (!selectionMode) {
      selectionMode = true;
    }

    if (e.shiftKey && lastClickedIndex !== null) {
      // Range select
      const start = Math.min(lastClickedIndex, index);
      const end = Math.max(lastClickedIndex, index);
      const newSet = new Set(selectedKeys);
      for (let i = start; i <= end; i++) {
        newSet.add(getIngredientKey(ingredients[i]));
      }
      selectedKeys = newSet;
    } else {
      // Single toggle
      toggleItem(key);
      lastClickedIndex = index;
    }
  }

  function toggleItem(key: string) {
    const newSet = new Set(selectedKeys);
    if (newSet.has(key)) {
      newSet.delete(key);
    } else {
      newSet.add(key);
    }
    selectedKeys = newSet;

    // Auto-exit selection mode when all items are deselected
    if (newSet.size === 0) {
      selectionMode = false;
      lastClickedIndex = null;
    }
  }

  function selectAll() {
    selectedKeys = new Set(ingredients.map(ing => getIngredientKey(ing)));
  }

  function deselectAll() {
    selectedKeys = new Set();
  }

  // Delete functions
  function handleDeleteClick() {
    if (selectedKeys.size === 0) return;
    deleteTarget = 'bulk';
    showDeleteConfirm = true;
  }

  function handleSingleDelete(key: string) {
    deleteTarget = key;
    showDeleteConfirm = true;
  }

  function confirmDelete() {
    if (deleteTarget === 'bulk') {
      onDelete(Array.from(selectedKeys));
      selectedKeys = new Set();
      selectionMode = false;
    } else if (deleteTarget) {
      onDelete([deleteTarget]);
    }
    showDeleteConfirm = false;
    deleteTarget = null;
    lastClickedIndex = null;
  }

  function cancelDelete() {
    showDeleteConfirm = false;
    deleteTarget = null;
  }

  // Clear list functions
  function handleClearClick() {
    showClearConfirm = true;
  }

  function confirmClear() {
    showClearConfirm = false;
    onDone();
  }

  function cancelClear() {
    showClearConfirm = false;
  }

  function getDeleteCount(): number {
    if (deleteTarget === 'bulk') {
      return selectedKeys.size;
    }
    return 1;
  }
</script>

<div class="shopping-list">
  <header class="header">
    <h2>Shopping List</h2>
    <div class="header-actions">
      {#if selectionMode}
        <button class="text" onclick={selectAll}>Select All</button>
        <button class="text" onclick={deselectAll}>Deselect All</button>
        <button class="text cancel" onclick={exitSelectionMode}>Cancel</button>
      {:else if ingredients.length > 0}
        <button class="secondary" onclick={handleClearClick}>
          Clear List
        </button>
      {:else}
        <div></div>
      {/if}
    </div>
  </header>

  {#if ingredients.length === 0}
    <div class="empty-state">
      <svg class="empty-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <circle cx="9" cy="21" r="1"/>
        <circle cx="20" cy="21" r="1"/>
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
      </svg>
      <p class="empty-title">No shopping list yet</p>
      <p class="hint">Select recipes from the Recipes tab and click "Build Shopping List" to get started.</p>
    </div>
  {:else}
    <div class="list">
      {#each ingredients as ing, index (getIngredientKey(ing))}
        {@const key = getIngredientKey(ing)}
        <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
        <div
          class="list-item"
          class:selected={selectedKeys.has(key)}
          onclick={(e) => {
            if (selectionMode) {
              e.preventDefault();
              handleItemSelect(index, e);
            }
          }}
        >
          <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
          <div
            class="checkbox-wrapper"
            class:visible={selectionMode}
            onclick={(e) => {
              e.stopPropagation();
              handleItemSelect(index, e);
            }}
          >
            <input
              type="checkbox"
              checked={selectedKeys.has(key)}
              onclick={(e) => e.stopPropagation()}
              onchange={() => {
                if (!selectionMode) selectionMode = true;
                toggleItem(key);
                lastClickedIndex = index;
              }}
            />
          </div>
          {#if ing.ingredient.image}
            <img
              src={getImageUrl(ing.ingredient.image)}
              alt=""
              class="ingredient-thumb"
            />
          {:else}
            <div class="ingredient-thumb-placeholder">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 0 1-8 0"/>
              </svg>
            </div>
          {/if}
          <span class="item-name">{formatIngredientName(ing)}</span>
          <span class="item-quantity">{ing.totalQuantity} {pluralizeUnit(ing.totalQuantity, ing.unit)}</span>
          {#if !selectionMode}
            <button
              class="trash-button"
              onclick={(e) => {
                e.stopPropagation();
                handleSingleDelete(key);
              }}
              title="Remove item"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
            </button>
          {/if}
        </div>
      {/each}
    </div>

    {#if selectionMode}
      <div class="selection-footer">
        <div class="selection-summary">
          <p><strong>{selectedKeys.size}</strong> item{selectedKeys.size !== 1 ? 's' : ''} selected</p>
        </div>
        <div class="selection-actions">
          <button
            class="danger"
            onclick={handleDeleteClick}
            disabled={selectedKeys.size === 0}
          >
            Delete
          </button>
        </div>
      </div>
    {:else}
      <div class="footer">
        <p class="total">{ingredients.length} item{ingredients.length !== 1 ? 's' : ''}</p>
        <button
          class="primary"
          onclick={handleExport}
          disabled={exporting || exported}
        >
          {#if exported}
            Exported
          {:else if exporting}
            Exporting...
          {:else}
            Send to iPhone
          {/if}
        </button>
      </div>
    {/if}
  {/if}
</div>

{#if showDeleteConfirm}
  <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
  <div class="confirm-backdrop" onclick={cancelDelete}>
    <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
    <div class="confirm-dialog" onclick={(e) => e.stopPropagation()}>
      <h3>Remove {getDeleteCount()} Item{getDeleteCount() !== 1 ? 's' : ''}?</h3>
      <p>
        {#if deleteTarget === 'bulk'}
          The selected items will be removed from your shopping list.
        {:else}
          This item will be removed from your shopping list.
        {/if}
      </p>
      <div class="confirm-actions">
        <button class="secondary" onclick={cancelDelete}>
          Cancel
        </button>
        <button class="danger" onclick={confirmDelete}>
          Remove
        </button>
      </div>
    </div>
  </div>
{/if}

{#if showClearConfirm}
  <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
  <div class="confirm-backdrop" onclick={cancelClear}>
    <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
    <div class="confirm-dialog" onclick={(e) => e.stopPropagation()}>
      <h3>Clear Shopping List?</h3>
      <p>All {ingredients.length} item{ingredients.length !== 1 ? 's' : ''} will be removed from your shopping list.</p>
      <div class="confirm-actions">
        <button class="secondary" onclick={cancelClear}>
          Cancel
        </button>
        <button class="danger" onclick={confirmClear}>
          Clear List
        </button>
      </div>
    </div>
  </div>
{/if}

{#if exporting}
  <div class="confirm-backdrop">
    <div class="confirm-dialog" style="text-align: center;">
      <div class="loading-spinner"></div>
      <p style="margin-bottom: 0;">Sending to iPhone...</p>
    </div>
  </div>
{/if}

<style>
  .shopping-list {
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
  }

  .header h2 {
    font-size: 24px;
    font-weight: 600;
  }

  .header-actions {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  button.text.cancel {
    color: var(--danger-color);
  }

  button.text.cancel:hover {
    background: color-mix(in srgb, var(--danger-color) 10%, transparent);
  }

  .empty-state {
    text-align: center;
    padding: 80px 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex: 1;
  }

  .empty-icon {
    color: var(--text-secondary);
    opacity: 0.4;
    margin-bottom: 16px;
  }

  .empty-title {
    font-size: 15px;
    font-weight: 500;
    color: var(--text-secondary);
    margin: 0 0 4px 0;
  }

  .empty-state .hint {
    font-size: 13px;
    color: var(--text-secondary);
    opacity: 0.7;
    margin: 0;
    max-width: 300px;
  }

  .list {
    display: flex;
    flex-direction: column;
    flex: 1;
    overflow-y: auto;
  }

  .list-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 16px;
    border-bottom: 1px solid var(--border-color);
    transition: background 0.15s ease;
  }

  .list-item:last-child {
    border-bottom: none;
  }

  .list-item:hover {
    background: color-mix(in srgb, var(--accent-color) 3%, transparent);
  }

  .list-item.selected {
    background: color-mix(in srgb, var(--accent-color) 6%, transparent);
  }

  /* Checkbox wrapper - hidden by default, visible on hover or in selection mode */
  .checkbox-wrapper {
    opacity: 0;
    width: 0;
    overflow: hidden;
    transition: opacity 0.15s ease, width 0.15s ease;
    flex-shrink: 0;
  }

  .list-item:hover .checkbox-wrapper,
  .checkbox-wrapper.visible {
    opacity: 1;
    width: 18px;
  }

  .checkbox-wrapper input[type="checkbox"] {
    width: 18px;
    height: 18px;
    cursor: pointer;
    accent-color: var(--accent-color);
  }

  .ingredient-thumb {
    width: 40px;
    height: 40px;
    border-radius: 8px;
    object-fit: cover;
    flex-shrink: 0;
  }

  .ingredient-thumb-placeholder {
    width: 40px;
    height: 40px;
    border-radius: 8px;
    background: var(--bg-secondary);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    color: var(--text-secondary);
    opacity: 0.5;
  }

  .item-name {
    flex: 1;
    font-weight: 500;
  }

  .item-quantity {
    color: var(--text-secondary);
    font-size: 13px;
  }

  /* Trash button - hidden by default, visible on hover */
  .trash-button {
    opacity: 0;
    background: none;
    border: none;
    padding: 4px;
    cursor: pointer;
    color: var(--text-secondary);
    border-radius: 4px;
    transition: opacity 0.15s ease, background 0.15s ease, color 0.15s ease;
    flex-shrink: 0;
  }

  .list-item:hover .trash-button {
    opacity: 1;
  }

  .trash-button:hover {
    background: color-mix(in srgb, var(--danger-color) 10%, transparent);
    color: var(--danger-color);
  }

  .footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 24px;
    padding-top: 24px;
    border-top: 1px solid var(--border-color);
  }

  .total {
    color: var(--text-secondary);
    margin: 0;
  }

  /* Selection footer */
  .selection-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 24px;
    padding-top: 16px;
    border-top: 1px solid var(--border-color);
  }

  .selection-summary p {
    margin: 0;
    font-size: 14px;
  }

  .selection-actions {
    display: flex;
    gap: 12px;
  }

  /* Confirmation dialog */
  .confirm-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
  }

  .confirm-dialog {
    background: var(--bg-primary);
    border-radius: 12px;
    padding: 24px;
    max-width: 400px;
    width: 90%;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  }

  .confirm-dialog h3 {
    font-size: 18px;
    font-weight: 600;
    margin: 0 0 12px 0;
  }

  .confirm-dialog p {
    color: var(--text-secondary);
    font-size: 14px;
    line-height: 1.5;
    margin: 0 0 24px 0;
  }

  .confirm-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }

  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 3px solid var(--border-color);
    border-top-color: var(--accent-color);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    margin: 0 auto 16px auto;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
</style>
