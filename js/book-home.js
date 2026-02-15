// js/book-home.js — Golden Book scroll-driven homepage
// GSAP SplitText cover animation, accumulator-based paginated scroll, scroll-driven page flips

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(ScrollTrigger, SplitText);

// --- Cover entrance animation ---
function animateCover() {
  const emblem = document.querySelector('.cover-emblem');
  const title = document.querySelector('.cover-title');
  const divider = document.querySelector('.cover-divider');
  const tagline = document.querySelector('.cover-tagline');
  const scrollHint = document.querySelector('.scroll-indicator');

  if (!title) return;

  gsap.set([emblem, title, divider, tagline, scrollHint].filter(Boolean), { visibility: 'visible' });

  const split = new SplitText(title, { type: 'chars' });
  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

  if (emblem) {
    tl.from(emblem, { autoAlpha: 0, scale: 0.8, duration: 0.6 });
  }

  tl.from(split.chars, {
    y: 40, autoAlpha: 0, duration: 0.8, stagger: 0.04,
  }, emblem ? '-=0.3' : '0');

  if (divider) {
    tl.from(divider, { autoAlpha: 0, scaleX: 0, duration: 0.5 }, '-=0.2');
  }

  if (tagline) {
    tl.from(tagline, { autoAlpha: 0, y: 20, duration: 0.7 }, '-=0.2');
  }

  if (scrollHint) {
    tl.from(scrollHint, { autoAlpha: 0, duration: 0.6 }, '-=0.2');
  }
}

// --- Scroll indicator fade-out ---
function setupScrollIndicator() {
  const scrollHint = document.querySelector('.scroll-indicator');
  if (!scrollHint) return;

  gsap.to(scrollHint, {
    autoAlpha: 0,
    scrollTrigger: {
      trigger: '.scroll-spacer[data-section="cover"]',
      start: 'top top',
      end: '30% top',
      scrub: true,
    },
  });
}

// --- Paginated scroll (accumulator-based, inspired by solar system) ---
function setupPaginatedScroll() {
  let currentPage = 0;
  const totalPages = 3; // cover, welcome, toc
  let isAnimating = false;
  let scrollAccumulator = 0;
  let accumulatorTimeout;
  const scrollThreshold = 80;
  const scrollProxy = { value: window.scrollY };

  // Page stops skip over flip zones: cover=0vh, welcome=2vh, toc=4vh
  function getStopPositions() {
    const vh = window.innerHeight;
    return [0, 2 * vh, 4 * vh];
  }

  // Detect which page we're closest to on load
  function detectCurrentPage() {
    const stops = getStopPositions();
    const scrollY = window.scrollY;
    let closest = 0;
    let minDist = Infinity;
    stops.forEach((stop, i) => {
      const dist = Math.abs(scrollY - stop);
      if (dist < minDist) { minDist = dist; closest = i; }
    });
    return closest;
  }

  currentPage = detectCurrentPage();
  scrollProxy.value = window.scrollY;

  function navigateToPage(index) {
    if (index < 0 || index >= totalPages || index === currentPage) return;
    isAnimating = true;
    currentPage = index;
    scrollAccumulator = 0;

    const stops = getStopPositions();
    const target = stops[index];

    gsap.killTweensOf(scrollProxy);
    scrollProxy.value = window.scrollY;

    gsap.to(scrollProxy, {
      value: target,
      duration: 1.8,
      ease: 'power2.inOut',
      onUpdate: () => window.scrollTo(0, scrollProxy.value),
      onComplete: () => { isAnimating = false; },
    });
  }

  // --- Wheel input ---
  window.addEventListener('wheel', (e) => {
    e.preventDefault();
    if (isAnimating) return;

    scrollAccumulator += e.deltaY;

    clearTimeout(accumulatorTimeout);
    accumulatorTimeout = setTimeout(() => { scrollAccumulator = 0; }, 200);

    if (Math.abs(scrollAccumulator) >= scrollThreshold) {
      if (scrollAccumulator > 0 && currentPage < totalPages - 1) {
        navigateToPage(currentPage + 1);
      } else if (scrollAccumulator < 0 && currentPage > 0) {
        navigateToPage(currentPage - 1);
      }
      scrollAccumulator = 0;
    }
  }, { passive: false });

  // --- Touch input ---
  let touchStartY = 0;
  let touchAccumulator = 0;

  window.addEventListener('touchstart', (e) => {
    touchStartY = e.touches[0].clientY;
    touchAccumulator = 0;
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (isAnimating) return;

    const deltaY = touchStartY - e.touches[0].clientY;
    touchStartY = e.touches[0].clientY;
    touchAccumulator += deltaY;

    if (Math.abs(touchAccumulator) >= scrollThreshold) {
      if (touchAccumulator > 0 && currentPage < totalPages - 1) {
        navigateToPage(currentPage + 1);
      } else if (touchAccumulator < 0 && currentPage > 0) {
        navigateToPage(currentPage - 1);
      }
      touchAccumulator = 0;
    }
  }, { passive: false });

  // --- Keyboard input ---
  window.addEventListener('keydown', (e) => {
    if (isAnimating) return;

    if (['ArrowDown', 'PageDown', ' '].includes(e.key)) {
      e.preventDefault();
      if (currentPage < totalPages - 1) navigateToPage(currentPage + 1);
    } else if (['ArrowUp', 'PageUp'].includes(e.key)) {
      e.preventDefault();
      if (currentPage > 0) navigateToPage(currentPage - 1);
    }
  });

  // --- Recalculate on resize ---
  window.addEventListener('resize', () => {
    if (isAnimating) return;
    const stops = getStopPositions();
    scrollProxy.value = stops[currentPage];
    window.scrollTo(0, stops[currentPage]);
  });
}

