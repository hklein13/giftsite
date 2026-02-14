# Book Template Design

**Date:** 2026-02-14
**Status:** Design approved, pending implementation
**Replaces:** N/A (added as third template alongside Cabin and Cloud)

## Concept

A scroll-driven interactive book that visitors physically "open" and page through. The homepage is the book's front cover; scrolling opens it to reveal a table of contents where each section of the site is a clickable chapter. The entire site lives "inside the book" — subpages share the same book frame.

**Core metaphor:** Discovering your gift is like opening a book — each chapter reveals something new about yourself.

**Interaction model:** Scroll-driven. Pages turn via 3D CSS transforms as the user scrolls. No clicks required to progress — the book unfolds naturally. Mobile swipe/scroll drives the same mechanic.

## User Flow

```
[Front Cover]  → scroll →  [Cover flips open]  → scroll →  [Table of Contents]
  100vh                      3D page turn                     5 chapters listed
  Gold book                  pinned, scrubbed                 each clickable
  Title + tagline            rotateY 0→-180deg                links to subpages
```

### Scroll Map

| Scroll Position | What the User Sees |
|---|---|
| 0–100vh | **Front cover.** Book centered on screen. Title animates in (SplitText char stagger). Tagline fades in below. Scroll indicator at bottom. |
| 100vh–200vh | **Pinned: Cover flip.** The cover page rotates on its spine (left edge) from 0° to -180°, revealing the welcome page underneath. Shadow sweeps across during mid-flip. |
| 200vh–300vh | **Welcome page.** Brief intro text fades in. Sets the contemplative tone. |
| 300vh–400vh | **Pinned: Welcome page flip.** Same 3D flip reveals the Table of Contents. |
| 400vh+ | **Table of Contents.** Five chapters stagger in. Each is a clickable link to its subpage. |

Total scroll depth: ~5 viewport heights (cover + flip + welcome + flip + TOC).

## Pages

### Front Cover
- Full book cover, centered on a bright warm background
- **Title:** "The Gift Site" — Fraunces serif, cream on gold
- **Tagline:** "A journey of discovery awaits" — Outfit, lighter cream
- SplitText character animation on load (same technique as cabin hero)
- Scroll indicator ("Scroll to open") at bottom
- The book has a visible spine on the left edge and subtle shadow beneath

### Welcome Page (Inside Cover)
- Warm near-white parchment background
- Brief welcome text in dark sepia-brown
- Could include a small decorative flourish or chapter ornament
- Keeps it simple — this page is a breathing moment before the TOC

### Table of Contents
- Classic book TOC layout
- Chapter number + title + brief one-line description
- Five chapters:
  1. **Why We Exist** — Helping people discover their unique gift
  2. **Discover** — Self-reflection questions to begin the journey inward
  3. **The Process** — How discovery unfolds through reflection and dialogue
  4. **Facilitate** — Tools and guidance for group gift discovery
  5. **Gift Companion** — An AI companion to prepare for your journey
- Each chapter row is clickable → navigates to the subpage
- Staggered reveal animation as they come into view

## Visual Design

### Palette (Bright & Warm)

| Element | Color | Notes |
|---|---|---|
| Background (surface) | `#faf6f0` | Warm cream, like linen in sunlight |
| Book cover | `#d4a853` → `#c49a3a` | Golden gradient — warm, inviting, precious |
| Cover title | `#faf6f0` | Cream on gold |
| Cover tagline | `rgba(250,246,240,0.7)` | Softer cream |
| Page interior | `#fffcf7` | Near-white with warmth, like fresh paper |
| Body text | `#3a2a1a` | Dark sepia-brown for readability |
| Chapter titles | `#b8862d` | Rich gold |
| Accents / flourishes | `#d4a853` | Gold — chapter numbers, decorative elements |
| Spine | `#c49a3a` | Matches cover |
| Page flip shadow | `rgba(180,150,100,0.15)` | Warm and soft, not dark |
| Companion button | `#d4a853` | Gold circle, unchanged |

