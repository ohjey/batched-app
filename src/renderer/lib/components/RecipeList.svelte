<script lang="ts">
  import type { Recipe } from '../../../shared/types';
  import RecipeDetailCard from './RecipeDetailCard.svelte';

  interface Props {
    onNewRecipe: () => void;
    onEditRecipe: (recipe: Recipe) => void;
    onBuildShoppingList: (ids: string[]) => void;
    refreshKey?: number;
    addToast: (message: string, type?: 'success' | 'error') => void;
  }

  let { onNewRecipe, onEditRecipe, onBuildShoppingList, refreshKey = 0, addToast }: Props = $props();

  let recipes: Recipe[] = $state([]);
  let loading = $state(true);
  let selectedRecipe: Recipe | null = $state(null);

  // Selection mode state
  let selectionMode = $state(false);
  let selectedIds: Set<string> = $state(new Set());
  let deleting = $state(false);
  let showDeleteConfirm = $state(false);
  let lastClickedIndex: number | null = $state(null);

  $effect(() => {
    // Re-run when refreshKey changes
    refreshKey;
    loadRecipes();
  });

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

  async function loadRecipes() {
    loading = true;
    try {
      recipes = await window.api.recipes.getAll();
    } catch (err) {
      console.error('Failed to load recipes:', err);
      recipes = [];
    }
    loading = false;
  }

  function handleRecipeClick(recipe: Recipe) {
    selectedRecipe = recipe;
  }

  function handleCloseDetail() {
    selectedRecipe = null;
  }

  function handleEditFromDetail(recipe: Recipe) {
    selectedRecipe = null;
    onEditRecipe(recipe);
  }

  async function handleDeleteFromDetail(recipe: Recipe) {
    selectedRecipe = null;
    try {
      await window.api.recipes.delete(recipe.id);
      await loadRecipes();
      addToast('Recipe deleted');
    } catch (err) {
      console.error('Failed to delete recipe:', err);
      addToast('Failed to delete recipe. Please try again.', 'error');
    }
  }

  // Selection mode functions
  function exitSelectionMode() {
    selectionMode = false;
    selectedIds = new Set();
    lastClickedIndex = null;
  }

  function handleRecipeSelect(index: number, e: MouseEvent) {
    // Auto-enter selection mode on first selection
    if (!selectionMode) {
      selectionMode = true;
    }
    if (e.shiftKey && lastClickedIndex !== null) {
      // Range select
      const start = Math.min(lastClickedIndex, index);
      const end = Math.max(lastClickedIndex, index);
      const newSet = new Set(selectedIds);
      for (let i = start; i <= end; i++) {
        newSet.add(recipes[i].id);
      }
      selectedIds = newSet;
    } else {
      // Single toggle
      toggleRecipe(recipes[index].id);
      lastClickedIndex = index;
    }
  }

  function toggleRecipe(id: string) {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    selectedIds = newSet;

    // Auto-exit selection mode when all items are deselected
    if (newSet.size === 0) {
      selectionMode = false;
      lastClickedIndex = null;
    }
  }

  function selectAll() {
    selectedIds = new Set(recipes.map(r => r.id));
  }

  function deselectAll() {
    selectedIds = new Set();
  }

  function handleDeleteClick() {
    if (selectedIds.size === 0) return;
    showDeleteConfirm = true;
  }

  async function confirmBulkDelete() {
    if (selectedIds.size === 0) return;

    deleting = true;
    try {
      const count = await window.api.recipes.deleteBulk(Array.from(selectedIds));
      selectedIds = new Set();
      selectionMode = false;
      showDeleteConfirm = false;
      await loadRecipes();
      addToast(`Deleted ${count} recipe${count !== 1 ? 's' : ''}`);
    } catch (err) {
      console.error('Failed to delete recipes:', err);
      addToast('Failed to delete recipes. Please try again.', 'error');
    }
    deleting = false;
  }

  function cancelDelete() {
    showDeleteConfirm = false;
  }

  function handleBuildShoppingList() {
    if (selectedIds.size === 0) return;
    onBuildShoppingList(Array.from(selectedIds));
    exitSelectionMode();
  }
</script>

