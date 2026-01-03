<script lang="ts">
  import type { Ingredient, StandardUnit, RecipeIngredient, FoodComboIngredient } from '../../../shared/types';
  import { UNIT_OPTIONS } from '../../../shared/types';
  import foodComboIngredients from '../../../data/ingredients.json';
  import { initializeSearch, searchIngredients } from '../../../shared/ingredientSearch';

  interface Props {
    ingredient: Partial<RecipeIngredient>;
    existingIngredients: Ingredient[];
    onUpdate: (ingredient: Partial<RecipeIngredient>) => void;
    onRemove: () => void;
  }

  let { ingredient, existingIngredients, onUpdate, onRemove }: Props = $props();

  let quantity = $state(ingredient.quantity ?? 1);
  let unit = $state<StandardUnit>(ingredient.unit ?? 'piece');
  let ingredientName = $state(ingredient.ingredient?.displayName ?? '');
  let showSuggestions = $state(false);
  let selectedImage = $state(ingredient.ingredient?.image ?? '');
  let selectedSlug = $state(ingredient.ingredient?.slug ?? '');

  // Cast the imported JSON to the correct type
  const allFoodComboIngredients = foodComboIngredients as FoodComboIngredient[];

  // Initialize smart search
  initializeSearch(allFoodComboIngredients);

  // Search through FoodCombo ingredients with smart matching
  let filteredSuggestions = $derived(
    searchIngredients(ingredientName, 8)
  );

  function getImageUrl(imagePath: string): string {
    // Use relative path - works in both dev and packaged app
    return imagePath;
  }

  function handleQuantityChange(e: Event) {
    const target = e.target as HTMLInputElement;
    quantity = parseFloat(target.value) || 0;
    emitUpdate();
  }

  function handleUnitChange(e: Event) {
    const target = e.target as HTMLSelectElement;
    unit = target.value as StandardUnit;
    emitUpdate();
  }

  function handleNameChange(e: Event) {
    const target = e.target as HTMLInputElement;
    ingredientName = target.value;
    showSuggestions = true;
    emitUpdate();
  }

  function handleNameFocus() {
    showSuggestions = true;
  }

  function handleNameBlur() {
    setTimeout(() => {
      showSuggestions = false;
    }, 200);
  }

  function selectSuggestion(suggestion: FoodComboIngredient) {
    ingredientName = suggestion.name;
    selectedImage = suggestion.image;
    selectedSlug = suggestion.slug;
    showSuggestions = false;

    // Check if we have this ingredient in the database already
    const existingMatch = existingIngredients.find(
      i => i.displayName.toLowerCase() === suggestion.name.toLowerCase()
    );

    onUpdate({
      ...ingredient,
      quantity,
      unit,
      ingredient: existingMatch ?? {
        id: '',
        canonicalName: suggestion.slug,
        displayName: suggestion.name,
        slug: suggestion.slug,
        image: suggestion.image,
      },
    });
  }

  function emitUpdate() {
    const existingMatch = existingIngredients.find(
      i => i.displayName.toLowerCase() === ingredientName.toLowerCase()
    );

    // Also check FoodCombo ingredients for image and slug
    const foodComboMatch = allFoodComboIngredients.find(
      i => i.name.toLowerCase() === ingredientName.toLowerCase()
    );

    onUpdate({
      ...ingredient,
      quantity,
      unit,
      ingredient: existingMatch ?? {
        id: '',
        canonicalName: ingredientName.toLowerCase().trim(),
        displayName: ingredientName.trim(),
        slug: foodComboMatch?.slug ?? selectedSlug || undefined,
        image: foodComboMatch?.image ?? selectedImage,
      },
    });
  }
</script>

<div class="ingredient-row">
  {#if selectedImage}
    <div class="selected-image">
      <img src={getImageUrl(selectedImage)} alt={ingredientName} />
    </div>
  {/if}

  <input
    type="number"
    class="quantity-input"
    value={quantity}
    min="0"
    step="0.25"
    oninput={handleQuantityChange}
    placeholder="Qty"
  />

  <select class="unit-select" value={unit} onchange={handleUnitChange}>
    {#each UNIT_OPTIONS as option}
      <option value={option.value}>{option.label}</option>
    {/each}
  </select>

  <div class="ingredient-input-wrapper">
    <input
      type="text"
      class="ingredient-input"
      value={ingredientName}
      oninput={handleNameChange}
      onfocus={handleNameFocus}
      onblur={handleNameBlur}
      placeholder="Search ingredient..."
    />

    {#if showSuggestions && filteredSuggestions.length > 0}
      <div class="suggestions">
        {#each filteredSuggestions as suggestion}
          <button
            type="button"
            class="suggestion-item"
            onmousedown={() => selectSuggestion(suggestion)}
          >
            <img
              src={getImageUrl(suggestion.image)}
              alt={suggestion.name}
              class="suggestion-image"
            />
            <div class="suggestion-info">
              <span class="suggestion-name">{suggestion.name}</span>
              <span class="suggestion-category">{suggestion.category}</span>
            </div>
          </button>
        {/each}
      </div>
    {/if}
  </div>

  <button type="button" class="remove-btn" onclick={onRemove}>
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  </button>
</div>

<style>
  .ingredient-row {
    display: flex;
    gap: 8px;
    align-items: flex-start;
  }

  .selected-image {
    width: 36px;
    height: 36px;
    border-radius: 6px;
    overflow: hidden;
    flex-shrink: 0;
    background: var(--bg-secondary);
  }

  .selected-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .quantity-input {
    width: 70px;
    text-align: center;
  }

  .unit-select {
    width: 100px;
  }

  .ingredient-input-wrapper {
    flex: 1;
    position: relative;
  }

  .ingredient-input {
    width: 100%;
  }

  .suggestions {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
    z-index: 100;
    margin-top: 4px;
    overflow: hidden;
    max-height: 320px;
    overflow-y: auto;
  }

  .suggestion-item {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    text-align: left;
    padding: 8px 12px;
    background: none;
    border: none;
    border-radius: 0;
    cursor: pointer;
    font-size: 13px;
    transition: background 0.15s;
  }

  .suggestion-item:hover {
    background: var(--bg-secondary);
  }

  .suggestion-image {
    width: 40px;
    height: 40px;
    border-radius: 6px;
    object-fit: cover;
    flex-shrink: 0;
  }

  .suggestion-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .suggestion-name {
    font-weight: 500;
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .suggestion-category {
    font-size: 11px;
    color: var(--text-secondary);
  }

  .remove-btn {
    padding: 8px;
    background: none;
    border: none;
    color: var(--text-secondary);
    cursor: pointer;
    border-radius: 4px;
  }

  .remove-btn:hover {
    background: color-mix(in srgb, var(--danger-color) 10%, transparent);
    color: var(--danger-color);
  }
</style>
