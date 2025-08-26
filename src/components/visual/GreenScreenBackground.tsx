import { useEffect, useMemo, useRef, useState } from "react";

type SourceConfig = {
  src: string;
  /** How to fit the video inside the canvas working area. */
  fit?: 'cover' | 'contain' | 'fill';
  /** Additional scale multiplier applied after fit. */
  scale?: number;
  /** Shift position by percentage of working width/height (-50 to 50 typical). */
  dxPercent?: number;
  dyPercent?: number;
  /** Override global crop percentages for this source. */
  cropXPercent?: number;
  cropYPercent?: number;
};

type GreenScreenBackgroundProps = {
  sources: (string | SourceConfig)[];
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
  /** When true, play sources one-by-one like a carousel instead of compositing. */
  carousel?: boolean;
  /** Interval between carousel switches in milliseconds. */
  carouselIntervalMs?: number;
};

/**
 * Canvas-based chroma key compositor with pixelation.
 * Draws one or more green-screen videos into a downscaled offscreen canvas,
 * keys out green, then upscales to the main canvas with image smoothing disabled
 * for a crisp pixelated aesthetic.
 */
export default function GreenScreenBackground({ sources, className, pixelSize = 4, fps = 30, disableOnMobile = true, cropXPercent = 0, cropYPercent = 0, edgeSmooth = false, soften = false, highQuality = false, carousel = false, carouselIntervalMs = 6000 }: GreenScreenBackgroundProps) {

  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videosRef = useRef<HTMLVideoElement[]>([]);
  const offscreenRef = useRef<HTMLCanvasElement | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);


  const effectiveSources = useMemo<SourceConfig[]>(() =>
    (sources || [])
      .filter(Boolean)
      .map((s) => (typeof s === 'string' ? { src: s } : s)),
  [sources]);

  // Only extract the srcs for effect dependencies
  const sourceUrls = useMemo(() => effectiveSources.map(s => s.src).join(','), [effectiveSources]);

  // Reset currentIndex to 0 whenever sources change
  useEffect(() => {
    setCurrentIndex(0);
  }, [sourceUrls]);

  // Manage carousel timer in a separate effect
  useEffect(() => {
    if (!carousel || effectiveSources.length <= 1) return;
    const advance = () => setCurrentIndex(i => (i + 1) % effectiveSources.length);
    const timer = window.setInterval(advance, Math.max(1000, carouselIntervalMs));
    return () => window.clearInterval(timer);
  }, [carousel, carouselIntervalMs, effectiveSources.length]);

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
    const videos: HTMLVideoElement[] = effectiveSources.map((conf) => {
      const v = document.createElement("video");
      v.src = conf.src;
      v.muted = true;
      v.loop = true;
      v.playsInline = true;
      v.autoplay = true;
      // In case assets are served with proper CORS headers
      v.crossOrigin = "anonymous";
      return v;
    });
    videosRef.current = videos;


    // Preload all videos before starting carousel
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
    let carouselTimer: number | undefined;

    Promise.allSettled(startPromises).then(() => {
      if (carousel && effectiveSources.length > 1) {
        const advance = () => {
          setCurrentIndex((i) => (i + 1) % effectiveSources.length);
        };
        // @ts-ignore - setInterval returns number in browsers
        carouselTimer = window.setInterval(advance, Math.max(1000, carouselIntervalMs));
      }

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

        const drawOne = (v: HTMLVideoElement, conf: SourceConfig, index: number) => {
          if (v.readyState < 2 || v.videoWidth === 0 || v.videoHeight === 0) return;
          // Crop source rect
          const cx = conf.cropXPercent !== undefined ? conf.cropXPercent : cropXPercent;
          const cy = conf.cropYPercent !== undefined ? conf.cropYPercent : cropYPercent;
          const cropX = Math.max(0, Math.min(0.49, cx));
          const cropY = Math.max(0, Math.min(0.49, cy));
          const sx = Math.floor(v.videoWidth * cropX);
          const sy = Math.floor(v.videoHeight * cropY);
          const sWidth = Math.floor(v.videoWidth * (1 - cropX * 2));
          const sHeight = Math.floor(v.videoHeight * (1 - cropY * 2));

          // Fit
          const fitMode = conf.fit || 'cover';
          let destW = w;
          let destH = Math.floor((w * sHeight) / sWidth);
          if (fitMode === 'contain') {
            const scaleContain = Math.min(w / sWidth, h / sHeight);
            destW = Math.floor(sWidth * scaleContain);
            destH = Math.floor(sHeight * scaleContain);
          } else if (fitMode === 'cover') {
            const scaleCover = Math.max(w / sWidth, h / sHeight);
            destW = Math.floor(sWidth * scaleCover);
            destH = Math.floor(sHeight * scaleCover);
          } else if (fitMode === 'fill') {
            destW = w;
            destH = h;
          }

          // Extra scale
          const extra = conf.scale && conf.scale > 0 ? conf.scale : (carousel ? 1 : 1 + (index % 3) * 0.1);
          const vw = Math.floor(destW * extra);
          const vh = Math.floor(destH * extra);

          // Position (center + offset)
          const offsetX = ((conf.dxPercent || 0) / 100) * w;
          const offsetY = ((conf.dyPercent || 0) / 100) * h;
          const dx = Math.floor((w - vw) / 2 + offsetX);
          const dy = Math.floor((h - vh) / 2 + offsetY);

          octx.drawImage(v, sx, sy, sWidth, sHeight, dx, dy, vw, vh);

          const frame = octx.getImageData(dx, dy, vw, vh);
          const data = frame.data;

          for (let p = 0; p < data.length; p += 4) {
            const r = data[p + 0];
            const g = data[p + 1];
            const b = data[p + 2];
            const greenDominant = g > 60 && g > r * 1.25 && g > b * 1.25;
            const nearNeon = g > 160 && r < 140 && b < 140;
            if (greenDominant || nearNeon) {
              data[p + 3] = 0;
            }
          }

          octx.putImageData(frame, dx, dy);
        };

        if (carousel) {
          const i = currentIndex % videos.length;
          const v = videos[i];
          const conf = effectiveSources[i] || { src: '' };
          drawOne(v, conf, i);
        } else {
          videos.forEach((v, i) => drawOne(v, effectiveSources[i] || { src: '' }, i));
        }

        // Blit to full-res. Enable smoothing in high-quality mode
        ctx.imageSmoothingEnabled = highQuality ? true : false;
        ctx.clearRect(0, 0, W, H);
        ctx.drawImage(offscreen, 0, 0, W, H);
      };

      rafId = requestAnimationFrame(render);
    });

    return () => {
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      if (carouselTimer) window.clearInterval(carouselTimer);
      videos.forEach((v) => {
        v.pause();
        v.src = "";
        v.load();
      });
    };
  }, [effectiveSources, pixelSize, fps, disableOnMobile, highQuality, cropXPercent, cropYPercent, edgeSmooth, soften, currentIndex]);

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