<div class="recipe-list">
  <header class="header">
    <h2>My Recipes</h2>
    <div class="header-actions">
      {#if selectionMode}
        <button class="text" onclick={selectAll}>Select All</button>
        <button class="text" onclick={deselectAll}>Deselect All</button>
        <button class="text cancel" onclick={exitSelectionMode}>Cancel</button>
      {:else}
        <button class="primary" onclick={onNewRecipe}>
          + Add Recipe
        </button>
      {/if}
    </div>
  </header>

  {#if loading}
    <div class="empty-state">
      <p>Loading recipes...</p>
    </div>
  {:else if recipes.length === 0}
    <div class="empty-state">
      <svg class="empty-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
        <line x1="8" y1="7" x2="16" y2="7"/>
        <line x1="8" y1="11" x2="14" y2="11"/>
      </svg>
      <p class="empty-title">No recipes yet</p>
      <p class="empty-hint">Click "Add Recipe" to create your first recipe</p>
    </div>
  {:else}
    <div class="recipes-grid">
      {#each recipes as recipe, index (recipe.id)}
        <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions a11y_no_noninteractive_element_interactions -->
        <div
          class="recipe-card"
          class:selected={selectedIds.has(recipe.id)}
          onclick={(e) => {
            if (selectionMode) {
              e.preventDefault();
              handleRecipeSelect(index, e);
            } else {
              handleRecipeClick(recipe);
            }
          }}
        >
          <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions a11y_no_noninteractive_element_interactions -->
          <div
            class="checkbox-wrapper"
            class:visible={selectionMode}
            onclick={(e) => {
              e.stopPropagation();
              handleRecipeSelect(index, e);
            }}
          >
            <input
              type="checkbox"
              checked={selectedIds.has(recipe.id)}
              onclick={(e) => e.stopPropagation()}
              onchange={(e) => handleRecipeSelect(index, e)}
            />
          </div>
          <div class="recipe-content">
            <h3>{recipe.name}</h3>
            <p class="ingredient-count">
              {recipe.ingredients.length} ingredient{recipe.ingredients.length !== 1 ? 's' : ''}
              {#if recipe.steps.length > 0}
                · {recipe.steps.length} step{recipe.steps.length !== 1 ? 's' : ''}
              {/if}
            </p>
          </div>
        </div>
      {/each}
    </div>

    {#if selectionMode}
      <div class="selection-footer">
        <div class="selection-summary">
          <p><strong>{selectedIds.size}</strong> recipe{selectedIds.size !== 1 ? 's' : ''} selected</p>
        </div>
        <div class="selection-actions">
          <button
            class="danger"
            onclick={handleDeleteClick}
            disabled={selectedIds.size === 0}
          >
            Delete
          </button>
          <button
            class="primary"
            onclick={handleBuildShoppingList}
            disabled={selectedIds.size === 0}
          >
            Build Shopping List
          </button>
        </div>
      </div>
    {/if}
  {/if}
</div>

{#if showDeleteConfirm}
  <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
  <div class="confirm-backdrop" onclick={cancelDelete}>
    <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
    <div class="confirm-dialog" onclick={(e) => e.stopPropagation()}>
      <h3>Delete {selectedIds.size} Recipe{selectedIds.size !== 1 ? 's' : ''}?</h3>
      <p>This action cannot be undone. The selected recipes and all their ingredients will be permanently deleted.</p>
      <div class="confirm-actions">
        <button class="secondary" onclick={cancelDelete} disabled={deleting}>
          Cancel
        </button>
        <button class="danger" onclick={confirmBulkDelete} disabled={deleting}>
          {deleting ? 'Deleting...' : 'Delete'}
        </button>
      </div>
    </div>
  </div>
{/if}

<RecipeDetailCard
  recipe={selectedRecipe}
  onClose={handleCloseDetail}
  onEdit={handleEditFromDetail}
  onDelete={handleDeleteFromDetail}
/>

<style>
  .recipe-list {
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 16px;
    position: sticky;
    top: 0;
    background: var(--bg-primary);
    z-index: 10;
  }

  .header h2 {
    font-size: 24px;
    font-weight: 600;
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

  .empty-hint {
    font-size: 13px;
    color: var(--text-secondary);
    opacity: 0.7;
    margin: 0;
  }

  .recipes-grid {
    display: flex;
    flex-direction: column;
    flex: 1;
    overflow-y: auto;
    padding-bottom: 8px;
  }

  .recipe-card {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    text-align: left;
    background: var(--bg-primary);
    border-bottom: 1px solid var(--border-color);
    padding: 16px 20px;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .recipe-card:last-child {
    border-bottom: none;
  }

  .recipe-card:hover {
    background: color-mix(in srgb, var(--accent-color) 3%, transparent);
  }

  .recipe-card h3 {
    font-size: 16px;
    font-weight: 500;
    margin-bottom: 4px;
  }

  .ingredient-count {
    font-size: 13px;
    color: var(--text-secondary);
  }

  /* Checkbox wrapper - hidden by default, visible on hover or when selection exists */
  .checkbox-wrapper {
    opacity: 0;
    width: 0;
    overflow: hidden;
    transition: opacity 0.15s ease, width 0.15s ease;
    flex-shrink: 0;
  }

  .recipe-card:hover .checkbox-wrapper,
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

  /* Header actions */
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

  .recipe-card .recipe-content {
    flex: 1;
    text-align: left;
  }

  .recipe-card.selected {
    background: color-mix(in srgb, var(--accent-color) 6%, transparent);
  }

  /* Selection footer */
  .selection-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 16px;
    border-top: 1px solid var(--border-color);
    position: sticky;
    bottom: 0;
    background: var(--bg-primary);
    z-index: 10;
  }

  .selection-summary p {
    margin: 0;
    font-size: 14px;
  }

  .selection-actions {
    display: flex;
    gap: 12px;
  }

  /* Danger button */
  :global(button.danger) {
    background: var(--danger-color);
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 6px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.15s ease;
  }

  :global(button.danger:hover) {
    opacity: 0.9;
  }

  :global(button.danger:disabled) {
    background: var(--border-color);
    cursor: not-allowed;
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

  :global(button.secondary) {
    background: var(--bg-secondary);
    color: var(--text-primary);
    border: none;
    padding: 10px 20px;
    border-radius: 6px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.15s ease;
  }

  :global(button.secondary:hover) {
    background: var(--border-color);
  }

  :global(button.secondary:disabled) {
    color: var(--text-secondary);
    cursor: not-allowed;
  }
</style>
