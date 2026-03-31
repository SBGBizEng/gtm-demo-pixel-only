/**
 * GTM Demo Store — Pixel Only
 * Shared store logic: cart management, dataLayer helpers, debug panel
 *
 * dataLayer events pushed (all consumed by GTM → Facebook Pixel tag):
 *   pixel_page_view       — fired on every page load (via GTM trigger)
 *   pixel_view_content    — fired on product detail page
 *   pixel_add_to_cart     — fired when user clicks "Add to Cart"
 *   pixel_initiate_checkout — fired when user reaches checkout page
 *   pixel_purchase        — fired on order confirmation page
 */

// ── dataLayer bootstrap ──────────────────────────────────────────────────────
window.dataLayer = window.dataLayer || [];

// ── Cart helpers (localStorage) ──────────────────────────────────────────────
const Cart = {
  _key: 'gtm_demo_cart',

  get() {
    try { return JSON.parse(localStorage.getItem(this._key)) || []; }
    catch(e) { return []; }
  },

  save(items) {
    localStorage.setItem(this._key, JSON.stringify(items));
    this._updateBadge();
  },

  add(product, qty) {
    const items = this.get();
    const existing = items.find(i => i.id === product.id);
    if (existing) {
      existing.quantity += qty;
    } else {
      items.push({ ...product, quantity: qty });
    }
    this.save(items);
  },

  remove(productId) {
    const items = this.get().filter(i => i.id !== productId);
    this.save(items);
  },

  clear() {
    localStorage.removeItem(this._key);
    this._updateBadge();
  },

  total() {
    return this.get().reduce((sum, i) => sum + i.price * i.quantity, 0);
  },

  count() {
    return this.get().reduce((sum, i) => sum + i.quantity, 0);
  },

  _updateBadge() {
    const badge = document.querySelector('.cart-badge');
    if (badge) badge.textContent = this.count();
  }
};

// ── dataLayer push helpers ────────────────────────────────────────────────────
function dlPush(eventName, payload) {
  const event = { event: eventName, ...payload };
  window.dataLayer.push(event);
  debugLog(eventName, payload);
}

/**
 * Push pixel_view_content for a product detail page.
 * @param {Object} product  { id, name, price, category }
 */
function pushViewContent(product) {
  dlPush('pixel_view_content', {
    content_ids:  [product.id],
    content_name: product.name,
    content_type: 'product',
    value:        product.price,
    currency:     'USD',
    content_category: product.category || 'General'
  });
}

/**
 * Push pixel_add_to_cart.
 * @param {Object} product  { id, name, price, category }
 * @param {number} qty
 */
function pushAddToCart(product, qty) {
  dlPush('pixel_add_to_cart', {
    content_ids:  [product.id],
    content_name: product.name,
    content_type: 'product',
    value:        +(product.price * qty).toFixed(2),
    currency:     'USD',
    num_items:    qty
  });
}

/**
 * Push pixel_initiate_checkout when user lands on checkout.
 */
function pushInitiateCheckout() {
  const items = Cart.get();
  dlPush('pixel_initiate_checkout', {
    content_ids:  items.map(i => i.id),
    content_type: 'product',
    value:        +Cart.total().toFixed(2),
    currency:     'USD',
    num_items:    Cart.count()
  });
}

/**
 * Push pixel_purchase on confirmation page.
 * @param {string} orderId
 */
function pushPurchase(orderId) {
  const items = Cart.get();
  dlPush('pixel_purchase', {
    order_id:     orderId,
    content_ids:  items.map(i => i.id),
    content_type: 'product',
    value:        +Cart.total().toFixed(2),
    currency:     'USD',
    num_items:    Cart.count(),
    contents:     items.map(i => ({ id: i.id, quantity: i.quantity, item_price: i.price }))
  });
}

// ── Debug panel ───────────────────────────────────────────────────────────────
function debugLog(eventName, payload) {
  const panel = document.getElementById('debug-panel');
  if (!panel) return;
  const line = document.createElement('div');
  line.className = 'event-line';
  line.innerHTML = `<span>[dataLayer]</span> event: <b>${eventName}</b> — ${JSON.stringify(payload)}`;
  panel.appendChild(line);
  panel.scrollTop = panel.scrollHeight;
}

// ── Toast notification ────────────────────────────────────────────────────────
function showToast(msg) {
  let t = document.getElementById('toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toast';
    t.className = 'toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
}

// ── Init on DOM ready ─────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  Cart._updateBadge();
});
