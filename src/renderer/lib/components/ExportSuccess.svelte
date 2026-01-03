<script lang="ts">
  import QRCode from './QRCode.svelte';
  import ParticleOrb from './ParticleOrb.svelte';

  interface Props {
    onStartOver: () => void;
  }

  let { onStartOver }: Props = $props();

  const qrData = 'x-apple-reminderkit://';
</script>

<div class="export-success">
  <div class="left-panel">
    <div class="success-icon">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
    </div>

    <h1 class="heading">Sent to Reminders!</h1>

    <p class="subtitle">
      Scan the code with your iPhone camera to open Reminders
    </p>

    <p class="folder-info">
      Your items are in the "Batched Shopping List" folder
    </p>

    <button class="primary start-over-btn" onclick={onStartOver}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
        <path d="M3 3v5h5"></path>
      </svg>
      Start Over
    </button>
  </div>

  <div class="right-panel">
    <div class="qr-container">
      <ParticleOrb width={360} height={360} particleCount={55} />
      <div class="qr-wrapper">
        <QRCode data={qrData} size={200} foreground="#D4A05A" />
      </div>
    </div>
  </div>
</div>

<style>
  .export-success {
    position: fixed;
    inset: 0;
    z-index: 100;
    background: var(--bg-primary);
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 32px;
    align-items: center;
    padding: 48px;
  }

  .left-panel {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
    max-width: 380px;
  }

  .success-icon {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background: color-mix(in srgb, var(--success-color) 15%, transparent);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--success-color);
    margin-bottom: 8px;
  }

  .heading {
    font-size: 28px;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0;
  }

  .subtitle {
    font-size: 15px;
    color: var(--text-secondary);
    line-height: 1.5;
    margin: 0;
  }

  .folder-info {
    font-size: 14px;
    color: var(--text-secondary);
    background: var(--bg-secondary);
    padding: 12px 16px;
    border-radius: 8px;
    margin: 8px 0 0 0;
  }

  .start-over-btn {
    margin-top: 16px;
    padding: 12px 24px;
    font-size: 15px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .right-panel {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .qr-container {
    position: relative;
    width: 360px;
    height: 360px;
  }

  .qr-container :global(.particle-canvas) {
    position: absolute;
    top: 0;
    left: 0;
    z-index: 0;
  }

  .qr-wrapper {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 1;
  }
</style>
