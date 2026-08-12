/*
 * Premium Blk Theme — theme.js
 * Vanilla JS only. Zero frameworks.
 * All components are Custom Elements (Web Components).
 * Progressive enhancement — everything works without JS first.
 */

(() => {
  'use strict';

  // ==========================================================================
  // CORE UTILITIES
  // ==========================================================================

  const $ = (selector, context = document) => context.querySelector(selector);
  const $$ = (selector, context = document) =>
    Array.from(context.querySelectorAll(selector));

  const debounce = (fn, wait = 200) => {
    let timeout;
    return function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => fn.apply(this, args), wait);
    };
  };

  const throttle = (fn, wait = 100) => {
    let last = 0;
    let timeout;
    return function (...args) {
      const now = Date.now();
      const remaining = wait - (now - last);
      if (remaining <= 0) {
        clearTimeout(timeout);
        last = now;
        fn.apply(this, args);
      } else if (!timeout) {
        timeout = setTimeout(() => {
          last = Date.now();
          fn.apply(this, args);
          timeout = null;
        }, remaining);
      }
    };
  };

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  const onReady = (fn) => {
    if (document.readyState !== 'loading') {
      fn();
    } else {
      document.addEventListener('DOMContentLoaded', fn, { once: true });
    }
  };

  // Money formatting (Shopify pattern)
  const formatMoney = (cents, format = '${{ amount }}') => {
    if (typeof cents !== 'number') cents = parseInt(cents, 10) || 0;
    const dollars = cents / 100;
    const amount = dollars.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return format.replace('{{ amount }}', amount);
  };

  // ==========================================================================
  // PUB/SUB EVENT BUS
  // ==========================================================================
  // Lightweight publish/subscribe for cross-component communication.
  // Components publish events, other components subscribe. No direct coupling.

  const PubSub = (() => {
    const events = new Map();
    let uid = 0;

    const subscribe = (event, callback) => {
      if (!events.has(event)) events.set(event, new Map());
      const token = ++uid;
      events.get(event).set(token, callback);
      return token;
    };

    const unsubscribe = (token) => {
      for (const [, map] of events) {
        if (map.has(token)) {
          map.delete(token);
          return true;
        }
      }
      return false;
    };

    const publish = (event, data = {}) => {
      if (!events.has(event)) return;
      for (const callback of events.get(event).values()) {
        try {
          callback(data);
        } catch (e) {
          console.error(`[PubSub] Error in subscriber for "${event}":`, e);
        }
      }
    };

    return { subscribe, unsubscribe, publish };
  })();

  // Expose for debugging
  window.__theme = window.__theme || {};
  window.__theme.PubSub = PubSub;

  // ==========================================================================
  // LAZY COMPONENT LOADER
  // ==========================================================================
  // Components initialize when they enter the viewport (200px margin).
  // Above-the-fold components initialize immediately.
  // Components signal readiness via `data-init` attribute.

  class LazyLoader {
    constructor() {
      this.observer = null;
      this.init();
    }

    init() {
      if (!('IntersectionObserver' in window)) {
        // No IntersectionObserver support — init everything immediately
        this.initAll();
        return;
      }

      this.observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              this.initComponent(entry.target);
              this.observer.unobserve(entry.target);
            }
          });
        },
        { rootMargin: '200px 0px' }
      );
    }

    observe(el) {
      if (!this.observer) {
        this.initComponent(el);
        return;
      }
      this.observer.observe(el);
    }

    initComponent(el) {
      if (el.dataset.init === 'true') return;
      if (typeof el.init === 'function') {
        try {
          el.init();
        } catch (e) {
          console.error('[LazyLoader] Failed to init component:', el.tagName, e);
        }
      }
      el.dataset.init = 'true';
    }

    initAll() {
      $$('[data-lazy-init]').forEach((el) => this.initComponent(el));
    }
  }

  const lazyLoader = new LazyLoader();

  // ==========================================================================
  // BASE COMPONENT CLASS
  // ==========================================================================
  // All theme custom elements extend this.
  // Standard lifecycle: constructor → connectedCallback → init → disconnectedCallback

  class ThemeComponent extends HTMLElement {
    constructor() {
      super();
      this._state = {};
      this._pubsubTokens = [];
      this._listeners = new Map();
      this._initialized = false;
    }

    connectedCallback() {
      if (this.hasAttribute('data-lazy')) {
        lazyLoader.observe(this);
      } else {
        this.init();
      }
    }

    disconnectedCallback() {
      this._cleanup();
      this._initialized = false;
    }

    init() {
      if (this._initialized) return;
      this._initialized = true;
      this.cacheDOM();
      this.bindEvents();
      this.ready();
      this.dispatchEvent(
        new CustomEvent('ready', { bubbles: true, detail: { el: this } })
      );
    }

    // Override in subclass
    cacheDOM() {}
    bindEvents() {}
    ready() {}

    // State management
    get state() {
      return { ...this._state };
    }

    setState(patch) {
      const prev = { ...this._state };
      this._state = { ...this._state, ...patch };
      this.onStateChange(prev, this._state);
    }

    onStateChange(prev, next) {
      // Override in subclass
    }

    // Event helpers
    on(event, handler, context = this) {
      const bound = handler.bind(context);
      this.addEventListener(event, bound);
      this._listeners.set(handler, bound);
      return () => this.off(event, handler);
    }

    off(event, handler) {
      const bound = this._listeners.get(handler);
      if (bound) {
        this.removeEventListener(event, bound);
        this._listeners.delete(handler);
      }
    }

    // Pub/sub helpers
    subscribe(event, callback) {
      const token = PubSub.subscribe(event, callback.bind(this));
      this._pubsubTokens.push(token);
      return token;
    }

    publish(event, data) {
      PubSub.publish(event, data);
    }

    _cleanup() {
      // Unsubscribe all pub/sub tokens
      this._pubsubTokens.forEach((token) => PubSub.unsubscribe(token));
      this._pubsubTokens = [];
      // Event listeners are cleaned up by the browser when element is removed
      this._listeners.clear();
    }
  }

  // ==========================================================================
  // THEME TOGGLE (Dark / Light mode)
  // ==========================================================================

  class ThemeToggle extends ThemeComponent {
    static observedAttributes = ['mode'];

    cacheDOM() {
      this.button = $('button', this) || this;
    }

    bindEvents() {
      this.button.addEventListener('click', () => this.toggle());
    }

    ready() {
      this._updateLabel();
      // Listen for changes from other toggles on the page
      this.subscribe('theme:change', () => this._updateLabel());
    }

    get currentMode() {
      const stored = localStorage.getItem('theme-mode');
      if (stored === 'dark' || stored === 'light') return stored;
      return window.matchMedia('(prefers-color-scheme: light)').matches
        ? 'light'
        : 'dark';
    }

    toggle() {
      const next = this.currentMode === 'dark' ? 'light' : 'dark';
      this.setMode(next);
    }

    setMode(mode) {
      if (mode !== 'dark' && mode !== 'light') return;
      document.documentElement.setAttribute('data-theme', mode);
      try {
        localStorage.setItem('theme-mode', mode);
      } catch (e) {}
      this.publish('theme:change', { mode });
      this._updateLabel();
    }

    _updateLabel() {
      const mode = this.currentMode;
      this.setAttribute('mode', mode);
      this.setAttribute('aria-label', mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
      this.dataset.mode = mode;
    }
  }

  customElements.define('theme-toggle', ThemeToggle);

  // ==========================================================================
  // ACCORDION COMPONENT
  // ==========================================================================

  class Accordion extends ThemeComponent {
    cacheDOM() {
      this.items = $$('.c-accordion__item', this);
    }

    bindEvents() {
      this.items.forEach((item) => {
        const trigger = $('.c-accordion__trigger', item);
        trigger.addEventListener('click', () => this.toggle(item));
        trigger.addEventListener('keydown', (e) => this._onKeydown(e, item));
      });
    }

    ready() {
      // Initialize first item as open if configured
      if (this.hasAttribute('first-open') && this.items.length) {
        this.open(this.items[0], true);
      }
    }

    toggle(item) {
      const isOpen = item.getAttribute('aria-expanded') === 'true';
      if (isOpen) {
        this.close(item);
      } else {
        this.open(item);
      }
    }

    open(item, silent = false) {
      // If single-open mode, close others
      if (this.hasAttribute('single')) {
        this.items.forEach((other) => {
          if (other !== item) this.close(other);
        });
      }
      item.setAttribute('aria-expanded', 'true');
      const content = $('.c-accordion__content', item);
      if (content) content.style.maxHeight = content.scrollHeight + 'px';
      if (!silent) this.publish('accordion:open', { item, el: this });
    }

    close(item, silent = false) {
      item.setAttribute('aria-expanded', 'false');
      const content = $('.c-accordion__content', item);
      if (content) content.style.maxHeight = '0';
      if (!silent) this.publish('accordion:close', { item, el: this });
    }

    _onKeydown(e, item) {
      const items = this.items;
      const index = items.indexOf(item);
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          items[(index + 1) % items.length].querySelector('.c-accordion__trigger').focus();
          break;
        case 'ArrowUp':
          e.preventDefault();
          items[(index - 1 + items.length) % items.length]
            .querySelector('.c-accordion__trigger')
            .focus();
          break;
        case 'Home':
          e.preventDefault();
          items[0].querySelector('.c-accordion__trigger').focus();
          break;
        case 'End':
          e.preventDefault();
          items[items.length - 1].querySelector('.c-accordion__trigger').focus();
          break;
      }
    }
  }

  customElements.define('ui-accordion', Accordion);

  // ==========================================================================
  // TABS COMPONENT
  // ==========================================================================

  class Tabs extends ThemeComponent {
    cacheDOM() {
      this.triggers = $$('.c-tabs__trigger', this);
      this.panels = $$('.c-tabs__panel', this);
    }

    bindEvents() {
      this.triggers.forEach((trigger, i) => {
        trigger.addEventListener('click', () => this.activate(i));
        trigger.addEventListener('keydown', (e) => this._onKeydown(e, i));
      });
    }

    ready() {
      // Activate first tab by default
      if (this.triggers.length) this.activate(0, true);
    }

    activate(index, silent = false) {
      if (index < 0 || index >= this.triggers.length) return;
      this.triggers.forEach((t, i) => {
        const selected = i === index;
        t.setAttribute('aria-selected', String(selected));
        t.tabIndex = selected ? 0 : -1;
      });
      this.panels.forEach((p, i) => {
        if (i === index) {
          p.hidden = false;
        } else {
          p.hidden = true;
        }
      });
      if (!silent) {
        this.publish('tabs:change', { index, el: this });
      }
    }

    _onKeydown(e, index) {
      const count = this.triggers.length;
      switch (e.key) {
        case 'ArrowRight':
          e.preventDefault();
          this.activate((index + 1) % count);
          this.triggers[(index + 1) % count].focus();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          this.activate((index - 1 + count) % count);
          this.triggers[(index - 1 + count) % count].focus();
          break;
        case 'Home':
          e.preventDefault();
          this.activate(0);
          this.triggers[0].focus();
          break;
        case 'End':
          e.preventDefault();
          this.activate(count - 1);
          this.triggers[count - 1].focus();
          break;
      }
    }
  }

  customElements.define('ui-tabs', Tabs);

  // ==========================================================================
  // DRAWER COMPONENT
  // ==========================================================================

  class Drawer extends ThemeComponent {
    static observedAttributes = ['open', 'position'];

    cacheDOM() {
      this.overlay = $('.c-drawer__overlay', this) || document.querySelector(`.c-drawer__overlay[data-for="${this.id}"]`);
      this.closeBtn = $('.c-drawer__close', this);
      this._focusableSelectors =
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    }

    bindEvents() {
      if (this.closeBtn) {
        this.closeBtn.addEventListener('click', () => this.close());
      }
      if (this.overlay) {
        this.overlay.addEventListener('click', () => this.close());
      }
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.isOpen) this.close();
      });
    }

    get isOpen() {
      return this.classList.contains('is-open');
    }

    open() {
      this.classList.add('is-open');
      this.setAttribute('aria-hidden', 'false');
      if (this.overlay) this.overlay.classList.add('is-visible');
      document.body.style.overflow = 'hidden';
      this._firstFocusable = this._getFocusable()[0];
      if (this._firstFocusable) this._firstFocusable.focus();
      this.publish('drawer:open', { el: this, id: this.id });
    }

    close() {
      this.classList.remove('is-open');
      this.setAttribute('aria-hidden', 'true');
      if (this.overlay) this.overlay.classList.remove('is-visible');
      document.body.style.overflow = '';
      // Return focus to trigger if available
      if (this._previousFocus) this._previousFocus.focus();
      this.publish('drawer:close', { el: this, id: this.id });
    }

    toggle() {
      if (this.isOpen) this.close();
      else {
        this._previousFocus = document.activeElement;
        this.open();
      }
    }

    _getFocusable() {
      return $$(this._focusableSelectors, this).filter(
        (el) => !el.disabled && el.offsetParent !== null
      );
    }
  }

  customElements.define('ui-drawer', Drawer);

  // ==========================================================================
  // QUANTITY INPUT COMPONENT
  // ==========================================================================

  class QuantityInput extends ThemeComponent {
    static observedAttributes = ['value', 'min', 'max'];

    cacheDOM() {
      this.input = $('input[type="number"]', this);
      this.decBtn = $('[data-action="decrease"]', this);
      this.incBtn = $('[data-action="increase"]', this);
    }

    bindEvents() {
      if (this.decBtn) this.decBtn.addEventListener('click', () => this.decrease());
      if (this.incBtn) this.incBtn.addEventListener('click', () => this.increase());
      if (this.input) {
        this.input.addEventListener('change', () => this._onInputChange());
        this.input.addEventListener('input', () => this._validate());
      }
    }

    get value() {
      return this.input ? parseInt(this.input.value, 10) : 1;
    }

    get min() {
      return this.input ? parseInt(this.input.min, 10) || 1 : 1;
    }

    get max() {
      return this.input ? parseInt(this.input.max, 10) || 999 : 999;
    }

    increase() {
      const next = Math.min(this.value + 1, this.max);
      this.setValue(next);
    }

    decrease() {
      const next = Math.max(this.value - 1, this.min);
      this.setValue(next);
    }

    setValue(value, silent = false) {
      const clamped = clamp(value, this.min, this.max);
      if (this.input) this.input.value = clamped;
      this._validate();
      if (!silent) {
        this.publish('quantity:change', { value: clamped, el: this });
        this.dispatchEvent(new CustomEvent('change', { detail: { value: clamped } }));
      }
    }

    _onInputChange() {
      this.setValue(this.value);
    }

    _validate() {
      if (!this.input) return;
      const v = this.value;
      if (this.decBtn) this.decBtn.disabled = v <= this.min;
      if (this.incBtn) this.incBtn.disabled = v >= this.max;
    }
  }

  customElements.define('quantity-input', QuantityInput);

  // ==========================================================================
  // CART DRAWER
  // ==========================================================================
  // Simple cart drawer wrapper with AJAX add-to-cart.
  // Uses Shopify's /cart/add.js API endpoint.

  class CartDrawer extends ThemeComponent {
    cacheDOM() {
      this.drawer = this.closest('ui-drawer') || this;
      this.countEl = $('[data-cart-count]', this);
      this.totalEl = $('[data-cart-total]', this);
      this.itemsEl = $('[data-cart-items]', this);
      this.emptyEl = $('[data-cart-empty]', this);
    }

    bindEvents() {
      // Listen for add-to-cart events
      this.subscribe('cart:add', (data) => this.addItem(data));
      this.subscribe('cart:update', () => this.refresh());
      this.subscribe('cart:toggle', () => this.toggle());

      // Delegated remove/update from cart items
      this.addEventListener('click', (e) => {
        const removeBtn = e.target.closest('[data-remove-item]');
        if (removeBtn) {
          e.preventDefault();
          const key = removeBtn.dataset.removeItem;
          this.removeItem(key);
        }
      });
    }

    ready() {
      this._updateCount();
    }

    async addItem({ id, quantity = 1, properties = {} }) {
      try {
        const formData = new FormData();
        formData.append('id', id);
        formData.append('quantity', quantity);
        Object.entries(properties).forEach(([k, v]) => {
          formData.append(`properties[${k}]`, v);
        });

        const res = await fetch('/cart/add.js', {
          method: 'POST',
          body: formData,
          headers: { Accept: 'application/json' },
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.description || 'Failed to add to cart');
        }

        await this.refresh();
        this.publish('cart:add:success');
        this.open();
      } catch (err) {
        this.publish('cart:add:error', { error: err.message });
        console.error('[Cart] Add failed:', err);
      }
    }

    async removeItem(key) {
      try {
        await fetch('/cart/change.js', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({ id: key, quantity: 0 }),
        });
        await this.refresh();
      } catch (err) {
        console.error('[Cart] Remove failed:', err);
      }
    }

    async refresh() {
      try {
        const res = await fetch('/cart.js', {
          headers: { Accept: 'application/json' },
        });
        const cart = await res.json();
        this._updateCount(cart.item_count);
        this._updateTotal(cart.total_price);
        this._updateEmpty(cart.item_count === 0);
        this.publish('cart:refreshed', { cart });
      } catch (err) {
        console.error('[Cart] Refresh failed:', err);
      }
    }

    open() {
      if (this.drawer && this.drawer.open) this.drawer.open();
    }

    close() {
      if (this.drawer && this.drawer.close) this.drawer.close();
    }

    toggle() {
      if (this.drawer && this.drawer.toggle) this.drawer.toggle();
    }

    _updateCount(count) {
      if (this.countEl) this.countEl.textContent = count != null ? count : '';
    }

    _updateTotal(cents) {
      if (!this.totalEl || cents == null) return;
      const moneyFormat =
        window.__theme?.moneyFormat || '${{ amount }}';
      const dollars = (cents / 100).toFixed(2);
      this.totalEl.textContent = moneyFormat.replace('{{ amount }}', dollars);
    }

    _updateEmpty(isEmpty) {
      if (this.emptyEl) this.emptyEl.hidden = !isEmpty;
    }
  }

  customElements.define('cart-drawer', CartDrawer);

  // ==========================================================================
  // MOBILE NAV DRAWER
  // ==========================================================================

  class MobileNav extends ThemeComponent {
    cacheDOM() {
      this.toggleButtons = $$('[data-mobile-nav-toggle]');
    }

    bindEvents() {
      this.toggleButtons.forEach((btn) => {
        btn.addEventListener('click', () => this.toggle());
      });
    }

    open() {
      this.publish('mobile-nav:open');
      const drawer = document.querySelector('ui-drawer[data-mobile-nav]');
      if (drawer && drawer.open) drawer.open();
    }

    close() {
      this.publish('mobile-nav:close');
      const drawer = document.querySelector('ui-drawer[data-mobile-nav]');
      if (drawer && drawer.close) drawer.close();
    }

    toggle() {
      const drawer = document.querySelector('ui-drawer[data-mobile-nav]');
      if (drawer && drawer.toggle) drawer.toggle();
    }
  }

  // Auto-initialize mobile nav controller
  onReady(() => {
    const nav = document.createElement('div');
    nav.style.display = 'none';
    new MobileNav().connectedCallback.call(nav);
  });

  // ==========================================================================
  // ANNOUNCEMENT BAR
  // ==========================================================================

  class AnnouncementBar extends ThemeComponent {
    ready() {
      // Dismissible announcement bar
      const dismissBtn = $('[data-dismiss]', this);
      if (dismissBtn) {
        dismissBtn.addEventListener('click', () => this.dismiss());
      }
    }

    dismiss() {
      this.style.display = 'none';
      try {
        sessionStorage.setItem('announcement-dismissed', 'true');
      } catch (e) {}
      this.publish('announcement:dismiss');
    }
  }

  customElements.define('announcement-bar', AnnouncementBar);

  // ==========================================================================
  // SCROLL-TRIGGERED HEADER (sticky on scroll up)
  // ==========================================================================

  class StickyHeader extends ThemeComponent {
    cacheDOM() {
      this.header = this;
    }

    bindEvents() {
      this._onScroll = throttle(() => this._update(), 100);
      window.addEventListener('scroll', this._onScroll, { passive: true });
    }

    ready() {
      this._lastScroll = 0;
      this._isVisible = true;
      this._update();
    }

    disconnectedCallback() {
      super.disconnectedCallback();
      window.removeEventListener('scroll', this._onScroll);
    }

    _update() {
      const scrollY = window.scrollY;
      const threshold = 100;

      // Always show at top
      if (scrollY < threshold) {
        this._show();
        this._lastScroll = scrollY;
        return;
      }

      // Scrolling down → hide
      if (scrollY > this._lastScroll + 5 && this._isVisible) {
        this._hide();
      }
      // Scrolling up → show
      else if (scrollY < this._lastScroll - 5 && !this._isVisible) {
        this._show();
      }

      this._lastScroll = scrollY;
    }

    _hide() {
      this._isVisible = false;
      this.classList.add('is-hidden');
      this.style.transform = 'translateY(-100%)';
      this.style.transition = 'transform 0.3s ease';
    }

    _show() {
      this._isVisible = true;
      this.classList.remove('is-hidden');
      this.style.transform = '';
    }
  }

  customElements.define('sticky-header', StickyHeader);

  // ==========================================================================
  // CART API — AJAX cart operations
  // ==========================================================================
  // All cart interactions go through this. PubSub events for cross-component sync.
  // Works with the default Shopify AJAX cart API (/cart.js, /cart/add.js, etc.)

  const CartAPI = {
    // Get current cart state
    async getCart() {
      try {
        const res = await fetch('/cart.js', {
          headers: { 'Accept': 'application/json' }
        });
        if (!res.ok) throw new Error('Cart fetch failed');
        const cart = await res.json();
        PubSub.publish('cart:updated', cart);
        return cart;
      } catch (e) {
        console.error('[CartAPI] getCart failed:', e);
        throw e;
      }
    },

    // Add a single item
    async addItem(variantId, quantity = 1, properties = {}) {
      try {
        const res = await fetch('/cart/add.js', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            id: variantId,
            quantity,
            properties
          })
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.description || 'Failed to add item');
        }
        const item = await res.json();
        PubSub.publish('cart:item-added', item);
        // Refresh full cart state
        await this.getCart();
        return item;
      } catch (e) {
        console.error('[CartAPI] addItem failed:', e);
        PubSub.publish('cart:error', { action: 'add', error: e.message });
        throw e;
      }
    },

    // Add multiple items
    async addItems(items) {
      try {
        const res = await fetch('/cart/add.js', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ items })
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.description || 'Failed to add items');
        }
        const added = await res.json();
        PubSub.publish('cart:items-added', added);
        await this.getCart();
        return added;
      } catch (e) {
        console.error('[CartAPI] addItems failed:', e);
        PubSub.publish('cart:error', { action: 'add', error: e.message });
        throw e;
      }
    },

    // Update item quantity
    async updateItem(key, quantity) {
      try {
        const res = await fetch('/cart/change.js', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            id: key,
            quantity
          })
        });
        if (!res.ok) throw new Error('Failed to update item');
        const cart = await res.json();
        PubSub.publish('cart:updated', cart);
        return cart;
      } catch (e) {
        console.error('[CartAPI] updateItem failed:', e);
        PubSub.publish('cart:error', { action: 'update', error: e.message });
        throw e;
      }
    },

    // Remove item (set quantity to 0)
    async removeItem(key) {
      return this.updateItem(key, 0);
    },

    // Clear cart
    async clear() {
      try {
        const res = await fetch('/cart/clear.js', {
          method: 'POST',
          headers: { 'Accept': 'application/json' }
        });
        if (!res.ok) throw new Error('Failed to clear cart');
        const cart = await res.json();
        PubSub.publish('cart:updated', cart);
        return cart;
      } catch (e) {
        console.error('[CartAPI] clear failed:', e);
        throw e;
      }
    },

    // Get shipping rates (optional, for progress bar)
    async getShippingRates(address) {
      // Basic: use /cart/shipping_rates.json with address params
      try {
        const params = new URLSearchParams({
          'shipping_address[country]': address.country || 'United States',
          'shipping_address[province]': address.province || '',
          'shipping_address[zip]': address.zip || ''
        });
        const res = await fetch(`/cart/shipping_rates.json?${params.toString()}`, {
          headers: { 'Accept': 'application/json' }
        });
        if (!res.ok) throw new Error('Failed to get shipping rates');
        const data = await res.json();
        return data.shipping_rates || [];
      } catch (e) {
        console.warn('[CartAPI] getShippingRates failed:', e);
        return [];
      }
    }
  };

  // ==========================================================================
  // VARIANT SELECTOR — product option selection logic
  // ==========================================================================
  // Handles option selection, variant lookup, price/image/availability update.
  // Uses product JSON data embedded on the page.

  class VariantSelector {
    constructor(productJson, options = {}) {
      this.product = productJson;
      this.options = options;
      this.selectedOptions = {};
      this.currentVariant = null;
      this.onVariantChange = options.onVariantChange || (() => {});
      this._init();
    }

    _init() {
      // Start with first available variant's options
      const firstAvailable = this._getFirstAvailableVariant();
      if (firstAvailable) {
        this.product.options.forEach((opt, i) => {
          this.selectedOptions[opt.name] = firstAvailable.options[i];
        });
        this.currentVariant = firstAvailable;
      } else if (this.product.variants.length > 0) {
        this.product.options.forEach((opt, i) => {
          this.selectedOptions[opt.name] = this.product.variants[0].options[i];
        });
        this.currentVariant = this.product.variants[0];
      }
    }

    _getFirstAvailableVariant() {
      return this.product.variants.find(v => v.available) || this.product.variants[0];
    }

    // Select an option value
    select(optionName, value) {
      this.selectedOptions[optionName] = value;
      this._updateVariant();
    }

    selectByIndex(optionIndex, value) {
      const optionName = this.product.options[optionIndex];
      if (optionName) {
        this.select(optionName.name || optionName, value);
      }
    }

    _updateVariant() {
      const selected = Object.values(this.selectedOptions);
      const variant = this.product.variants.find(v =>
        v.options.every((opt, i) => opt === selected[i])
      );

      if (variant) {
        this.currentVariant = variant;
        this.onVariantChange(variant, this._isAvailable(variant));
      }
    }

    _isAvailable(variant) {
      return variant ? variant.available : false;
    }

    get currentVariantId() {
      return this.currentVariant ? this.currentVariant.id : null;
    }

    get available() {
      return this.currentVariant ? this.currentVariant.available : false;
    }

    get price() {
      return this.currentVariant ? this.currentVariant.price : 0;
    }

    get compareAtPrice() {
      return this.currentVariant ? this.currentVariant.compare_at_price : 0;
    }

    // Check if a specific option value is available
    isValueAvailable(optionIndex, value) {
      const testOptions = Object.values(this.selectedOptions);
      testOptions[optionIndex] = value;
      const variant = this.product.variants.find(v =>
        v.options.every((opt, i) => opt === testOptions[i])
      );
      return variant ? variant.available : false;
    }
  }

  // ==========================================================================
  // WISHLIST — localStorage-powered wishlist
  // ==========================================================================

  const Wishlist = (() => {
    const STORAGE_KEY = 'theme-wishlist';
    let items = [];

    const load = () => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        items = raw ? JSON.parse(raw) : [];
      } catch (e) {
        items = [];
      }
      return items;
    };

    const save = () => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      } catch (e) {
        console.warn('[Wishlist] Could not save:', e);
      }
      PubSub.publish('wishlist:updated', { items: [...items] });
    };

    const init = () => {
      load();
      PubSub.publish('wishlist:updated', { items: [...items] });
    };

    const has = (id) => items.includes(String(id));

    const toggle = (id) => {
      id = String(id);
      if (has(id)) {
        items = items.filter((i) => i !== id);
      } else {
        items.push(id);
      }
      save();
      return has(id);
    };

    const add = (id) => {
      id = String(id);
      if (!has(id)) {
        items.push(id);
        save();
      }
      return true;
    };

    const remove = (id) => {
      id = String(id);
      items = items.filter((i) => i !== id);
      save();
      return false;
    };

    const getAll = () => [...items];

    return { init, has, toggle, add, remove, getAll };
  })();

  // ==========================================================================
  // RECENTLY VIEWED — localStorage-powered product history
  // ==========================================================================

  const RecentlyViewed = {
    STORAGE_KEY: 'theme-recently-viewed',
    MAX_ITEMS: 8,

    getAll() {
      try {
        const raw = localStorage.getItem(this.STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
      } catch (e) {
        return [];
      }
    },

    add(product) {
      if (!product || !product.id) return;
      let items = this.getAll();
      items = items.filter((i) => i.id !== product.id);
      items.unshift({
        id: product.id,
        title: product.title,
        url: product.url,
        image: product.featured_image ? product.featured_image.src : null,
        price: product.price,
        handle: product.handle
      });
      items = items.slice(0, this.MAX_ITEMS);
      try {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(items));
      } catch (e) {
        console.warn('[RecentlyViewed] Could not save:', e);
      }
      PubSub.publish('recently-viewed:updated', { items });
    },

    clear() {
      try {
        localStorage.removeItem(this.STORAGE_KEY);
      } catch (e) {}
      PubSub.publish('recently-viewed:updated', { items: [] });
    }
  };

  // ==========================================================================
  // EXPOSE PUBLIC API
  // ==========================================================================

  window.__theme = {
    ...(window.__theme || {}),
    version: '1.0.0',
    PubSub,
    CartAPI,
    VariantSelector,
    Wishlist,
    RecentlyViewed,
    components: {
      ThemeComponent,
      ThemeToggle,
      Accordion,
      Tabs,
      Drawer,
      QuantityInput,
      CartDrawer,
      StickyHeader,
      AnnouncementBar,
    },
    utils: {
      $,
      $$,
      debounce,
      throttle,
      clamp,
      onReady,
      formatMoney,
    },
  };

  // Bootstrap
  onReady(() => {
    // Init wishlist state
    Wishlist.init();

    // Global wishlist button handler (delegated)
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-wishlist-btn]');
      if (!btn) return;
      e.preventDefault();
      e.stopPropagation();

      const id = btn.dataset.productId;
      if (!id) return;

      const isSaved = Wishlist.toggle(id);
      btn.classList.toggle('is-saved', isSaved);
      btn.setAttribute('aria-pressed', isSaved ? 'true' : 'false');
      btn.setAttribute('aria-label',
        (isSaved ? 'Remove ' : 'Add ') + (btn.dataset.productTitle || '') + ' ' +
        (isSaved ? 'from' : 'to') + ' wishlist');
    });

    // Global quick-add handler (delegated)
    document.addEventListener('click', async (e) => {
      const btn = e.target.closest('[data-quick-add]');
      if (!btn) return;
      e.preventDefault();
      e.stopPropagation();

      // Don't intercept if the button is inside a form (let it submit normally)
      if (btn.closest('form')) return;

      const variantId = btn.dataset.variantId;
      if (!variantId || !CartAPI) {
        // Fallback: navigate to product page
        const productUrl = btn.dataset.productUrl || btn.closest('[data-product-card]')?.querySelector('a')?.getAttribute('href');
        if (productUrl) window.location.href = productUrl;
        return;
      }

      // Loading state
      const originalText = btn.textContent;
      btn.disabled = true;
      btn.textContent = 'Adding...';

      try {
        await CartAPI.addItem(variantId, 1);
        PubSub.publish('cart:add-success', { variantId, quantity: 1 });
        PubSub.publish('cart:open');
      } catch (err) {
        btn.disabled = false;
        btn.textContent = originalText;
        console.warn('Quick add failed:', err.message);
      }
    });

    // Sync all wishlist buttons to current state
    const syncWishlistButtons = () => {
      const ids = Wishlist.getAll();
      document.querySelectorAll('[data-wishlist-btn]').forEach((btn) => {
        const isSaved = ids.includes(btn.dataset.productId);
        btn.classList.toggle('is-saved', isSaved);
        btn.setAttribute('aria-pressed', isSaved ? 'true' : 'false');
      });
    };

    Wishlist.init();
    syncWishlistButtons();

    // Record recently-viewed if on a product page
    const productJsonEl = document.querySelector('[data-product-json]');
    if (productJsonEl) {
      try {
        const product = JSON.parse(productJsonEl.textContent.trim());
        if (product && product.id) {
          RecentlyViewed.add(product);
        }
      } catch (e) {
        // Ignore parse errors
      }
    }

    /**
   * InstantPage — hover prefetch for instant navigation feel
   * Prefetches internal links on hover so they load instantly when clicked.
   * Respects reduced-motion and data-disable-prefetch attributes.
   */
  const InstantPage = (() => {
    const prefetched = new Set();
    let enabled = true;

    const init = () => {
      // Respect reduced motion preference
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        enabled = false;
        return;
      }

      // Don't prefetch on slow connections
      if (navigator.connection &&
          (navigator.connection.saveData ||
           navigator.connection.effectiveType === 'slow-2g' ||
           navigator.connection.effectiveType === '2g')) {
        enabled = false;
        return;
      }

      // Use event delegation on document
      document.addEventListener('mouseover', handleMouseOver, { passive: true });
      document.addEventListener('touchstart', handleTouchStart, { passive: true });
    };

    const shouldPrefetch = (url) => {
      if (!enabled) return false;
      if (!url) return false;

      // Only prefetch same-origin
      try {
        const u = new URL(url, window.location.origin);
        if (u.origin !== window.location.origin) return false;

        // Skip non-page links
        if (u.pathname.match(/\.(png|jpg|jpeg|gif|svg|webp|pdf|zip|js|css|json)$/i)) return false;

        // Skip hash links
        if (u.hash && u.pathname === window.location.pathname) return false;

        // Skip already prefetched
        if (prefetched.has(u.pathname)) return false;

        // Skip pages with disable attribute
        return true;
      } catch (e) {
        return false;
      }
    };

    const prefetch = (url) => {
      try {
        const u = new URL(url, window.location.origin);
        const key = u.pathname;
        if (prefetched.has(key)) return;
        prefetched.add(key);

        // Use link prefetch for best browser support
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = url;
        link.as = 'document';
        document.head.appendChild(link);
      } catch (e) {
        // Silently fail — prefetch is a progressive enhancement
      }
    };

    let hoverTimer = null;

    const handleMouseOver = (e) => {
      const link = e.target.closest('a');
      if (!link) return;
      if (link.dataset.disablePrefetch !== undefined) return;
      if (!shouldPrefetch(link.href)) return;

      // Wait 80ms before prefetching to avoid prefetching on quick mouse-through
      clearTimeout(hoverTimer);
      hoverTimer = setTimeout(() => {
        prefetch(link.href);
      }, 80);
    };

    const handleTouchStart = (e) => {
      const link = e.target.closest('a');
      if (!link) return;
      if (!shouldPrefetch(link.href)) return;
      prefetch(link.href);
    };

    return { init, prefetch };
  })();

  window.__theme.InstantPage = InstantPage;
  InstantPage.init();

  PubSub.publish('theme:ready');

    // Refresh cart badge on load
    if (CartAPI) {
      CartAPI.getCart().catch(() => {});
    }
  });
})();
