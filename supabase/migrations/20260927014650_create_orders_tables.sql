/*
# Create orders and order_items tables

1. New Tables
- `orders`: stores customer order header (name, phone, email, address, pincode, total, status, order_id)
- `order_items`: stores individual line items per order (product_id, product_name, unit_price, qty, line_total)

2. Security
- Enable RLS on both tables.
- INSERT allowed for anon + authenticated (the Vercel serverless function uses the service role key which bypasses RLS, but we add anon policies as a safety net).
- SELECT/UPDATE/DELETE restricted — only the server-side function (service role) can manage orders; anon clients cannot read or modify order data directly.

3. Notes
- `order_number` is a human-readable sequential order ID (e.g., AR-000001) generated via a sequence.
- `idempotency_key` prevents duplicate submissions.
- Prices are stored server-side from a trusted catalog; the backend recomputes totals.
*/

CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text UNIQUE NOT NULL,
  idempotency_key text,
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  customer_email text,
  customer_address text NOT NULL,
  customer_pincode text NOT NULL,
  subtotal integer NOT NULL DEFAULT 0,
  total integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'received',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id text NOT NULL,
  product_name text NOT NULL,
  unit_price integer NOT NULL,
  qty integer NOT NULL CHECK (qty > 0),
  line_total integer NOT NULL
);

-- Sequence for human-readable order numbers
CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1;

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Orders: anon can insert (the function uses service role, but we allow anon as safety)
DROP POLICY IF EXISTS "anon_insert_orders" ON orders;
CREATE POLICY "anon_insert_orders" ON orders FOR INSERT
  TO anon, authenticated WITH CHECK (true);

-- Order items: anon can insert
DROP POLICY IF EXISTS "anon_insert_order_items" ON order_items;
CREATE POLICY "anon_insert_order_items" ON order_items FOR INSERT
  TO anon, authenticated WITH CHECK (true);

-- No SELECT/UPDATE/DELETE for anon — only service role (backend) can read/manage orders

-- Index for idempotency lookups
CREATE INDEX IF NOT EXISTS idx_orders_idempotency_key ON orders(idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
