# The Gift Site

An immersive 3D solar system navigation experience for discovering your gift.

## Overview

The homepage features a WebGL-powered journey through space. Users scroll through a linear path visiting planets, each representing a different aspect of the gift discovery process.

### Navigation Flow
1. **Hero Section** - "Uncover Your Gift" title at scroll position 0
2. **Planet Stops** - Camera travels linearly to each planet:
   - Why We Exist
   - Discover
   - The Process
   - Facilitate
3. **Sun** - Subtle warm glow in the far background

### Features
- **Snap Scroll** - Hard stops at each planet, requires scroll to continue
- **Bottom Caption Bar** - Shows planet title and description
- **Centered "Visit" Button** - Appears after arriving at planet, navigates to page
- **Enhanced Starfield** - Multi-layered stars with twinkling and drift movement
- **Post-Processing** - Bloom, film grain, vignette, chromatic aberration

## Tech Stack

### Core
- **Vite** - Build tool and dev server
- **Three.js** - WebGL 3D graphics
- **GSAP + ScrollTrigger** - Animations
- **Lenis** - Smooth scrolling (on content pages)

### Visual Effects
- **Theatre.js** - Animation timeline editor (Ctrl+\ to toggle studio)
- **VFX-JS** - WebGL text effects
- Custom GLSL shaders for planets, stars, and post-processing

### Fonts
- **Fraunces** (display)
- **Outfit** (body)

## Project Structure

```
giftsite/
├── index.html           # Homepage - Solar system navigation
├── why.html             # Why We Exist
├── discover.html        # Discover page
├── process.html         # The Process (has GSAP animations)
├── facilitate.html      # Facilitate page
├── audiences.html       # Who It's For
├── companion.html       # Gift Companion (Coming Soon)
├── css/
│   └── main.css         # All styles
├── js/
│   ├── main.js          # Entry point - imports & initializes all modules
│   ├── solar-system.js  # Three.js solar system scene & navigation
│   ├── animations.js    # GSAP animation controller
│   └── vfx.js           # VFX-JS text effects
├── package.json         # NPM dependencies
└── README.md
```

## Development

### Setup
```bash
npm install
npm run dev
```

### Build for Production
```bash
npm run build
npm run preview  # Test production build locally
```

## Deployment

Deployed via GitHub Pages from `main` branch.

---

*A journey of discovery awaits.*
