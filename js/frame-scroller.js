// js/frame-scroller.js — Scroll-driven canvas frame playback module
// Progressive loading, object-fit cover, GSAP ScrollTrigger integration

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/**
 * @param {Object} opts
 * @param {HTMLCanvasElement} opts.canvas
 * @param {number} opts.frameCount - total frames
 * @param {string} opts.framePath - path to frames directory
 * @param {string} opts.trigger - CSS selector for ScrollTrigger trigger
 * @param {number} [opts.scrub=0.5] - ScrollTrigger scrub value
 * @param {number[]} [opts.focalPoint=[0.5,0.5]] - [x,y] crop anchor (0-1), like object-position
 * @param {number} [opts.windowSize=0] - sliding window size (0 = keep all frames in memory)
 * @param {Function} [opts.onFrameChange] - callback(currentFrame, frameCount)
 * @returns {{ destroy: Function, getCurrentFrame: Function }}
 */
export function createFrameScroller({
  canvas,
  frameCount,
  framePath: frameDir,
  trigger,
  scrub = 0.5,
  focalPoint = [0.5, 0.5],
  maxDpr = 2,
  windowSize = 0,
  onFrameChange,
}) {
  const ctx = canvas.getContext('2d');
  const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);

  // Frame storage
  const frames = new Array(frameCount).fill(null);
  const cacheBust = 'v5';
  let currentFrame = 0;
  let lastDrawnFrame = -1;
  const halfWindow = windowSize > 0 ? Math.floor(windowSize / 2) : 0;

  // --- Canvas sizing ---
  function sizeCanvas() {
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    drawFrame(currentFrame);
  }

  // --- Object-fit cover drawing ---
  function drawFrame(index) {
    const img = frames[index];
    if (!img) {
      // Find nearest loaded frame
      for (let offset = 1; offset < frameCount; offset++) {
        if (frames[index - offset]) { drawImage(frames[index - offset]); return; }
        if (frames[index + offset]) { drawImage(frames[index + offset]); return; }
      }
      return;
    }
    drawImage(img);
    lastDrawnFrame = index;
  }

  function drawImage(img) {
    const cw = canvas.width;
    const ch = canvas.height;
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;

    // Object-fit: cover calculation
    const canvasRatio = cw / ch;
    const imgRatio = iw / ih;

    let sx, sy, sw, sh;
    if (imgRatio > canvasRatio) {
      // Image is wider — crop sides
      sh = ih;
      sw = ih * canvasRatio;
      sx = Math.max(0, Math.min((iw - sw) * focalPoint[0], iw - sw));
      sy = 0;
    } else {
      // Image is taller — crop top/bottom
      sw = iw;
      sh = iw / canvasRatio;
      sx = 0;
      sy = Math.max(0, Math.min((ih - sh) * focalPoint[1], ih - sh));
    }

    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, cw, ch);
  }

  // --- Frame loading ---
  function getFramePath(index) {
    const num = String(index + 1).padStart(3, '0');
    return `${frameDir}/frame-${num}.webp?v=${cacheBust}`;
  }

  function loadFrame(index) {
    return new Promise((resolve) => {
      if (frames[index]) { resolve(); return; }
      const img = new Image();
      img.onload = () => { frames[index] = img; resolve(); };
      img.onerror = () => resolve(); // skip broken frames
      img.src = getFramePath(index);
    });
  }

  async function loadRange(start, end) {
    const promises = [];
    for (let i = start; i < Math.min(end, frameCount); i++) {
      promises.push(loadFrame(i));
    }
    await Promise.all(promises);
  }

  // --- Sliding window (mobile only, windowSize > 0) ---
  function loadWindow(centerIndex) {
    const start = Math.max(0, centerIndex - halfWindow);
    const end = Math.min(frameCount, centerIndex + halfWindow + 1);
    loadRange(start, end);
  }

  function evictDistantFrames(centerIndex) {
    for (let i = 0; i < frameCount; i++) {
      if (frames[i] && Math.abs(i - centerIndex) > halfWindow) {
        frames[i] = null;
      }
    }
  }

  // --- Loading ---
  async function startLoading() {
    if (windowSize > 0) {
      // Sliding window: load initial window only
      await loadRange(0, Math.min(windowSize, frameCount));
    } else {
      // Desktop: load first 30 immediately, then all remaining
      await loadRange(0, Math.min(30, frameCount));
      loadRange(30, frameCount);
    }
    drawFrame(0);
  }

  // --- ScrollTrigger integration ---
  const st = ScrollTrigger.create({
    trigger: trigger,
    start: 'top top',
    end: 'bottom bottom',
    scrub: scrub,
    onUpdate: (self) => {
      const frameIndex = Math.min(
        Math.floor(self.progress * frameCount),
        frameCount - 1
      );
      if (frameIndex !== currentFrame) {
        currentFrame = frameIndex;
        drawFrame(currentFrame);
        if (windowSize > 0) {
          loadWindow(currentFrame);
          evictDistantFrames(currentFrame);
        }
        if (onFrameChange) onFrameChange(currentFrame, frameCount);
      }
    },
  });

  // --- Resize handler ---
  window.addEventListener('resize', sizeCanvas);

  // --- Init ---
  sizeCanvas();
  startLoading();

  return {
    destroy() {
      window.removeEventListener('resize', sizeCanvas);
      st.kill();
    },
    getCurrentFrame() {
      return currentFrame;
    },
  };
}
