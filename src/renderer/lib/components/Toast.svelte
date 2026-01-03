<script lang="ts">
  interface Props {
    message: string;
    type?: 'success' | 'error';
    onDismiss: () => void;
  }

  let { message, type = 'success', onDismiss }: Props = $props();

  let visible = $state(false);

  $effect(() => {
    // Trigger animation on mount
    requestAnimationFrame(() => {
      visible = true;
    });

    // Auto-dismiss after 3 seconds
    const timer = setTimeout(() => {
      dismiss();
    }, 3000);

    return () => clearTimeout(timer);
  });

  function dismiss() {
    visible = false;
    setTimeout(onDismiss, 200); // Wait for exit animation
  }
</script>

<div class="toast {type}" class:visible>
  <div class="icon">
    {#if type === 'success'}
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M13.5 4.5L6.5 11.5L2.5 7.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    {:else}
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="2"/>
        <path d="M8 5V8.5M8 11H8.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
    {/if}
  </div>
  <span class="message">{message}</span>
  <button class="dismiss" onclick={dismiss} aria-label="Dismiss">
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M9 3L3 9M3 3L9 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    </svg>
  </button>
</div>

<style>
  .toast {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 14px;
    background: var(--bg-primary);
    border-radius: 10px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15), 0 0 0 1px var(--border-color);
    transform: translateX(120%);
    opacity: 0;
    transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.25s ease;
    max-width: 320px;
  }

  .toast.visible {
    transform: translateX(0);
    opacity: 1;
  }

  .icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .success .icon {
    background: color-mix(in srgb, var(--success-color) 15%, transparent);
    color: var(--success-color);
  }

  .error .icon {
    background: color-mix(in srgb, var(--danger-color) 15%, transparent);
    color: var(--danger-color);
  }

  .message {
    flex: 1;
    font-size: 13px;
    font-weight: 500;
    color: var(--text-primary);
    line-height: 1.4;
  }

  .dismiss {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    padding: 0;
    background: none;
    border: none;
    border-radius: 4px;
    color: var(--text-secondary);
    cursor: pointer;
    flex-shrink: 0;
    transition: background 0.15s ease, color 0.15s ease;
  }

  .dismiss:hover {
    background: var(--bg-secondary);
    color: var(--text-primary);
  }
</style>
