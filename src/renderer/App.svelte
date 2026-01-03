<script lang="ts">
  import Sidebar from './lib/components/Sidebar.svelte';
  import RecipeList from './lib/components/RecipeList.svelte';
  import RecipeEditor from './lib/components/RecipeEditor.svelte';
  import IngredientQuestionnaire from './lib/components/IngredientQuestionnaire.svelte';
  import ShoppingList from './lib/components/ShoppingList.svelte';
  import ExportSuccess from './lib/components/ExportSuccess.svelte';
  import ToastContainer, { type ToastData } from './lib/components/ToastContainer.svelte';
  import type { Recipe, ConsolidatedIngredient } from '../shared/types';

  type View = 'recipes' | 'editor' | 'shopping-list' | 'export-success';

  let currentView: View = $state('recipes');
  let editingRecipe: Recipe | null = $state(null);
  let selectedRecipeIds: string[] = $state([]);
  let shoppingList: ConsolidatedIngredient[] = $state([]);
  let pendingRecipeIds: string[] = $state([]);
  let showReplaceListDialog = $state(false);
  let showIngredientModal = $state(false);
  let pendingIngredients: ConsolidatedIngredient[] = $state([]);
  let recipeRefreshKey = $state(0);
  let toasts: ToastData[] = $state([]);

  function addToast(message: string, type: 'success' | 'error' = 'success') {
    const id = crypto.randomUUID();
    toasts = [...toasts, { id, message, type }];
  }

  function removeToast(id: string) {
    toasts = toasts.filter(t => t.id !== id);
  }

  function handleNavigate(view: 'recipes' | 'shop') {
    if (view === 'recipes') {
      currentView = 'recipes';
      editingRecipe = null;
    } else {
      currentView = 'shopping-list';
    }
  }

  function handleNewRecipe() {
    editingRecipe = null;
    currentView = 'editor';
  }

  function handleEditRecipe(recipe: Recipe) {
    editingRecipe = recipe;
    currentView = 'editor';
  }

  function handleEditorBack() {
    editingRecipe = null;
    currentView = 'recipes';
  }

  function handleRecipeSaved() {
    editingRecipe = null;
    currentView = 'recipes';
    recipeRefreshKey++;
  }

  async function handleBuildShoppingList(ids: string[]) {
    // Check if there's an existing shopping list
    if (shoppingList.length > 0) {
      pendingRecipeIds = ids;
      showReplaceListDialog = true;
    } else {
      await consolidateAndShowModal(ids, 'replace');
    }
  }

  async function consolidateAndShowModal(ids: string[], mode: 'replace' | 'append') {
    try {
      // Use snapshot to get plain array for IPC serialization
      const plainIds = [...ids];
      const ingredients = await window.api.shopping.consolidate(plainIds);
      selectedRecipeIds = ids;
      pendingIngredients = ingredients;
      showIngredientModal = true;
    } catch (err) {
      console.error('Failed to consolidate ingredients:', err);
      addToast('Failed to build shopping list. Please try again.', 'error');
    }
  }

  function handleReplaceList() {
    showReplaceListDialog = false;
    shoppingList = [];
    consolidateAndShowModal(pendingRecipeIds, 'replace');
  }

  function handleAppendToList() {
    showReplaceListDialog = false;
    consolidateAndShowModal(pendingRecipeIds, 'append');
  }

  function handleCancelDialog() {
    showReplaceListDialog = false;
    pendingRecipeIds = [];
  }

  function handleQuestionnaireComplete(finalIngredients: ConsolidatedIngredient[]) {
    // Save the shopping list (filtered to items we need)
    shoppingList = finalIngredients.filter(i => !i.alreadyHave);
    showIngredientModal = false;
    pendingIngredients = [];
    addToast(`Shopping list created with ${shoppingList.length} item${shoppingList.length !== 1 ? 's' : ''}`);
    // Auto-switch to Shop tab
    currentView = 'shopping-list';
  }

  function handleQuestionnaireCancel() {
    showIngredientModal = false;
    pendingIngredients = [];
  }

  function handleShoppingDone() {
    selectedRecipeIds = [];
    shoppingList = [];
    currentView = 'recipes';
  }

  function handleShoppingListDelete(keys: string[]) {
    shoppingList = shoppingList.filter(ing =>
      !keys.includes(`${ing.ingredient.canonicalName}:${ing.note || ''}`)
    );
    addToast(`Removed ${keys.length} item${keys.length !== 1 ? 's' : ''} from shopping list`);
  }

  function handleExportSuccess() {
    currentView = 'export-success';
  }

  function handleStartOver() {
    selectedRecipeIds = [];
    shoppingList = [];
    currentView = 'recipes';
  }
