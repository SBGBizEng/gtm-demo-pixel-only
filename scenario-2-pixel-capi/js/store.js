/**
 * GTM Demo Store — Pixel + CAPI
 * Shared store logic: cart management, dataLayer helpers, debug panel
 *
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  SCENARIO 2 DESIGN NOTES                                                │
 * │                                                                         │
 * │  Browser-side (Pixel via GTM):                                          │
 * │    pixel_page_view, pixel_view_content, pixel_add_to_cart,              │
 * │    pixel_initiate_checkout, pixel_purchase                               │
 * │                                                                         │
 * │  Server-side (CAPI via GTM Server Container):                           │
 * │    capi_view_content, capi_add_to_cart,                                 │
 * │    capi_initiate_checkout, capi_purchase                                 │
 * │                                                                         │
 * │  PII HANDLING (intentional for testing):                                │
 * │    • PII (email, phone, name) IS collected from the checkout form       │
 * │    • PII IS stored in window.customerPII for GTM variable access        │
 * │    • PII IS pushed into the dataLayer (so GTM can read it)              │
 * │    • PII is NOT hashed and NOT included in CAPI event payloads          │
 * │    • No event_id / deduplication key is set on any event                │
 * │                                                                         │
 * │  This is the "before" state — intentionally incomplete — for GTM        │
 * │  training exercises on adding hashing, PII, and deduplication.          │
 * └─────────────────────────────────────────────────────────────────────────┘
 */

// ── dataLayer bootstrap ──────────────────────────────────────────────────────
window.dataLayer = window.dataLayer || [];

// ── PII store (collected but NOT forwarded to CAPI) ──────────────────────────
window.customerPII = {
  email:      null,   // raw, unhashed — intentionally NOT sent to CAPI
  phone:      null,   // raw, unhashed — intentionally NOT sent to CAPI
  firstName:  null,
  lastName:   null,
  city:       null,
  zip:        null,
  country:    null
};

// ── Cart helpers (localStorage) ──────────────────────────────────────────────
const Cart = {
  _key: 'gtm_capi_demo_cart',

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

// ── BROWSER PIXEL events ──────────────────────────────────────────────────────

function pushViewContent(product) {
  dlPush('pixel_view_content', {
    content_ids:      [product.id],
    content_name:     product.name,
    content_type:     'product',
    value:            product.price,
    currency:         'USD',
    content_category: product.category || 'General'
    // NOTE: No event_id — deduplication intentionally omitted
  });
}

function pushAddToCart(product, qty) {
  dlPush('pixel_add_to_cart', {
    content_ids:  [product.id],
    content_name: product.name,
    content_type: 'product',
    value:        +(product.price * qty).toFixed(2),
    currency:     'USD',
    num_items:    qty
    // NOTE: No event_id — deduplication intentionally omitted
  });
}

function pushInitiateCheckout() {
  const items = Cart.get();
  dlPush('pixel_initiate_checkout', {
    content_ids:  items.map(i => i.id),
    content_type: 'product',
    value:        +Cart.total().toFixed(2),
    currency:     'USD',
    num_items:    Cart.count()
    // NOTE: No event_id — deduplication intentionally omitted
  });
}

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
    // NOTE: No event_id — deduplication intentionally omitted
  });
}

// ── SERVER-SIDE CAPI events ───────────────────────────────────────────────────
// These events are picked up by the GTM Server Container CAPI tag.
// IMPORTANT: user_data object is intentionally EMPTY — PII is collected
// (see window.customerPII) but NOT forwarded to the server tag.
// No event_id is set — deduplication is intentionally omitted.

function capiViewContent(product) {
  dlPush('capi_view_content', {
    // ── Event data ──
    event_name:   'ViewContent',
    content_ids:  [product.id],
    content_name: product.name,
    content_type: 'product',
    value:        product.price,
    currency:     'USD',

    // ── User data (intentionally empty — PII NOT forwarded) ──
    // user_data: {}   ← GTM CAPI tag will receive no user identifiers
    // event_id: ''    ← No deduplication key

    _capi_note: 'PII available in window.customerPII but NOT included here'
  });
}

function capiAddToCart(product, qty) {
  dlPush('capi_add_to_cart', {
    event_name:   'AddToCart',
    content_ids:  [product.id],
    content_name: product.name,
    content_type: 'product',
    value:        +(product.price * qty).toFixed(2),
    currency:     'USD',
    num_items:    qty,

    // user_data: {}   ← intentionally empty
    // event_id: ''    ← no deduplication

    _capi_note: 'PII available in window.customerPII but NOT included here'
  });
}

function capiInitiateCheckout() {
  const items = Cart.get();
  dlPush('capi_initiate_checkout', {
    event_name:   'InitiateCheckout',
    content_ids:  items.map(i => i.id),
    content_type: 'product',
    value:        +Cart.total().toFixed(2),
    currency:     'USD',
    num_items:    Cart.count(),

    // user_data: {}   ← intentionally empty
    // event_id: ''    ← no deduplication

    _capi_note: 'PII available in window.customerPII but NOT included here'
  });
}

function capiPurchase(orderId) {
  const items = Cart.get();
  dlPush('capi_purchase', {
    event_name:   'Purchase',
    order_id:     orderId,
    content_ids:  items.map(i => i.id),
    content_type: 'product',
    value:        +Cart.total().toFixed(2),
    currency:     'USD',
    num_items:    Cart.count(),
    contents:     items.map(i => ({ id: i.id, quantity: i.quantity, item_price: i.price })),

    // user_data: {}   ← intentionally empty — PII NOT forwarded
    // event_id: ''    ← no deduplication

    _capi_note: 'PII available in window.customerPII but NOT included here'
  });
}

// ── Debug panel ───────────────────────────────────────────────────────────────
function debugLog(eventName, payload) {
  const panel = document.getElementById('debug-panel');
  if (!panel) return;
  const isCapi  = eventName.startsWith('capi_');
  const isPixel = eventName.startsWith('pixel_');
  const line = document.createElement('div');
  line.className = 'event-line';
  const tag = isCapi
    ? '<span style="color:#e9711c;">[CAPI→Server]</span>'
    : isPixel
      ? '<span style="color:#42b72a;">[Pixel→Browser]</span>'
      : '<span>[dataLayer]</span>';
  line.innerHTML = `${tag} <b>${eventName}</b> — ${JSON.stringify(payload)}`;
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
