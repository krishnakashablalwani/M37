-- =============================================================================
-- Seed Data: B2B Pharmaceutical, Surgical & FMCG Distribution Platform
-- =============================================================================

-- 1. Insert Initial Platform Configurations
INSERT INTO platform_config (key, value, description) VALUES
('business_coverage', '{"mode": "SINGLE_CITY", "city": "Hyderabad", "supported_states": ["Telangana", "Andhra Pradesh"]}', 'Territory and tax calculation configuration'),
('routing_weights', '{"preferred_status": 30, "fill_rate": 35, "price_competitiveness": 20, "reliability_sla": 15}', 'Smart distributor scoring formula weights'),
('compliance_rules', '{"strict_schedule_h_blocking": true, "dl_pre_expiry_alert_days": 30, "fmcg_only_requires_gst": true}', 'Compliance and KYC enforcement parameters')
ON CONFLICT (key) DO NOTHING;

-- 2. Organizations: Distributors & Retailers
-- Distributor 1: MedLife Wholesale Pharma (Hyderabad)
INSERT INTO organizations (
  id, org_type, legal_name, trade_name, phone, email, gstin,
  drug_license_no_20, drug_license_no_21, dl_valid_until, kyc_state,
  pincode, city, state, address_line, serviceable_pincodes, min_order_value, delivery_charge, reliability_score
) VALUES (
  '11111111-1111-1111-1111-111111111111', 'DISTRIBUTOR', 'MedLife Wholesale Pharma Pvt Ltd', 'MedLife Distributors',
  '+919849012345', 'sales@medlifewholesale.com', '36AABCM1234F1Z8',
  'TG/HYD/20B/2021/8892', 'TG/HYD/21B/2021/8893', '2028-12-31', 'APPROVED',
  '500003', 'Hyderabad', 'Telangana', 'Plot 42, Sanathnagar Industrial Estate',
  ARRAY['500001','500002','500003','500004','500016','500038','500072'],
  1000.00, 50.00, 98.50
) ON CONFLICT (id) DO NOTHING;

-- Distributor 2: Apex Surgical & Medical Stockists
INSERT INTO organizations (
  id, org_type, legal_name, trade_name, phone, email, gstin,
  drug_license_no_20, drug_license_no_21, dl_valid_until, kyc_state,
  pincode, city, state, address_line, serviceable_pincodes, min_order_value, delivery_charge, reliability_score
) VALUES (
  '22222222-2222-2222-2222-222222222222', 'DISTRIBUTOR', 'Apex Healthcare & Surgical Suppliers', 'Apex Stockists',
  '+919849067890', 'orders@apexsurgical.com', '36AABCA5678G1Z2',
  'TG/HYD/20B/2022/4120', 'TG/HYD/21B/2022/4121', '2027-08-31', 'APPROVED',
  '500016', 'Secunderabad', 'Telangana', '12-2-417, Parklane Road',
  ARRAY['500001','500002','500003','500016','500020','500025'],
  1500.00, 0.00, 96.00
) ON CONFLICT (id) DO NOTHING;

-- Distributor 3: Metro FMCG & OTC Mega Stockists
INSERT INTO organizations (
  id, org_type, legal_name, trade_name, phone, email, gstin,
  drug_license_no_20, drug_license_no_21, dl_valid_until, kyc_state,
  pincode, city, state, address_line, serviceable_pincodes, min_order_value, delivery_charge, reliability_score
) VALUES (
  '33333333-3333-3333-3333-333333333333', 'DISTRIBUTOR', 'Metro Consumer Brands & OTC Pvt Ltd', 'Metro Stockists',
  '+919849099999', 'dispatch@metrofmcg.com', '36AABCM9999H1Z0',
  'TG/HYD/20B/2020/1101', 'TG/HYD/21B/2020/1102', '2029-03-31', 'APPROVED',
  '500038', 'Hyderabad', 'Telangana', 'B-14, IDA Kukatpally',
  ARRAY['500001','500002','500003','500016','500038','500072','500081'],
  800.00, 30.00, 94.20
) ON CONFLICT (id) DO NOTHING;

