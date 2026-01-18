// js/main.js - Main entry point for Vite bundler
// Imports all modules and initializes the application

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import studio from '@theatre/studio';
import { getProject, types } from '@theatre/core';

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger);

// Make libraries available globally for other modules
window.THREE = THREE;
window.gsap = gsap;
window.ScrollTrigger = ScrollTrigger;
window.Lenis = Lenis;

// Post-processing classes available globally
window.EffectComposer = EffectComposer;
window.RenderPass = RenderPass;
window.UnrealBloomPass = UnrealBloomPass;
window.ShaderPass = ShaderPass;

// Initialize Theatre.js Studio
studio.initialize();

// Create Theatre.js project and sheet
const project = getProject('GiftSite');
const sheet = project.sheet('SolarSystem');

// Export Theatre.js for use in other modules
window.theatreProject = project;
window.theatreSheet = sheet;
window.theatreTypes = types;

console.log('Theatre.js Studio initialized. Press Ctrl+\\ to toggle.');

// Keyboard shortcut to toggle studio
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key === '\\') {
    studio.ui.isHidden ? studio.ui.restore() : studio.ui.hide();
  }
});

// Import application modules
import { SolarSystemScene } from './solar-system.js';
import { AnimationController } from './animations.js';
import { TextEffects } from './vfx.js';

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  // Initialize solar system scene
  window.solarSystem = new SolarSystemScene();

  // Initialize animation controller
  window.animationController = new AnimationController();

  // Initialize text effects
  window.textEffects = new TextEffects();

  console.log('Gift Site initialized');
});
