<script lang="ts">
  import type { Recipe, Ingredient, RecipeIngredient, StandardUnit, FoodComboIngredient } from '../../../shared/types';
  import { UNIT_OPTIONS } from '../../../shared/types';
  import { v4 as uuid } from 'uuid';
  import foodComboIngredients from '../../../data/ingredients.json';
  import { initializeSearch, searchIngredients } from '../../../shared/ingredientSearch';
  import { tooltip } from '../actions/tooltip';
  import NumberStepper from './NumberStepper.svelte';
  import CustomSelect from './CustomSelect.svelte';

  interface Props {
    recipe: Recipe | null;
    onBack: () => void;
    onSave: () => void;
    addToast: (message: string, type?: 'success' | 'error') => void;
  }

  let { recipe, onBack, onSave, addToast }: Props = $props();

  let name = $state(recipe?.name ?? '');
  let steps = $state<{ id: string; content: string }[]>(
    recipe?.steps?.map(s => ({ id: s.id, content: s.content })) ??
    [{ id: uuid(), content: '' }]
  );
  let ingredients = $state<Partial<RecipeIngredient>[]>(
    recipe?.ingredients.map(i => ({ ...i })) ?? []
  );
  let existingIngredients: Ingredient[] = $state([]);
  let saving = $state(false);
  let deleting = $state(false);

  // Multi-step form state
  let currentStep = $state(1);
  let includeInstructions = $state(recipe?.steps?.some(s => s.content.trim()) ?? false);
  let totalSteps = $derived(includeInstructions ? 3 : 2);

  // Search state
  let searchQuery = $state('');
  let searchFocused = $state(false);
  let searchInputElement: HTMLInputElement | null = $state(null);
  let dropdownPosition = $state({ top: 0, left: 0, width: 0 });

  // Error state
  let error = $state('');

  // Drag-and-drop state for instructions
  let draggedIndex = $state<number | null>(null);
  let dropTargetIndex = $state<number | null>(null);

  // Height animation state
  let modalBodyEl: HTMLDivElement | null = $state(null);
  let contentWrapperEl: HTMLDivElement | null = $state(null);
  let isAnimating = $state(false);
  let lastHeight = $state(0);

  const isEditing = recipe !== null;
  const allFoodComboIngredients = foodComboIngredients as FoodComboIngredient[];

  // Store initial state for change detection (edit mode only)
  const initialState = isEditing ? {
    name: recipe?.name ?? '',
    includeInstructions: recipe?.steps?.some(s => s.content.trim()) ?? false,
    ingredients: JSON.stringify(recipe?.ingredients.map(i => ({ id: i.id, quantity: i.quantity, unit: i.unit, note: i.note, ingredient: i.ingredient })) ?? []),
    steps: JSON.stringify(recipe?.steps?.map(s => ({ id: s.id, content: s.content })) ?? [])
  } : null;

  // Check if any changes made (for edit mode)
  let hasChanges = $derived(
    !isEditing ? true : (
      name !== initialState!.name ||
      includeInstructions !== initialState!.includeInstructions ||
      JSON.stringify(ingredients.map(i => ({ id: i.id, quantity: i.quantity, unit: i.unit, note: i.note, ingredient: i.ingredient }))) !== initialState!.ingredients ||
      JSON.stringify(steps) !== initialState!.steps
    )
  );

  // Initialize smart search
  initializeSearch(allFoodComboIngredients);

  // Filter ingredients based on search with smart matching
  let searchResults = $derived(
    searchIngredients(searchQuery, 12)
      .filter(i => !ingredients.some(added =>
        added.ingredient?.displayName?.toLowerCase() === i.name.toLowerCase()
      ))
  );

  // Update dropdown position when showing results
  function updateDropdownPosition() {
    if (searchInputElement) {
      const rect = searchInputElement.getBoundingClientRect();
      dropdownPosition = {
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width
      };
    }
  }

  // Update position when dropdown should show
  $effect(() => {
    if (searchQuery.length > 0 && searchResults.length > 0 && searchInputElement) {
      updateDropdownPosition();
    }
  });

  $effect(() => {
    loadExistingIngredients();
  });

  // ResizeObserver for auto height animation on any content change
  $effect(() => {
    if (!contentWrapperEl || !modalBodyEl) return;

    const observer = new ResizeObserver(() => {
      const newHeight = contentWrapperEl!.offsetHeight;

      // Initialize lastHeight on first observation
      if (lastHeight === 0) {
        lastHeight = newHeight;
        return;
      }

      // Animate if height changed and not already animating
      if (newHeight !== lastHeight && !isAnimating) {
        isAnimating = true;
        const startHeight = lastHeight;

        modalBodyEl!.style.height = `${startHeight}px`;
        modalBodyEl!.style.overflow = 'hidden';

        // Force reflow
        modalBodyEl!.offsetHeight;

        modalBodyEl!.style.height = `${newHeight}px`;

        setTimeout(() => {
          if (modalBodyEl) {
            modalBodyEl.style.height = '';
            modalBodyEl.style.overflow = '';
          }
          lastHeight = newHeight;
          isAnimating = false;
        }, 300);
      }
    });

    observer.observe(contentWrapperEl);
    return () => observer.disconnect();
  });

  async function loadExistingIngredients() {
    try {
      existingIngredients = await window.api.ingredients.getAll();
    } catch (err) {
      console.error('Failed to load ingredients:', err);
    }
  }

  function getImageUrl(imagePath: string): string {
    return imagePath;
  }

  function addIngredient(foodComboItem: FoodComboIngredient) {
    const existingMatch = existingIngredients.find(
      i => i.displayName.toLowerCase() === foodComboItem.name.toLowerCase()
    );

    const newIngredient: Partial<RecipeIngredient> = {
      id: uuid(),
      quantity: 1,
      unit: 'piece',
      ingredient: {
        ...(existingMatch ?? {
          id: '',
          canonicalName: foodComboItem.slug,
          displayName: foodComboItem.name,
        }),
        slug: foodComboItem.slug,
        image: foodComboItem.image,
      },
    };

    ingredients = [...ingredients, newIngredient];
    searchQuery = '';
  }

  function updateIngredientQuantity(index: number, value: number) {
    ingredients = ingredients.map((ing, i) =>
      i === index ? { ...ing, quantity: value } : ing
    );
  }

  function updateIngredientUnit(index: number, value: StandardUnit) {
    ingredients = ingredients.map((ing, i) =>
      i === index ? { ...ing, unit: value } : ing
    );
  }

  function updateIngredientNote(index: number, value: string) {
    ingredients = ingredients.map((ing, i) =>
      i === index ? { ...ing, note: value || undefined } : ing
    );
  }

  function removeIngredient(index: number) {
    ingredients = ingredients.filter((_, i) => i !== index);
  }

  function addStep() {
    steps = [...steps, { id: uuid(), content: '' }];
  }

  function removeStep(index: number) {
    if (steps.length <= 1) return;
    steps = steps.filter((_, i) => i !== index);
  }

  function updateStepContent(index: number, content: string) {
    steps = steps.map((step, i) =>
      i === index ? { ...step, content } : step
    );
  }

  // Drag-and-drop handlers for step reordering
  function handleDragStart(index: number) {
    draggedIndex = index;
  }

  function handleDragOver(e: DragEvent, index: number) {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      dropTargetIndex = index;
    }
  }

  function handleDragEnd() {
    if (draggedIndex !== null && dropTargetIndex !== null && draggedIndex !== dropTargetIndex) {
      const newSteps = [...steps];
      const [draggedItem] = newSteps.splice(draggedIndex, 1);
      newSteps.splice(dropTargetIndex, 0, draggedItem);
      steps = newSteps;
    }
    draggedIndex = null;
    dropTargetIndex = null;
  }

  // Auto-resize textarea to fit content
  function autoResize(e: Event) {
    const textarea = e.target as HTMLTextAreaElement;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 300) + 'px';
  }

  // Svelte action to auto-resize textarea on mount
  function autoResizeOnMount(textarea: HTMLTextAreaElement) {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 300) + 'px';
  }

  function getStepLabel(step: number): string {
    if (step === 1) return 'Details';
    if (step === 2) return 'Ingredients';
    return 'Instructions';
  }

  function canProceed(): boolean {
    if (currentStep === 1) {
      return name.trim().length > 0;
    }
    if (currentStep === 2) {
      return ingredients.length > 0;
    }
    return true;
  }

  function canSave(): boolean {
    if (!name.trim()) return false;
    if (ingredients.length === 0) return false;
    if (includeInstructions && !steps.some(s => s.content.trim())) return false;
    return true;
  }

  function handleNext() {
    if (!canProceed()) {
      if (currentStep === 1) {
        error = 'Please enter a recipe name';
      } else if (currentStep === 2) {
        error = 'Please add at least one ingredient';
      }
      return;
    }

    error = '';
    if (currentStep < totalSteps) {
      currentStep++;
    } else {
      handleSave();
    }
  }

  function handleBack() {
    error = '';
    if (currentStep > 1) {
      currentStep--;
    } else {
      onBack();
    }
  }

  function goToStep(step: number) {
    if (!isEditing) return;
    if (step >= 1 && step <= totalSteps) {
      error = '';
      currentStep = step;
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      const target = e.target as HTMLElement;
      // Don't trigger on textareas or search input
      if (target.tagName === 'TEXTAREA' || target.classList.contains('search-input')) {
        return;
      }
      e.preventDefault();
      handleNext();
    }
  }

  async function handleSave() {
    if (!name.trim()) {
      error = 'Please enter a recipe name';
      return;
    }

    if (ingredients.length === 0) {
      error = 'Please add at least one ingredient';
      return;
    }

    if (includeInstructions && !steps.some(s => s.content.trim())) {
      error = 'Please add at least one instruction step';
      return;
    }

    saving = true;
    try {
      const recipeData = {
        id: recipe?.id ?? uuid(),
        name: name.trim(),
        instructions: null,
        steps: includeInstructions ? $state.snapshot(steps).filter(s => s.content.trim()) : [],
        ingredients: $state.snapshot(ingredients),
      };

      if (isEditing) {
        await window.api.recipes.update(recipeData);
        addToast('Recipe saved successfully');
      } else {
        await window.api.recipes.create(recipeData);
        addToast('Recipe created successfully');
      }

      onSave();
    } catch (err) {
      console.error('Failed to save recipe:', err);
      addToast('Failed to save recipe. Please try again.', 'error');
    }
    saving = false;
  }

  async function handleDelete() {
    if (!recipe) return;

    if (!confirm(`Are you sure you want to delete "${recipe.name}"?`)) {
      return;
    }

    deleting = true;
    try {
      await window.api.recipes.delete(recipe.id);
      addToast('Recipe deleted');
      onSave();
    } catch (err) {
      console.error('Failed to delete recipe:', err);
      addToast('Failed to delete recipe. Please try again.', 'error');
    }
    deleting = false;
  }
