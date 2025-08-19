import { useEffect, useMemo, useRef } from "react";

type GreenScreenBackgroundProps = {
  sources: string[];
  className?: string;
  /** Size of the pixel block. Higher = more pixelated, lower = more detail. */
  pixelSize?: number;
  /** Target frames per second for processing. */
  fps?: number;
  /** Disable processing on small screens to preserve performance. */
  disableOnMobile?: boolean;
  /** Crop equal percentages from left and right (0 - 0.49). */
  cropXPercent?: number;
  /** Crop equal percentages from top and bottom (0 - 0.49). */
  cropYPercent?: number;
  /** Apply a subtle drop shadow to soften keyed edges. */
  edgeSmooth?: boolean;
  /** Apply a gentle blur/contrast/saturation to soften artifacts. */
  soften?: boolean;
  /** When true, render at native resolution without pixelation and with smoothing enabled. */
  highQuality?: boolean;
};

/**
 * Canvas-based chroma key compositor with pixelation.
 * Draws one or more green-screen videos into a downscaled offscreen canvas,
 * keys out green, then upscales to the main canvas with image smoothing disabled
 * for a crisp pixelated aesthetic.
 */
export default function GreenScreenBackground({ sources, className, pixelSize = 4, fps = 30, disableOnMobile = true, cropXPercent = 0, cropYPercent = 0, edgeSmooth = false, soften = false, highQuality = false }: GreenScreenBackgroundProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videosRef = useRef<HTMLVideoElement[]>([]);
  const offscreenRef = useRef<HTMLCanvasElement | null>(null);

  const effectiveSources = useMemo(() => sources.filter(Boolean), [sources]);

  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    if (disableOnMobile && isMobile) return;

    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    // Setup main canvas size and scaling behavior (respect device pixel ratio)
    const resize = () => {
      const { clientWidth, clientHeight } = container;
      const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));
      canvas.width = Math.max(1, Math.floor(clientWidth * dpr));
      canvas.height = Math.max(1, Math.floor(clientHeight * dpr));
      canvas.style.width = `${clientWidth}px`;
      canvas.style.height = `${clientHeight}px`;
    };
    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

    // Prepare offscreen canvas for low-res pixel pass
    const offscreen = document.createElement("canvas");
    offscreenRef.current = offscreen;

    // Create video elements
    const videos: HTMLVideoElement[] = effectiveSources.map((src) => {
      const v = document.createElement("video");
      v.src = src;
      v.muted = true;
      v.loop = true;
      v.playsInline = true;
      v.autoplay = true;
      // In case assets are served with proper CORS headers
      v.crossOrigin = "anonymous";
      return v;
    });
    videosRef.current = videos;

    // Start videos when metadata is loaded
    const startPromises = videos.map(
      (v) =>
        new Promise<void>((resolve) => {
          const onLoaded = () => {
            v.play().catch(() => {});
            resolve();
          };
          if (v.readyState >= 2) onLoaded();
          else v.addEventListener("loadeddata", onLoaded, { once: true });
        })
    );

    let rafId = 0;
    let lastTime = 0;
    const interval = 1000 / fps;

    const render = (time: number) => {
      rafId = requestAnimationFrame(render);
      if (time - lastTime < interval) return;
      lastTime = time;

      const ctx = canvas.getContext("2d", { alpha: true });
      if (!ctx) return;
      const W = canvas.width;
      const H = canvas.height;

      // Determine working size (low-res for pixelated mode, full-res for highQuality)
      const effectivePixelSize = highQuality ? 1 : Math.max(1, pixelSize);
      const w = Math.max(1, Math.floor(W / effectivePixelSize));
      const h = Math.max(1, Math.floor(H / effectivePixelSize));
      if (offscreen.width !== w || offscreen.height !== h) {
        offscreen.width = w;
        offscreen.height = h;
      }
      const octx = offscreen.getContext("2d", { willReadFrequently: true });
      if (!octx) return;

      // Background fill (dark pitch)
      const grd = octx.createLinearGradient(0, 0, 0, h);
      grd.addColorStop(0, "#0a1b10");
      grd.addColorStop(1, "#0f2d1a");
      octx.fillStyle = grd;
      octx.fillRect(0, 0, w, h);

      // Composite each video with naive green chroma key
      videos.forEach((v, i) => {
        if (v.readyState < 2 || v.videoWidth === 0 || v.videoHeight === 0) return;
        // Compute crop region from original video
        const cropX = Math.max(0, Math.min(0.49, cropXPercent));
        const cropY = Math.max(0, Math.min(0.49, cropYPercent));
        const sx = Math.floor(v.videoWidth * cropX);
        const sy = Math.floor(v.videoHeight * cropY);
        const sWidth = Math.floor(v.videoWidth * (1 - cropX * 2));
        const sHeight = Math.floor(v.videoHeight * (1 - cropY * 2));

        // Fit and slightly scale different videos to cover area
        const scale = 1 + (i % 3) * 0.1;
        const vw = Math.floor(w * scale);
        const vh = Math.floor((vw * sHeight) / sWidth);
        const dx = Math.floor((w - vw) / 2);
        const dy = Math.floor((h - vh) / 2);
        octx.drawImage(v, sx, sy, sWidth, sHeight, dx, dy, vw, vh);

        const frame = octx.getImageData(dx, dy, vw, vh);
        const data = frame.data;

        for (let p = 0; p < data.length; p += 4) {
          const r = data[p + 0];
          const g = data[p + 1];
          const b = data[p + 2];
          // Simple green screen key: strong green dominance and brightness threshold
          const greenDominant = g > 60 && g > r * 1.25 && g > b * 1.25;
          const nearNeon = g > 160 && r < 140 && b < 140;
          if (greenDominant || nearNeon) {
            data[p + 3] = 0;
          }
        }

        octx.putImageData(frame, dx, dy);
      });

      // Blit to full-res. Enable smoothing in high-quality mode
      ctx.imageSmoothingEnabled = highQuality ? true : false;
      ctx.clearRect(0, 0, W, H);
      ctx.drawImage(offscreen, 0, 0, W, H);
    };

    Promise.allSettled(startPromises).then(() => {
      rafId = requestAnimationFrame(render);
    });

    return () => {
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      videos.forEach((v) => {
        v.pause();
        v.src = "";
        v.load();
      });
    };
  }, [effectiveSources, pixelSize, fps, disableOnMobile, highQuality, cropXPercent, cropYPercent, edgeSmooth, soften]);

  const smoothingClass = edgeSmooth && soften
    ? 'pixel-smooth-combined'
    : edgeSmooth
      ? 'pixel-edge-smooth'
      : soften
        ? 'pixel-soften'
        : '';

  return (
    <div ref={containerRef} className={className} aria-hidden>
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 h-full w-full block border-0 ${smoothingClass}`}
      />
    </div>
  );
}


