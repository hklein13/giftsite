// js/vfx.js - Text Effects
// GSAP-based reveal effects for planet card headlines
// VFX-JS requires bundler - will be added when bundler is introduced

class TextEffects {
  constructor() {
    this.init();
  }

  init() {
    this.observeCards();
    console.log('Text effects loaded (GSAP-based, VFX-JS planned for bundler)');
  }

  observeCards() {
    // Watch for card visibility changes to trigger effects
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          const card = mutation.target;
          if (card.classList.contains('active')) {
            this.triggerRevealEffect(card);
          }
        }
      });
    });

    document.querySelectorAll('.planet-card').forEach(card => {
      observer.observe(card, { attributes: true });
    });
  }

  triggerRevealEffect(card) {
    const headline = card.querySelector('h2');
    const paragraph = card.querySelector('p');
    const button = card.querySelector('.btn');

    const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });

    // Headline with slight scale and blur-like effect
    if (headline) {
      tl.fromTo(headline,
        {
          opacity: 0,
          y: 20,
          scale: 0.98,
          filter: 'blur(4px)'
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          filter: 'blur(0px)',
          duration: 0.8
        }
      );
    }

    // Paragraph fades in
    if (paragraph) {
      tl.fromTo(paragraph,
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.6 },
        '-=0.4'
      );
    }

    // Button slides up
    if (button) {
      tl.fromTo(button,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.5 },
        '-=0.3'
      );
    }
  }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  // Small delay to ensure GSAP is loaded
  setTimeout(() => {
    window.textEffects = new TextEffects();
  }, 100);
});