// --- Page flip animations (scroll-driven) ---
function setupPageFlips() {
  const pages = document.querySelectorAll('.page');
  const flipSections = document.querySelectorAll('.scroll-spacer[data-section^="flip"]');
  const book = document.querySelector('.book');

  flipSections.forEach((section, i) => {
    const page = pages[i];
    if (!page || !section) return;

    const flipShadow = page.querySelector('.flip-shadow');
    const castShadow = page.querySelector('.flip-cast-shadow');
    const selfShadow = page.querySelector('.flip-self-shadow');
    const lightCatch = page.querySelector('.flip-light-catch');

    ScrollTrigger.create({
      trigger: section,
      start: 'top top',
      end: 'bottom top',
      scrub: 0.1,
      onUpdate: (self) => {
        const p = self.progress;
        let angle, liftZ;

        // Page lift anticipation (0-5%)
        if (p < 0.05) {
          const liftProgress = p / 0.05;
          angle = liftProgress * -3;
          liftZ = liftProgress * 10;
        }
        // Main rotation (5-95%)
        else if (p < 0.95) {
          const flipProgress = (p - 0.05) / 0.9;
          angle = -3 + (flipProgress * -177);
          liftZ = 10 * (1 - flipProgress);
        }
        // Settling bounce (95-100%)
        else {
          const settleProgress = (p - 0.95) / 0.05;
          angle = -180 - (Math.sin(settleProgress * Math.PI) * 2);
          liftZ = 0;
        }

        gsap.set(page, { rotateY: angle, translateZ: liftZ });

        // Overall flip shadow
        if (flipShadow) {
          gsap.set(flipShadow, { opacity: Math.sin(p * Math.PI) * 0.15 });
        }

        // Cast shadow sweeping across page below
        if (castShadow) {
          const castX = p * 100;
          gsap.set(castShadow, {
            opacity: Math.sin(p * Math.PI) * 0.2,
            background: `linear-gradient(to right, transparent ${castX - 10}%, rgba(0,0,0,0.15) ${castX}%, transparent ${castX + 15}%)`
          });
        }

        // Self-shadow on front face (darkens right edge as page rotates)
        if (selfShadow) {
          const selfOpacity = p < 0.5 ? p * 1.6 : (1 - p) * 0.5;
          gsap.set(selfShadow, { opacity: Math.max(0, selfOpacity) });
        }

        // Light catch on back face (visible after 90deg)
        if (lightCatch) {
          const raw = p > 0.5 ? (p - 0.5) * 2 : 0;
          const catchOpacity = raw * 0.4 * (1 - raw * 0.5);
          gsap.set(lightCatch, { opacity: Math.max(0, catchOpacity) });
        }

        // Spine flex
        if (book) {
          const spineWidth = 18 + Math.sin(p * Math.PI) * 2;
          book.style.setProperty('--spine-width', spineWidth + 'px');
        }
      },
    });
  });
}

// --- Welcome text reveal ---
function setupWelcomeReveal() {
  const welcomeText = document.querySelector('.welcome-text');
  if (!welcomeText) return;

  gsap.from(welcomeText, {
    autoAlpha: 0, y: 30, duration: 0.8, ease: 'power2.out',
    scrollTrigger: {
      trigger: '.scroll-spacer[data-section="welcome"]',
      start: 'top 60%',
      once: true,
    },
  });
}

// --- TOC chapter stagger reveal ---
function setupTocReveals() {
  const chapters = document.querySelectorAll('.toc-chapter');
  if (!chapters.length) return;

  gsap.from(chapters, {
    autoAlpha: 0, y: 40, duration: 0.6, stagger: 0.12, ease: 'power2.out',
    scrollTrigger: {
      trigger: '.scroll-spacer[data-section="toc"]',
      start: 'top 70%',
      once: true,
    },
  });
}

// --- Init ---
function init() {
  animateCover();
  setupScrollIndicator();
  setupPaginatedScroll();
  setupPageFlips();
  setupWelcomeReveal();
  setupTocReveals();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
