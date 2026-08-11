# Premium-Blk Theme — Development Reference

> This file is the canonical reference for anyone (human or AI) working on the Premium-Blk Shopify theme. Read it before making any changes.

---

## What this is

Premium-Blk is a custom Shopify 2.0 theme built for legendary-branding.com (streetwear). It's a ground-up rewrite from a Dawn skeleton with a distinct visual identity: **pure black/white mono brutalist + editorial magazine design, bold sans-serif typography, dark mode default with light mode toggle**.

Design goals, in priority order:
1. **Performance first** — 90+ Lighthouse mobile, PSI green, top-5 CWV tier
2. **Premium visual quality** — editorial magazine + brutalist accents, not generic Dawn
3. **SEO excellence** — full JSON-LD coverage, technical SEO baked in
4. **Enterprise-grade architecture** — component system, testing, CI, documentation
5. **Conversion optimized** — streetwear-specific UX patterns

---

## Ground Rules

### Shopify Compliance (Non-negotiable)

**Read `SHOPIFY_COMPLIANCE.md` before writing any file.** All of these rules are enforced:

- Only these top-level directories are recognized by Shopify: `assets/`, `blocks/`, `config/`, `layout/`, `locales/`, `sections/`, `snippets/`, `templates/`
- **No subfolders** inside `assets/`, `snippets/`, `sections/`, `locales/`, or `config/`. Shopify ignores them.
- The one exception: `templates/customers/` is a valid subfolder for customer account templates.
- `layout/theme.liquid` is **required** — no file = can't upload theme.
- All snippet filenames use prefixes to organize: `icon-*`, `component-*`, `seo-*`, `layout-*`, `util-*`
- Section groups (JSON files in `sections/`) must have these required properties: `type`, `name`, `sections`, `order`
- Section groups are rendered with `{% sections 'group-name' %}` (PLURAL — not `{% section %}`)
- `gift_card.liquid` and `robots.txt.liquid` must be Liquid, not JSON
- `content_for_header` must be in `<head>` before `</head>` — never remove it
- Use `{% render %}`, not `{% include %}` (deprecated)
- All images must have `width` + `height` attributes and use `image_url: width: N` for proper sizing
- JSON template filenames must match valid Shopify template types: `index`, `product`, `collection`, `cart`, `page`, `blog`, `article`, `search`, `404`, `list-collections`, `password`

If you're unsure about whether something is valid Shopify, check `SHOPIFY_COMPLIANCE.md` first.

### CSS Architecture

See `ARCHITECTURE.md` §2 for full details. Summary:

- **Cascade Layers** in this order: `tokens → reset → base → components → sections → utilities → overrides`
- **3-level token system**: primitives → semantic → component. Components never reference primitives directly.
- **Naming**: `.t-*` tokens, `.c-*` components, `.s-*` sections, `.u-*` utilities, `.is-*` / `.has-*` state, `.js-*` JS hooks (never styled)
- Dark/light mode: `data-theme="dark|light"` on `<html>`. System preference via `prefers-color-scheme`. Both swap only Level 2 semantic tokens.
- No IDs in selectors. No `!important`. Max specificity: 0,2,0.
- No magic numbers — use token system for all spacing, colors, typography
- All colors must reference tokens (no hex/rgb values in component CSS)

### JavaScript Architecture

See `ARCHITECTURE.md` §3 for full details. Summary:

- **Zero frameworks.** Vanilla JS only. No React, Vue, jQuery, Alpine, Lodash.
- **Custom Elements** (Web Components) for every interactive component. Standard lifecycle: `constructor → connectedCallback → attributeChangedCallback → disconnectedCallback`
- **3-tier state**: component-local (default, 90% of cases) → pub/sub event bus (cross-component) → URL (filters/search)
- **Lazy init** via `IntersectionObserver` — components above fold init immediately, rest init when 200px from viewport
- **All scripts `defer`**. No `async` on theme scripts (async blocks rendering unpredictably).
- No global variables. Everything scoped to modules or custom elements.
- Clean up all listeners/subscriptions in `disconnectedCallback` — no memory leaks.
- Progressive enhancement: everything works without JS first. JS adds layers of interactivity.

### Liquid Component System

See `ARCHITECTURE.md` §4 for full details. Summary:

