<script lang="ts">
  import QRCodeStyling from 'qr-code-styling';

  interface Props {
    data: string;
    size?: number;
    foreground?: string;
  }

  let { data, size = 160, foreground = '#D4A05A' }: Props = $props();
  let container: HTMLDivElement;

  $effect(() => {
    if (!container || !data) return;

    // Clear previous QR code
    container.innerHTML = '';

    const qrCode = new QRCodeStyling({
      width: size,
      height: size,
      type: 'svg',
      data: data,
      shape: 'circle',
      dotsOptions: {
        color: foreground,
        type: 'dots'
      },
      cornersSquareOptions: {
        color: foreground,
        type: 'extra-rounded'
      },
      cornersDotOptions: {
        color: foreground,
        type: 'dot'
      },
      backgroundOptions: {
        color: 'transparent'
      },
      qrOptions: {
        errorCorrectionLevel: 'H'
      }
    });

    qrCode.append(container);
  });

  // Border ring dimensions
  const borderSize = size + 24;
  const radius = borderSize / 2 - 4;
</script>

<div class="circular-qr" style="--size: {size}px; --border-size: {borderSize}px">
  <svg class="spinner-ring" width={borderSize} height={borderSize} viewBox="0 0 {borderSize} {borderSize}">
    <circle
      cx={borderSize / 2}
      cy={borderSize / 2}
      r={radius}
      fill="none"
      stroke={foreground}
      stroke-width="3"
      stroke-dasharray="85 28"
      stroke-linecap="round"
      opacity="0.6"
    />
  </svg>
  <div class="qr-container" bind:this={container}></div>
</div>

<style>
  .circular-qr {
    position: relative;
    display: inline-block;
    width: var(--border-size);
    height: var(--border-size);
  }

  .spinner-ring {
    position: absolute;
    top: 0;
    left: 0;
    animation: spin 24s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .qr-container {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: var(--size);
    height: var(--size);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .qr-container :global(svg) {
    display: block;
  }
</style>
