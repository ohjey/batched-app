<script lang="ts">
  interface Option {
    value: string;
    label: string;
  }

  interface Props {
    value: string;
    options: Option[];
    onchange?: (value: string) => void;
    disabled?: boolean;
    placeholder?: string;
  }

  let { value, options, onchange, disabled = false, placeholder = 'Select...' }: Props = $props();

  let open = $state(false);
  let focusedIndex = $state(-1);
  let containerEl: HTMLDivElement;
  let triggerEl: HTMLButtonElement;
  let dropdownPosition = $state({ top: 0, left: 0, width: 0 });

  $effect(() => {
    if (open) {
      // Calculate dropdown position
      updateDropdownPosition();
      // Add click outside listener
      document.addEventListener('click', handleClickOutside);
      // Focus first option or selected option
      const selectedIdx = options.findIndex(opt => opt.value === value);
      focusedIndex = selectedIdx >= 0 ? selectedIdx : 0;
    } else {
      document.removeEventListener('click', handleClickOutside);
      focusedIndex = -1;
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  });

  function updateDropdownPosition() {
    if (!triggerEl) return;
    const rect = triggerEl.getBoundingClientRect();
    dropdownPosition = {
      top: rect.bottom + 4,
      left: rect.left,
      width: Math.max(rect.width, 120)
    };
  }

  function handleClickOutside(e: MouseEvent) {
    if (containerEl && !containerEl.contains(e.target as Node)) {
      open = false;
    }
  }

  function toggleDropdown() {
    if (disabled) return;
    open = !open;
  }

  function selectOption(optionValue: string) {
    if (optionValue !== value) {
      onchange?.(optionValue);
    }
    open = false;
    triggerEl?.focus();
  }

  function handleKeydown(e: KeyboardEvent) {
    if (disabled) return;

    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (open && focusedIndex >= 0) {
          selectOption(options[focusedIndex].value);
        } else {
          toggleDropdown();
        }
        break;
      case 'Escape':
        e.preventDefault();
        open = false;
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (!open) {
          open = true;
        } else {
          focusedIndex = Math.min(focusedIndex + 1, options.length - 1);
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (open) {
          focusedIndex = Math.max(focusedIndex - 1, 0);
        }
        break;
      default:
        // Type-ahead: jump to option starting with typed character
        if (e.key.length === 1 && open) {
          const char = e.key.toLowerCase();
          const startIdx = focusedIndex + 1;
          const matchIdx = options.findIndex((opt, i) =>
            i >= startIdx && opt.label.toLowerCase().startsWith(char)
          );
          if (matchIdx >= 0) {
            focusedIndex = matchIdx;
          } else {
            // Wrap around
            const wrapIdx = options.findIndex(opt =>
              opt.label.toLowerCase().startsWith(char)
            );
            if (wrapIdx >= 0) {
              focusedIndex = wrapIdx;
            }
          }
        }
    }
  }

  $effect(() => {
    // Scroll focused option into view
    if (open && focusedIndex >= 0) {
      const optionEl = containerEl?.querySelector(`[data-index="${focusedIndex}"]`);
      optionEl?.scrollIntoView({ block: 'nearest' });
    }
  });

  const selectedLabel = $derived(options.find(opt => opt.value === value)?.label || placeholder);
</script>

<div class="custom-select" class:open class:disabled bind:this={containerEl}>
  <button
    bind:this={triggerEl}
    type="button"
    class="select-trigger"
    onclick={toggleDropdown}
    onkeydown={handleKeydown}
    disabled={disabled}
    aria-haspopup="listbox"
    aria-expanded={open}
  >
    <span class="select-value">{selectedLabel}</span>
    <svg class="select-chevron" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  </button>

  {#if open}
    <div
      class="select-dropdown"
      role="listbox"
      style="top: {dropdownPosition.top}px; left: {dropdownPosition.left}px; width: {dropdownPosition.width}px;"
    >
      {#each options as option, index}
        <button
          type="button"
          class="select-option"
          class:selected={option.value === value}
          class:focused={focusedIndex === index}
          onclick={() => selectOption(option.value)}
          onmouseenter={() => focusedIndex = index}
          role="option"
          aria-selected={option.value === value}
          data-index={index}
        >
          {option.label}
          {#if option.value === value}
            <svg class="check-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          {/if}
        </button>
      {/each}
    </div>
  {/if}
</div>

<style>
  .custom-select {
    position: relative;
    width: 90px;
  }

  .select-trigger {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 4px;
    width: 100%;
    height: 32px;
    padding: 6px 8px;
    background: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: 6px;
    font-size: 13px;
    color: var(--text-primary);
    cursor: pointer;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
  }

  .select-trigger:hover:not(:disabled) {
    border-color: var(--text-secondary);
  }

  .select-trigger:focus {
    outline: none;
    border-color: var(--accent-color);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent-color) 15%, transparent);
  }

  .custom-select.open .select-trigger {
    border-color: var(--accent-color);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent-color) 15%, transparent);
  }

  .select-value {
    flex: 1;
    text-align: left;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .select-chevron {
    flex-shrink: 0;
    color: var(--text-secondary);
    transition: transform 0.2s ease;
  }

  .custom-select.open .select-chevron {
    transform: rotate(180deg);
  }

  .select-dropdown {
    position: fixed;
    background: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
    z-index: 1100;
    max-height: 200px;
    overflow-y: auto;
    padding: 4px;
  }

  .select-option {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 8px 10px;
    background: none;
    border: none;
    border-radius: 4px;
    font-size: 13px;
    color: var(--text-primary);
    cursor: pointer;
    transition: background 0.1s ease;
    text-align: left;
  }

  .select-option:hover,
  .select-option.focused {
    background: var(--bg-secondary);
  }

  .select-option.selected {
    font-weight: 500;
    color: var(--accent-color);
  }

  .check-icon {
    flex-shrink: 0;
    color: var(--accent-color);
  }

  .custom-select.disabled {
    opacity: 0.5;
    pointer-events: none;
  }
</style>
