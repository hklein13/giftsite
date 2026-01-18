// js/animations.js - GSAP Animations for Solar System Homepage
// Handles nav state and basic UI animations

class AnimationController {
  constructor() {
    this.init();
  }

  init() {
    gsap.registerPlugin(ScrollTrigger);

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
    // Fade in nav and UI elements on load
    const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });

    tl.from('nav', {
      opacity: 0,
      y: -20,
      duration: 1,
      delay: 0.5
    });

    tl.from('.scroll-indicator', {
      opacity: 0,
      x: 20,
      duration: 0.8
    }, '-=0.5');
  }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.animationController = new AnimationController();
});
