<script lang="ts">
  import { onMount } from 'svelte';

  interface Props {
    activeSection: 'recipes' | 'shop';
    onNavigate: (section: 'recipes' | 'shop') => void;
    shopItemCount?: number;
  }

  let { activeSection, onNavigate, shopItemCount = 0 }: Props = $props();
  let version = $state('');

  onMount(async () => {
    version = await window.api.app.getVersion();
  });
</script>

<aside class="sidebar">
  <div class="drag-region title-bar"></div>
  <div class="logo">
    <img src="/logo.webp" alt="Batched" class="logo-img" />
  </div>

  <nav class="nav">
    <button
      class="nav-item"
      class:active={activeSection === 'recipes'}
      onclick={() => onNavigate('recipes')}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
      </svg>
      <span>Recipes</span>
    </button>

    <button
      class="nav-item"
      class:active={activeSection === 'shop'}
      onclick={() => onNavigate('shop')}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="9" cy="21" r="1"/>
        <circle cx="20" cy="21" r="1"/>
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
      </svg>
      <span>Shop</span>
      {#if shopItemCount > 0}
        <span class="badge">{shopItemCount}</span>
      {/if}
    </button>
  </nav>

  <div class="version">v{version}</div>
</aside>

<style>
  .sidebar {
    width: 200px;
    background: var(--bg-sidebar);
    border-right: 1px solid var(--border-color);
    display: flex;
    flex-direction: column;
    padding: 0;
  }

  .title-bar {
    height: 52px;
    flex-shrink: 0;
  }

  .logo {
    padding: 0 20px 24px;
    border-bottom: 1px solid var(--border-color);
    margin-bottom: 16px;
  }

  .logo-img {
    height: 32px;
    width: auto;
  }

  .nav {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 0 12px;
  }

  .nav-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    background: none;
    border: none;
    border-radius: 6px;
    color: var(--text-secondary);
    text-align: left;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .nav-item:hover {
    background: color-mix(in srgb, var(--text-primary) 5%, transparent);
    color: var(--text-primary);
  }

  .nav-item.active {
    background: var(--accent-color);
    color: white;
  }

  .nav-item span {
    font-size: 14px;
    font-weight: 500;
  }

  .badge {
    margin-left: auto;
    min-width: 20px;
    height: 20px;
    padding: 0 6px;
    border-radius: 10px;
    background: var(--accent-color);
    color: white;
    font-size: 12px;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .nav-item.active .badge {
    background: white;
    color: var(--accent-color);
  }

  .version {
    margin-top: auto;
    padding: 16px 20px;
    font-size: 11px;
    color: var(--text-tertiary, #999);
    opacity: 0.7;
  }
</style>
