-- =============================================================================
-- B2B Pharmaceutical, Surgical & FMCG Distribution Platform
-- Foundational Database Schema (PostgreSQL 16 / Supabase)
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- -----------------------------------------------------------------------------
-- ENUMS
-- -----------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('SUPER_ADMIN', 'DISTRIBUTOR', 'RETAILER', 'SALES_REP');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE kyc_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE product_category AS ENUM ('PHARMA', 'SURGICAL', 'FMCG');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE drug_schedule AS ENUM ('OTC', 'SCHEDULE_H', 'SCHEDULE_H1', 'SCHEDULE_X', 'NON_PHARMA');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE order_status AS ENUM (
    'SUGGESTED_DRAFT',
    'AWAITING_RETAILER_APPROVAL',
    'ORDER_PLACED',
    'AWAITING_DISTRIBUTOR_CONFIRMATION',
    'ACCEPTED',
    'PARTIALLY_ACCEPTED',
    'REJECTED',
    'PROCESSING',
    'PACKED',
    'DISPATCHED',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
    'CANCELLED',
    'SHORTFALL_ACTION_REQUIRED',
    'RETURN_REQUESTED',
    'RETURNED_PARTIAL',
    'RETURNED_FULL'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('UNPAID', 'PARTIALLY_PAID', 'PAID', 'OVERDUE');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- -----------------------------------------------------------------------------
-- 1. ORGANIZATIONS (Retailers & Distributors)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_type user_role NOT NULL CHECK (org_type IN ('DISTRIBUTOR', 'RETAILER')),
  legal_name TEXT NOT NULL,
  trade_name TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,
  email TEXT,
  gstin TEXT,
  drug_license_no_20 TEXT,
  drug_license_no_21 TEXT,
  dl_valid_until DATE,
  kyc_doc_urls JSONB DEFAULT '[]'::jsonb,
  kyc_state kyc_status DEFAULT 'PENDING',
  pincode TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  address_line TEXT NOT NULL,
  serviceable_pincodes TEXT[] DEFAULT '{}', -- Used by Distributors
  min_order_value NUMERIC(12,2) DEFAULT 0,
  delivery_charge NUMERIC(10,2) DEFAULT 0,
  reliability_score NUMERIC(5,2) DEFAULT 100.00,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_organizations_pincode ON organizations(pincode);
CREATE INDEX IF NOT EXISTS idx_organizations_type ON organizations(org_type);
CREATE INDEX IF NOT EXISTS idx_organizations_kyc_state ON organizations(kyc_state);

-- -----------------------------------------------------------------------------
-- 2. MASTER PRODUCT CATALOG (Admin Controlled Canonical Registry)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS master_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku_code TEXT UNIQUE NOT NULL,
  barcode TEXT,
  brand_name TEXT NOT NULL,
  generic_composition TEXT, -- e.g., "Paracetamol 650mg"
  manufacturer TEXT NOT NULL,
  category product_category NOT NULL,
  schedule drug_schedule DEFAULT 'NON_PHARMA',
  pack_size TEXT NOT NULL, -- e.g., "10x15 Tablets" or "500ml Bottle"
  uom TEXT NOT NULL, -- Strip, Box, Bottle, Piece, Vial
  hsn_code TEXT NOT NULL,
  gst_percentage NUMERIC(5,2) NOT NULL, -- 5, 12, 18, 28
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Full-text search index for sub-50ms instant search
CREATE INDEX IF NOT EXISTS idx_master_products_search ON master_products 
USING GIN (to_tsvector('english', brand_name || ' ' || COALESCE(generic_composition, '') || ' ' || manufacturer || ' ' || sku_code));

CREATE INDEX IF NOT EXISTS idx_master_products_trgm ON master_products USING gin (brand_name gin_trgm_ops);

-- -----------------------------------------------------------------------------
-- 3. DISTRIBUTOR INVENTORY & BATCHES
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS distributor_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  distributor_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  master_product_id UUID NOT NULL REFERENCES master_products(id) ON DELETE RESTRICT,
  batch_number TEXT NOT NULL,
  expiry_date DATE NOT NULL,
  mrp NUMERIC(10,2) NOT NULL,
  ptr NUMERIC(10,2) NOT NULL, -- Price to Retailer
  discount_pct NUMERIC(5,2) DEFAULT 0,
  scheme_description TEXT, -- e.g., "Buy 10 Get 1 Free"
  scheme_base_qty INT,
  scheme_free_qty INT,
  moq INT DEFAULT 1 CHECK (moq >= 1),
  available_qty INT NOT NULL CHECK (available_qty >= 0),
  reserved_qty INT NOT NULL DEFAULT 0 CHECK (reserved_qty >= 0),
  damaged_qty INT NOT NULL DEFAULT 0 CHECK (damaged_qty >= 0),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(distributor_id, master_product_id, batch_number)
);

CREATE INDEX IF NOT EXISTS idx_distributor_batches_lookup ON distributor_batches(distributor_id, master_product_id);
CREATE INDEX IF NOT EXISTS idx_distributor_batches_fefo ON distributor_batches(master_product_id, expiry_date);

-- -----------------------------------------------------------------------------
-- 4. RETAILER-DISTRIBUTOR COMMERCIAL MAPPING & CREDIT LEDGER
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS retailer_distributor_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  retailer_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  distributor_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  is_preferred BOOLEAN DEFAULT false,
  priority_rank INT DEFAULT 1,
  credit_limit NUMERIC(12,2) DEFAULT 0,
  credit_days INT DEFAULT 0,
  current_outstanding NUMERIC(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(retailer_id, distributor_id)
);