-- Retailer 1: Care Chemist & Druggist (Verified Pharmacy)
INSERT INTO organizations (
  id, org_type, legal_name, trade_name, phone, email, gstin,
  drug_license_no_20, drug_license_no_21, dl_valid_until, kyc_state,
  pincode, city, state, address_line, min_order_value, reliability_score
) VALUES (
  '44444444-4444-4444-4444-444444444444', 'RETAILER', 'Care Chemist & Druggist LLP', 'Care Chemist',
  '+919848011223', 'carechemist.hyd@gmail.com', '36AAACC4321A1Z1',
  'TG/HYD/20/2021/6541', 'TG/HYD/21/2021/6542', '2027-11-30', 'APPROVED',
  '500003', 'Hyderabad', 'Telangana', 'Shop 4, Market Street, Secunderabad',
  0, 99.00
) ON CONFLICT (id) DO NOTHING;

-- Retailer 2: Krishna Super Store (FMCG Only - No Drug License)
INSERT INTO organizations (
  id, org_type, legal_name, trade_name, phone, email, gstin,
  drug_license_no_20, drug_license_no_21, dl_valid_until, kyc_state,
  pincode, city, state, address_line, min_order_value, reliability_score
) VALUES (
  '55555555-5555-5555-5555-555555555555', 'RETAILER', 'Krishna Retail Mart', 'Krishna Super Store',
  '+919848099887', 'krishna.mart@gmail.com', '36AAACK8877B1Z5',
  NULL, NULL, NULL, 'APPROVED',
  '500016', 'Secunderabad', 'Telangana', 'Plot 8, Begumpet Main Road',
  0, 95.00
) ON CONFLICT (id) DO NOTHING;

-- 3. Commercial Links & Credit Setup
INSERT INTO retailer_distributor_links (
  retailer_id, distributor_id, is_preferred, priority_rank, credit_limit, credit_days, current_outstanding
) VALUES
('44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', true, 1, 100000.00, 21, 24500.00),
('44444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', false, 2, 50000.00, 15, 0.00),
('55555555-5555-5555-5555-555555555555', '33333333-3333-3333-3333-333333333333', true, 1, 30000.00, 7, 8500.00)
ON CONFLICT (retailer_id, distributor_id) DO NOTHING;

-- 4. Master Product Catalog
-- Product 1: Dolo 650 (Schedule H)
INSERT INTO master_products (
  id, sku_code, barcode, brand_name, generic_composition, manufacturer,
  category, schedule, pack_size, uom, hsn_code, gst_percentage
) VALUES (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'MED-DOLO-650', '8901234567890',
  'Dolo 650 Tablet', 'Paracetamol 650mg', 'Micro Labs Ltd',
  'PHARMA', 'SCHEDULE_H', '15 Tablets / Strip', 'Strip', '30049060', 12.00
) ON CONFLICT (id) DO NOTHING;

-- Product 2: Calpol 650 (Generic Substitute for Paracetamol 650)
INSERT INTO master_products (
  id, sku_code, barcode, brand_name, generic_composition, manufacturer,
  category, schedule, pack_size, uom, hsn_code, gst_percentage
) VALUES (
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'MED-CALPOL-650', '8901234567891',
  'Calpol 650mg Tablet', 'Paracetamol 650mg', 'GlaxoSmithKline Pharmaceuticals',
  'PHARMA', 'SCHEDULE_H', '15 Tablets / Strip', 'Strip', '30049060', 12.00
) ON CONFLICT (id) DO NOTHING;

-- Product 3: Azithral 500 (Schedule H1)
INSERT INTO master_products (
  id, sku_code, barcode, brand_name, generic_composition, manufacturer,
  category, schedule, pack_size, uom, hsn_code, gst_percentage
) VALUES (
  'cccccccc-cccc-cccc-cccc-cccccccccccc', 'MED-AZITH-500', '8901234567892',
  'Azithral 500 Tablet', 'Azithromycin 500mg', 'Alembic Pharmaceuticals Ltd',
  'PHARMA', 'SCHEDULE_H1', '5 Tablets / Strip', 'Strip', '30042010', 12.00
) ON CONFLICT (id) DO NOTHING;

-- Product 4: Surgical Nitrile Gloves (Surgical)
INSERT INTO master_products (
  id, sku_code, barcode, brand_name, generic_composition, manufacturer,
  category, schedule, pack_size, uom, hsn_code, gst_percentage
) VALUES (
  'dddddddd-dddd-dddd-dddd-dddddddddddd', 'SURG-GLOVE-NIT-M', '8901234567893',
  'CareProtect Nitrile Examination Gloves (Medium)', '100% Medical Grade Nitrile Powder-Free', 'CareProtect Healthcare',
  'SURGICAL', 'NON_PHARMA', 'Box of 100 Pieces', 'Box', '40151100', 12.00
) ON CONFLICT (id) DO NOTHING;

