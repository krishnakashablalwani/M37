PART 2: TECHNICAL REQUIREMENTS DOCUMENT (TRD)1. Antigravity IDE Stack & ArchitectureTo maximize velocity in Antigravity IDE and prevent code fragmentation across mobile and web, use a Modular Monolith with an Unified Full-Stack TypeScript + Python Data Engine setup:Frontend & Mobile Wrapper: Next.js 15 (App Router) + React 18 + TypeScript + Tailwind CSS + shadcn/ui.Android App Generation: Wrap the Next.js mobile viewport routes (/retailer/*, /rep/*) using Capacitor to compile a native Android .apk / .aab with native access to the camera (barcode scanning via @capacitor-mlkit/barcode-scanning & return photo uploads) and push notifications (@capacitor/push-notifications).Web Portals: Desktop-responsive Next.js routes (/distributor/*, /admin/*) served from the exact same repository and component library.State & Offline Resilience: TanStack Query (React Query) + Zustand (with persist middleware in IndexedDB so retailers in low-connectivity medical shops never lose their cart).Backend & Database: Supabase (PostgreSQL 16 + Row Level Security + Auth + Storage + Realtime) paired with Next.js Server Actions / API Routes for standard CRUD, and a lightweight Python (FastAPI) worker service for heavy CSV catalog normalization, Pandas-based demand forecasting, and cron-based auto-order calculations.Search Engine: PostgreSQL pg_trgm + Full-Text Search (GIN indexes) for Phase 1-2 (zero extra infra cost, handles 500k+ SKUs in <50ms). Upgradeable to Typesense/Meilisearch in Phase 3.PDF & Reporting Engine: @react-pdf/renderer or server-side HTML-to-PDF for GST Invoices, Credit Notes, and xlsx (SheetJS) for Excel ledger/report exports.Notifications: Firebase Cloud Messaging (FCM) for Android push + WhatsApp Business API (Interakt / Wati / Meta Cloud API webhook) for critical order/invoice alerts.2. Core Database Schema (PostgreSQL / Supabase DDL)You can drop this foundational schema directly into your Supabase SQL Editor or Antigravity database migration folder:SQL-- ENUMS
CREATE TYPE user_role AS ENUM ('SUPER_ADMIN', 'DISTRIBUTOR', 'RETAILER', 'SALES_REP');
CREATE TYPE kyc_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED');
CREATE TYPE product_category AS ENUM ('PHARMA', 'SURGICAL', 'FMCG');
CREATE TYPE drug_schedule AS ENUM ('OTC', 'SCHEDULE_H', 'SCHEDULE_H1', 'SCHEDULE_X', 'NON_PHARMA');
CREATE TYPE order_status AS ENUM (
  'SUGGESTED_DRAFT', 'AWAITING_RETAILER_APPROVAL', 'ORDER_PLACED',
  'AWAITING_DISTRIBUTOR_CONFIRMATION', 'ACCEPTED', 'PARTIALLY_ACCEPTED',
  'REJECTED', 'PROCESSING', 'PACKED', 'DISPATCHED', 'OUT_FOR_DELIVERY',
  'DELIVERED', 'CANCELLED', 'SHORTFALL_ACTION_REQUIRED'
);
CREATE TYPE payment_status AS ENUM ('UNPAID', 'PARTIALLY_PAID', 'PAID', 'OVERDUE');

-- 1. ORGANIZATIONS (Retailers & Distributors)
CREATE TABLE organizations (
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
  kyc_doc_urls JSONB DEFAULT '[]',
  kyc_state kyc_status DEFAULT 'PENDING',
  pincode TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  address_line TEXT NOT NULL,
  serviceable_pincodes TEXT[] DEFAULT '{}', -- Used by Distributors
  min_order_value NUMERIC(12,2) DEFAULT 0,
  delivery_charge NUMERIC(10,2) DEFAULT 0,
  reliability_score NUMERIC(4,2) DEFAULT 100.00,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. MASTER PRODUCT CATALOG (Admin Controlled)
CREATE TABLE master_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku_code TEXT UNIQUE NOT NULL,
  barcode TEXT,
  brand_name TEXT NOT NULL,
  generic_composition TEXT, -- e.g., "Paracetamol 650mg"
  manufacturer TEXT NOT NULL,
  category product_category NOT NULL,
  schedule drug_schedule DEFAULT 'NON_PHARMA',
  pack_size TEXT NOT NULL, -- e.g., "10x15 Tablets" or "500ml Bottle"
  uom TEXT NOT NULL, -- Strip, Box, Bottle, Piece
  hsn_code TEXT NOT NULL,
  gst_percentage NUMERIC(5,2) NOT NULL, -- 5, 12, 18, 28
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_master_products_search ON master_products 
USING GIN (to_tsvector('english', brand_name || ' ' || COALESCE(generic_composition, '') || ' ' || manufacturer || ' ' || sku_code));

-- 3. DISTRIBUTOR INVENTORY & BATCHES
CREATE TABLE distributor_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  distributor_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  master_product_id UUID REFERENCES master_products(id) ON DELETE RESTRICT,
  batch_number TEXT NOT NULL,
  expiry_date DATE NOT NULL,
  mrp NUMERIC(10,2) NOT NULL,
  ptr NUMERIC(10,2) NOT NULL, -- Price to Retailer (Excl. or Incl. tax as configured)
  discount_pct NUMERIC(5,2) DEFAULT 0,
  scheme_description TEXT, -- e.g., "Buy 10 Get 1 Free"
  scheme_base_qty INT,
  scheme_free_qty INT,
  moq INT DEFAULT 1,
  available_qty INT NOT NULL CHECK (available_qty >= 0),
  reserved_qty INT NOT NULL DEFAULT 0 CHECK (reserved_qty >= 0),
  damaged_qty INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(distributor_id, master_product_id, batch_number)
);

-- 4. RETAILER-DISTRIBUTOR COMMERCIAL MAPPING & CREDIT LEDGER
CREATE TABLE retailer_distributor_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  retailer_id UUID REFERENCES organizations(id),
  distributor_id UUID REFERENCES organizations(id),
  is_preferred BOOLEAN DEFAULT false,
  priority_rank INT DEFAULT 1,
  credit_limit NUMERIC(12,2) DEFAULT 0,
  credit_days INT DEFAULT 0,
  current_outstanding NUMERIC(12,2) DEFAULT 0,
  UNIQUE(retailer_id, distributor_id)
);

-- 5. RETAILER INVENTORY & DEMAND CONFIG (For Auto-Order Engine)
CREATE TABLE retailer_product_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  retailer_id UUID REFERENCES organizations(id),
  master_product_id UUID REFERENCES master_products(id),
  current_known_stock INT, -- Nullable if retailer doesn't track stock
  min_stock_threshold INT DEFAULT 5,
  max_target_stock INT DEFAULT 50,
  avg_daily_sales NUMERIC(10,2) DEFAULT 0,
  data_source TEXT DEFAULT 'ORDER_HISTORY' CHECK (data_source IN ('ACTUAL_POS_SALES', 'ORDER_HISTORY')),
  auto_order_enabled BOOLEAN DEFAULT true,
  UNIQUE(retailer_id, master_product_id)
);

-- 6. ORDERS & ORDER ITEMS
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  retailer_id UUID REFERENCES organizations(id),
  distributor_id UUID REFERENCES organizations(id),
  parent_split_group_id UUID, -- Links split orders together
  is_auto_generated BOOLEAN DEFAULT false,
  generation_mode TEXT CHECK (generation_mode IN ('AUTO_ALLOCATED', 'RETAILER_SELECTED', 'MANUAL')),
  status order_status NOT NULL DEFAULT 'ORDER_PLACED',
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  tax_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  delivery_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  grand_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  expected_delivery_at TIMESTAMPTZ,
  confirmed_by_retailer_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  master_product_id UUID REFERENCES master_products(id),
  allocated_batch_id UUID REFERENCES distributor_batches(id),
  requested_qty INT NOT NULL CHECK (requested_qty > 0),
  accepted_qty INT,
  free_scheme_qty INT DEFAULT 0,
  unit_ptr NUMERIC(10,2) NOT NULL,
  gst_pct NUMERIC(5,2) NOT NULL,
  discount_amount NUMERIC(10,2) DEFAULT 0,
  line_total NUMERIC(12,2) NOT NULL,
  estimation_basis TEXT -- 'ACTUAL_POS_SALES' or 'ORDER_HISTORY_7D/15D/30D'
);

-- 7. INVOICES, PAYMENTS & AUDIT LOGS
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT NOT NULL, -- Distributor's GST Invoice Series
  order_id UUID REFERENCES orders(id) UNIQUE,
  distributor_id UUID REFERENCES organizations(id),
  retailer_id UUID REFERENCES organizations(id),
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

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_org_id UUID,
  entity_table TEXT NOT NULL,
  entity_id UUID NOT NULL,
  action TEXT NOT NULL, -- e.g., 'STOCK_ADJUSTMENT', 'ORDER_STATUS_CHANGE', 'CREDIT_NOTE_ISSUED'
  old_payload JSONB,
  new_payload JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
3. Core Algorithms & Engine Specifications3.1 Atomic FEFO Inventory Reservation (PostgreSQL RPC)To guarantee that two retailers never book the same stock simultaneously, order acceptance executes an atomic PostgreSQL transaction using FOR UPDATE:SQLCREATE OR REPLACE FUNCTION reserve_order_stock(p_order_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql AS $$
DECLARE
  v_item RECORD;
  v_batch RECORD;
BEGIN
  FOR v_item IN SELECT * FROM order_items WHERE order_id = p_order_id LOOP
    -- Lock the specific batch row (or earliest expiring batch with valid shelf life)
    SELECT * INTO v_batch FROM distributor_batches
    WHERE id = v_item.allocated_batch_id
      AND available_qty >= (v_item.accepted_qty + v_item.free_scheme_qty)
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Insufficient stock for product % in batch %', v_item.master_product_id, v_item.allocated_batch_id;
    END IF;

    UPDATE distributor_batches
    SET available_qty = available_qty - (v_item.accepted_qty + v_item.free_scheme_qty),
        reserved_qty = reserved_qty + (v_item.accepted_qty + v_item.free_scheme_qty),
        updated_at = now()
    WHERE id = v_batch.id;
  END LOOP;
  RETURN TRUE;
END;
$$;
3.2 Automatic Order Generation & Smart Routing Engine (Python / TypeScript Cron)Runs daily at a configurable window (e.g., 20:00 IST):Fetch Demand Window: Pulls retailer's configured lookback window ($N \in \{1, 7, 15, 30\}$ days).Distinguish Sales vs. Orders:If retailer_product_settings.current_known_stock IS NOT NULL, uses actual POS consumption rate and sets estimation_basis = 'ACTUAL_POS_SALES'.Otherwise, calculates velocity from fulfilled order_items over the last $N$ days and flags estimation_basis = 'ORDER_HISTORY_ND'.Compute Net Suggested Quantity:Pythonin_transit = get_pending_order_qty(retailer_id, product_id)
available = current_known_stock if current_known_stock is not None else estimated_remaining_stock
raw_qty = target_stock - (available + in_transit)
suggested_qty = max(0, round_to_moq_and_pack(raw_qty, moq))
Distributor Scoring & Allocation (Mode A):Filters distributors where retailer.pincode = ANY(distributor.serviceable_pincodes) AND batch.expiry_date > CURRENT_DATE + min_shelf_life_days.Calculates composite score per distributor:Preferred Distributor Bonus: +30 pts100% Stock Fill Rate: +35 ptsLowest Net Effective Price (PTR minus scheme benefit): +20 ptsReliability & SLA Score: +15 ptsGenerates a SUGGESTED_DRAFT order and sends an actionable notification to the retailer.4. Recommended Defaults for Section 19 (Pre-Development Questions)Your SRD lists 12 open business questions in Section 19. To avoid hardcoding assumptions while letting you start building immediately in Antigravity, build these as Admin Feature Flags (platform_config table) with the following sensible MVP defaults:#Question AreaRecommended MVP Architecture Default1Business CoverageSingle-city / Pincode-cluster launch (e.g., Hyderabad pincodes), architected with state and pincode routing arrays so multi-state IGST vs CGST/SGST tax switching works automatically.2Customer TypeStrict B2B Only. Gate registration behind GSTIN / Drug License verification. Hide wholesale PTR pricing from unauthenticated users.3Order GenerationHybrid with explicit UI badge: Default to 7/15/30-day Order History (since most medical shops don't sync live POS stock on Day 1), with an optional CSV/manual "Current Stock" input column in the draft screen.4Distributor SelectionConfigurable Weighted Score (Default: 1st check Preferred Distributor → if out of stock, rank alternatives by Availability + Net Scheme Price).5Stock Data SyncPhase 1: Standardized CSV/Excel Template Upload + Manual UI Edit. Phase 3: Tally/Marg ERP desktop connector utility.6Pricing ControlMaster Catalog by Admin (MRP ceiling); Independent PTR, Discounts & Schemes by each Distributor.7PaymentsDirect Retailer-to-Distributor UPI Deep Links & Offline Ledger Logging in MVP (avoids RBI payment aggregator nodal account delays for marketplace split settlements). Add Razorpay Route in Phase 2.8Delivery LogisticsDistributor Self-Delivery in Phase 1 (Distributors use their existing delivery boys and update status to DISPATCHED / DELIVERED).9Revenue ModelSupport both Distributor SaaS Subscription and % Platform Commission ledger tracking (toggled in Admin settings).5. Antigravity IDE Folder Structure & Build RoadmapSet up your project workspace with this modular structure so you can build and test each slice cleanly:Plaintextb2b-pharma-fmcg-platform/
├── apps/
│   ├── web-and-mobile/             # Next.js 15 App Router + Capacitor (Android)
│   │   ├── src/app/
│   │   │   ├── (auth)/             # Login, OTP, KYC & Drug License Upload
│   │   │   ├── (retailer)/         # Mobile-first Zomato-style ordering UI
│   │   │   │   ├── search/         # Salt/Brand search + Distributor Compare drawer
│   │   │   │   ├── auto-drafts/    # Suggested Replenishment Review screen
│   │   │   │   ├── cart/           # Multi-distributor split cart & checkout
│   │   │   │   ├── orders/         # Status tracker, Shortfall re-order, RMA returns
│   │   │   │   └── ledger/         # GST Invoices PDF & Outstanding dues
│   │   │   ├── (distributor)/      # Distributor Portal (Inventory, Orders, Invoicing)
│   │   │   └── (admin)/            # Master Catalog, KYC Approval, Routing Rules
│   │   └── capacitor.config.ts     # Compiles (retailer) routes into Android APK
│   └── automation-engine/          # FastAPI (Python) service
│       ├── routers/
│       │   ├── auto_order.py       # Daily replenishment calculation engine
│       │   ├── csv_ingestion.py    # Bulk stock/price Excel validator & fuzzy matcher
│       │   └── routing.py          # Multi-distributor scoring & shortfall splitting
├── packages/
│   └── database/                   # Supabase migrations, RLS policies & RPC functions
Step-by-Step Build Sequence for AntigravitySprint 1 (Foundation & Compliance): Run the PostgreSQL schema above in Supabase, configure Row Level Security (RLS), and build the Role-Based Auth + Drug License / GSTIN KYC onboarding flow.Sprint 2 (Master Catalog & Distributor Stock Engine): Build the Admin Master Product CRUD, the Distributor Batch/Stock management table, and the Bulk CSV/Excel uploader with validation error reporting.Sprint 3 (Retailer Discovery & Manual Ordering): Build the debounced Brand/Generic Salt search bar, the Distributor Comparison Bottom Sheet, Cart validation (MOQ + Schedule H/X license checks), and the Atomic FEFO Stock Reservation RPC.Sprint 4 (GST Invoicing, Ledger & Returns): Build the Distributor Order Acceptance screen, automated GST Invoice PDF generator, Credit Ledger tracker, and Return (RMA) photo upload workflow.Sprint 5 (Auto-Replenishment & Smart Routing): Implement the daily Auto-Order calculation cron job, the SUGGESTED_DRAFT review UI (with explicit Actual Sales vs. Order History tags), and the Shortfall 1-tap alternative distributor routing flow.