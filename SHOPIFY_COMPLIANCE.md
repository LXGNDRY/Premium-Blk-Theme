# Premium-Blk Theme — Shopify Compliance Reference

> This is the authoritative reference for all Shopify-specific file naming, structure, and conventions. Every file in this theme must follow these rules exactly. Deviate and Shopify will silently fail to recognize the file.

---

## 1. Directory Structure (Exactly These Folders)

Shopify only recognizes these top-level directories. **No other subdirectories are supported.** No `components/`, no `styles/`, no `scripts/` at the top level.

```
theme-name/
├── assets/          # All CSS, JS, images, fonts, SVG sprites
├── blocks/          # App block wrappers (rarely used in custom themes)
├── config/          # settings_schema.json + settings_data.json
├── layout/          # Layout files (theme.liquid is REQUIRED)
├── locales/         # Translation JSON files
├── sections/        # Section files (.liquid) + section groups (.json)
├── snippets/        # Reusable Liquid snippets (FLAT — no subfolders)
└── templates/       # Template files + customers/ subfolder
    └── customers/   # Customer account templates (only supported subfolder)
```

**Critical rule:** Subdirectories other than `templates/customers/` and `templates/metaobject/` are NOT supported. Files in any other subdirectory will be ignored by Shopify.

This means:
- No `snippets/components/` — all snippets are flat in `snippets/`
- No `assets/css/` or `assets/js/` — all assets flat in `assets/`
- No `sections/header/` — all sections flat in `sections/`
- No `locales/en/` — all locale files flat in `locales/`

Naming convention for organized snippets: use prefixes instead of subfolders:
```
snippets/
  icon-arrow.liquid
  icon-cart.liquid
  icon-menu.liquid
  component-button.liquid
  component-card.liquid
  component-modal.liquid
  seo-meta-tags.liquid
  seo-json-ld-product.liquid
  layout-breadcrumbs.liquid
  layout-pagination.liquid
```

---

## 2. Required Files

At minimum, a theme must have:
```
layout/theme.liquid    ← absolutely required — no theme.liquid = can't upload
```

Everything else is technically optional, but a functional theme needs at minimum:
```
config/settings_schema.json     # Theme settings definition
config/settings_data.json       # Theme settings default values
templates/index.json            # Home page
templates/product.json          # Product page
templates/collection.json       # Collection page
templates/cart.json             # Cart page
templates/page.json             # Standard page
templates/search.json           # Search results
templates/404.json              # Not found
sections/[at least one section]
```

---

## 3. File Naming Conventions

### 3.1 Templates

Template filenames must match a valid Shopify template type. Format:
```
[type].json                        # Default template
[type].[suffix].json              # Alternate template
```

**Valid template types:**
| Type | File | Purpose |
|---|---|---|
| `index` | `templates/index.json` | Home page |
| `product` | `templates/product.json` | Product page |
| `collection` | `templates/collection.json` | Collection page |
| `cart` | `templates/cart.json` | Cart page |
| `page` | `templates/page.json` | Standard page |
| `blog` | `templates/blog.json` | Blog index |
| `article` | `templates/article.json` | Blog article |
| `search` | `templates/search.json` | Search results |
| `404` | `templates/404.json` | Not found page |
| `list-collections` | `templates/list-collections.json` | All collections |
| `password` | `templates/password.json` | Password page |
| `gift_card` | `templates/gift_card.liquid` | Gift card (LIQUID ONLY, not JSON) |
| `robots.txt` | `templates/robots.txt.liquid` | robots.txt (LIQUID ONLY, not JSON) |

**Customer templates** (in `templates/customers/`):
```
templates/customers/account.json
templates/customers/activate_account.json
templates/customers/addresses.json
templates/customers/login.json
templates/customers/order.json
templates/customers/register.json
templates/customers/reset_password.json
```

**Important rules:**
- A template can be JSON OR Liquid, but NOT both. If `product.liquid` exists, you can't have `product.json`.
- `gift_card.liquid` and `robots.txt.liquid` MUST be Liquid. JSON templates don't work for these.
- Alternate templates: `product.editorial.json` = a second product template named "editorial"

### 3.2 Sections

Section files go in `sections/`. Two types:

1. **Liquid sections** (`.liquid`) — the actual section code
2. **Section groups** (`.json`) — containers for sections used in layouts (header, footer)

**Section naming:** `[name].liquid` — lowercase, hyphenated, descriptive
```
sections/header.liquid
sections/footer.liquid
sections/hero-editorial.liquid
sections/featured-collection.liquid
sections/main-product.liquid
```