</script>

<div class="app-container">
  <Sidebar
    activeSection={currentView === 'recipes' || currentView === 'editor' ? 'recipes' : 'shop'}
    onNavigate={handleNavigate}
    shopItemCount={shoppingList.length}
  />
  <main class="main-content">
    {#if currentView === 'recipes' || currentView === 'editor'}
      <RecipeList
        onNewRecipe={handleNewRecipe}
        onEditRecipe={handleEditRecipe}
        onBuildShoppingList={handleBuildShoppingList}
        refreshKey={recipeRefreshKey}
        {addToast}
      />
    {:else if currentView === 'shopping-list'}
      <ShoppingList
        ingredients={shoppingList}
        onDone={handleShoppingDone}
        onDelete={handleShoppingListDelete}
        onExportSuccess={handleExportSuccess}
      />
    {:else if currentView === 'export-success'}
      <ExportSuccess onStartOver={handleStartOver} />
    {/if}
  </main>
</div>

{#if currentView === 'editor'}
  <RecipeEditor
    recipe={editingRecipe}
    onBack={handleEditorBack}
    onSave={handleRecipeSaved}
    {addToast}
  />
{/if}

<ToastContainer {toasts} onRemove={removeToast} />

{#if showReplaceListDialog}
  <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions a11y_no_noninteractive_element_interactions -->
  <div class="dialog-backdrop" onclick={handleCancelDialog}>
    <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions a11y_no_noninteractive_element_interactions -->
    <div class="dialog" onclick={(e) => e.stopPropagation()}>
      <div class="dialog-header">
        <h3>Existing Shopping List</h3>
        <button type="button" class="dialog-close" onclick={handleCancelDialog} aria-label="Close"><span>×</span></button>
      </div>
      <p>You already have a shopping list with {shoppingList.length} item{shoppingList.length !== 1 ? 's' : ''}. What would you like to do?</p>
      <div class="dialog-actions">
        <button class="secondary" onclick={handleAppendToList}>
          Add to Existing
        </button>
        <button class="primary" onclick={handleReplaceList}>
          Replace
        </button>
      </div>
    </div>
  </div>
{/if}

{#if showIngredientModal && pendingIngredients.length > 0}
  <IngredientQuestionnaire
    ingredients={pendingIngredients}
    onComplete={handleQuestionnaireComplete}
    onCancel={handleQuestionnaireCancel}
  />
{/if}

<style>
  .app-container {
    display: flex;
    height: 100%;
  }

  .main-content {
    flex: 1;
    overflow-y: auto;
    padding: 24px;
    background: var(--bg-primary);
  }

  .dialog-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
  }

  .dialog {
    background: var(--bg-primary);
    border-radius: 12px;
    padding: 24px;
    max-width: 420px;
    width: 90%;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  }

  .dialog-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }

  .dialog h3 {
    font-size: 18px;
    font-weight: 600;
    margin: 0;
  }

  .dialog-close {
    width: 28px;
    height: 28px;
    padding: 0;
    box-sizing: border-box;
    border-radius: 50%;
    border: none;
    background: transparent;
    color: var(--text-secondary);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.15s ease;
    font-size: 24px;
    line-height: 1;
  }

  .dialog-close span {
    display: block;
    transform: translateY(-1px);
  }

  .dialog-close:hover {
    background: var(--bg-secondary);
    color: var(--text-primary);
  }

  .dialog p {
    color: var(--text-secondary);
    font-size: 14px;
    line-height: 1.5;
    margin: 0 0 24px 0;
  }

  .dialog-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }
</style>
