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
├── index.html              # Template chooser landing page (currently 3 cards → becoming 2)
├── study/
│   └── index.html          # The Study — scroll-driven frame sequence (TO BE CREATED)
├── discovery/
│   └── index.html          # The Discovery — static hero (TO BE CREATED)
├── cabin/
│   └── index.html          # The Sanctuary — SHELVED (code stays for reference)
├── cloud/
│   └── index.html          # Cloud Ascent — SHELVED
├── book/
│   └── index.html          # The Golden Book — SHELVED
├── assets/
│   ├── OpenAI Playground 2026-02-24 at 21.07.54 (0).png  # Study base frame (approved)
│   ├── OpenAI Playground 2026-02-24 at 21.16.14 (0).png  # Discovery hero (approved)
│   └── (legacy sanctuary/cloud/book assets)
├── js/
│   ├── study-home.js       # GSAP/Lenis + frame-scroller for Study (TO BE CREATED)
│   ├── discovery-home.js   # GSAP/Lenis + SplitText for Discovery (TO BE CREATED)
│   ├── frame-scroller.js   # Canvas frame playback module (TO BE CREATED)
│   ├── cabin-home.js       # Old Sanctuary — SHELVED (base for discovery-home.js)
│   ├── book-home.js        # Old Golden Book — SHELVED
│   └── concepts/
│       └── cloud-ascent.js # Old Cloud Ascent — SHELVED
├── scripts/
│   └── extract-frames.mjs  # ffmpeg frame extraction (TO BE CREATED)
├── public/
│   └── study-frames/       # Extracted WebP frames (TO BE CREATED, gitignored)
├── docs/plans/             # Design docs and implementation plans
├── package.json
├── vite.config.js          # Currently 4 entry points → becoming 3 (main, study, discovery)
└── README.md
```

## Tech Stack

### Core
- **Vite** - Build tool and dev server (`npm run dev`)
- **GSAP 3.14** - Animations (both templates)
- **Lenis 1.3** - Smooth scroll (both templates)
- **HTML5 Canvas** - Frame sequence playback (Study only)

### Shelved (still in dependencies, used by shelved templates)
- **Three.js r182** - WebGL 3D graphics (Cloud Ascent only)
- **pmndrs `postprocessing`** - Post-processing effects (Cloud Ascent only)
- **page-flip** - Book page turns (Golden Book only)

### Fonts
- **Young Serif** (display — both templates)
- **Fraunces** (display — chooser page only)
- **Outfit** (body)

### Deployment
- GitHub Pages via GitHub Actions (auto-builds on push to `main`)
- Vite builds to `dist/` folder with base path `/giftsite/`

---

## Site Architecture

### Template Chooser (`/giftsite/`)
Landing page with 2 template cards (Study, Discovery). Dark navy background (#0d1929), Fraunces/Outfit typography, hover effects.

### The Study (`/giftsite/study/`)
Scroll-driven frame sequence in an old money private study. Treasure chest opens as user scrolls, gold light fills the screen, reveals navigation cards as an integrated overlay.

- Canvas + GSAP ScrollTrigger scrub through 192 WebP frames
- 600vh scroll runway with sticky hero
- Progressive frame loading (first 30 immediate, rest right after)
- Title fades at 5% scroll, overlays at 8%
- Cards overlay appears within the scroll sequence (60-85% of runway) — no separate section
- No footer — scroll ends at fully materialized cards

### The Discovery (`/giftsite/discovery/`)
Static hero image of a person looking into the treasure chest, same old money study setting.

- Static `<img>` hero with `object-fit: cover`, `object-position: 48.5% center`
- Scroll parallax on hero image (yPercent drift + subtle scale)
- GSAP/Lenis SplitText hero animation, ScrollTrigger card reveals
- Same layout pattern as Study but simpler (no frame sequence, separate cards section)

### Shared between both templates:
- **Setting:** Old money private study — mahogany, leather-bound books, quilted leather, ornate treasure chest
- **Title:** "Welcome to the Gift Site"
- **Tagline:** "Discover the beautiful and precious gift inside of you"
- **Text overlay:** No frosted glass — bare text at bottom of viewport over dark image
- **5 Navigation cards:** Why We Exist, Discover, The Process, Facilitate, Gift Companion
- **Color palette:** Dark mahogany `#1a0f0a` body, parchment `#f8f0e3` text, gold `#d4a853` accents, soft amber `#f5e6c8` card section, deep mahogany `#2a1810` footer
- **Companion bot button:** Fixed position, gold, bottom-right

### Shelved Templates
Sanctuary (cabin/), Cloud Ascent (cloud/), and Golden Book (book/) are shelved. Code stays in repo for reference. Removed from vite.config.js entry points and chooser page.

### Future: Gift Companion Bot
Placeholder icon exists on templates. Will eventually be an interactive chatbot.

---

## Mobile Optimization

Primary target device: Modern iPhone (12+). Site should feel snappy and responsive.

- Single landscape image source per template — mobile crops center via `object-fit: cover`
- Study: canvas focalPoint `[0.475, 0.5]` for chest centering on mobile crop
- Discovery: `object-position: 48.5% center` for hero image
- Safe area insets respected (`env(safe-area-inset-bottom)`)
- All interactive elements minimum 44x44px touch targets
- Canvas DPR: capped at 2.0 for all devices (Study template)

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
- `index.html` - Template chooser landing page
- `docs/plans/2026-02-24-old-money-office-redesign-design.md` - Current design document
- `docs/plans/2026-02-24-old-money-office-implementation.md` - Current implementation plan
- `test-viability.html` - Asset viability test page (gitignored, dev only)
- `cabin/index.html` - Old Sanctuary (reference for Discovery template)
- `js/cabin-home.js` - Old Sanctuary JS (base for discovery-home.js)
- `vite.config.js` - Build config (needs entry point update)

---

## Archived / Shelved Files

Solar system homepage backed up locally: `C:\Users\HarrisonKlein\Downloads\giftsite-solar-system-backup\`

Old cabin video assets (`cabin-fire.mp4`, `cabin-still.jpg`, `cabin-blur.jpg`) remain in `assets/` but are no longer referenced.

Cloud Ascent, Golden Book, and Sanctuary code stays in repo on `feature/reimagine-templates` branch but will be removed from vite config and chooser.

---

## MCP Tools

### Context7 - Documentation Lookup
Use Context7 for accurate, up-to-date documentation on:
- GSAP (ScrollTrigger, SplitText)
- Vite (build config, asset handling)

**Usage:** Add "use context7" to prompts, e.g., "use context7 to show GSAP ScrollTrigger scrub examples"

### Playwright - Browser Automation
Use Playwright for:
- Visual testing of templates
- Screenshots for thumbnails
- Mobile viewport testing

**Usage:** "Use playwright to screenshot both templates at mobile viewport"