**Section groups:** Use `*-group.json` naming convention:
```
sections/header-group.json     ← type: "header"
sections/footer-group.json     ← type: "footer"
sections/aside-group.json      ← type: "aside" (or custom.*)
```

**Section group schema (must have all four fields):**
```json
{
  "type": "header",
  "name": "Header group",
  "sections": {},
  "order": []
}
```

Valid `type` values:
- `header`
- `footer`
- `aside`
- `custom.[identifier]` (for custom section group types)

**Section limits:**
- Max 25 sections per JSON template
- Max 50 blocks per section
- Max 20 section group files per theme
- Max 1,000 JSON templates per theme

### 3.3 Snippets

All snippets in `snippets/`, flat structure (no subfolders).

Naming conventions (use prefixes to organize by category):
```
icon-*.liquid          # SVG icon snippets
component-*.liquid     # Reusable UI components
seo-*.liquid           # SEO-related snippets
layout-*.liquid        # Layout helpers
util-*.liquid          # Utility snippets
```

Rendered with:
```liquid
{% render 'component-button', label: 'Shop now', url: '/collections/all' %}
```

### 3.4 Locales

Locale files in `locales/`, flat structure.

Naming:
```
locales/en.default.json           # Default English — CANONICAL source of all keys
locales/en.json                   # Storefront English (merchant-editable)
locales/fr.json                   # French
locales/de.json                   # German
locales/en.default.schema.json    # Schema translations for English
locales/fr.schema.json            # Schema translations for French
```

Rules:
- One `.default.json` locale is the reference (usually `en.default.json`)
- Other locales should have the same keys
- Schema locale files (`*.schema.json`) translate theme editor labels
- File names use language codes: `en`, `fr`, `de`, `es`, `pt-BR`, `zh-CN`, etc.

### 3.5 Config

```
config/settings_schema.json     # Settings definition (what appears in Theme Editor)
config/settings_data.json       # Saved values + presets
```

`settings_schema.json` MUST start with a `theme_info` object:
```json
[
  {
    "name": "theme_info",
    "theme_name": "Premium Blk",
    "theme_author": "Legendary Branding",
    "theme_version": "1.0.0",
    "theme_documentation_url": "",
    "theme_support_url": ""
  },
  // ... rest of settings groups
]
```

`settings_data.json` structure:
```json
{
  "current": {
    "settings": {},
    "sections": {},
    "content_for_index": []
  },
  "presets": {
    "Default": {
      "settings": {},
      "sections": {},
      "content_for_index": []
    }
  }
}
```

### 3.6 Assets

All assets in `assets/`, flat structure.

Supported:
```
assets/base.css              # Regular CSS
assets/theme.js              # Regular JS
assets/logo.png              # Images (png, jpg, svg, webp, gif)
assets/icons.svg             # SVG sprite
assets/custom-font.woff2     # Fonts
assets/base.css.liquid       # CSS with Liquid (access to settings object)
assets/theme.js.liquid       # JS with Liquid (access to settings object)
```

Referenced with:
```liquid
{{ 'base.css' | asset_url | stylesheet_tag }}
{{ 'theme.js' | asset_url | script_tag }}
```

`.liquid` extension on assets gives access to:
- `settings` object
- Liquid filters
- But NOT `section` or other page-specific objects

---

## 4. Section Schema Rules

Every `.liquid` section file contains a `{% schema %}` block with JSON.

### Required schema properties

| Property | Type | Required? | Description |
|---|---|---|---|
| `name` | string | Yes | Section name (shown in theme editor) |
| `tag` | string | No | HTML tag to wrap section in (default: `div`) |
| `class` | string | No | CSS class for the wrapper |
| `limit` | number | No | Max instances per page |
| `max_blocks` | number | No | Max blocks per section |
| `settings` | array | No | Section settings |
| `blocks` | array | No | Block type definitions |
| `presets` | array | No | Presets (for "Add section" in theme editor) |
| `enabled_on` | object | No | Where section can be used |
| `disabled_on` | object | No | Where section is disabled |

### `enabled_on` / `disabled_on`

Control which templates a section can be added to:
```json
"enabled_on": {
  "groups": ["*"]   // "*" = all templates
}
```

Specific groups:
```json
"enabled_on": {
  "templates": ["index", "product"],
  "groups": ["header", "footer"]
}
```

### Presets

Sections MUST have presets to be addable via the theme editor:
```json
"presets": [
  {
    "name": "Featured collection",
    "settings": {
      "heading": "Featured"
    },
    "blocks": []
  }
]
```

Without `presets`, the section can only be included manually in template JSON files.

---

## 5. JSON Template Structure

