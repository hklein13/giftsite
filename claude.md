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
├── index.html              # Template chooser landing page
├── cabin/
│   └── index.html          # The Sanctuary — photography-based homepage
├── cloud/
│   └── index.html          # Cloud Ascent template (Three.js interactive)
├── book/
│   └── index.html          # The Golden Book template (scroll-driven page flip)
├── assets/
│   ├── sanctuary-desktop.png  # Sanctuary hero — landscape (desktop)
│   ├── sanctuary-mobile.png   # Sanctuary hero — portrait (mobile)
│   ├── thumb-cabin.jpg     # Chooser thumbnail (needs update for Sanctuary)
│   ├── thumb-cloud.jpg     # Chooser thumbnail
│   └── thumb-book.jpg      # Chooser thumbnail
├── js/
│   ├── cabin-home.js       # GSAP/Lenis scroll animations for Sanctuary
│   ├── book-home.js        # GSAP accumulator scroll + page flip for Book
│   └── concepts/
│       └── cloud-ascent.js # Three.js cloud scene
├── package.json
├── vite.config.js          # 4 entry points: main, cabin, cloud, book
└── README.md
```

## Tech Stack

### Core
- **Vite** - Build tool and dev server (`npm run dev`)
- **GSAP 3.14** - Animations (all templates)
- **Lenis 1.3** - Smooth scroll (Sanctuary only)
- **Three.js r182** - WebGL 3D graphics (Cloud Ascent only)
- **pmndrs `postprocessing`** - Post-processing effects (Cloud Ascent only)

### Fonts
- **Fraunces** (display)
- **Outfit** (body)

### Deployment
- GitHub Pages via GitHub Actions (auto-builds on push to `main`)
- Vite builds to `dist/` folder with base path `/giftsite/`

---

## Site Architecture

### Template Chooser (`/giftsite/`)
Landing page with three thumbnail cards linking to each template. Dark navy background (#0d1929), Fraunces/Outfit typography, hover effects on cards.

### The Sanctuary (`/giftsite/cabin/`)
Photography-based homepage with AI-generated conservatory scene. Bright, airy, inviting.

**Layout (same on desktop and mobile):**
- Fixed background photo fills viewport (`<picture>` with responsive sources)
- Frosted glass text backdrop near top with title + tagline (clickable — scrolls to cards)
- Cards section scrolls over the photo with frosted glass treatment
- Individual cards are semi-transparent white with blur

**Responsive images:**
- Desktop: `sanctuary-desktop.png` (landscape conservatory)
- Mobile (<768px): `sanctuary-mobile.png` (portrait conservatory)
- `<picture>` element with `<source media="(max-width: 768px)">` — browser picks the right one, no JS

**Animations (js/cabin-home.js):**
- GSAP + Lenis smooth scroll (synced to single RAF loop)
- SplitText hero title: characters rise + fade with 0.04s stagger
- Tagline + scroll indicator fade in sequentially
- Scroll indicator fades out via ScrollTrigger scrub (0-15%)
- Cards reveal: y:60 → 0 + fade when scrolled to 85% viewport

**5 Navigation cards** (non-clickable divs, will become links when subpages built):
- Why We Exist, Discover, The Process, Facilitate, Gift Companion

**Companion bot button:** Fixed position, gold (#d4a853), bottom-right

### The Golden Book (`/giftsite/book/`)
Scroll-driven 3D page-flip book on a dark walnut desk. See MEMORY.md for full details.

### Cloud Ascent (`/giftsite/cloud/`)
- Three.js interactive scene with layered clouds, god rays, particles
- Uses pmndrs `postprocessing` for bloom + noise effects
- Touch/click interaction for particle burst
- **Known issues:** Cloud opacity balance is fragile. Don't use ACES tone mapping.

### Future: Gift Companion Bot
Placeholder icon exists on Sanctuary + Book templates. Will eventually be an interactive chatbot.

---

## Mobile Optimization

Primary target device: Modern iPhone (12+). Site should feel snappy and responsive.

- Sanctuary: portrait photo via `<picture>` — fills viewport naturally, no video
- Cloud template: full-viewport Three.js canvas
- Safe area insets respected (`env(safe-area-inset-bottom)`)
- All interactive elements minimum 44x44px touch targets

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
- `cabin/index.html` - The Sanctuary homepage (photo hero + frosted glass cards)
- `js/cabin-home.js` - GSAP/Lenis animations for Sanctuary page
- `book/index.html` - The Golden Book (scroll-driven page flip)
- `js/book-home.js` - GSAP accumulator scroll + page flip animations
- `cloud/index.html` - Cloud template (loads cloud-ascent.js)
- `js/concepts/cloud-ascent.js` - Three.js cloud scene logic
- `vite.config.js` - Build config with 4 entry points

---

## Archived Files

Solar system homepage and old subpages were removed from git but backed up locally:
`C:\Users\HarrisonKlein\Downloads\giftsite-solar-system-backup\`

Old cabin video assets (`cabin-fire.mp4`, `cabin-still.jpg`, `cabin-blur.jpg`) remain in `assets/` but are no longer referenced in code.

---

## MCP Tools

### Context7 - Documentation Lookup
Use Context7 for accurate, up-to-date documentation on:
- Three.js (shaders, materials, geometries, post-processing)
- Vite (build config, asset handling)

**Usage:** Add "use context7" to prompts, e.g., "use context7 to show Three.js post-processing examples"

### Playwright - Browser Automation
Use Playwright for:
- Visual testing of templates
- Screenshots for thumbnails
- Mobile viewport testing

**Usage:** "Use playwright to screenshot both templates at mobile viewport"
