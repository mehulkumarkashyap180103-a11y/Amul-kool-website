/**
 * AMUL KOOL EXOTIC ROSE — Cart UI Controller
 * Renders the basket modal from the cart store, wires product cards,
 * and keeps the header basket button in sync.
 */

import { cart } from './cart.js';
import { PRODUCTS } from './products.js';

const STORAGE_KEY = 'amul_rose_cart_v1';
const MAX_QTY = 99;

function $(id) { return document.getElementById(id); }
function formatINR(n) { return '₹' + n; }

// ── Header basket button ──
function updateHeaderButton(snapshot) {
  const btn = $('order-modal-trigger');
  if (!btn) return;
  const span = btn.querySelector('span');
  if (snapshot.isEmpty) {
    if (span) span.textContent = '🛒 Basket';
  } else {
    if (span) span.textContent = `🛒 Basket • ${formatINR(snapshot.subtotal)}`;
  }
}

// ── Toast notification (works with both toast systems) ──
function showToast(message, type) {
  // Primary: toast-portal (script.js system)
  const portal = $('toast-portal');
  if (portal) {
    const toast = document.createElement('div');
    toast.className = `toast-item toast-${type || 'info'}`;
    toast.innerHTML = `<span>${message}</span>`;
    portal.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('hide');
      setTimeout(() => toast.remove(), 400);
    }, 3800);
    return;
  }
  // Fallback: cart-toast (inline system)
  const toast = $('cart-toast');
  const toastText = $('cart-toast-text');
  if (toast && toastText) {
    toastText.textContent = message;
    toast.classList.remove('translate-y-20', 'opacity-0', 'pointer-events-none');
    toast.classList.add('translate-y-0', 'opacity-100');
    setTimeout(() => {
      toast.classList.add('translate-y-20', 'opacity-0', 'pointer-events-none');
      toast.classList.remove('translate-y-0', 'opacity-100');
    }, 3000);
  }
}
function showToastMsg(msg, type) { showToast(msg, type); }

// ── Product card quantity steppers ──
function changeCardQty(id, delta) {
  const el = $(id);
  if (!el) return;
  let val = parseInt(el.textContent, 10) || 1;
  val = Math.max(1, Math.min(MAX_QTY, val + delta));
  el.textContent = val;
}

function getCardQty(productId) {
  const map = { 'single': 'qty-1', 'family-pack': 'qty-2', 'party-crate': 'qty-3' };
  const el = $(map[productId]);
  return el ? (parseInt(el.textContent, 10) || 1) : 1;
}

// ── Add to cart from product cards ──
function addToCart(productId) {
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) return;
  const qty = getCardQty(productId);
  cart.add(productId, qty);
  showToast(`Added ${qty} × ${product.name} to your basket!`, 'success');
}

// ── Basket modal rendering ──
function renderModal(snapshot) {
  const linesContainer = $('cart-lines');
  const emptyState = $('cart-empty-state');
  const summarySection = $('cart-summary-section');
  const customerSection = $('cart-customer-section');
  const confirmBtn = $('confirm-order-btn');

  if (snapshot.isEmpty) {
    if (linesContainer) linesContainer.style.display = 'none';
    if (emptyState) emptyState.style.display = 'flex';
    if (summarySection) summarySection.style.display = 'none';
    if (customerSection) customerSection.style.display = 'none';
    if (confirmBtn) confirmBtn.style.display = 'none';
    return;
  }

  if (emptyState) emptyState.style.display = 'none';
  if (linesContainer) {
    linesContainer.style.display = 'block';
    linesContainer.innerHTML = snapshot.lines.map(line => `
      <div class="cart-line-item" data-product-id="${line.id}">
        <div class="cart-line-info">
          <span class="cart-line-name">${line.name}</span>
          <span class="cart-line-subtitle">${line.subtitle}</span>
          <span class="cart-line-price">${formatINR(line.price)} each</span>
        </div>
        <div class="cart-line-controls">
          <div class="cart-line-qty">
            <button type="button" class="cart-qty-btn" data-action="decrease" data-id="${line.id}" aria-label="Decrease quantity">−</button>
            <span class="cart-qty-val">${line.qty}</span>
            <button type="button" class="cart-qty-btn" data-action="increase" data-id="${line.id}" aria-label="Increase quantity">+</button>
          </div>
          <span class="cart-line-total">${formatINR(line.lineTotal)}</span>
          <button type="button" class="cart-remove-btn" data-action="remove" data-id="${line.id}" aria-label="Remove item">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
          </button>
        </div>
      </div>
    `).join('');
  }

  if (summarySection) {
    summarySection.style.display = 'block';
    const subtotalEl = $('summary-subtotal');
    const totalEl = $('summary-total');
    if (subtotalEl) subtotalEl.textContent = formatINR(snapshot.subtotal);
    if (totalEl) totalEl.textContent = formatINR(snapshot.subtotal);
  }

  if (customerSection) customerSection.style.display = 'block';
  if (confirmBtn) confirmBtn.style.display = 'flex';
}

