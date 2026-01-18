// js/theatre-setup.js - Animation Configuration
// Theatre.js requires a bundler for browser use
// This file provides simple configuration until bundler is added

// Animation configuration (editable values)
window.animationConfig = {
  camera: {
    easeStrength: 0.05,      // 0.01 - 0.2 (lower = smoother)
    transitionDuration: 1.5   // seconds for jump transitions
  },
  planets: {
    glowIntensity: 0.2,      // 0.05 - 0.5
    bobAmount: 0.5,          // 0 - 2
    rotationSpeed: 0.002     // 0 - 0.01
  },
  sun: {
    pulseAmount: 0.02,       // 0 - 0.1
    pulseSpeed: 1            // 0.5 - 3
  }
};

// Dev mode: expose config editor via console
console.log('Animation config loaded. Edit via window.animationConfig');
console.log('Example: window.animationConfig.camera.easeStrength = 0.03');

// Note: Theatre.js integration planned for future with bundler setup
// When bundler is added, this file will be replaced with Theatre.js studio
