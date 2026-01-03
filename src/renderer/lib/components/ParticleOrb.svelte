<script lang="ts">
  interface Props {
    width?: number;
    height?: number;
    particleCount?: number;
  }

  let { width = 320, height = 320, particleCount = 50 }: Props = $props();

  let canvas: HTMLCanvasElement;

  interface Particle {
    angle: number;
    orbitRadius: number;
    speed: number;
    radius: number;
    opacity: number;
    pulsePhase: number;
    orbitTilt: number;
    verticalOffset: number;
  }

  function hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
      : { r: 212, g: 160, b: 90 }; // Fallback to accent color
  }

  $effect(() => {
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Get accent color from CSS variables
    const accentHex = getComputedStyle(document.documentElement).getPropertyValue('--accent-color').trim();
    const accent = hexToRgb(accentHex);
    // Lighter variant for bright center
    const lightAccent = {
      r: Math.min(255, accent.r + 60),
      g: Math.min(255, accent.g + 60),
      b: Math.min(255, accent.b + 60)
    };

    const centerX = width / 2;
    const centerY = height / 2;
    const minOrbitRadius = 130;
    const maxOrbitRadius = 170;

    // Initialize particles
    const particles: Particle[] = Array.from({ length: particleCount }, () => ({
      angle: Math.random() * Math.PI * 2,
      orbitRadius: minOrbitRadius + Math.random() * (maxOrbitRadius - minOrbitRadius),
      speed: (Math.random() - 0.5) * 0.002 + (Math.random() > 0.5 ? 0.001 : -0.001),
      radius: Math.random() * 2.5 + 1,
      opacity: Math.random() * 0.4 + 0.3,
      pulsePhase: Math.random() * Math.PI * 2,
      orbitTilt: (Math.random() - 0.5) * 0.4,
      verticalOffset: (Math.random() - 0.5) * 30
    }));

    let animationId: number;
    let startTime = Date.now();

    function animate() {
      const elapsed = (Date.now() - startTime) * 0.001;

      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // Draw particles
      particles.forEach(p => {
        // Update angle
        p.angle += p.speed;

        // Calculate position with slight elliptical orbit and tilt
        const x = centerX + Math.cos(p.angle) * p.orbitRadius;
        const y = centerY + Math.sin(p.angle) * p.orbitRadius * (0.85 + p.orbitTilt) + p.verticalOffset;

        // Pulsing opacity
        const pulse = Math.sin(elapsed * 0.7 + p.pulsePhase) * 0.25 + 0.75;
        const currentOpacity = p.opacity * pulse;

        // Draw outer glow
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, p.radius * 4);
        gradient.addColorStop(0, `rgba(${accent.r}, ${accent.g}, ${accent.b}, ${currentOpacity * 0.4})`);
        gradient.addColorStop(0.5, `rgba(${accent.r}, ${accent.g}, ${accent.b}, ${currentOpacity * 0.15})`);
        gradient.addColorStop(1, `rgba(${accent.r}, ${accent.g}, ${accent.b}, 0)`);

        ctx.beginPath();
        ctx.arc(x, y, p.radius * 4, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Draw core particle
        ctx.beginPath();
        ctx.arc(x, y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${accent.r}, ${accent.g}, ${accent.b}, ${currentOpacity})`;
        ctx.fill();

        // Draw bright center
        ctx.beginPath();
        ctx.arc(x, y, p.radius * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${lightAccent.r}, ${lightAccent.g}, ${lightAccent.b}, ${currentOpacity * 0.8})`;
        ctx.fill();
      });

      animationId = requestAnimationFrame(animate);
    }

    animate();

    return () => {
      cancelAnimationFrame(animationId);
    };
  });
</script>

<canvas
  bind:this={canvas}
  {width}
  {height}
  class="particle-canvas"
></canvas>

<style>
  .particle-canvas {
    display: block;
  }
</style>
