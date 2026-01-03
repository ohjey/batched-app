<script lang="ts">
  interface Props {
    value: number;
    min?: number;
    max?: number;
    step?: number;
    onchange?: (value: number) => void;
    disabled?: boolean;
  }

  let { value, min = 0, max = 9999, step = 1, onchange, disabled = false }: Props = $props();

  let inputValue = $state(formatValue(value));
  let inputEl: HTMLInputElement;

  // Sync inputValue when external value changes
  $effect(() => {
    inputValue = formatValue(value);
  });

  function formatValue(val: number): string {
    // Display clean decimals (e.g., 0.25, 1, 1.5)
    return val % 1 === 0 ? val.toString() : val.toFixed(2).replace(/\.?0+$/, '');
  }

  function clamp(val: number): number {
    return Math.min(max, Math.max(min, val));
  }

  function roundToStep(val: number): number {
    return Math.round(val / step) * step;
  }

  function updateValue(newVal: number) {
    const clamped = clamp(roundToStep(newVal));
    if (clamped !== value) {
      onchange?.(clamped);
    }
    inputValue = formatValue(clamped);
  }

  function increment() {
    updateValue(value + step);
  }

  function decrement() {
    updateValue(value - step);
  }

  function handleInput(e: Event) {
    const target = e.target as HTMLInputElement;
    inputValue = target.value;
  }

  function handleBlur() {
    const parsed = parseFloat(inputValue);
    if (isNaN(parsed)) {
      inputValue = formatValue(value);
    } else {
      updateValue(parsed);
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      increment();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      decrement();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      inputEl?.blur();
    }
  }
</script>

<div class="number-stepper" class:disabled>
  <button
    type="button"
    class="stepper-btn decrement"
    onclick={decrement}
    disabled={disabled || value <= min}
    aria-label="Decrease value"
  >
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  </button>

  <input
    bind:this={inputEl}
    type="text"
    inputmode="decimal"
    class="stepper-value"
    value={inputValue}
    oninput={handleInput}
    onblur={handleBlur}
    onkeydown={handleKeydown}
    disabled={disabled}
    aria-label="Quantity"
  />

  <button
    type="button"
    class="stepper-btn increment"
    onclick={increment}
    disabled={disabled || value >= max}
    aria-label="Increase value"
  >
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  </button>
</div>

<style>
  .number-stepper {
    display: flex;
    align-items: stretch;
    height: 32px;
    background: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: 6px;
    overflow: hidden;
    width: 100px;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
  }

  .number-stepper:focus-within {
    border-color: var(--accent-color);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent-color) 15%, transparent);
  }

  .stepper-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    flex-shrink: 0;
    background: var(--bg-secondary);
    border: none;
    border-radius: 0;
    color: var(--accent-color);
    cursor: pointer;
    transition: background 0.15s ease, color 0.15s ease;
    padding: 0;
  }

  .stepper-btn:hover:not(:disabled) {
    background: color-mix(in srgb, var(--accent-color) 15%, transparent);
  }

  .stepper-btn:active:not(:disabled) {
    background: color-mix(in srgb, var(--accent-color) 25%, transparent);
  }

  .stepper-btn:disabled {
    color: var(--text-secondary);
    cursor: not-allowed;
    opacity: 0.5;
  }

  .stepper-btn.decrement {
    border-right: 1px solid var(--border-color);
  }

  .stepper-btn.increment {
    border-left: 1px solid var(--border-color);
  }

  .stepper-value {
    flex: 1;
    min-width: 0;
    text-align: center;
    border: none;
    background: transparent;
    font-size: 13px;
    font-weight: 500;
    color: var(--text-primary);
    padding: 0 4px;
  }

  .stepper-value:focus {
    outline: none;
  }

  .number-stepper.disabled {
    opacity: 0.5;
    pointer-events: none;
  }
</style>
