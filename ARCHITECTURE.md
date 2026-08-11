# Premium-Blk Theme — Enterprise Architecture Specification

## 0. Principles

1. **Performance is a feature, not an afterthought.** Every architectural decision is benchmarked against performance budgets. If it hurts PSI, it doesn't ship.
2. **Progressive enhancement.** Everything works without JavaScript. JS adds layers of interactivity, but the baseline experience is pure HTML+CSS.
3. **Convention over configuration.** Standardized patterns for every component type. No bespoke one-off solutions.
4. **Separation of concerns.** Liquid = data + markup. CSS = presentation. JS = behavior. No mingling.
5. **Build-time validation > runtime errors.** Lint, type-check, and schema-validate everything possible before deployment.
6. **One source of truth.** Design tokens are the canonical source for color, spacing, typography. No magic numbers in components.
7. **Accessibility is non-negotiable.** WCAG 2.1 AA minimum on every interactive element.
8. **Measurable quality gates.** No merge to main unless performance, accessibility, and visual regression budgets pass.

---

## 1. File Structure

> **Shopify compliance note:** All files must follow Shopify's exact directory structure. Only these top-level directories are recognized: `assets/`, `blocks/`, `config/`, `layout/`, `locales/`, `sections/`, `snippets/`, `templates/`. No other subdirectories are supported except `templates/customers/` and `templates/metaobject/`. Snippets must be flat (no subfolders) — use filename prefixes for organization instead.