</script>

<div class="modal-backdrop">
  <div class="modal" onkeydown={handleKeydown}>
    <header class="modal-header">
      <div class="header-top">
        <h2>{isEditing ? 'Edit Recipe' : 'New Recipe'}</h2>
        <button type="button" class="close-btn" onclick={onBack} use:tooltip={"Close"}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
      <div class="progress-bar">
        <div
          class="progress-indicator"
          style="width: calc((100% - 6px) / {totalSteps}); transform: translateX({(currentStep - 1) * 100}%);"
        ></div>
        {#each Array(totalSteps) as _, i}
          {@const step = i + 1}
          <button
            type="button"
            class="progress-segment"
            class:active={currentStep === step}
            class:completed={currentStep > step}
            class:clickable={isEditing}
            onclick={() => goToStep(step)}
            disabled={!isEditing}
          >
            {getStepLabel(step)}
          </button>
        {/each}
      </div>
    </header>

    <div class="modal-body" bind:this={modalBodyEl}>
      <div class="content-wrapper" bind:this={contentWrapperEl}>
      {#if currentStep === 1}
        <!-- Step 1: Details -->
        <div class="form-group">
          <label for="name">Recipe Name</label>
          <input
            id="name"
            type="text"
            bind:value={name}
            placeholder="e.g., Spaghetti Bolognese"
          />
        </div>

        <div class="form-group">
          <label class="toggle-label">
            <span>Add cooking instructions</span>
            <button
              type="button"
              class="toggle-switch"
              class:active={includeInstructions}
              onclick={() => includeInstructions = !includeInstructions}
              role="switch"
              aria-checked={includeInstructions}
            >
              <span class="toggle-slider"></span>
            </button>
          </label>
          <p class="toggle-description">
            {includeInstructions ? 'Step-by-step instructions will be added after ingredients' : 'Recipe will only include ingredients list'}
          </p>
        </div>
      {:else if currentStep === 2}
        <!-- Step 2: Ingredients -->
        <div class="form-group">
          <label>Ingredients</label>

        <div class="search-container">
          <svg class="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            class="search-input"
            bind:value={searchQuery}
            bind:this={searchInputElement}
            onfocus={() => searchFocused = true}
            onblur={() => setTimeout(() => searchFocused = false, 200)}
            placeholder="Search ingredients..."
          />

          {#if searchQuery.length > 0 && searchResults.length > 0}
            <div class="search-dropdown" style="top: {dropdownPosition.top}px; left: {dropdownPosition.left}px; width: {dropdownPosition.width}px;">
              {#each searchResults as item}
                <button
                  type="button"
                  class="dropdown-item"
                  onmousedown={() => addIngredient(item)}
                >
                  <img src={getImageUrl(item.image)} alt={item.name} />
                  <div class="result-info">
                    <span class="result-name">{item.name}</span>
                    <span class="result-category">{item.category}</span>
                  </div>
                </button>
              {/each}
            </div>
          {:else if searchQuery.length > 0 && searchResults.length === 0}
            <div class="search-dropdown" style="top: {dropdownPosition.top}px; left: {dropdownPosition.left}px; width: {dropdownPosition.width}px;">
              <div class="no-results">No ingredients found for "{searchQuery}"</div>
            </div>
          {/if}
        </div>

        {#if ingredients.length > 0}
          <div class="added-ingredients">
            {#each ingredients as ing, index (ing.id)}
              <div class="ingredient-item">
                {#if ing.ingredient?.image}
                  <img src={getImageUrl(ing.ingredient.image)} alt={ing.ingredient?.displayName} class="ingredient-thumb" />
                {:else}
                  <div class="ingredient-thumb placeholder"></div>
                {/if}

                <div class="ingredient-info">
                  <span class="ingredient-name">
                    {ing.ingredient?.displayName}{#if ing.note} <span class="ingredient-note">({ing.note})</span>{/if}
                  </span>
                  <input
                    type="text"
                    class="note-input"
                    value={ing.note ?? ''}
                    oninput={(e) => updateIngredientNote(index, (e.target as HTMLInputElement).value)}
                    placeholder="Add note (e.g., Red, Diced)"
                  />
                </div>

                <NumberStepper
                  value={ing.quantity ?? 1}
                  min={0}
                  step={0.25}
                  onchange={(value) => updateIngredientQuantity(index, value)}
                />

                <CustomSelect
                  value={ing.unit ?? 'piece'}
                  options={UNIT_OPTIONS}
                  onchange={(value) => updateIngredientUnit(index, value as StandardUnit)}
                />

                <button type="button" class="remove-btn" onclick={() => removeIngredient(index)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            {/each}
          </div>
        {:else}
          <div class="empty-state">
            <svg class="empty-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <p class="empty-title">No ingredients yet</p>
            <p class="empty-hint">Search above to add ingredients</p>
          </div>
        {/if}
        </div>
      {:else if currentStep === 3}
        <!-- Step 3: Instructions -->
        <div class="form-group">
          <div class="steps-header">
            <label>Instructions</label>
            <span class="step-count-badge">{steps.filter(s => s.content.trim()).length} step{steps.filter(s => s.content.trim()).length !== 1 ? 's' : ''}</span>
          </div>

          <div class="steps-list">
            {#each steps as step, index (step.id)}
              <div
                class="step-item"
                class:dragging={draggedIndex === index}
                class:drop-target={dropTargetIndex === index}
                draggable="true"
                ondragstart={() => handleDragStart(index)}
                ondragover={(e) => handleDragOver(e, index)}
                ondragend={handleDragEnd}
                role="listitem"
              >
                <button
                  type="button"
                  class="drag-handle"
                  aria-label="Drag to reorder step {index + 1}"
                >
                  <svg width="12" height="18" viewBox="0 0 12 18" fill="currentColor">
                    <circle cx="3" cy="3" r="1.5"/>
                    <circle cx="9" cy="3" r="1.5"/>
                    <circle cx="3" cy="9" r="1.5"/>
                    <circle cx="9" cy="9" r="1.5"/>
                    <circle cx="3" cy="15" r="1.5"/>
                    <circle cx="9" cy="15" r="1.5"/>
                  </svg>
                </button>
                <span class="step-number-badge">{index + 1}</span>
                <textarea
                  class="step-input"
                  value={step.content}
                  oninput={(e) => { updateStepContent(index, (e.target as HTMLTextAreaElement).value); autoResize(e); }}
                  placeholder={index === 0 ? "What's the first step?" : "Describe this step..."}
                  rows="1"
                  use:autoResizeOnMount
                ></textarea>
                <button
                  type="button"
                  class="step-delete-btn"
                  onclick={() => removeStep(index)}
                  disabled={steps.length <= 1}
                  aria-label="Delete step {index + 1}"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            {/each}
          </div>

          <div class="add-step-footer">
            <button type="button" class="add-step-btn-full" onclick={addStep}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Add a step
            </button>
          </div>
        </div>
      {/if}
      </div>
    </div>

    <footer class="modal-footer">
      {#if isEditing}
        <!-- Edit mode: [Delete] [Save] -->
        <button type="button" class="danger" onclick={handleDelete} disabled={deleting} use:tooltip={"Delete recipe"}>
          {deleting ? 'Deleting...' : 'Delete'}
        </button>
        {#if error}
          <p class="error-message">{error}</p>
        {/if}
        <div class="footer-right">
          <button type="button" class="primary" onclick={handleSave} disabled={saving || !canSave() || !hasChanges}>
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      {:else}
        <!-- Create mode: [Cancel/Back] [Next/Save Recipe] -->
        {#if error}
          <p class="error-message">{error}</p>
        {/if}
        <div class="footer-right">
          {#if currentStep > 1}
            <button type="button" class="secondary" onclick={handleBack}>
              Back
            </button>
          {/if}
          <button type="button" class="primary" onclick={handleNext} disabled={saving}>
            {#if currentStep === totalSteps}
              {saving ? 'Saving...' : 'Save Recipe'}
            {:else}
              Next
            {/if}
          </button>
        </div>
      {/if}
    </footer>
  </div>
</div>

<style>
  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 24px;
  }

  .modal {
    background: var(--bg-primary);
    border-radius: 16px;
    width: 100%;
    max-width: 600px;
    max-height: calc(100vh - 48px);
    display: flex;
    flex-direction: column;
    box-shadow: 0 24px 48px rgba(0, 0, 0, 0.2);
  }

  .modal-header {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 20px 24px;
    border-bottom: 1px solid var(--border-color);
  }

  .header-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .modal-header h2 {
    font-size: 20px;
    font-weight: 600;
  }

  /* Progress Bar - iOS Segmented Control */
  .progress-bar {
    display: flex;
    position: relative;
    background: var(--bg-secondary);
    border-radius: 8px;
    padding: 3px;
  }

  .progress-indicator {
    position: absolute;
    top: 3px;
    bottom: 3px;
    left: 3px;
    background: var(--bg-primary);
    border-radius: 6px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    transition: transform 0.25s ease, width 0.25s ease;
    z-index: 0;
  }

  .progress-segment {
    flex: 1;
    padding: 6px 12px;
    border-radius: 6px;
    border: none;
    background: transparent;
    font-size: 13px;
    font-weight: 500;
    color: var(--text-secondary);
    cursor: default;
    transition: color 0.2s;
    position: relative;
    z-index: 1;
  }

  .progress-segment.clickable {
    cursor: pointer;
  }

  .progress-segment.clickable:hover {
    color: var(--text-primary);
  }

  .progress-segment.active {
    color: var(--text-primary);
  }

  .progress-segment.completed {
    color: var(--text-primary);
  }

  .close-btn {
    padding: 8px;
    background: none;
    border: none;
    color: var(--text-secondary);
    cursor: pointer;
    border-radius: 8px;
  }

  .close-btn:hover {
    background: var(--bg-secondary);
    color: var(--text-primary);
  }

  .modal-body {
    overflow-y: auto;
    overflow-x: visible;
    max-height: calc(80vh - 180px);
    transition: height 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    will-change: height;
  }

  .content-wrapper {
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .form-group label {
    font-weight: 500;
    color: var(--text-primary);
  }

  .form-group input[type="text"],
  .form-group textarea {
    width: 100%;
  }

  /* Toggle Switch */
  .toggle-label {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: 500;
    color: var(--text-primary);
  }

  .toggle-switch {
    position: relative;
    width: 44px;
    height: 24px;
    background: var(--border-color);
    border: none;
    border-radius: 12px;
    cursor: pointer;
    transition: background 0.2s;
    padding: 0;
  }

  .toggle-switch.active {
    background: var(--accent-color);
  }

  .toggle-slider {
    position: absolute;
    top: 2px;
    left: 2px;
    width: 20px;
    height: 20px;
    background: var(--bg-primary);
    border-radius: 50%;
    transition: transform 0.2s;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  }

  .toggle-switch.active .toggle-slider {
    transform: translateX(20px);
  }

  .toggle-description {
    font-size: 13px;
    color: var(--text-secondary);
    margin: 0;
  }

  .search-container {
    position: relative;
  }

  .search-icon {
    position: absolute;
    left: 12px;
    top: 11px;
    color: var(--text-secondary);
    pointer-events: none;
  }

  .search-input {
    width: 100%;
    padding-left: 40px !important;
    font-size: 14px;
  }

  .search-dropdown {
    position: fixed;
    background: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: 10px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
    z-index: 1100;
    max-height: min(300px, 40vh);
    overflow-y: auto;
  }

  .dropdown-item {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    padding: 10px 14px;
    background: none;
    border: none;
    border-bottom: 1px solid var(--border-color);
    cursor: pointer;
    text-align: left;
    transition: background 0.15s;
  }

  .dropdown-item:last-child {
    border-bottom: none;
  }

  .dropdown-item:hover {
    background: var(--bg-secondary);
  }

  .dropdown-item img {
    width: 40px;
    height: 40px;
    border-radius: 8px;
    object-fit: cover;
    flex-shrink: 0;
  }

  .result-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .result-name {
    font-weight: 500;
    font-size: 14px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    color: var(--text-primary);
  }

  .result-category {
    font-size: 12px;
    color: var(--text-secondary);
  }

  .no-results {
    text-align: center;
    padding: 20px 16px;
    color: var(--text-secondary);
    font-size: 13px;
  }

  .added-ingredients {
    display: flex;
    flex-direction: column;
    gap: 0;
    margin-top: 16px;
  }

  .ingredient-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 0;
    border-bottom: 1px solid var(--border-color);
  }

  .ingredient-item:last-child {
    border-bottom: none;
  }

  .ingredient-thumb {
    width: 40px;
    height: 40px;
    border-radius: 8px;
    object-fit: cover;
    flex-shrink: 0;
  }

  .ingredient-thumb.placeholder {
    background: var(--border-color);
  }

  .ingredient-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }

  .ingredient-name {
    font-weight: 500;
    font-size: 14px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .ingredient-note {
    color: var(--text-secondary);
    font-weight: 400;
  }

  .note-input {
    padding: 4px 8px;
    font-size: 12px;
    border: 1px solid transparent;
    background: transparent;
    border-radius: 4px;
    width: 100%;
  }

  .note-input:hover {
    background: var(--bg-primary);
    border-color: var(--border-color);
  }

  .note-input:focus {
    background: var(--bg-primary);
    border-color: var(--accent-color);
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent-color) 10%, transparent);
  }

  .note-input::placeholder {
    color: var(--text-secondary);
    opacity: 0.7;
  }

  .remove-btn {
    padding: 6px;
    background: none;
    border: none;
    color: var(--text-secondary);
    cursor: pointer;
    border-radius: 6px;
    flex-shrink: 0;
  }

  .remove-btn:hover {
    background: color-mix(in srgb, var(--danger-color) 10%, transparent);
    color: var(--danger-color);
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 48px 24px;
    text-align: center;
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

  .modal-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 24px;
    border-top: 1px solid var(--border-color);
    gap: 12px;
  }

  .error-message {
    color: var(--danger-color);
    font-size: 13px;
    margin: 0;
    flex: 1;
  }

  .footer-right {
    display: flex;
    gap: 12px;
    margin-left: auto;
  }

  .modal-footer button.primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .steps-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }

  .step-count-badge {
    font-size: 13px;
    color: var(--text-secondary);
    font-weight: 500;
  }

  .steps-list {
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .step-item {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 12px 0;
    border-bottom: 1px solid var(--border-color);
    transition: background 0.15s, box-shadow 0.2s, transform 0.2s;
    background: transparent;
    position: relative;
  }

  .step-item:last-child {
    border-bottom: none;
  }

  .step-item.dragging {
    background: var(--bg-primary);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
    border-radius: 8px;
    z-index: 10;
    border-bottom: none;
  }

  .step-item.drop-target::before {
    content: '';
    position: absolute;
    top: -1px;
    left: 0;
    right: 0;
    height: 2px;
    background: var(--accent-color);
    border-radius: 1px;
  }

  /* Drag handle */
  .drag-handle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    flex-shrink: 0;
    cursor: grab;
    color: var(--border-color);
    background: none;
    border: none;
    border-radius: 4px;
    transition: color 0.15s;
    margin-top: 6px;
  }

  .drag-handle:hover {
    color: var(--text-secondary);
  }

  .drag-handle:active,
  .dragging .drag-handle {
    cursor: grabbing;
  }

  /* Step number badge */
  .step-number-badge {
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
    margin-top: 4px;
  }

  .step-input {
    flex: 1;
    resize: none;
    min-height: 36px;
    max-height: 300px;
    overflow-y: auto;
    border: 1px solid var(--border-color);
    border-radius: 6px;
    padding: 8px 10px;
    font-size: 14px;
    line-height: 1.4;
    transition: border-color 0.15s, box-shadow 0.15s;
  }

  .step-input:focus {
    outline: none;
    border-color: var(--accent-color);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent-color) 15%, transparent);
  }

  /* Delete button - always visible but subtle */
  .step-delete-btn {
    padding: 8px;
    background: none;
    border: none;
    color: var(--border-color);
    cursor: pointer;
    border-radius: 6px;
    flex-shrink: 0;
    transition: background 0.15s, color 0.15s;
    margin-top: 4px;
  }

  .step-delete-btn:hover:not(:disabled) {
    background: color-mix(in srgb, var(--danger-color) 10%, transparent);
    color: var(--danger-color);
  }

  .step-delete-btn:disabled {
    opacity: 0;
    pointer-events: none;
  }

  /* Add step footer button */
  .add-step-footer {
    padding: 16px 0 0;
  }

  .add-step-btn-full {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    padding: 12px;
    background: transparent;
    border: 2px dashed var(--border-color);
    border-radius: 8px;
    color: var(--text-secondary);
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s;
  }

  .add-step-btn-full:hover {
    border-color: var(--accent-color);
    border-style: solid;
    color: var(--accent-color);
    background: color-mix(in srgb, var(--accent-color) 5%, transparent);
  }

  /* Step animations */
  @keyframes step-enter {
    from {
      opacity: 0;
      transform: translateY(-8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .step-item {
    animation: step-enter 0.2s ease-out;
  }
</style>
