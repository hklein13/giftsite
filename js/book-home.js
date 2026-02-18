// js/book-home.js — Golden Book with StPageFlip
// SplitText cover animation, PageFlip library for realistic page turning

import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { PageFlip } from 'page-flip';

gsap.registerPlugin(SplitText);

// --- Cover entrance animation ---
function animateCover() {
  const emblem = document.querySelector('.cover-emblem');
  const prefix = document.querySelector('.cover-title-prefix');
  const title = document.querySelector('.cover-title');
  const divider = document.querySelector('.cover-divider');
  const tagline = document.querySelector('.cover-tagline');
  const hint = document.querySelector('.turn-hint');

  if (!title) return;

  gsap.set([emblem, prefix, title, divider, tagline, hint].filter(Boolean), { visibility: 'visible' });

  const split = new SplitText(title, { type: 'words,chars' });
  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

  if (emblem) {
    tl.from(emblem, { autoAlpha: 0, scale: 0.8, duration: 0.6 });
  }

  if (prefix) {
    tl.from(prefix, { autoAlpha: 0, y: 15, duration: 0.5 }, emblem ? '-=0.2' : '0');
  }

  tl.from(split.chars, {
    y: 40, autoAlpha: 0, duration: 0.8, stagger: 0.04,
  }, '-=0.2');

  if (divider) {
    tl.from(divider, { autoAlpha: 0, scaleX: 0, duration: 0.5 }, '-=0.2');
  }

  if (tagline) {
    tl.from(tagline, { autoAlpha: 0, y: 20, duration: 0.7 }, '-=0.2');
  }

  if (hint) {
    tl.from(hint, { autoAlpha: 0, duration: 0.6 }, '-=0.2');
  }
}

// --- Wheel-to-flip (accumulator-based) ---
function setupWheelFlip(pageFlip) {
  let accumulator = 0;
  let timeout;
  const threshold = 80;

  window.addEventListener('wheel', (e) => {
    e.preventDefault();

    // Don't interrupt active flip
    const state = pageFlip.getState();
    if (state === 'flipping' || state === 'user_fold') return;

    accumulator += e.deltaY;
    clearTimeout(timeout);
    timeout = setTimeout(() => { accumulator = 0; }, 200);

    if (Math.abs(accumulator) >= threshold) {
      if (accumulator > 0) pageFlip.flipNext();
      else pageFlip.flipPrev();
      accumulator = 0;
    }
  }, { passive: false });
}

// --- Keyboard navigation ---
function setupKeyboardFlip(pageFlip) {
  window.addEventListener('keydown', (e) => {
    const state = pageFlip.getState();
    if (state === 'flipping' || state === 'user_fold') return;

    if (['ArrowDown', 'PageDown', ' ', 'ArrowRight'].includes(e.key)) {
      e.preventDefault();
      pageFlip.flipNext();
    } else if (['ArrowUp', 'PageUp', 'ArrowLeft'].includes(e.key)) {
      e.preventDefault();
      pageFlip.flipPrev();
    }
  });
}

// --- Init ---
function init() {
  const bookEl = document.getElementById('book');
  if (!bookEl) return;

  // Determine sizing based on viewport
  const isMobile = window.innerWidth < 640;
  const baseWidth = isMobile ? Math.min(window.innerWidth * 0.92, 400) : 550;
  const baseHeight = Math.round(baseWidth * 1.33); // ~4:3 book ratio

  const pageFlip = new PageFlip(bookEl, {
    width: baseWidth,
    height: baseHeight,
    size: 'stretch',
    minWidth: 260,
    maxWidth: 600,
    minHeight: 350,
    maxHeight: 800,
    showCover: true,
    flippingTime: 1200,
    usePortrait: true,
    drawShadow: true,
    maxShadowOpacity: 0.5,
    mobileScrollSupport: false,
    startZIndex: 0,
    autoSize: true,
    swipeDistance: 30,
  });

  pageFlip.loadFromHTML(document.querySelectorAll('#book .page-content'));

  // Desktop cover centering — measure actual cover position and calculate offset
  const container = document.getElementById('book-container');
  let coverOffset = 0;

  function measureCoverOffset() {
    bookEl.style.transform = '';
    requestAnimationFrame(() => {
      const coverItem = bookEl.querySelector('.stf__item');
      if (!coverItem || !container) return;
      const containerRect = container.getBoundingClientRect();
      const coverRect = coverItem.getBoundingClientRect();
      const containerCenter = containerRect.left + containerRect.width / 2;
      const coverCenter = coverRect.left + coverRect.width / 2;
      coverOffset = Math.round(containerCenter - coverCenter);
      if (Math.abs(coverOffset) > 5) {
        bookEl.style.transform = `translateX(${coverOffset}px)`;
      }
    });
  }

  // Measure after StPageFlip finishes rendering
  requestAnimationFrame(() => measureCoverOffset());

  // Cover entrance animation
  animateCover();

  // Wheel + keyboard navigation
  setupWheelFlip(pageFlip);
  setupKeyboardFlip(pageFlip);

  // Hide turn hint on first flip + desktop cover centering toggle
  const hint = document.querySelector('.turn-hint');
  let hintHidden = false;

  pageFlip.on('flip', (e) => {
    if (hint && !hintHidden) {
      gsap.to(hint, { autoAlpha: 0, duration: 0.3 });
      hintHidden = true;
    }

    // Center on cover, remove offset for spreads
    bookEl.style.transform = e.data === 0 ? `translateX(${coverOffset}px)` : '';
  });

  // Handle resize
  const debounce = (fn, ms) => {
    let t;
    return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
  };

  window.addEventListener('resize', debounce(() => {
    pageFlip.update();
  }, 200));
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
