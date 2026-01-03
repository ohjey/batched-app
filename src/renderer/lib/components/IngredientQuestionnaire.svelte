<script lang="ts">
  import type { ConsolidatedIngredient } from '../../../shared/types';
  import { pluralizeUnit } from '../../../shared/formatters';

  interface Props {
    ingredients: ConsolidatedIngredient[];
    onComplete: (ingredients: ConsolidatedIngredient[]) => void;
    onCancel: () => void;
  }

  let { ingredients, onComplete, onCancel }: Props = $props();

  let currentIndex = $state(0);
  let answers = $state<Map<string, boolean>>(new Map());

  function getIngredientKey(ing: ConsolidatedIngredient): string {
    return `${ing.ingredient.canonicalName}:${ing.note || ''}`;
  }

  function formatIngredientName(ing: ConsolidatedIngredient): string {
    return ing.note ? `${ing.ingredient.displayName} (${ing.note})` : ing.ingredient.displayName;
  }

  function getImageUrl(imagePath: string): string {
    return `/${imagePath}`;
  }

  function handleAnswer(alreadyHave: boolean) {
    const current = ingredients[currentIndex];
    const key = getIngredientKey(current);
    answers.set(key, alreadyHave);
    answers = new Map(answers); // Trigger reactivity

    if (currentIndex < ingredients.length - 1) {
      currentIndex++;
    } else {
      // Last ingredient - complete the questionnaire
      finishQuestionnaire();
    }
  }

  function finishQuestionnaire() {
    const finalIngredients = ingredients.map(ing => ({
      ...ing,
      alreadyHave: answers.get(getIngredientKey(ing)) ?? false,
    }));
    onComplete(finalIngredients);
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      onCancel();
    }
  }

  let currentIngredient = $derived(ingredients[currentIndex]);
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
<div class="modal-backdrop" onclick={onCancel}>
  <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
  <div class="modal" onclick={(e) => e.stopPropagation()}>
    <header class="modal-header">
      <div class="progress-segments">
        {#each ingredients as _, i}
          <div class="segment" class:completed={i <= currentIndex}></div>
        {/each}
      </div>
      <button type="button" class="close-btn" onclick={onCancel} aria-label="Close"><span>×</span></button>
    </header>

    <div class="modal-body">
      <p class="question">Do you already have this ingredient?</p>

      <div class="ingredient-card">
        {#if currentIngredient.ingredient.image}
          <img
            src={getImageUrl(currentIngredient.ingredient.image)}
            alt={currentIngredient.ingredient.displayName}
            class="ingredient-image"
          />
        {:else}
          <div class="ingredient-placeholder">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 0 1-8 0"/>
            </svg>
          </div>
        {/if}

        <h3 class="ingredient-name">{formatIngredientName(currentIngredient)}</h3>
        <p class="ingredient-quantity">{currentIngredient.totalQuantity} {pluralizeUnit(currentIngredient.totalQuantity, currentIngredient.unit)}</p>
      </div>
    </div>

    <footer class="modal-footer">
      <button class="btn have" onclick={() => handleAnswer(true)} aria-label="Already have it">×</button>
      <button class="btn need" onclick={() => handleAnswer(false)}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="9" cy="21" r="1"/>
          <circle cx="20" cy="21" r="1"/>
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
        </svg>
        Need it
      </button>
    </footer>
  </div>
</div>

<style>
  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .modal {
    background: var(--bg-primary);
    border-radius: 16px;
    width: 400px;
    max-width: 90%;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    overflow: hidden;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
  }

  .progress-segments {
    display: flex;
    gap: 4px;
    flex: 1;
    min-width: 0;
    margin-right: 12px;
  }

  .segment {
    flex: 1;
    min-width: 4px;
    max-width: 32px;
    height: 4px;
    border-radius: 2px;
    background: var(--border-color);
    transition: background 0.2s ease;
  }

  .segment.completed {
    background: var(--accent-color);
  }

  .close-btn {
    width: 32px;
    height: 32px;
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
    transition: all 0.15s ease;
    font-size: 24px;
    line-height: 1;
  }

  .close-btn span {
    display: block;
    transform: translateY(-1px);
  }

  .close-btn:hover {
    background: var(--bg-secondary);
    color: var(--text-primary);
  }

  .modal-body {
    padding: 24px;
    text-align: center;
  }

  .question {
    font-size: 14px;
    color: var(--text-secondary);
    margin: 0 0 24px 0;
  }

  .ingredient-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }

  .ingredient-image {
    width: 80px;
    height: 80px;
    border-radius: 16px;
    object-fit: cover;
    background: var(--bg-secondary);
    margin-bottom: 8px;
  }

  .ingredient-placeholder {
    width: 80px;
    height: 80px;
    border-radius: 16px;
    background: var(--bg-secondary);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-secondary);
    opacity: 0.5;
    margin-bottom: 8px;
  }

  .ingredient-name {
    font-size: 24px;
    font-weight: 600;
    margin: 0;
  }

  .ingredient-quantity {
    font-size: 16px;
    color: var(--text-secondary);
    margin: 0;
  }

  .modal-footer {
    display: flex;
    gap: 12px;
    padding: 24px;
    border-top: 1px solid var(--border-color);
  }

  .btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 14px 20px;
    border: none;
    border-radius: 10px;
    font-size: 16px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .btn.have {
    background: var(--danger-color);
    color: white;
    flex: none;
    width: 52px;
    height: 52px;
    padding: 0;
    font-size: 28px;
    line-height: 1;
    border-radius: 10px;
  }

  .btn.have:hover {
    opacity: 0.9;
  }

  .btn.need {
    background: var(--accent-color);
    color: white;
    flex: 1;
  }

  .btn.need:hover {
    background: var(--accent-hover);
  }
</style>