**Overall feel:** A beautiful golden book resting in a sunlit room. Bright, happy, warm — not dim or moody.

### Typography

- **Fraunces** (serif) — Cover title, chapter headings, section headings. Its variable weight and italic axis are perfect for the bookish feel.
- **Outfit** (sans-serif) — Body text, descriptions, page numbers. Clean and readable.
- No new fonts needed.

### Textures & Details

- No image textures — CSS gradients and layered box-shadows create the parchment/leather feel
- Book has rounded corners on the right edges, squared on the spine side
- Thin darker line on page right edge (paper thickness illusion)
- During flip: turning page casts a warm, soft shadow on the page beneath
- Cover may have a faint radial gold glow behind the title
- Small decorative flourishes (CSS borders or SVG ornaments) on chapter pages

## Page Flip Mechanics

### 3D Transform Setup

```
.book {
  perspective: 1800px;
  transform-style: preserve-3d;
}

.page {
  transform-origin: left center;    /* hinge on the spine */
  backface-visibility: hidden;
}
```

### How a Flip Works

1. A "page" div has two child faces — `.page-front` and `.page-back`
2. `.page-back` is pre-rotated `rotateY(180deg)` so it faces the right way when flipped
3. GSAP ScrollTrigger scrubs the page's `rotateY` from `0deg` → `-180deg`
4. At ~90deg (edge-on), the front face disappears and back face appears naturally
5. A shadow element tracks the flip angle for realistic light/shadow

### ScrollTrigger Config (per flip)

```js
ScrollTrigger.create({
  trigger: '.flip-section-N',
  start: 'top top',
  end: 'bottom top',
  pin: '.book',
  scrub: 0.5,
  onUpdate: (self) => {
    // Drive rotateY from 0 to -180 based on self.progress
  }
});
```

### Performance

- All transforms are GPU-composited (`rotateY`, `opacity`) — no layout thrashing
- Lenis smooth scroll synced to GSAP ticker (same as current cabin setup)
- Target: 60fps on modern iPhone 12+

## Mobile Considerations

- Book fills ~95% viewport width, centered
- Same scroll-driven flip works with touch/swipe — no special handling needed
- Pages may be slightly taller on mobile to accommodate text
- Spine is narrower on mobile
- Touch targets for TOC chapters: minimum 44px height
- Safe area insets respected for companion button

## Subpage Scalability

When a user clicks a chapter from the TOC:

- The subpage loads in the **same book frame** — the visitor stays "inside the book"
- A small "Contents" link or icon in the corner allows returning to the TOC
- Each subpage can have its own internal scroll within the book frame
- Page-flip transitions between subpages are optional (could be standard navigation with the book frame persistent)
- The book frame is a shared layout component reused across all pages

## Tech Stack

- **CSS 3D Transforms** — `perspective`, `rotateY`, `backface-visibility`, `transform-origin`
- **GSAP ScrollTrigger** — scroll-pinning and scrubbed flip animation (already in project)
- **GSAP SplitText** — cover title animation (already in project)
- **Lenis** — smooth scroll (already in project)
- **No new dependencies**

## File Structure (Planned)

```
giftsite/
├── book/
│   └── index.html          # Book template homepage
├── js/
│   └── book-home.js        # GSAP/Lenis: page flip logic, TOC reveals
├── index.html              # Updated chooser (now 3 cards)
└── assets/
    └── thumb-book.jpg      # Chooser thumbnail (to be created)
```

## Chooser Page Update

Add a third card to the template chooser (`index.html`):

- **Title:** "The Golden Book"
- **Description:** "An interactive book that opens to reveal your journey — scroll to turn pages"
- **Thumbnail:** Screenshot of the gold cover (generated after build)
- Grid changes from 2-column to accommodate 3 cards

## Open Questions

- Welcome page content — what text should appear? (Can use placeholder for now)
- Decorative flourishes — simple CSS borders vs. small SVG ornaments?
- Subpage book frame — implement now or defer until subpages are built?
