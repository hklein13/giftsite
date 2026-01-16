// js/animations.js - GSAP Animation System
// Handles all scroll-triggered animations and interactions

class AnimationController {
  constructor() {
    this.init();
  }

  init() {
    // Register GSAP plugins
    gsap.registerPlugin(ScrollTrigger);

    // Initialize Lenis smooth scroll
    this.initLenis();

    // Set up animations after a brief delay to ensure DOM is ready
    setTimeout(() => {
      this.initNavigation();
      this.initHeroAnimations();
      this.initScrollAnimations();
      this.initMagneticButtons();
    }, 100);
  }

  initLenis() {
    this.lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      smoothWheel: true
    });

    // Connect Lenis to GSAP ticker
    this.lenis.on('scroll', (e) => {
      ScrollTrigger.update();

      // Update Three.js background
      if (window.ambientBg) {
        window.ambientBg.updateScroll(e.scroll);
      }
    });

    gsap.ticker.add((time) => {
      this.lenis.raf(time * 1000);
    });

    gsap.ticker.lagSmoothing(0);
  }

  initNavigation() {
    const nav = document.querySelector('nav');
    if (!nav) return;

    ScrollTrigger.create({
      start: 'top -100',
      onUpdate: (self) => {
        if (self.scroll() > 100) {
          nav.classList.add('scrolled');
        } else {
          nav.classList.remove('scrolled');
        }
      }
    });
  }

  initHeroAnimations() {
    const hero = document.querySelector('.hero');
    if (!hero) return;

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    // Section tag
    tl.from('.hero .section-tag', {
      opacity: 0,
      y: 20,
      duration: 0.8
    });

    // Headline
    tl.from('.hero h1', {
      opacity: 0,
      y: 40,
      duration: 0.8
    }, '-=0.4');

    // Subtitle
    tl.from('.hero .subtitle', {
      opacity: 0,
      y: 20,
      duration: 0.6
    }, '-=0.3');

    // Buttons
    tl.from('.hero .btn', {
      opacity: 0,
      y: 20,
      stagger: 0.1,
      duration: 0.5
    }, '-=0.2');

    // Scroll indicator
    tl.from('.scroll-indicator', {
      opacity: 0,
      y: -20,
      duration: 0.5
    }, '-=0.2');

    // Hide scroll indicator on scroll
    ScrollTrigger.create({
      trigger: '.hero',
      start: 'top top',
      end: 'bottom top',
      onUpdate: (self) => {
        const indicator = document.querySelector('.scroll-indicator');
        if (indicator) {
          indicator.style.opacity = 1 - self.progress * 2;
        }
      }
    });
  }

  initScrollAnimations() {
    // Problem/Why section - text reveal
    this.animateProblemSection();

    // Process section - card entrance
    this.animateProcessSection();

    // Quote section - scale and fade
    this.animateQuoteSection();

    // Audiences section - card scatter to grid
    this.animateAudiencesSection();

    // CTA section - final reveal
    this.animateCTASection();
  }

  animateProblemSection() {
    const section = document.querySelector('.problem-section');
    if (!section) return;

    const lines = section.querySelectorAll('.reveal-line');

    lines.forEach((line, i) => {
      gsap.from(line, {
        scrollTrigger: {
          trigger: line,
          start: 'top 80%',
          end: 'top 50%',
          scrub: 1
        },
        opacity: 0,
        y: 30
      });
    });

    // Shift text - warm phase
    const shiftText = section.querySelector('.shift-text');
    if (shiftText) {
      gsap.from(shiftText, {
        scrollTrigger: {
          trigger: shiftText,
          start: 'top 80%',
          end: 'top 40%',
          scrub: 1
        },
        opacity: 0,
        scale: 0.95
      });
    }
  }

  animateProcessSection() {
    const section = document.querySelector('.process-section');
    if (!section) return;

    // Header
    gsap.from('.process-section .section-header', {
      scrollTrigger: {
        trigger: '.process-section',
        start: 'top 70%'
      },
      opacity: 0,
      y: 30,
      duration: 0.8
    });

    // Progress line
    const progressLine = section.querySelector('.progress-line');
    if (progressLine) {
      gsap.from(progressLine, {
        scrollTrigger: {
          trigger: section,
          start: 'top 60%',
          end: 'bottom 60%',
          scrub: 1
        },
        scaleY: 0,
        transformOrigin: 'top'
      });
    }

    // Cards staggered entrance
    const cards = section.querySelectorAll('.process-card');
    cards.forEach((card, i) => {
      gsap.from(card, {
        scrollTrigger: {
          trigger: card,
          start: 'top 80%'
        },
        opacity: 0,
        y: 50,
        duration: 0.6,
        delay: i * 0.15
      });

      // Animate inner elements
      const num = card.querySelector('.process-num');
      if (num) {
        gsap.from(num, {
          scrollTrigger: {
            trigger: card,
            start: 'top 80%'
          },
          scale: 0,
          duration: 0.4,
          delay: i * 0.15 + 0.2
        });
      }
    });
  }

  animateQuoteSection() {
    const section = document.querySelector('.quote-section');
    if (!section) return;

    const quote = section.querySelector('blockquote');
    if (quote) {
      gsap.from(quote, {
        scrollTrigger: {
          trigger: section,
          start: 'top 70%',
          end: 'top 30%',
          scrub: 1
        },
        opacity: 0,
        scale: 0.9
      });
    }

    const cite = section.querySelector('cite');
    if (cite) {
      gsap.from(cite, {
        scrollTrigger: {
          trigger: section,
          start: 'top 50%'
        },
        opacity: 0,
        y: 20,
        duration: 0.6
      });
    }
  }

  animateAudiencesSection() {
    const section = document.querySelector('.audiences-section');
    if (!section) return;

    // Header
    gsap.from('.audiences-section .section-header', {
      scrollTrigger: {
        trigger: '.audiences-section',
        start: 'top 70%'
      },
      opacity: 0,
      y: 30,
      duration: 0.8
    });

    // Cards with scatter-to-grid effect
    const cards = section.querySelectorAll('.audience-card');
    cards.forEach((card, i) => {
      const randomRotate = (Math.random() - 0.5) * 10;
      const randomX = (Math.random() - 0.5) * 50;

      gsap.from(card, {
        scrollTrigger: {
          trigger: section,
          start: 'top 60%'
        },
        opacity: 0,
        y: 60,
        x: randomX,
        rotation: randomRotate,
        duration: 0.8,
        delay: i * 0.1,
        ease: 'power3.out'
      });
    });
  }

  animateCTASection() {
    const section = document.querySelector('.cta-section');
    if (!section) return;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top 70%'
      }
    });

    const h2 = section.querySelector('h2');
    if (h2) {
      tl.from(h2, {
        opacity: 0,
        y: 30,
        duration: 0.6
      });
    }

    const p = section.querySelector('p');
    if (p) {
      tl.from(p, {
        opacity: 0,
        y: 20,
        duration: 0.5
      }, '-=0.3');
    }

    const btn = section.querySelector('.btn');
    if (btn) {
      tl.from(btn, {
        opacity: 0,
        scale: 0.9,
        duration: 0.5,
        ease: 'back.out(1.7)'
      }, '-=0.2');
    }
  }

  initMagneticButtons() {
    const buttons = document.querySelectorAll('.btn-magnetic');

    buttons.forEach(btn => {
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;

        gsap.to(btn, {
          x: x * 0.3,
          y: y * 0.3,
          duration: 0.3,
          ease: 'power2.out'
        });
      });

      btn.addEventListener('mouseleave', () => {
        gsap.to(btn, {
          x: 0,
          y: 0,
          duration: 0.5,
          ease: 'elastic.out(1, 0.5)'
        });
      });
    });
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.animationController = new AnimationController();
});
