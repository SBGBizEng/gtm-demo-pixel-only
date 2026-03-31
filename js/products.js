/**
 * GTM Demo Store — Product Catalogue
 * Used by all pages to render product data.
 */
const PRODUCTS = [
  {
    id: 'SKU-001',
    name: 'Wireless Noise-Cancelling Headphones',
    price: 149.99,
    category: 'Electronics',
    description: 'Premium over-ear headphones with 30-hour battery life and active noise cancellation.',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80'
  },
  {
    id: 'SKU-002',
    name: 'Minimalist Leather Wallet',
    price: 49.99,
    category: 'Accessories',
    description: 'Slim RFID-blocking wallet crafted from genuine full-grain leather.',
    image: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=400&q=80'
  },
  {
    id: 'SKU-003',
    name: 'Stainless Steel Water Bottle',
    price: 34.99,
    category: 'Lifestyle',
    description: 'Double-wall vacuum insulated bottle — keeps drinks cold 24h or hot 12h.',
    image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400&q=80'
  },
  {
    id: 'SKU-004',
    name: 'Mechanical Keyboard',
    price: 129.99,
    category: 'Electronics',
    description: 'Compact TKL layout with Cherry MX switches and RGB backlighting.',
    image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&q=80'
  },
  {
    id: 'SKU-005',
    name: 'Yoga Mat Pro',
    price: 79.99,
    category: 'Fitness',
    description: 'Non-slip 6mm thick eco-friendly TPE mat with alignment lines.',
    image: 'https://images.unsplash.com/photo-1601925228008-d5d3f3c7e3d1?w=400&q=80'
  },
  {
    id: 'SKU-006',
    name: 'Scented Soy Candle Set',
    price: 39.99,
    category: 'Home',
    description: 'Set of 3 hand-poured soy candles in lavender, cedarwood, and citrus.',
    image: 'https://images.unsplash.com/photo-1602874801006-8e8e5d4e1f5d?w=400&q=80'
  }
];

/**
 * Find a product by ID.
 * @param {string} id
 * @returns {Object|undefined}
 */
function getProductById(id) {
  return PRODUCTS.find(p => p.id === id);
}
