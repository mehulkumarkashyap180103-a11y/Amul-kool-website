/**
 * AMUL KOOL EXOTIC ROSE — Cart Store
 * Centralized cart state with add / update / remove / clear.
 * Persists to localStorage. Notifies subscribers on every change.
 */

import { PRODUCTS, getProduct } from './products.js';

const STORAGE_KEY = 'amul_rose_cart';
const MAX_QTY = 99;

class CartStore {
  constructor() {
    this._items = {}; // { productId: quantity }
    this._listeners = [];
    this._load();
  }

  _load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          this._items = parsed;
        }
      }
    } catch (e) {
      this._items = {};
    }
  }

  _save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this._items));
    } catch (e) {}
  }

  _notify() {
    this._save();
    this._listeners.forEach(fn => fn(this.getSnapshot()));
  }

  subscribe(fn) {
    this._listeners.push(fn);
    fn(this.getSnapshot());
    return () => {
      this._listeners = this._listeners.filter(f => f !== fn);
    };
  }

  add(productId, qty = 1) {
    if (!getProduct(productId)) return;
    const current = this._items[productId] || 0;
    this._items[productId] = Math.min(MAX_QTY, current + qty);
    if (this._items[productId] <= 0) delete this._items[productId];
    this._notify();
  }

  setQty(productId, qty) {
    if (!getProduct(productId)) return;
    qty = Math.max(0, Math.min(MAX_QTY, Math.round(qty)));
    if (qty === 0) {
      delete this._items[productId];
    } else {
      this._items[productId] = qty;
    }
    this._notify();
  }

  increment(productId) {
    this.add(productId, 1);
  }

  decrement(productId) {
    if (!this._items[productId]) return;
    this._items[productId]--;
    if (this._items[productId] <= 0) delete this._items[productId];
    this._notify();
  }

  remove(productId) {
    delete this._items[productId];
    this._notify();
  }

  clear() {
    this._items = {};
    this._notify();
  }

  getCount() {
    return Object.values(this._items).reduce((sum, q) => sum + q, 0);
  }

  getLines() {
    return Object.keys(this._items)
      .map(id => {
        const product = getProduct(id);
        if (!product) return null;
        const qty = this._items[id];
        return {
          id: product.id,
          name: product.name,
          subtitle: product.subtitle,
          price: product.price,
          qty,
          lineTotal: product.price * qty,
        };
      })
      .filter(Boolean);
  }

  getSubtotal() {
    return this.getLines().reduce((sum, line) => sum + line.lineTotal, 0);
  }

  getSnapshot() {
    return {
      lines: this.getLines(),
      count: this.getCount(),
      subtotal: this.getSubtotal(),
      isEmpty: this.getCount() === 0,
    };
  }
}

export const cart = new CartStore();
