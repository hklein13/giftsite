// js/book-home.js — Golden Book scroll-driven homepage
// Paginated scroll, GSAP SplitText cover animation, scroll-driven page flips

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(ScrollTrigger, SplitText);

// --- Paginated scroll state ---
let currentPage = 0;
let isAnimating = false;
let snapPoints = [];

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

// --- Page flip animations (scroll-driven) ---
function setupPageFlips() {
  const pages = document.querySelectorAll('.page');
  const flipSections = document.querySelectorAll('.scroll-spacer[data-section^="flip"]');

  flipSections.forEach((section, i) => {
    const page = pages[i];
    if (!page || !section) return;

    const shadow = page.querySelector('.flip-shadow');

    ScrollTrigger.create({
      trigger: section,
      start: 'top top',
      end: 'bottom top',
      scrub: 0.1,
      onUpdate: (self) => {
        const angle = self.progress * -180;
        gsap.set(page, { rotateY: angle });

        if (shadow) {
          const shadowOpacity = Math.sin(self.progress * Math.PI) * 0.15;
          gsap.set(shadow, { opacity: shadowOpacity });
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

// --- Paginated scroll navigation ---
function navigateToPage(index) {
  if (index < 0 || index >= snapPoints.length) return;
  isAnimating = true;
  currentPage = index;

  const target = snapPoints[index];
  const proxy = { y: window.scrollY };

  gsap.to(proxy, {
    y: target,
    duration: 2,
    ease: 'slow(0.5, 0.8, false)',
    onUpdate: () => {
      window.scrollTo(0, proxy.y);
    },
    onComplete: () => {
      setTimeout(() => { isAnimating = false; }, 200);
    },
  });
}

function setupPaginatedScroll() {
  // Snap only to content pages (cover, welcome, toc)
  // Flips happen automatically during transitions as scroll passes through flip spacers
  const contentSections = ['cover', 'welcome', 'toc'];
  snapPoints = contentSections.map((name) => {
    const el = document.querySelector(`.scroll-spacer[data-section="${name}"]`);
    return el ? el.offsetTop : 0;
  });

  // Wheel navigation — one scroll = one page
  window.addEventListener('wheel', (e) => {
    e.preventDefault();
    if (isAnimating) return;

    if (e.deltaY > 0) {
      navigateToPage(currentPage + 1);
    } else if (e.deltaY < 0) {
      navigateToPage(currentPage - 1);
    }
  }, { passive: false });

  // Touch navigation
  let touchStartY = 0;
  let touchStartTime = 0;

  window.addEventListener('touchstart', (e) => {
    touchStartY = e.touches[0].clientY;
    touchStartTime = Date.now();
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    // Prevent native scroll during touch
    e.preventDefault();
  }, { passive: false });

  window.addEventListener('touchend', (e) => {
    if (isAnimating) return;
    const deltaY = touchStartY - e.changedTouches[0].clientY;
    const elapsed = Date.now() - touchStartTime;

    // Require a minimum swipe distance (30px) or fast flick
    if (Math.abs(deltaY) < 30 && elapsed > 300) return;

    if (deltaY > 0) {
      navigateToPage(currentPage + 1);
    } else if (deltaY < 0) {
      navigateToPage(currentPage - 1);
    }
  }, { passive: true });

  // Keyboard navigation
  window.addEventListener('keydown', (e) => {
    if (isAnimating) return;
    if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
      e.preventDefault();
      navigateToPage(currentPage + 1);
    } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
      e.preventDefault();
      navigateToPage(currentPage - 1);
    }
  });
}

// --- Init ---
function init() {
  animateCover();
  setupScrollIndicator();
  setupPageFlips();
  setupWelcomeReveal();
  setupTocReveals();
  setupPaginatedScroll();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