- Every snippet follows the exact pattern: comment header → parameter validation/defaults → computed values → markup
- All parameters passed explicitly via `{% render %}`. No reaching into global scope from inside snippets.
- All user-facing text escaped with `| escape`
- All external links have `rel="noopener noreferrer"`
- One component per snippet file
- Sections follow fixed order: `{% schema %} → {% stylesheet %} → {% javascript %} → markup`
- Sections must have `presets` to be addable via theme editor

### Performance Budgets

See `ARCHITECTURE.md` §6 for full details. **These are enforced — PRs that bust budgets are rejected.**

| Metric | Home | Collection | Product | Cart |
|---|---|---|---|---|
| Lighthouse performance (mobile) | ≥ 92 | ≥ 90 | ≥ 88 | ≥ 90 |
| LCP | < 1.8s | < 2.0s | < 2.2s | < 1.8s |
| CLS | < 0.02 | < 0.02 | < 0.03 | < 0.02 |
| TBT | < 50ms | < 75ms | < 100ms | < 60ms |
| Total JS (gzipped) | < 30KB | < 35KB | < 45KB | < 30KB |
| Critical CSS (inlined) | < 15KB | < 15KB | < 18KB | < 12KB |

### Accessibility

- WCAG 2.1 AA minimum on all interactive elements. AAA text contrast (which mono design makes trivial).
- All interactive elements keyboard-reachable and operable.
- Visible focus indicators (brutalist thick outline = built-in, not optional).
- Skip-to-content link on every page.
- All images have meaningful `alt` text (or `alt=""` if decorative).
- All form inputs have associated labels.
- `prefers-reduced-motion` respected — animations disabled for users who opt out.
- `prefers-color-scheme` respected — defaults match system when no user choice stored.

---

## Repository Structure

```
Premium-Blk-Theme/
│
│  ═══ THESE GO TO SHOPIFY ═══
│
├── assets/                      # All CSS, JS, images, fonts, SVG sprites (FLAT)
├── config/
│   ├── settings_schema.json     # Theme settings definition
│   └── settings_data.json       # Default values + presets
├── layout/
│   └── theme.liquid             # REQUIRED — master layout
├── locales/                     # 52 translation files (FLAT)
├── sections/                    # .liquid sections + .json section groups (FLAT)
├── snippets/                    # All reusable Liquid snippets (FLAT, prefix-organized)
└── templates/
    ├── *.json                   # JSON templates
    ├── gift_card.liquid         # MUST be Liquid
    ├── robots.txt.liquid        # MUST be Liquid
    └── customers/               # Only supported subfolder
│
│  ═══ DEV-ONLY — NOT pushed to Shopify ═══
│
├── docs/                        # Documentation
│   ├── ARCHITECTURE.md          # Full architecture spec
│   ├── SHOPIFY_COMPLIANCE.md    # Shopify naming/structure reference
│   ├── COMPONENTS.md            # Component catalog
│   ├── SETTINGS.md              # Settings reference
│   ├── PERFORMANCE.md           # Performance budget + methodology
│   ├── ACCESSIBILITY.md         # A11y standards + checklist
│   └── DEPLOYMENT.md            # Release process
├── src/                         # Source files (compiled to assets/)
│   ├── css/                     # PostCSS source (tokens, components, sections)
│   └── js/                      # JS modules (Vite-bundled to theme.js)
├── tests/
│   ├── visual/                  # Visual regression baselines
│   ├── perf/                    # Performance budget configs
│   └── a11y/                    # A11y test configs
├── claude.md                    # THIS FILE — read first
├── .shopifyignore               # Excludes dev files from theme pushes
├── .theme-check.yml             # Shopify Theme Check config
├── .stylelintrc                 # CSS linting
├── .eslintrc                    # JS linting
├── .prettierrc                  # Code formatting
├── package.json                 # Build scripts + dev dependencies
├── vite.config.js               # JS bundler config
└── theme.toml                   # Shopify CLI config
```

Dev-only files are excluded from Shopify pushes via `.shopifyignore`. Only the 7 standard directories go to Shopify.

---

## Snippet Naming Convention

Since snippets can't have subfolders, we use filename prefixes:

