<script lang="ts">
  import type { Recipe } from '../../../shared/types';
  import { pluralizeUnit } from '../../../shared/formatters';
  import { tooltip } from '../actions/tooltip';

  interface Props {
    recipe: Recipe | null;
    onClose: () => void;
    onEdit: (recipe: Recipe) => void;
    onDelete: (recipe: Recipe) => void;
  }

  let { recipe, onClose, onEdit, onDelete }: Props = $props();

  let isVisible = $state(false);
  let showDeleteConfirm = $state(false);

  type ViewFilter = 'all' | 'ingredients' | 'instructions';
  let viewFilter = $state<ViewFilter>('all');

  $effect(() => {
    if (recipe) {
      // Reset filter when a new recipe is opened
      viewFilter = 'all';
      // Small delay to trigger the slide-in animation
      requestAnimationFrame(() => {
        isVisible = true;
      });
    } else {
      isVisible = false;
    }
  });

  function handleClose() {
    isVisible = false;
    // Wait for animation to complete before calling onClose
    setTimeout(onClose, 300);
  }

  function handleBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      handleClose();
    }
  }

  function handleEdit() {
    if (recipe) {
      isVisible = false;
      setTimeout(() => onEdit(recipe!), 300);
    }
  }

  function handleDeleteClick() {
    showDeleteConfirm = true;
  }

  function cancelDelete() {
    showDeleteConfirm = false;
  }

  function confirmDelete() {
    if (recipe) {
      showDeleteConfirm = false;
      isVisible = false;
      setTimeout(() => onDelete(recipe!), 300);
    }
  }

  function formatQuantity(quantity: number): string {
    if (quantity === Math.floor(quantity)) {
      return quantity.toString();
    }
    return quantity.toFixed(2).replace(/\.?0+$/, '');
  }

  function getImageUrl(imagePath: string): string {
    return `/${imagePath}`;
  }

  function getIndicatorOffset(): number {
    // Each button is 44px wide + 2px gap
    if (viewFilter === 'all') return 0;
    if (viewFilter === 'ingredients') return 46;
    return 92;
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if recipe}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="backdrop"
    class:visible={isVisible}
    onclick={handleBackdropClick}
  >
    <div class="detail-card" class:visible={isVisible}>
      <header class="card-header">
        <h2>{recipe.name}</h2>
        {#if (recipe.steps && recipe.steps.length > 0) || recipe.instructions}
        <div class="segment-control">
          <div class="segment-indicator" style="transform: translateX({getIndicatorOffset()}px);"></div>
          <button
            class="segment-btn"
            class:active={viewFilter === 'all'}
            onclick={() => viewFilter = 'all'}
            aria-label="Show all"
            use:tooltip={"Show all"}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="3" width="7" height="7"/>
              <rect x="14" y="3" width="7" height="7"/>
              <rect x="3" y="14" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/>
            </svg>
          </button>
          <button
            class="segment-btn"
            class:active={viewFilter === 'ingredients'}
            onclick={() => viewFilter = 'ingredients'}
            aria-label="Show ingredients only"
            use:tooltip={"Ingredients only"}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 0 1-8 0"/>
            </svg>
          </button>
          <button
            class="segment-btn"
            class:active={viewFilter === 'instructions'}
            onclick={() => viewFilter = 'instructions'}
            aria-label="Show instructions only"
            use:tooltip={"Instructions only"}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="8" y1="6" x2="21" y2="6"/>
              <line x1="8" y1="12" x2="21" y2="12"/>
              <line x1="8" y1="18" x2="21" y2="18"/>
              <line x1="3" y1="6" x2="3.01" y2="6"/>
              <line x1="3" y1="12" x2="3.01" y2="12"/>
              <line x1="3" y1="18" x2="3.01" y2="18"/>
            </svg>
          </button>
        </div>
        {/if}
        <button class="close-btn" onclick={handleClose} aria-label="Close">
          <span class="close-icon">&times;</span>
        </button>
      </header>

      <div class="card-body">
        {#if viewFilter === 'all' || viewFilter === 'ingredients'}
        <section class="section">
          <h3>Ingredients</h3>
          {#if recipe.ingredients.length === 0}
            <p class="empty-text">No ingredients added</p>
          {:else}
            <ul class="ingredients-list">
              {#each recipe.ingredients as item (item.id)}
                <li class="ingredient-item">
                  {#if item.ingredient.image}
                    <img
                      src={getImageUrl(item.ingredient.image)}
                      alt={item.ingredient.displayName}
                      class="ingredient-image"
                    />
                  {:else}
                    <div class="ingredient-placeholder"></div>
                  {/if}
                  <div class="ingredient-info">
                    <span class="ingredient-name">{item.ingredient.displayName}</span>
                    <span class="ingredient-quantity">
                      {formatQuantity(item.quantity)} {pluralizeUnit(item.quantity, item.unit)}
                      {#if item.note}
                        <span class="ingredient-note">({item.note})</span>
                      {/if}
                    </span>
                  </div>
                </li>
              {/each}
            </ul>
          {/if}
        </section>
        {/if}

        {#if viewFilter === 'all' || viewFilter === 'instructions'}
        {#if recipe.steps && recipe.steps.length > 0}
          <section class="section">
            <h3>Instructions</h3>
            <ol class="steps-list">
              {#each recipe.steps as step (step.id)}
                <li class="step-item">
                  <span class="step-number">{step.stepNumber}</span>
                  <span class="step-content">{step.content}</span>
                </li>
              {/each}
            </ol>
          </section>
        {:else if recipe.instructions}
          <section class="section">
            <h3>Instructions</h3>
            <div class="instructions">
              {recipe.instructions}
            </div>
          </section>
        {/if}
        {/if}
      </div>

      <footer class="card-footer">
        <button class="danger" onclick={handleDeleteClick}>Delete</button>
        <div class="footer-right">
          <button class="secondary" onclick={handleClose}>Close</button>
          <button class="primary" onclick={handleEdit}>Edit Recipe</button>
        </div>
      </footer>
    </div>
  </div>

  {#if showDeleteConfirm}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="confirm-overlay" onclick={cancelDelete}>
      <div class="confirm-dialog" onclick={(e) => e.stopPropagation()}>
        <h3>Delete Recipe</h3>
        <p>Are you sure you want to delete "{recipe.name}"? This action cannot be undone.</p>
        <div class="confirm-actions">
          <button class="secondary" onclick={cancelDelete}>Cancel</button>
          <button class="danger" onclick={confirmDelete}>Delete</button>
        </div>
      </div>
    </div>
  {/if}
{/if}

<style>
  .backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    z-index: 1000;
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.3s ease, visibility 0.3s ease;
  }

  .backdrop.visible {
    opacity: 1;
    visibility: visible;
  }

  .detail-card {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    width: 450px;
    max-width: 100%;
    background: var(--bg-primary);
    box-shadow: -4px 0 24px rgba(0, 0, 0, 0.15);
    display: flex;
    flex-direction: column;
    transform: translateX(100%);
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .detail-card.visible {
    transform: translateX(0);
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid var(--border-color);
    flex-shrink: 0;
    gap: 12px;
  }

  .card-header h2 {
    font-size: 18px;
    font-weight: 600;
    margin: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
    min-width: 0;
  }

  .close-btn {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: 1px solid var(--border-color);
    background: var(--bg-primary);
    color: var(--text-secondary);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s ease;
    flex-shrink: 0;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .close-btn:hover {
    background: var(--bg-secondary);
    color: var(--text-primary);
    border-color: var(--text-secondary);
  }

  .close-icon {
    font-size: 20px;
    line-height: 0;
    font-weight: 400;
    margin-top: -1px;
  }

  .segment-control {
    display: flex;
    background: var(--bg-secondary);
    border-radius: 8px;
    padding: 3px;
    gap: 2px;
    flex-shrink: 0;
    position: relative;
  }

  .segment-indicator {
    position: absolute;
    top: 3px;
    bottom: 3px;
    left: 3px;
    width: 44px;
    background: var(--bg-primary);
    border-radius: 6px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    transition: transform 0.25s ease;
  }

  .segment-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 32px;
    border: none;
    background: transparent;
    border-radius: 6px;
    cursor: pointer;
    color: var(--text-secondary);
    transition: color 0.15s ease;
    position: relative;
    z-index: 1;
  }

  .segment-btn:hover:not(.active) {
    color: var(--text-primary);
  }

  .segment-btn.active {
    color: var(--accent-color);
  }

  .segment-btn svg {
    flex-shrink: 0;
  }

  .card-body {
    flex: 1;
    overflow-y: auto;
    padding: 24px;
  }

  .section {
    margin-bottom: 28px;
  }

  .section:last-child {
    margin-bottom: 0;
  }

  .section h3 {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 12px;
  }

  .empty-text {
    color: var(--text-secondary);
    font-style: italic;
    font-size: 14px;
  }

  .ingredients-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .ingredient-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 0;
    border-bottom: 1px solid var(--bg-secondary);
  }

  .ingredient-item:last-child {
    border-bottom: none;
  }

  .ingredient-image {
    width: 40px;
    height: 40px;
    border-radius: 8px;
    object-fit: cover;
    background: var(--bg-secondary);
  }

  .ingredient-placeholder {
    width: 40px;
    height: 40px;
    border-radius: 8px;
    background: var(--bg-secondary);
  }

  .ingredient-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .ingredient-name {
    font-weight: 500;
    font-size: 15px;
  }

  .ingredient-quantity {
    font-size: 13px;
    color: var(--text-secondary);
  }

  .ingredient-note {
    font-style: italic;
  }

  .instructions {
    font-size: 15px;
    line-height: 1.6;
    white-space: pre-wrap;
    color: var(--text-color);
  }

  .steps-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .steps-list .step-item {
    display: flex;
    gap: 14px;
    padding: 14px 0;
    border-bottom: 1px solid var(--bg-secondary);
  }

  .steps-list .step-item:last-child {
    border-bottom: none;
  }

  .step-number {
    width: 28px;
    height: 28px;
    background: var(--accent-color);
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-size: 13px;
    flex-shrink: 0;
  }

  .step-content {
    flex: 1;
    font-size: 15px;
    line-height: 1.6;
    padding-top: 3px;
  }

  .card-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 24px;
    border-top: 1px solid var(--border-color);
    flex-shrink: 0;
  }

  .footer-right {
    display: flex;
    gap: 12px;
  }

  .danger {
    background: var(--danger-color);
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: opacity 0.15s ease;
  }

  .danger:hover {
    opacity: 0.9;
  }

  .confirm-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1100;
  }

  .confirm-dialog {
    background: var(--bg-primary);
    border-radius: 12px;
    padding: 24px;
    max-width: 400px;
    width: 90%;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.2);
  }

  .confirm-dialog h3 {
    margin: 0 0 12px 0;
    font-size: 18px;
    font-weight: 600;
  }

  .confirm-dialog p {
    margin: 0 0 20px 0;
    color: var(--text-secondary);
    font-size: 14px;
    line-height: 1.5;
  }

  .confirm-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }

</style>
