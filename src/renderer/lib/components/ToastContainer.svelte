<script lang="ts" module>
  export interface ToastData {
    id: string;
    message: string;
    type: 'success' | 'error';
  }
</script>

<script lang="ts">
  import Toast from './Toast.svelte';

  interface Props {
    toasts: ToastData[];
    onRemove: (id: string) => void;
  }

  let { toasts, onRemove }: Props = $props();
</script>

<div class="toast-container">
  {#each toasts as toast (toast.id)}
    <Toast
      message={toast.message}
      type={toast.type}
      onDismiss={() => onRemove(toast.id)}
    />
  {/each}
</div>

<style>
  .toast-container {
    position: fixed;
    top: 48px;
    right: 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    z-index: 9999;
    pointer-events: none;
  }

  .toast-container :global(.toast) {
    pointer-events: auto;
  }
</style>