| Prefix | Category | Examples |
|---|---|---|
| `icon-*` | SVG icons | `icon-cart.liquid`, `icon-menu.liquid`, `icon-arrow.liquid` |
| `component-*` | UI components | `component-button.liquid`, `component-product-card.liquid`, `component-modal.liquid` |
| `seo-*` | SEO / meta tags | `seo-meta-tags.liquid`, `seo-json-ld-product.liquid` |
| `layout-*` | Layout helpers | `layout-breadcrumbs.liquid`, `layout-pagination.liquid` |
| `util-*` | Utility snippets | `util-image.liquid`, `util-money.liquid`, `util-link.liquid` |

When you add a new snippet, pick the right prefix and follow the snippet standard from `ARCHITECTURE.md` §4.1.

---

## Branching & Workflow

- `main` — production-ready, deployed to live store
- `live` — current working branch for active development (default branch for this work)
- Feature branches: `feature/[name]`
- Bugfix branches: `fix/[name]`
- Release tags: `v1.2.3` (semver)

PRs to `main` require:
1. All linting passes (Stylelint, ESLint, Theme Check)
2. Performance budgets met (Lighthouse CI)
3. Accessibility scan passes (pa11y)
4. Visual regression reviewed (Percy)
5. Manual QA sign-off

---

## Common Tasks

### Adding a new component snippet
1. Create `snippets/component-[name].liquid`
2. Follow the snippet template from `ARCHITECTURE.md` §4.1
3. Add CSS to `src/css/components/_[name].css` (or section CSS if section-specific)
4. Add JS custom element to `src/js/components/[name].js` if interactive
5. Document in `docs/COMPONENTS.md`

### Adding a new section
1. Create `sections/[name].liquid`
2. Follow section structure: schema → stylesheet → javascript → markup
3. Include presets in schema if it should be addable in theme editor
4. Set `enabled_on` / `disabled_on` for template restrictions
5. Register in relevant JSON templates

### Adding a new setting
1. Add to `config/settings_schema.json` in the appropriate group
2. Add the CSS variable mapping in `theme.liquid` (in the inline `:root` style block)
3. Add default value to `config/settings_data.json`
4. Document in `docs/SETTINGS.md`

### Changing the design system
1. Edit tokens in `src/css/tokens.css` (Level 1 primitives + Level 2 semantic)
2. Verify both dark and light modes are updated
3. Run visual regression tests
4. Update `docs/COMPONENTS.md` if component appearances change

---

## What NOT to do

- Don't create subdirectories inside `snippets/`, `assets/`, `sections/`, `locales/`, or `config/`
- Don't use `{% include %}` — always `{% render %}`
- Don't reference colors by hex value in component CSS — always use tokens
- Don't add JS frameworks or heavy libraries
- Don't use `async` on theme scripts (use `defer`)
- Don't remove `content_for_header` from `<head>`
- Don't create a template that isn't a valid Shopify template type
- Don't ship images without explicit `width` + `height` attributes
- Don't skip `alt` text on images (either meaningful alt or `alt=""` for decorative)
- Don't inline all your CSS in section stylesheet blocks — it hurts caching and bloats every page
- Don't add a new dependency without justifying it in the PR description

---

## Quick Reference: Valid Shopify Template Types

| Type | JSON | Liquid | Notes |
|---|---|---|---|
| `index` | ✅ | ✅ | Home page |
| `product` | ✅ | ✅ | Product page |
| `collection` | ✅ | ✅ | Collection page |
| `cart` | ✅ | ✅ | Cart page |
| `page` | ✅ | ✅ | Standard page |
| `blog` | ✅ | ✅ | Blog index |
| `article` | ✅ | ✅ | Blog post |
| `search` | ✅ | ✅ | Search results |
| `404` | ✅ | ✅ | Not found |
| `list-collections` | ✅ | ✅ | All collections |
| `password` | ✅ | ✅ | Password page |
| `gift_card` | ❌ | ✅ | Must be Liquid only |
| `robots.txt` | ❌ | ✅ | Must be Liquid only |
| `customers/account` | ✅ | ✅ | Customer account |
| `customers/login` | ✅ | ✅ | Login page |
| `customers/register` | ✅ | ✅ | Register page |
| `customers/addresses` | ✅ | ✅ | Addresses |
| `customers/order` | ✅ | ✅ | Order detail |
| `customers/reset_password` | ✅ | ✅ | Reset password |
| `customers/activate_account` | ✅ | ✅ | Activate account |

---

*Reference v1.0 — always check SHOPIFY_COMPLIANCE.md for the most up-to-date Shopify rules*