```
Premium-Blk-Theme/
├── assets/                          # All assets (flat — no subfolders)
│   ├── critical.css                 # Above-the-fold CSS (inlined in head)
│   ├── base.css                     # All base + component CSS (deferred load)
│   ├── theme.js                     # Single JS bundle (deferred)
│   ├── section-hero.css             # Per-section CSS (loaded only when present)
│   ├── section-product-grid.css
│   ├── section-[name].css           # Pattern: section-[name].css
│   └── icons.svg                    # SVG sprite (all icons in one file)
│
├── config/
│   ├── settings_schema.json         # Theme settings definition
│   └── settings_data.json           # Default presets + current values
│
├── layout/
│   ├── theme.liquid                 # Master layout — REQUIRED by Shopify
│   └── password.liquid              # Password page layout (optional)
│
├── sections/                        # Shopify 2.0 sections (flat — no subfolders)
│   ├── header.liquid
│   ├── header-group.json            # Section group (type: "header")
│   ├── footer.liquid
│   ├── footer-group.json            # Section group (type: "footer")
│   ├── hero-editorial.liquid
│   ├── hero-split.liquid
│   ├── hero-typography.liquid
│   ├── marquee.liquid
│   ├── featured-collection.liquid
│   ├── editorial-text.liquid
│   ├── lookbook-grid.liquid
│   ├── horizontal-products.liquid
│   ├── featured-product.liquid
│   ├── brand-story.liquid
│   ├── countdown-drop.liquid
│   ├── text-columns.liquid
│   ├── collection-list.liquid
│   ├── logo-list.liquid
│   ├── newsletter.liquid
│   ├── cart-drawer.liquid
│   ├── predictive-search.liquid
│   ├── main-product.liquid
│   ├── main-collection.liquid
│   ├── main-cart.liquid
│   ├── main-blog.liquid
│   ├── main-article.liquid
│   ├── main-page.liquid
│   ├── main-search.liquid
│   ├── main-404.liquid
│   ├── related-products.liquid
│   └── ... (~50 total sections)
│
├── snippets/                        # ALL SNIPPETS FLAT — use prefixes to organize
│   # Icon snippets
│   ├── icon-arrow.liquid
│   ├── icon-cart.liquid
│   ├── icon-close.liquid
│   ├── icon-menu.liquid
│   ├── icon-search.liquid
│   ├── icon-star.liquid
│   └── icon-*.liquid
│   # Component snippets
│   ├── component-button.liquid
│   ├── component-product-card.liquid
│   ├── component-product-price.liquid
│   ├── component-product-badges.liquid
│   ├── component-product-media.liquid
│   ├── component-swatch.liquid
│   ├── component-quantity-input.liquid
│   ├── component-accordion.liquid
│   ├── component-tabs.liquid
│   ├── component-modal.liquid
│   ├── component-drawer.liquid
│   ├── component-form-field.liquid
│   └── component-spinner.liquid
│   # Layout snippets
│   ├── layout-breadcrumbs.liquid
│   ├── layout-pagination.liquid
│   ├── layout-skip-link.liquid
│   └── layout-section-header.liquid
│   # SEO snippets
│   ├── seo-meta-tags.liquid
│   ├── seo-json-ld-product.liquid
│   ├── seo-json-ld-collection.liquid
│   ├── seo-json-ld-article.liquid
│   ├── seo-json-ld-organization.liquid
│   └── seo-json-ld-breadcrumbs.liquid
│   # Utility snippets
│   ├── util-image.liquid            # Optimized image output (all sizes)
│   ├── util-link.liquid             # Standardized link wrapper
│   ├── util-money.liquid            # Price formatting
│   └── util-body-class.liquid       # Body class computation
│
├── templates/
│   ├── index.json
│   ├── product.json
│   ├── collection.json
│   ├── cart.json
│   ├── page.json
│   ├── page.contact.json
│   ├── blog.json
│   ├── article.json
│   ├── search.json
│   ├── 404.json
│   ├── password.json
│   ├── list-collections.json
│   ├── gift_card.liquid             # MUST be Liquid (Shopify requirement)
│   ├── robots.txt.liquid            # MUST be Liquid (Shopify requirement)
│   └── customers/                   # Only supported subfolder in templates/
│       ├── account.json
│       ├── activate_account.json
│       ├── addresses.json
│       ├── login.json
│       ├── order.json
│       ├── register.json
│       └── reset_password.json
│
├── locales/                         # All flat, 52 locales
│   ├── en.default.json              # Canonical source — all keys defined here
│   ├── en.json                      # Storefront English (merchant-editable)
│   ├── fr.json, de.json, es.json    # Other locales
│   └── [locale].schema.json         # Schema translations
│
├── docs/                            # Dev-only — NOT pushed to Shopify
│   ├── COMPONENTS.md                # Component catalog + usage
│   ├── SETTINGS.md                  # Settings reference
│   ├── PERFORMANCE.md               # Performance budget + methodology
│   ├── ACCESSIBILITY.md             # A11y standards + checklist
│   ├── DEPLOYMENT.md                # Release process
│   └── SHOPIFY_COMPLIANCE.md        # Shopify naming + structure reference
│
├── tests/                           # Dev-only — NOT pushed to Shopify
│   ├── visual/                      # Visual regression baseline images
│   ├── perf/                        # Performance budget configs
│   ├── a11y/                        # A11y test config
│   └── schemas/                     # JSON schema validators
│
├── src/                             # Dev-only — source files, compiled to assets/
│   ├── css/                         # PostCSS source (component files, tokens)
│   └── js/                          # JS modules (Vite-bundled to theme.js)
│
├── .theme-check.yml                 # Shopify Theme Check config
├── .stylelintrc                     # Stylelint config (CSS standards)
├── .eslintrc                        # ESLint config (JS standards)
├── .prettierrc                      # Code formatting
├── package.json                     # Build scripts, dev dependencies
├── vite.config.js                   # JS bundler (vanilla JS, no framework)
├── theme.toml                       # Shopify CLI theme config
├── ARCHITECTURE.md                  # This file
└── SHOPIFY_COMPLIANCE.md            # Shopify naming + structure reference
```

**Important:** Only these directories get pushed to Shopify:
`assets/`, `config/`, `layout/`, `locales/`, `sections/`, `snippets/`, `templates/`

