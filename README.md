# The Gift Site — Template Demos

Two design directions for The Gift Site redesign, presented as a single switchable demo.

## Templates

### Vessel
Contemplative, gallery-like aesthetic. Features dramatic dark/light vertical splits, generous negative space, subtle paper grain texture, and large typographic numbers. Feels like an art space or meditation guide.

### Gather
Warm, layered, handcrafted feel. Features soft overlapping shapes, inviting terracotta and sage color palette, and slightly rotated "note card" elements. More approachable while still refined.

## Structure

```
gift-site-demos/
├── index.html          ← Switcher (entry point)
├── vessel/
│   └── index.html      ← Vessel template
├── gather/
│   └── index.html      ← Gather template
└── README.md
```

## Deployment

### GitHub Pages (Recommended)

1. Create a new repository on GitHub
2. Upload these files maintaining the folder structure
3. Go to Settings → Pages
4. Set source to `main` branch, `/ (root)` folder
5. Your site will be live at `https://yourusername.github.io/repo-name/`

### Netlify Drop (Fastest)

1. Go to [app.netlify.com/drop](https://app.netlify.com/drop)
2. Drag the entire `gift-site-demos` folder onto the page
3. Instant live URL

## Usage

- Visit the root URL to see the switcher interface
- Use the floating toggle at the bottom to switch between templates
- Click the `?` button for template descriptions
- Each template is also accessible directly:
  - `/vessel/` — Vessel template
  - `/gather/` — Gather template

## Notes

- Both templates are fully responsive
- No build process required — pure HTML/CSS/JS
- Bot integration placeholder included (marked "Coming soon")
- All original site language preserved

---

*Created as a redesign proposal for [giftsite.org](https://giftsite.org)*