CREATE INDEX IF NOT EXISTS idx_links_retailer ON retailer_distributor_links(retailer_id);
CREATE INDEX IF NOT EXISTS idx_links_distributor ON retailer_distributor_links(distributor_id);

-- -----------------------------------------------------------------------------
-- 5. RETAILER PRODUCT SETTINGS (For Replenishment & Demand Engine)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS retailer_product_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  retailer_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  master_product_id UUID NOT NULL REFERENCES master_products(id) ON DELETE CASCADE,
  current_known_stock INT, -- Nullable if retailer doesn't maintain live POS sync
  min_stock_threshold INT DEFAULT 5,
  max_target_stock INT DEFAULT 50,
  avg_daily_sales NUMERIC(10,2) DEFAULT 0,
  lead_time_days INT DEFAULT 2,
  safety_buffer_days INT DEFAULT 2,
  data_source TEXT DEFAULT 'ORDER_HISTORY' CHECK (data_source IN ('ACTUAL_POS_SALES', 'ORDER_HISTORY')),
  auto_order_enabled BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(retailer_id, master_product_id)
);

-- -----------------------------------------------------------------------------
-- 6. ORDERS & ORDER ITEMS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  retailer_id UUID NOT NULL REFERENCES organizations(id),
  distributor_id UUID NOT NULL REFERENCES organizations(id),
  parent_split_group_id UUID, -- Links split orders together
  is_auto_generated BOOLEAN DEFAULT false,
  generation_mode TEXT CHECK (generation_mode IN ('AUTO_ALLOCATED', 'RETAILER_SELECTED', 'MANUAL')),
  status order_status NOT NULL DEFAULT 'ORDER_PLACED',
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  tax_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  delivery_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  grand_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  rejection_reason TEXT,
  expected_delivery_at TIMESTAMPTZ,
  confirmed_by_retailer_at TIMESTAMPTZ,
  dispatched_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orders_retailer ON orders(retailer_id);
CREATE INDEX IF NOT EXISTS idx_orders_distributor ON orders(distributor_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  master_product_id UUID NOT NULL REFERENCES master_products(id),
  allocated_batch_id UUID REFERENCES distributor_batches(id),
  requested_qty INT NOT NULL CHECK (requested_qty > 0),
  accepted_qty INT DEFAULT 0 CHECK (accepted_qty >= 0),
  free_scheme_qty INT DEFAULT 0 CHECK (free_scheme_qty >= 0),
  unit_ptr NUMERIC(10,2) NOT NULL,
  gst_pct NUMERIC(5,2) NOT NULL,
  discount_amount NUMERIC(10,2) DEFAULT 0,
  line_total NUMERIC(12,2) NOT NULL,
  estimation_basis TEXT -- 'ACTUAL_POS_SALES' or 'ORDER_HISTORY_7D/15D/30D'
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- -----------------------------------------------------------------------------
-- 7. INVOICES, CREDIT NOTES & AUDIT LOGS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT NOT NULL, -- Distributor's GST Invoice Series
  order_id UUID UNIQUE REFERENCES orders(id),
  distributor_id UUID NOT NULL REFERENCES organizations(id),
  retailer_id UUID NOT NULL REFERENCES organizations(id),
  taxable_value NUMERIC(12,2) NOT NULL,
  cgst_amount NUMERIC(12,2) DEFAULT 0,
  sgst_amount NUMERIC(12,2) DEFAULT 0,
  igst_amount NUMERIC(12,2) DEFAULT 0,
  total_invoice_amount NUMERIC(12,2) NOT NULL,
  amount_paid NUMERIC(12,2) DEFAULT 0,
  payment_state payment_status DEFAULT 'UNPAID',
  due_date DATE,
  pdf_url TEXT,
  issued_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(distributor_id, invoice_number)
);

CREATE INDEX IF NOT EXISTS idx_invoices_distributor ON invoices(distributor_id);
CREATE INDEX IF NOT EXISTS idx_invoices_retailer ON invoices(retailer_id);

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_org_id UUID,
  entity_table TEXT NOT NULL,
  entity_id UUID NOT NULL,
  action TEXT NOT NULL, -- e.g., 'STOCK_ADJUSTMENT', 'ORDER_STATUS_CHANGE', 'CREDIT_NOTE_ISSUED'
  old_payload JSONB,
  new_payload JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS platform_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 8. ATOMIC FEFO INVENTORY RESERVATION (PostgreSQL RPC)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION reserve_order_stock(p_order_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql AS $$
DECLARE
  v_item RECORD;
  v_batch RECORD;
BEGIN
  FOR v_item IN SELECT * FROM order_items WHERE order_id = p_order_id LOOP
    -- Lock the specific batch row
    SELECT * INTO v_batch FROM distributor_batches
    WHERE id = v_item.allocated_batch_id
      AND available_qty >= (COALESCE(v_item.accepted_qty, v_item.requested_qty) + COALESCE(v_item.free_scheme_qty, 0))
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Insufficient stock for product % in batch %', v_item.master_product_id, v_item.allocated_batch_id;
    END IF;

    UPDATE distributor_batches
    SET available_qty = available_qty - (COALESCE(v_item.accepted_qty, v_item.requested_qty) + COALESCE(v_item.free_scheme_qty, 0)),
        reserved_qty = reserved_qty + (COALESCE(v_item.accepted_qty, v_item.requested_qty) + COALESCE(v_item.free_scheme_qty, 0)),
        updated_at = now()
    WHERE id = v_batch.id;
  END LOOP;
  RETURN TRUE;
END;
$$;
