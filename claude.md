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
├── index.html        # Main homepage
├── why.html          # Why We Exist
├── discover.html     # Discover page
├── process.html      # The Process (has GSAP animations)
├── facilitate.html   # Facilitate page
├── audiences.html    # Who It's For
├── companion.html    # Gift Companion (Coming Soon)
└── README.md
```

## Tech Stack
- Pure HTML/CSS/JavaScript (no build process)
- Google Fonts: Fraunces (display), Outfit (body)
- GSAP + ScrollTrigger + Lenis (on process.html)
- Deployed via GitHub Pages from `main` branch