// ── Modal open/close ──
function openModal() {
  const modal = $('order-modal');
  if (modal) modal.classList.add('show');
}

function closeModal() {
  const modal = $('order-modal');
  if (modal) modal.classList.remove('show');
}

// ── Confirm order (Phase 2 will send to backend; Phase 1 stub) ──
let isSubmitting = false;

async function confirmOrder() {
  if (isSubmitting) return;

  const snapshot = cart.getSnapshot();
  if (snapshot.isEmpty) {
    showToast('Your basket is empty.', 'error');
    return;
  }

  // Validate customer fields
  const name = $('cust-name')?.value?.trim();
  const phone = $('cust-phone')?.value?.trim();
  const email = $('cust-email')?.value?.trim();
  const address = $('cust-address')?.value?.trim();
  const pincode = $('pincode-input')?.value?.trim();

  const errors = [];
  if (!name || name.length < 2) errors.push('Please enter your name.');
  if (!phone || !/^\d{10}$/.test(phone)) errors.push('Please enter a valid 10-digit phone number.');
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Please enter a valid email address.');
  if (!address || address.length < 5) errors.push('Please enter your delivery address.');
  if (!pincode || !/^\d{6}$/.test(pincode)) errors.push('Please enter a valid 6-digit PIN code.');

  if (errors.length > 0) {
    showToast(errors[0], 'error');
    return;
  }

  const confirmBtn = $('confirm-order-btn');

  try {
    isSubmitting = true;
    if (confirmBtn) {
      confirmBtn.disabled = true;
      confirmBtn.textContent = 'Processing...';
    }

    const response = await fetch('/api/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: snapshot.lines.map(l => ({ id: l.id, qty: l.qty })),
        customer: { name, phone, email, address, pincode },
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Order failed');
    }

    closeModal();
    cart.clear();
    showToast(`Order confirmed! Your order ID is ${data.orderId}.`, 'success');

    // Reset customer form
    ['cust-name', 'cust-phone', 'cust-email', 'cust-address', 'pincode-input'].forEach(id => {
      const el = $(id);
      if (el) el.value = '';
    });

  } catch (error) {
    showToast('Something went wrong. Please try again.', 'error');
  } finally {
    isSubmitting = false;
    if (confirmBtn) {
      confirmBtn.disabled = false;
      confirmBtn.textContent = 'Confirm Order';
    }
  }
}

// ── Pincode check ──
function checkPincode() {
  const input = $('pincode-input');
  const status = $('pincode-status');
  if (!input || !status) return;

  const code = input.value.trim();
  if (!/^\d{6}$/.test(code)) {
    status.className = 'pincode-status invalid';
    status.textContent = 'Please enter a valid 6-digit Indian PIN code';
    return;
  }
  status.className = 'pincode-status valid';
  status.textContent = 'Express Chilled Delivery available in your area!';
}

// ── Event delegation for cart line items ──
function handleLineItemClick(e) {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const action = btn.getAttribute('data-action');
  const id = btn.getAttribute('data-id');
  if (action === 'increase') cart.increment(id);
  else if (action === 'decrease') cart.decrement(id);
  else if (action === 'remove') {
    const product = PRODUCTS.find(p => p.id === id);
    cart.remove(id);
    if (product) showToast(`Removed ${product.name} from basket.`, 'info');
  }
}

// ── Init ──
export function initCartUI() {
  // Wire product card buttons
  document.querySelectorAll('[data-add-to-cart]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const productId = btn.getAttribute('data-add-to-cart');
      addToCart(productId);
    });
  });

  // Wire product card qty steppers
  document.querySelectorAll('[data-qty-control]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const target = btn.getAttribute('data-qty-control');
      const delta = parseInt(btn.getAttribute('data-delta') || '1', 10);
      changeCardQty(target, delta);
    });
  });

  // Modal open/close
  const trigger = $('order-modal-trigger');
  if (trigger) trigger.addEventListener('click', openModal);
  const closeBtn = $('modal-close-btn');
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  const modal = $('order-modal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
  }

  // Confirm order
  const confirmBtn = $('confirm-order-btn');
  if (confirmBtn) confirmBtn.addEventListener('click', confirmOrder);

  // Pincode check
  const pincodeBtn = $('pincode-check-btn');
  if (pincodeBtn) pincodeBtn.addEventListener('click', checkPincode);

  // Line item event delegation
  const linesContainer = $('cart-lines');
  if (linesContainer) linesContainer.addEventListener('click', handleLineItemClick);

  // Subscribe to cart changes
  cart.subscribe((snapshot) => {
    updateHeaderButton(snapshot);
    renderModal(snapshot);
  });

  // Expose for backwards compat with any inline onclick handlers during transition
  window.changeQty = changeCardQty;
  window.addToCart = addToCart;
}