Everything else (`docs/`, `tests/`, `src/`, `node_modules/`, config files) is developer-only and should be excluded from theme pushes via `.shopifyignore`.
```

---

## 2. CSS Architecture

### 2.1 Methodology: Utility-leaning BEM + Cascade Layers

We use **Cascade Layers** (`@layer`) for predictable specificity:

```css
@layer tokens, reset, base, components, sections, utilities, overrides;
```

Layer ordering (lowest to highest specificity):
1. **tokens** — CSS custom properties (design tokens), no selectors
2. **reset** — CSS reset (normalize + opinionated resets)
3. **base** — HTML element defaults (body, h1-h6, p, a, ul, form elements)
4. **components** — Reusable UI components (.c-btn, .c-card, etc.)
5. **sections** — Section-specific styles (.s-hero, .s-product-grid, etc.)
6. **utilities** — Single-purpose utility classes (.u-hidden, .u-text-center, etc.)
7. **overrides** — Theme editor custom CSS, print styles, reduced motion

### 2.2 Naming Convention

```
.t-*       /* tokens — CSS custom properties */
.c-*       /* components — reusable building blocks */
.s-*       /* sections — page sections (one per section file) */
.u-*       /* utilities — single-purpose helpers */
.is-*      /* state classes — .is-active, .is-open, .is-loading */
.has-*     /* state classes — .has-submenu, .has-image */
.js-*      /* JavaScript hooks — never styled, only for JS selection */
[data-*]   /* Data attributes for state — preferred over state classes for JS */
```

### 2.3 Design Token System

Three levels of tokens:

**Level 1 — Primitives (raw values)**
```css
--t-color-black: #000000;
--t-color-white: #ffffff;
--t-color-gray-900: #1a1a1a;
--t-color-red-500: #ff3b30;
--t-font-sans: 'Inter', system-ui, sans-serif;
--t-font-display: 'Display Grotesk', sans-serif;
--t-font-mono: 'JetBrains Mono', monospace;
--t-space-1: 4px;
--t-space-2: 8px;
...
```

**Level 2 — Semantic tokens (purpose-based, mapped from primitives)**
```css
--t-bg: var(--t-color-black);
--t-surface: var(--t-color-gray-900);
--t-text: var(--t-color-white);
--t-text-muted: var(--t-color-gray-400);
--t-border: var(--t-color-gray-800);
--t-border-strong: var(--t-color-white);
--t-accent: var(--t-color-white);
--t-accent-red: var(--t-color-red-500);
```

**Level 3 — Component tokens (component-specific overrides)**
```css
--c-btn-bg: var(--t-accent);
--c-btn-text: var(--t-bg);
--c-btn-padding-y: var(--t-space-4);
--c-btn-padding-x: var(--t-space-6);
--c-btn-radius: 0;
```

This three-level system means dark/light mode only swaps Level 2 tokens. Components never reference primitives directly.

### 2.4 Dark/Light Mode Implementation

No `body.dark-mode` class. Uses:
1. `prefers-color-scheme` media query for system preference (default)
2. `data-theme="dark|light"` attribute on `<html>` for user override
3. Token swap happens in one place:

```css
/* Dark mode (default) */
:root { --t-bg: #000; --t-text: #fff; ... }

/* Light mode override */
:root[data-theme="light"] { --t-bg: #fff; --t-text: #000; ... }

/* Respect system preference when no user choice */
@media (prefers-color-scheme: light) {
  :root:not([data-theme]) { --t-bg: #fff; --t-text: #000; ... }
}
```

No FOUC — a 1-line inline script in `<head>` (before CSS) reads localStorage and sets `data-theme` immediately.

### 2.5 Responsive System

Mobile-first. Breakpoints as custom properties:
```css
--t-bp-sm: 640px;
--t-bp-md: 768px;
--t-bp-lg: 1024px;
--t-bp-xl: 1280px;
--t-bp-2xl: 1536px;
```

Used via `@media (min-width: ...)`. No JS-based responsive logic. Container queries where appropriate for component-level responsiveness.

### 2.6 CSS File Strategy

- **critical.css** — ~10-15KB gzipped: tokens, reset, base, header, hero, layout grid, typography. Inlined in `<head>`.
- **base.css** — ~15-20KB gzipped: all components, utilities, below-the-fold layout. Loaded with `media="print" onload="this.media='all'"` (deferred, non-blocking).
- **section-[name].css** — Each section's CSS lives in its own file, loaded only when the section is present on a page.

### 2.7 CSS Quality Gates

- Stylelint with custom rule set (BEM naming, no IDs, no `!important`, token enforcement)
- Max specificity per selector: 0,2,0 (two classes max)
- No nested selectors deeper than 3 levels
- All colors must reference tokens (no hex/rgb in components)
- No magic numbers for spacing (use token system)
- CSS custom properties validated at build time

---

## 3. JavaScript Architecture

### 3.1 Principles

- **Zero framework dependencies.** Vanilla JS only.
- **Progressive enhancement.** Every JS feature degrades gracefully.
- **Custom Elements for components.** Each interactive component is a Web Component.
- **No global state.** State is component-local or in a lightweight pub/sub.
- **Lazy everything.** Components initialize when they enter the viewport.
- **Small bundle.** Target: < 30KB gzipped on home page.

### 3.2 Module Structure

```
src/js/
├── core/
│   ├── index.js              # Entry point, boot sequence
│   ├── lazy-loader.js        # IntersectionObserver-based component loader
│   ├── pubsub.js             # Event bus (publish/subscribe)
│   ├── state.js              # Lightweight reactive state store
│   ├── dom.js                # DOM utilities ($, $$, delegate, etc.)
│   ├── utils.js              # General utilities (debounce, throttle, clamp)
│   └── theme-toggle.js       # Dark/light mode controller
├── components/               # One file per custom element
│   ├── header.js             # <theme-header>
│   ├── product-card.js       # <product-card>
│   ├── product-gallery.js    # <product-gallery>
│   ├── variant-picker.js     # <variant-picker>
│   ├── cart-drawer.js        # <cart-drawer>
│   ├── predictive-search.js  # <predictive-search>
│   ├── quantity-input.js     # <quantity-input>
│   ├── accordion.js          # <ui-accordion>
│   ├── tabs.js               # <ui-tabs>
│   ├── modal.js              # <ui-modal>
│   ├── drawer.js             # <ui-drawer>
│   ├── marquee.js            # <ui-marquee>
│   ├── countdown.js          # <ui-countdown>
│   ├── quick-add.js          # <quick-add>
│   └── ...
├── sections/                 # Section-specific controllers
│   ├── hero-parallax.js
│   ├── product-grid.js
│   └── ...
├── api/                      # API clients
│   ├── shopify.js            # Storefront API / AJAX API wrappers
│   ├── cart.js               # Cart API (add, remove, update)
│   └── search.js             # Predictive search API
└── polyfills/                # Feature-detected polyfills (loaded conditionally)
```

### 3.3 Custom Element Pattern

Every component follows the same structure:

```javascript
class ProductCard extends HTMLElement {
  static observedAttributes = ['product-id', 'variant-id'];

  constructor() {
    super();
    this.state = {};
    this.bindMethods();
  }

  connectedCallback() {
    this.cacheDOM();
    this.bindEvents();
    this.pubsubTokens = [];
    this.isInitialized = true;
    this.dispatchEvent(new CustomEvent('ready', { bubbles: true }));
  }

  disconnectedCallback() {
    this.unbindEvents();
    this.pubsubTokens.forEach(t => PubSub.unsubscribe(t));
    this.isInitialized = false;
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (!this.isInitialized) return;
    if (oldValue === newValue) return;
    this[`on${name.replace(/-/g, '')}Change`]?.(newValue);
  }

  // --- internal ---
  cacheDOM() { /* query refs */ }
  bindEvents() { /* add listeners */ }
  unbindEvents() { /* remove listeners */ }
  bindMethods() { /* .bind(this) for all handlers */ }
  render() { /* update DOM from state */ }
}

customElements.define('product-card', ProductCard);
```

Rules:
- All public API through attributes, methods, and events
- No direct DOM manipulation from outside the component
- State changes always go through `this.state` and trigger `render()`
- Clean up everything in `disconnectedCallback` (no memory leaks)
- All event listeners are delegated where possible

### 3.4 State Management

No Redux, no Zustand. Three tiers:

1. **Component-local state** — `this.state` inside custom elements. Default for 90% of cases.
2. **Pub/Sub event bus** — For cross-component communication (cart updates, menu state). Lightweight publish/subscribe with named events.
3. **URL state** — For filters, pagination, search. The URL is the source of truth. Use `history.pushState` / `popstate` event.

Cart state is the only shared state that matters. It's managed by a single `<cart-controller>` element that publishes cart change events. All cart-consuming components subscribe to these events. No direct coupling.

### 3.5 Lazy Loading Strategy

Components are registered globally (custom element definitions are cheap — they're just class definitions). The expensive part — initialization, data fetching, heavy DOM manipulation — happens lazily:

```javascript
// Components initialize when they enter the viewport
const lazyObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting && !entry.target.isInitialized) {
      entry.target.init?.();
      lazyObserver.unobserve(entry.target);
    }
  });
}, { rootMargin: '200px' });
```

Components above the fold initialize immediately. Everything below waits until it's 200px from the viewport.

### 3.6 Error Handling

- Every component has a `try/catch` in `connectedCallback`
- Global error handler logs to console in dev, silently fails in production
- Failed API calls retry with exponential backoff (max 3 retries)
- All async operations have timeout guards
- No silent failures in dev mode — everything throws or logs visibly

### 3.7 JS Quality Gates

- ESLint + Prettier (enforced via pre-commit hook)
- No direct DOM selection with IDs (use `data-js` attributes or refs)
- No jQuery. No Lodash. No utility libraries.
- Every function has JSDoc type annotations
- Components must pass a11y tests (keyboard nav, ARIA labels, focus management)

---

## 4. Liquid Component System

### 4.1 Snippet Standards

Every snippet follows this exact structure:

```liquid
{% comment %}
  Component: [Name]
  Description: [What it renders, one sentence]

  Accepts:
  - param_name: {Type} Required/Optional — description
  - param_name_2: {Type} Default: value — description

  Usage:
  {% render 'component-name', param_name: value %}
{% endcomment %}

