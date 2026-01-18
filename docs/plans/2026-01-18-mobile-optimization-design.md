# Mobile Optimization Design

## Goal

Optimize the Gift Site for mobile-first usage. The primary user accesses via modern iPhone (12+), so the experience should be as good or better than desktop.

## Constraints

- Primary device: Modern iPhone (12+) - good GPU, handles 3D well
- No need for simplified mobile fallback
- Solar system remains primary navigation method

---

## Homepage (Solar System)

**Unchanged:**
- 3D solar system with planets
- Scroll-to-snap navigation between planets
- "Visit" button appears after arriving at planet
- Caption bar with title/description

**Mobile adjustments:**
- Tune touch scroll sensitivity (reduce threshold from 150px to ~80-100px)
- Ensure Visit button is minimum 44x44px touch target
- Verify caption bar is thumb-reachable (already at bottom)
- Scroll indicator dots already scale at 768px breakpoint

**Performance:**
- Modern iPhone handles Three.js + post-processing well
- No performance fallbacks needed

---

## Navigation

**Header:**
- Mobile shows logo only (nav links already hidden at 900px)
- Logo returns to homepage
- No hamburger menu - solar system IS the navigation

**Content page navigation:**
- Add next/prev links at bottom of each content page
- Sequential flow: Why We Exist → Discover → The Process → Facilitate
- Style: "Next: Discover →" / "← Back: Why We Exist"
- Placed above footer

**Pages and their links:**
| Page | Previous | Next |
|------|----------|------|
| why.html | (none) | Discover |
| discover.html | Why We Exist | The Process |
| process.html | Discover | Facilitate |
| facilitate.html | The Process | (none) |

---

## Touch & Typography

**Touch targets:**
- All interactive elements minimum 44x44px
- Verify: Visit button, scroll indicator dots, next/prev links
- Adequate spacing between tappable elements

**Typography:**
- Body text minimum 16px (prevents iOS auto-zoom)
- Line length constrained to ~45-65 characters
- Hero title already uses clamp() - scales appropriately

**Spacing:**
- Existing breakpoints handle padding reduction
- Review content pages for comfortable mobile reading

---

## Implementation Checklist

1. **Touch scroll sensitivity** - Reduce threshold in solar-system.js
2. **Visit button sizing** - Verify/increase touch target
3. **Next/prev links** - Add to why.html, discover.html, process.html, facilitate.html
4. **Touch target audit** - Check all interactive elements are 44px+
5. **Typography review** - Ensure readable font sizes on mobile
6. **Testing** - Verify on iPhone Safari
