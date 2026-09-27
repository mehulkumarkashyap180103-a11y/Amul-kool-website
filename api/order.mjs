/**
 * AMUL KOOL EXOTIC ROSE — Order API
 * Secure serverless endpoint that validates the cart, recomputes prices
 * from a trusted server-side catalog, persists to Supabase, and returns
 * a human-readable order ID. Never trusts client-sent prices or totals.
 */

import { createClient } from '@supabase/supabase-js';

// ── Trusted server-side product catalog ──
// This is the ONLY source of truth for prices on the server.
const SERVER_CATALOG = {
  'single': { id: 'single', name: 'On-the-Go Single', price: 30 },
  'family-pack': { id: 'family-pack', name: 'Family Chill 6-Pack', price: 170 },
  'party-crate': { id: 'party-crate', name: 'Party & Festive Crate', price: 650 },
};

const MAX_QTY = 99;
const MAX_ITEMS = 20;

function jsonError(res, status, message) {
  return res.status(status).json({ success: false, message });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return jsonError(res, 405, 'Only POST requests are allowed');
  }

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch (e) {
    return jsonError(res, 400, 'Invalid JSON body');
  }

  if (!body || typeof body !== 'object') {
    return jsonError(res, 400, 'Missing request body');
  }

  const { items, customer } = body;

  // ── Validate cart items ──
  if (!Array.isArray(items) || items.length === 0) {
    return jsonError(res, 400, 'Your cart is empty');
  }

  if (items.length > MAX_ITEMS) {
    return jsonError(res, 400, 'Too many items in cart');
  }

  // ── Validate customer info ──
  if (!customer || typeof customer !== 'object') {
    return jsonError(res, 400, 'Missing customer information');
  }

  const name = (customer.name || '').toString().trim();
  const phone = (customer.phone || '').toString().trim();
  const email = (customer.email || '').toString().trim();
  const address = (customer.address || '').toString().trim();
  const pincode = (customer.pincode || '').toString().trim();

  if (name.length < 2) return jsonError(res, 400, 'Please enter your name');
  if (!/^\d{10}$/.test(phone)) return jsonError(res, 400, 'Please enter a valid 10-digit phone number');
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return jsonError(res, 400, 'Please enter a valid email address');
  if (address.length < 5) return jsonError(res, 400, 'Please enter your delivery address');
  if (!/^\d{6}$/.test(pincode)) return jsonError(res, 400, 'Please enter a valid 6-digit PIN code');

  // ── Recompute prices server-side from trusted catalog ──
  let subtotal = 0;
  const validatedItems = [];

  for (const item of items) {
    if (!item || typeof item.id !== 'string' || typeof item.qty !== 'number') {
      return jsonError(res, 400, 'Invalid item in cart');
    }

    const product = SERVER_CATALOG[item.id];
    if (!product) {
      return jsonError(res, 400, `Unknown product: ${item.id}`);
    }

    const qty = Math.round(item.qty);
    if (qty < 1 || qty > MAX_QTY) {
      return jsonError(res, 400, 'Invalid quantity');
    }

    const lineTotal = product.price * qty;
    subtotal += lineTotal;

    validatedItems.push({
      product_id: product.id,
      product_name: product.name,
      unit_price: product.price,
      qty,
      line_total: lineTotal,
    });
  }

  if (subtotal <= 0) {
    return jsonError(res, 400, 'Cart total must be greater than zero');
  }

  // ── Generate human-readable order number ──
  const orderNumber = 'AR-' + String(Date.now()).slice(-8) + '-' + Math.floor(Math.random() * 1000).toString().padStart(3, '0');

  // ── Idempotency key to prevent duplicate submissions ──
  const idempotencyKey = `${name}-${phone}-${subtotal}-${validatedItems.length}-${Date.now().toString().slice(0, -4)}`;

  // ── Persist to Supabase ──
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables');
    return jsonError(res, 500, 'Server configuration error');
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Insert order
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        idempotency_key: idempotencyKey,
        customer_name: name,
        customer_phone: phone,
        customer_email: email || null,
        customer_address: address,
        customer_pincode: pincode,
        subtotal,
        total: subtotal,
        status: 'received',
      })
      .select('id, order_number')
      .single();

    if (orderError) {
      console.error('Order insert error:', orderError);
      return jsonError(res, 500, 'Failed to create order');
    }

    // Insert line items
    const itemsWithOrderId = validatedItems.map(item => ({
      ...item,
      order_id: orderData.id,
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(itemsWithOrderId);

    if (itemsError) {
      console.error('Order items insert error:', itemsError);
      return jsonError(res, 500, 'Failed to save order items');
    }

    console.log(`Order created: ${orderData.order_number} — ₹${subtotal} — ${validatedItems.length} items`);

    return res.status(200).json({
      success: true,
      message: 'Order received successfully!',
      orderId: orderData.order_number,
      total: subtotal,
      itemCount: validatedItems.reduce((sum, i) => sum + i.qty, 0),
    });

  } catch (error) {
    console.error('Order processing error:', error);
    return jsonError(res, 500, 'Something went wrong processing your order');
  }
}