```json
{
  "layout": "theme",
  "wrapper": "main#main-content.page-width",
  "sections": {
    "main-product": {
      "type": "main-product",
      "settings": {
        "show_vendor": true
      },
      "blocks": {}
    },
    "recommendations": {
      "type": "related-products",
      "settings": {}
    }
  },
  "order": ["main-product", "recommendations"]
}
```

Attributes:
- `layout` (optional) — which layout file to use (default: `theme`)
- `wrapper` (optional) — HTML wrapper element around all sections
- `sections` (required) — object of section ID → section data
- `order` (required) — array of section IDs in render order

**Section IDs** are alphanumeric only (no spaces, no special chars except hyphens/underscores).

**Section `type`** = the filename of the section in `sections/`, without `.liquid`.

---

## 6. Asset Loading Rules

### CSS

Shopify provides the `stylesheet_tag` filter, but for performance we often use raw `<link>` tags:

```liquid
{{ 'base.css' | asset_url | stylesheet_tag }}
```

or:

```liquid
<link rel="stylesheet" href="{{ 'base.css' | asset_url }}" media="print" onload="this.media='all'">
```

### JavaScript

```liquid
<script src="{{ 'theme.js' | asset_url }}" defer="defer"></script>
```

### Preloading critical assets

```liquid
<link rel="preload" href="{{ 'hero-image.jpg' | asset_url }}" as="image" fetchpriority="high">
<link rel="preconnect" href="https://cdn.shopify.com" crossorigin>
```

---

## 7. Liquid Conventions

### Tags to use / avoid

| Use | Avoid | Reason |
|---|---|---|
| `{% render %}` | `{% include %}` | `include` is deprecated, `render` has variable isolation |
| `{%- -%}` (whitespace trim) | `{% %}` | Cleaner HTML output, less CLS |
| `| escape` on user text | raw output | XSS prevention |
| `| money` for prices | manual formatting | Currency-aware |

### Image best practices

Always include `width` + `height` attributes + `srcset` + `sizes`:
```liquid
<img
  src="{{ image | image_url: width: 800 }}"
  srcset="
    {{ image | image_url: width: 400 }} 400w,
    {{ image | image_url: width: 800 }} 800w,
    {{ image | image_url: width: 1200 }} 1200w
  "
  sizes="(max-width: 768px) 100vw, 50vw"
  width="{{ image.width }}"
  height="{{ image.height }}"
  alt="{{ image.alt | escape }}"
  loading="lazy"
  decoding="async"
>
```

Use `image_url` filter with explicit `width` parameter — never rely on full-size images.

### The `content_for_header`

Must be in `<head>`, right before `</head>`:
```liquid
{{ content_for_header }}
```

This is how Shopify injects analytics, apps, and platform scripts. **Do NOT remove it.** Do NOT put it in the body.

### The `content_for_layout`

Where the template content is injected:
```liquid
<main id="MainContent">
  {{ content_for_layout }}
</main>
```

---

## 8. Section Groups in Layout

Section groups are rendered in layout files with the `{% sections %}` tag (note: plural, different from `{% section %}`):

```liquid
{% sections 'header-group' %}
```

NOT:
```liquid
{% section 'header-group' %}   ← WRONG — this is for single sections, not groups
```

Each section group file has a `type` (`header`, `footer`, `aside`, or `custom.*`) that determines how Shopify treats it in the theme editor.

---

## 9. Testing Compliance

Before deploying, always run:

```bash
shopify theme check
```

This catches:
- Missing required files
- Invalid schema JSON
- Undefined snippets
- Deprecated Liquid tags
- Missing templates
- Performance issues
- Accessibility issues

Also:
```bash
shopify theme info          # Theme metadata
shopify theme package       # Create a zip for the Theme Store
shopify theme push          # Push to a store
```

---

## 10. Current Theme Compliance Issues

Files in the current theme that need fixing:

1. **Broken asset references in theme.liquid** — references ~24 CSS files and ~24 JS files that don't exist in `assets/`. Shopify won't error on this (404s), but it adds render-blocking 404 requests that kill performance.

2. **Missing `gift_card.liquid`** — gift card template doesn't exist. Not strictly required for theme upload, but required for a complete theme.

3. **Missing `robots.txt.liquid`** — Shopify provides a default, but we should have our own for SEO control.

4. **Section groups missing `type` and `name`** — `header-group.json` and `footer-group.json` don't have the required `type` and `name` properties. They need these to be proper section groups.

5. **Empty `base.css`** + **stub `theme.js`** — the referenced assets exist but are essentially empty.

6. **Inconsistent `settings_data.json`** — references section IDs that don't match the template structure.

---

*Compliance reference v1.0 — based on Shopify Online Store 2.0 documentation*
