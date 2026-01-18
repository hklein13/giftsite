# Claude Code Guidelines for Gift Site

## ASK QUESTIONS - IMPORTANT

ALWAYS ask questions when uncertain. The user explicitly wants collaborative decision-making.

### When to Ask:
- Before making assumptions about data format or content
- When choosing between multiple valid approaches
- Before condensing, summarizing, or modifying source content
- When something seems wrong or inconsistent
- Before any significant change to existing functionality

### How to Ask:
- Be specific about what you're uncertain about
- Present options with pros/cons when applicable
- Don't assume - verify with the user first

### When User Pushes Back:
CRITICAL: If the user repeatedly questions Claude's explanation or diagnosis, this is a signal to STOP and re-verify assumptions. User confusion often indicates Claude's mental model is wrong. Don't double down - instead:

- Re-examine the evidence from scratch
- Verify assumptions against actual state (check GitHub directly, not just local git)
- Consider simpler explanations/solutions

The user is not always right, but neither is Claude - collaborative verification prevents wasted time.

---

## Git Workflow

**NEVER push directly to main.** Always use a staging branch and let the user merge via PR.

### Deployment Flow
1. Claude creates branch from main, commits/pushes changes
2. Claude tells user the branch is ready
3. User creates PR on GitHub, reviews changes
4. User merges to main (auto-deploys to GitHub Pages)
5. Claude runs `git checkout main && git pull` to sync

---

## Core Principles

### 1. KISS (Keep It Simple) - HIGHEST PRIORITY
- Simplest solution always wins
- If it feels complicated, step back and simplify
- Proven solutions over novel solutions

### 2. Avoid Over-Engineering
- Only make changes that are directly requested or clearly necessary
- Don't add features, refactor code, or make "improvements" beyond what's asked
- Three similar lines of code is better than a premature abstraction

### 3. YAGNI (You Aren't Gonna Need It)
- Don't build for hypothetical future requirements
- Build what's needed now, refactor when actually needed

---

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

## Tech Stack

### Core
- **Vite** - Build tool and dev server (`npm run dev`)
- **Three.js** - WebGL 3D graphics for solar system homepage
- **GSAP + ScrollTrigger** - Animations
- **Lenis** - Smooth scrolling

### Visual Effects
- **Theatre.js** - Animation timeline editor (Ctrl+\ to toggle studio)
- **VFX-JS** - WebGL text effects
- Custom GLSL shaders for planets, stars, and post-processing

### Fonts
- **Fraunces** (display)
- **Outfit** (body)

### Deployment
- GitHub Pages via GitHub Actions (auto-builds on push to `main`)
- Vite builds to `dist/` folder with base path `/giftsite/`

---

## Homepage Architecture (Solar System)

The homepage (`index.html`) features an immersive 3D solar system navigation:

### Navigation Flow
1. **Hero Section** - "Uncover Your Gift" title, visible at scroll position 0
2. **Planet Stops** - Camera travels linearly through space to each planet:
   - Why We Exist (planet with moon)
   - Discover (planet with rings)
   - The Process (planet with rings)
   - Facilitate (planet with moon)
3. **Sun** - Subtle warm glow in the far background

### Key Features
- **Snap Scroll** - Hard stops at each planet, requires scroll to continue
- **Bottom Caption Bar** - Shows planet title and description
- **Centered "Visit" Button** - Appears after arriving at planet, clicks navigate to page
- **Scroll Indicator Dots** - Right side navigation dots

### Visual Elements
- Procedural planet shaders with noise-based surface detail
- Multi-layered animated starfield with twinkling and drift
- Nebula clouds between planets
- Post-processing: bloom, film grain, vignette, chromatic aberration

---

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

### Key Files to Know
- `js/solar-system.js` - Main Three.js scene, all 3D elements
- `js/main.js` - Module imports, Theatre.js setup, global exports
- `css/main.css` - All styles including solar system UI elements
