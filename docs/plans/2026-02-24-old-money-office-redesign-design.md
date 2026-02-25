# Old Money Office Redesign — Design Document

**Date:** 2026-02-24
**Status:** Approved
**Branch:** `feature/reimagine-templates`

## Overview

Replace all existing templates (Sanctuary, Cloud Ascent, Golden Book) with two new templates set in an old money private study. A rich, ancient, ornate treasure chest centered in the room radiates golden light, illuminating mahogany paneling, leather-bound books, and quilted leather furniture. The room is warm and luminous despite its rich dark materials — the chest is the light source.

New tagline (both templates): **"Discover the beautiful and precious gift inside of you"**

## The Two Templates

### The Study (`/study/`)
Scroll-driven frame sequence. Same technical approach as the Sanctuary scroll-experience plan (Feb 20), but with the new office setting. User scrolls → chest opens further → gold light fills the screen → reveals navigation cards.

- Canvas + GSAP ScrollTrigger scrub
- ~120 WebP frames extracted from AI-generated video
- Progressive 3-phase loading
- Gold climax transitions into warm parchment card section

### The Discovery (`/discovery/`)
Static hero image + scroll to cards. A person seen from behind, looking into the open chest, gold light illuminating their silhouette. Simple, elegant — can be upgraded to scroll-driven later if the client prefers this theme.

- Static `<picture>` hero with `object-fit: cover`
- GSAP + Lenis for SplitText hero animation, ScrollTrigger card reveals
- Dust particles canvas (floating in golden light)

## AI Asset Prompts

Both scenes share the same room. Single wide landscape source for each, mobile crops center via `object-fit: cover`.

### Shared Scene Description
> A grand old money private study. Rich dark mahogany wood paneling and bookshelves filled with leather-bound books line the walls. A quilted leather armchair sits nearby. An ornate, ancient treasure chest sits centered on a large mahogany desk or table in the middle of the room. The chest is open, radiating warm golden light that illuminates the entire room — reflecting off the wood, leather, and book spines. The atmosphere is warm, luminous, and inviting despite the rich dark materials. Subtle dust motes float in the golden light.

### The Study — Base Frame (for video generation)
> [Shared scene]. The chest lid is barely cracked open, with a soft golden glow beginning to emanate from inside. The camera faces the chest straight-on at desk height. The room is warmly lit by the chest's glow. Photorealistic, cinematic lighting, shallow depth of field, 16:9 landscape composition.

**Video prompt** (applied to the base frame in image-to-video mode):
> Slow cinematic push-in camera movement toward the treasure chest on the desk. The chest lid gradually opens wider as the camera moves closer. The golden glow from inside the chest intensifies and grows, casting warm light across the mahogany walls and leather-bound books. Subtle dust motes float in the golden light. The study interior remains still and peaceful. The camera continues pushing in until the golden light from the chest fills the entire frame.

**Video tool chain:** Kling AI (iterate cheaply) → Runway Gen-4.5 (final quality). Single video source — mobile crops from same frames.

### The Discovery — Hero Image
> [Shared scene]. A person is seen from behind, kneeling or leaning over the open chest, looking down into it. Warm golden light from the chest illuminates their silhouette and casts long warm shadows across the study. The viewer sees over their shoulder into the golden glow. Photorealistic, cinematic lighting, warm golden color grade, 16:9 landscape composition.

## Color Palette

Shared by both templates:

| Role | Color | Usage |
|------|-------|-------|
| Deep mahogany | `#2a1810` | Page background, text on light areas |
| Warm parchment | `#f8f0e3` | Card backgrounds, heading text on dark |
| Burnished gold | `#d4a853` | Accents, "Gift" italic, dividers, hover states |
| Cognac | `#8b5e3c` | Secondary text, subtle borders |
| Soft amber | `#f5e6c8` | Card section background |

## Page Structure (both templates)

```
HERO (100vh)
  └─ Image or canvas (full viewport, object-fit: cover)
  └─ Subtle dark vignette overlay
  └─ Title: "Welcome to the Gift Site"
  └─ Tagline: "Discover the beautiful and precious gift inside of you"
  └─ Scroll indicator

[The Study only: SCROLL RUNWAY (~600vh, sticky canvas)]

CARDS SECTION
  └─ Warm parchment/amber background
  └─ "Explore Your Gift" heading
  └─ 5 navigation cards (Why We Exist, Discover, The Process, Facilitate, Gift Companion)
  └─ Gold accent borders, lift+glow hover

FOOTER
  └─ Deep mahogany background
  └─ Companion bot button (fixed, bottom-right)
```

## Shelved Templates

Cloud Ascent, Golden Book, and current Sanctuary files stay in the repo but are removed from `vite.config.js` entry points and the chooser page. User backs up locally (like solar system before).

## Chooser Page

Updated from 3 cards to 2. Same dark navy background. Wider cards to fill the space. New thumbnails for The Study and The Discovery.

## File Changes

### New Files
| File | Purpose |
|------|---------|
| `study/index.html` | The Study — scroll-driven template |
| `js/study-home.js` | GSAP/Lenis + frame-scroller integration |
| `discovery/index.html` | The Discovery — static hero template |
| `js/discovery-home.js` | GSAP/Lenis + SplitText + card reveals |
| `assets/study-hero.*` | Base image for The Study (AI-generated) |
| `assets/discovery-hero.*` | Hero image for The Discovery (AI-generated) |
| `assets/thumb-study.*` | Chooser thumbnail |
| `assets/thumb-discovery.*` | Chooser thumbnail |

### Modified Files
| File | Change |
|------|--------|
| `index.html` | Chooser — 2 cards, new thumbnails |
| `vite.config.js` | Replace cabin/cloud/book entries with study/discovery |

### Removed from Build (files stay in repo)
| File | Action |
|------|--------|
| `cabin/index.html`, `js/cabin-home.js` | Removed from vite config + chooser |
| `cloud/index.html`, `js/concepts/cloud-ascent.js` | Same |
| `book/index.html`, `js/book-home.js` | Same |

### Carried Forward from Scroll-Experience Plan
| File | Change |
|------|--------|
| `js/frame-scroller.js` | To be built (same spec as Feb 20 plan) |
| `scripts/extract-frames.mjs` | To be built (setting-agnostic, no changes needed) |
| `public/study-frames/` | Renamed from `sanctuary-frames/` |
