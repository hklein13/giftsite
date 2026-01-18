// js/animations.js - GSAP Animations for Solar System Homepage
// Handles nav state and basic UI animations

export class AnimationController {
  constructor() {
    this.init();
  }

  init() {
    setTimeout(() => {
      this.initNavigation();
      this.initIntroAnimation();
    }, 100);
  }

  initNavigation() {
    const nav = document.querySelector('nav');
    if (!nav) return;

    // Nav background on scroll
    window.addEventListener('scroll', () => {
      if (window.scrollY > 50) {
        nav.classList.add('scrolled');
      } else {
        nav.classList.remove('scrolled');
      }
    });
  }

  initIntroAnimation() {
    // Check if gsap is available
    if (typeof gsap === 'undefined') {
      console.warn('GSAP not loaded, skipping intro animation');
      return;
    }

    // Fade in nav and UI elements on load
    // Use set() first to ensure initial state, then animate
    const nav = document.querySelector('nav');
    const scrollIndicator = document.querySelector('.scroll-indicator');

    if (nav) {
      gsap.fromTo(nav,
        { opacity: 0, y: -20 },
        { opacity: 1, y: 0, duration: 1, delay: 0.5, ease: 'power2.out' }
      );
    }

    if (scrollIndicator) {
      gsap.fromTo(scrollIndicator,
        { opacity: 0, x: 20 },
        { opacity: 1, x: 0, duration: 0.8, delay: 0.8, ease: 'power2.out' }
      );
    }
  }
}