-- Product 5: Dettol Antiseptic Liquid 500ml (FMCG / OTC)
INSERT INTO master_products (
  id, sku_code, barcode, brand_name, generic_composition, manufacturer,
  category, schedule, pack_size, uom, hsn_code, gst_percentage
) VALUES (
  'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'FMCG-DETTOL-500', '8901234567894',
  'Dettol Antiseptic Liquid 500ml', 'Chloroxylenol 4.8% w/v', 'Reckitt Benckiser',
  'FMCG', 'OTC', '500ml Bottle', 'Bottle', '38089400', 18.00
) ON CONFLICT (id) DO NOTHING;

-- 5. Distributor Batches & Inventory
-- Dolo 650 at MedLife Wholesale
INSERT INTO distributor_batches (
  id, distributor_id, master_product_id, batch_number, expiry_date,
  mrp, ptr, discount_pct, scheme_description, scheme_base_qty, scheme_free_qty, moq, available_qty, reserved_qty
) VALUES (
  '11110001-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'DL24B01', '2027-05-31', 34.15, 24.39, 5.00, 'Buy 10 Get 1 Free', 10, 1, 5, 250, 0
) ON CONFLICT (id) DO NOTHING;

-- Dolo 650 at Apex Stockists (Alternative distributor for price/stock comparison)
INSERT INTO distributor_batches (
  id, distributor_id, master_product_id, batch_number, expiry_date,
  mrp, ptr, discount_pct, scheme_description, scheme_base_qty, scheme_free_qty, moq, available_qty, reserved_qty
) VALUES (
  '22220001-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'DL24A99', '2026-11-30', 34.15, 24.80, 2.00, 'Flat 2% Extra Cash Discount', NULL, NULL, 10, 80, 0
) ON CONFLICT (id) DO NOTHING;

-- Azithral 500 at MedLife Wholesale
INSERT INTO distributor_batches (
  id, distributor_id, master_product_id, batch_number, expiry_date,
  mrp, ptr, discount_pct, scheme_description, scheme_base_qty, scheme_free_qty, moq, available_qty, reserved_qty
) VALUES (
  '11110002-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'cccccccc-cccc-cccc-cccc-cccccccccccc',
  'AZ500-88', '2026-09-30', 125.00, 89.25, 3.00, 'Buy 20 Get 2 Free', 20, 2, 2, 140, 0
) ON CONFLICT (id) DO NOTHING;

-- Nitrile Gloves at Apex Stockists
INSERT INTO distributor_batches (
  id, distributor_id, master_product_id, batch_number, expiry_date,
  mrp, ptr, discount_pct, scheme_description, scheme_base_qty, scheme_free_qty, moq, available_qty, reserved_qty
) VALUES (
  '22220002-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 'dddddddd-dddd-dddd-dddd-dddddddddddd',
  'GL-MED-24', '2028-01-31', 650.00, 420.00, 8.00, 'Bulk Offer: 5% off on 10+ boxes', 10, 0, 1, 95, 0
) ON CONFLICT (id) DO NOTHING;

-- Dettol 500ml at Metro Stockists
INSERT INTO distributor_batches (
  id, distributor_id, master_product_id, batch_number, expiry_date,
  mrp, ptr, discount_pct, scheme_description, scheme_base_qty, scheme_free_qty, moq, available_qty, reserved_qty
) VALUES (
  '33330001-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
  'DT-HYD-500', '2027-04-30', 215.00, 168.00, 6.00, 'Standard FMCG Retailer Discount', NULL, NULL, 6, 320, 0
) ON CONFLICT (id) DO NOTHING;

-- 6. Retailer Product Settings (For Auto-Replenishment Engine)
INSERT INTO retailer_product_settings (
  retailer_id, master_product_id, current_known_stock, min_stock_threshold, max_target_stock, avg_daily_sales, data_source
) VALUES
('44444444-4444-4444-4444-444444444444', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 12, 15, 60, 8.50, 'ORDER_HISTORY'),
('44444444-4444-4444-4444-444444444444', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 4, 6, 25, 3.20, 'ORDER_HISTORY'),
('44444444-4444-4444-4444-444444444444', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 2, 4, 15, 1.80, 'ACTUAL_POS_SALES')
ON CONFLICT (retailer_id, master_product_id) DO NOTHING;