{%- liquid
  # Parameter validation + defaults
  assign _variant = variant | default: 'primary'
  assign _size = size | default: 'md'
  
  # Computed values
  assign _classes = ''
  if _variant == 'primary'
    assign _classes = _classes | append: ' c-btn--primary'
  endif
-%}

<a
  href="{{ url | default: '#' }}"
  class="c-btn {{ _classes }} {{ class | default: '' }}"
  {% if external %}target="_blank" rel="noopener noreferrer"{% endif %}
  {% if aria_label %}aria-label="{{ aria_label | escape }}"{% endif %}
>
  {{ label | escape }}
</a>
```

Rules:
- All parameters validated at top of snippet with sensible defaults
- No external data dependencies — everything comes from parameters
- CSS classes built up with string concatenation (no inline conditionals in class attribute)
- All user-facing text escaped with `| escape`
- All URLs validated with proper `rel` attributes
- One component per snippet file

### 4.2 Section Standards

Every section has exactly these parts in order:

1. `{% schema %}` block — JSON schema for theme editor
2. `{% stylesheet %}` block — section-specific CSS (scoped to section class)
3. `{% javascript %}` block — section-specific JS (custom element definition)
4. Liquid markup — the section HTML

**Schema conventions:**
- Always include `name` (required)
- Include `tag`, `class`, `enabled_on`, `max_blocks` where applicable
- Settings are grouped under `header` type for theme editor organization
- Every setting has a label, default value, and info text where needed
- Block types are defined with clear labels and presets
- All color/image/font settings use the proper Shopify input types
- Sections must have `presets` to be addable via the theme editor
- Section groups (JSON files in `sections/`) must have: `type` ("header"/"footer"/"aside"/"custom.*"), `name`, `sections`, `order`

**Section group schema example:**
```json
{
  "type": "header",
  "name": "Header group",
  "sections": {
    "announcement-bar": { "type": "announcement-bar", "settings": {} },
    "header": { "type": "header", "settings": {} }
  },
  "order": ["announcement-bar", "header"]
}
```

**Rendered in layout with:**
```liquid
{% sections 'header-group' %}   ← PLURAL "sections" tag for groups
{% section 'single-section' %}  ← SINGULAR "section" tag for individual sections
```

### 4.3 Data Flow

One-way data flow:
- **Templates** → define which sections render
- **Sections** → render snippets with data from Shopify objects + settings
- **Snippets** → pure presentational components, no data fetching
- **JS** → only enhances existing HTML, never creates content from scratch

No snippets reach into global variables. Everything is passed explicitly.

### 4.4 Performance Patterns in Liquid

- `{% capture %}` for computed values instead of repeated filter chains
- `{% assign %}` for variables used multiple times
- Avoid nested loops where possible — flatten data structures
- Use `size` check before loops to avoid empty iterations
- Pagination over infinite product lists
- Metafields accessed once per render, cached in variables
- No `{% include %}` (deprecated) — always `{% render %}` for isolation
- Lazy-load below-the-fold sections with `loading="lazy"` on their content

---

## 5. Build System

### 5.1 Tooling

- **Vite** — JS bundler (fast HMR, tree-shaking, code splitting)
- **PostCSS** — CSS processing (autoprefixer, nesting, custom media, minification)
- **Shopify CLI** — Theme dev server, push/pull, check
- **Stylelint** — CSS linting
- **ESLint** — JS linting
- **Prettier** — Code formatting (all languages)
- **Theme Check** — Shopify Liquid linting
- **Pa11y** — Accessibility testing
- **Lighthouse CI** — Performance testing
- **Percy** (optional) — Visual regression testing

### 5.2 Build Scripts

```json
{
  "dev": "shopify theme dev",
  "build:css": "postcss src/css/*.css -o assets/",
  "build:js": "vite build",
  "build": "npm run build:css && npm run build:js",
  "lint": "npm run lint:css && npm run lint:js && npm run lint:liquid",
  "lint:css": "stylelint 'src/css/**/*.css'",
  "lint:js": "eslint 'src/js/**/*.js'",
  "lint:liquid": "shopify theme check",
  "test:a11y": "pa11y-ci",
  "test:perf": "lhci autorun",
  "test:visual": "percy snapshot",
  "test": "npm run lint && npm run test:a11y && npm run test:perf"
}
```

### 5.3 CI/CD Pipeline

Every PR runs:
1. Linting (CSS, JS, Liquid)
2. Theme Check (Shopify best practices)
3. Accessibility scan (pa11y on key templates)
4. Lighthouse CI (performance budgets on key page types)
5. Visual regression snapshot (Percy, review-required changes)

Merge to main → auto-deploy to a staging theme → manual QA → promote to production.

---

## 6. Performance Budgets

### 6.1 Lighthouse Budgets (mobile)

| Metric | Home | Collection | Product | Cart |
|---|---|---|---|---|
| Performance score | ≥ 92 | ≥ 90 | ≥ 88 | ≥ 90 |
| FCP | < 1.2s | < 1.3s | < 1.4s | < 1.2s |
| LCP | < 1.8s | < 2.0s | < 2.2s | < 1.8s |
| TBT | < 50ms | < 75ms | < 100ms | < 60ms |
| CLS | < 0.02 | < 0.02 | < 0.03 | < 0.02 |
| INP | < 100ms | < 100ms | < 120ms | < 100ms |

### 6.2 Asset Budgets

| Asset | Budget (gzipped) |
|---|---|
| Inlined critical CSS | < 15KB |
| Base CSS (total) | < 30KB |
| Per-section CSS (avg) | < 3KB each |
| Total JS (home page) | < 30KB |
| Total JS (product page) | < 45KB |
| SVG icon sprite | < 5KB |
| Hero image (LCP) | < 100KB (webp) |
| Product card image | < 30KB (webp) |

### 6.3 Performance Monitoring

- Lighthouse CI runs on every PR
- Real User Monitoring (RUM) via `PerformanceObserver` in production
- Core Web Vitals tracked via CrUX / Shopify theme performance report
- Monthly performance audit with full waterfall analysis
- Performance budget enforced — PRs that bust budgets are blocked

---

## 7. Accessibility Standards

### 7.1 Requirements

- WCAG 2.1 AA minimum compliance on all interactive elements
- WCAG 2.1 AAA for text contrast (pure mono design makes this easy)
- Keyboard navigation: all interactive elements reachable and operable via keyboard
- Focus order matches visual order
- Visible focus indicators (brutalist thick outline = built-in)
- Skip-to-content link on every page
- All images have meaningful `alt` text (or `alt=""` if decorative)
- All form inputs have associated labels
- Error states are announced by screen readers
- `prefers-reduced-motion` respected (disable animations)
- `prefers-color-scheme` respected (dark/light mode)

### 7.2 A11y QA Process

- Automated: pa11y-ci on every PR (key templates)
- Manual: keyboard-only test on every major release
- Screen reader testing: VoiceOver (Safari) + NVDA (Firefox)
- Color contrast verified for all text + UI elements
- Focus management tested on all modals, drawers, and menus

---

## 8. Testing Strategy

### 8.1 Test Pyramid

1. **Static analysis** (linting, type checking) — cheapest, fastest, most automated
2. **Unit tests** (JS utilities, pure functions) — Vitest
3. **Component tests** (custom elements, rendering) — Playwright component testing
4. **Integration tests** (multi-component flows: add to cart → cart update)
5. **E2E tests** (happy path: browse → product → add to cart → checkout)
6. **Visual regression** (Percy) — catch unintended visual changes
7. **Performance tests** (Lighthouse CI) — budget enforcement
8. **Accessibility tests** (pa11y-ci) — a11y regressions
9. **Manual QA** — human check on major releases

### 8.2 What We Test

Critical flows (must pass on every release):
- Home page loads without errors
- Navigation works (header menu, mobile drawer, search)
- Collection page: filtering, sorting, pagination
- Product page: variant selection, add to cart, quantity change
- Cart: add item, remove item, update quantity, cart drawer
- Checkout: proceed to checkout from cart (up to Shopify checkout)
- Search: predictive search, search results page
- Forms: contact form, newsletter signup
- Theme toggle: dark/light mode persists across pages

---

## 9. Release Process

### 9.1 Versioning

Semantic versioning: `MAJOR.MINOR.PATCH`

- **MAJOR** — breaking changes to schema, templates, or component APIs
- **MINOR** — new features, new sections, new settings (backward-compatible)
- **PATCH** — bug fixes, performance improvements, a11y fixes

### 9.2 Release Cadence

- Minor releases: every 2 weeks
- Patch releases: as needed (bug fixes)
- Major releases: quarterly (or as needed for breaking changes)

### 9.3 Changelog

Every release has a CHANGELOG.md entry following Keep a Changelog format:
- Added
- Changed
- Deprecated
- Removed
- Fixed
- Security

### 9.4 Deployment

1. PR → review → merge to main
2. CI runs all checks
3. Auto-deploy to staging theme on the store
4. QA team validates in theme preview
5. Promote to production (theme publish)
6. Post-deployment: monitor RUM, CWV, error rates for 24h
7. Rollback plan: one-click publish of previous theme version

---

## 10. Known Gaps in Current Theme (to be addressed)

### Critical — Breaks Shopify recognition
1. **Broken asset pipeline** — `theme.liquid` references 24+ CSS files and 24+ JS files that don't exist in `assets/`. These return 404s and block rendering.
2. **Section groups missing required schema** — `header-group.json` and `footer-group.json` are missing the required `type` and `name` properties. They're not valid section groups.
3. **Wrong Liquid tag for section groups** — `theme.liquid` uses `{% sections 'announcement-bar' %}` as individual section tags but should use the plural `{% sections 'header-group' %}` tag to render the group.

### Architecture gaps
4. **Empty `base.css`** — all styling is inline in section `{% stylesheet %}` blocks (rendered on every page, no caching).
5. **Stub `theme.js`** — 5 lines, no component system, no pub/sub, no lazy loading.
6. **No design token system** — colors/typography are scattered across settings + inline styles.
7. **No dark/light mode** — settings have colors but no toggle or system preference support.
8. **No component library standard** — snippets have inconsistent interfaces, no parameter validation.

### Missing features
9. **No SEO infrastructure** — no JSON-LD, minimal meta tags, no OG/Twitter cards, no `robots.txt.liquid`.
10. **No `gift_card.liquid` template** — required for a complete theme (must be Liquid, not JSON).
11. **No accessibility standards** — focus management, keyboard nav, ARIA labels all missing.
12. **Missing premium sections** — marquee, editorial text, lookbook, horizontal scroll, countdown, etc.
13. **Minimal settings schema** — 8 groups, missing SEO, performance, product page, cart, etc.

### Process / quality gaps
14. **No testing infrastructure** — no linting, no a11y tests, no perf budgets, no Theme Check config.
15. **No build system** — no CSS processing, no JS bundling, no minification.
16. **No CI/CD** — no automated checks, no staging, no release process.
17. **No documentation** — no component docs, no settings reference, no contributor guide.

---

*Architecture v1.0 — enterprise-grade Shopify 2.0 theme spec*
