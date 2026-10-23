import assert from 'node:assert/strict';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

export async function runApiIntegrationTests() {
  console.log('\n============================================================');
  console.log('🧪 SUITE 2: End-to-End HTTP API & Workflow Integration');
  console.log('============================================================');

  let passedCount = 0;

  // 1. GET /api/search (Debounced Master Catalog Search)
  console.log('\n[2.1] Testing GET /api/search across Brands, Generic Salts, and Filters...');

  // 1a. Broad catalog query
  const resAll = await fetch(`${BASE_URL}/api/search?pincode=500003`);
  assert.equal(resAll.status, 200, 'Search API should return HTTP 200');
  const dataAll = await resAll.json();
  assert.ok(Array.isArray(dataAll.products), 'Should return products array');
  assert.ok(dataAll.products.length >= 20, `Expected >= 20 products, got ${dataAll.products.length}`);
  console.log(`  ✓ Unfiltered search returned ${dataAll.products.length} active products in pincode 500003.`);

  // 1b. Brand search (e.g. "Telma")
  const resBrand = await fetch(`${BASE_URL}/api/search?q=Telma&pincode=500003`);
  const dataBrand = await resBrand.json();
  assert.ok(dataBrand.products.length >= 1, 'Should find Telma brand');
  assert.ok(
    dataBrand.products.some((p) => p.brand_name.toLowerCase().includes('telma')),
    'Returned products should contain Telma'
  );
  console.log(`  ✓ Brand search for "Telma" returned ${dataBrand.products.length} match(es).`);

  // 1c. Generic salt search (e.g. "Paracetamol")
  const resSalt = await fetch(`${BASE_URL}/api/search?q=Paracetamol&pincode=500003`);
  const dataSalt = await resSalt.json();
  assert.ok(dataSalt.products.length >= 2, 'Should find Paracetamol products (Dolo, Calpol, Zerodol)');
  for (const p of dataSalt.products) {
    assert.ok(
      p.generic_composition.toLowerCase().includes('paracetamol'),
      `Product ${p.brand_name} should match generic composition Paracetamol`
    );
  }
  console.log(`  ✓ Generic salt search for "Paracetamol" matched: ${dataSalt.products.map((p) => p.brand_name).join(', ')}.`);

  // 1d. Category filter: SURGICAL
  const resSurg = await fetch(`${BASE_URL}/api/search?category=SURGICAL&pincode=500003`);
  const dataSurg = await resSurg.json();
  assert.ok(dataSurg.products.length >= 3, 'Should find surgical products');
  for (const p of dataSurg.products) {
    assert.equal(p.category, 'SURGICAL', 'All results must belong to SURGICAL category');
  }
  console.log(`  ✓ Category filter [SURGICAL] returned ${dataSurg.products.length} surgical SKUs.`);

  // 1e. Schedule filter: SCHEDULE_H1
  const resH1 = await fetch(`${BASE_URL}/api/search?schedule=SCHEDULE_H1&pincode=500003`);
  const dataH1 = await resH1.json();
  assert.ok(dataH1.products.length >= 2, 'Should find Schedule H1 antibiotics');
  for (const p of dataH1.products) {
    assert.equal(p.schedule, 'SCHEDULE_H1', 'All results must be SCHEDULE_H1');
  }
  console.log(`  ✓ Schedule filter [SCHEDULE_H1] returned: ${dataH1.products.map((p) => p.brand_name).join(', ')}.`);
  passedCount++;

  // 2. GET /api/organizations (RBAC & KYC State)
  console.log('\n[2.2] Testing GET /api/organizations...');
  const resOrgs = await fetch(`${BASE_URL}/api/organizations`);
  assert.equal(resOrgs.status, 200, 'Organizations API should return HTTP 200');
  const dataOrgs = await resOrgs.json();
  assert.ok(Array.isArray(dataOrgs.organizations), 'Should return organizations array');

  const careChemist = dataOrgs.organizations.find((o) => o.trade_name.includes('Care Chemist'));
  const medLife = dataOrgs.organizations.find((o) => o.trade_name.includes('MedLife'));
  assert.ok(careChemist, 'Care Chemist retailer must exist');
  assert.ok(medLife, 'MedLife distributor must exist');
  assert.equal(careChemist.kyc_state, 'APPROVED');
  assert.ok(careChemist.drug_license_no_20, 'Care Chemist must have Form 20 DL');
  console.log(`  ✓ Organizations API returned ${dataOrgs.organizations.length} verified B2B entities.`);
  passedCount++;

  // 3. GET /api/products/[id]/distributors (Distributor Compare Drawer)
  console.log('\n[2.3] Testing GET /api/products/[id]/distributors (Stockist Rank & Expiry Engine)...');
  const sampleProduct = dataAll.products[0];
  const resDistCompare = await fetch(
    `${BASE_URL}/api/products/${sampleProduct.id}/distributors?pincode=500003&retailer_id=${careChemist.id}`
  );
  assert.equal(resDistCompare.status, 200, 'Compare API should return HTTP 200');
  const dataCompare = await resDistCompare.json();
  assert.ok(Array.isArray(dataCompare.distributors), 'Should return distributors array');
  assert.ok(dataCompare.distributors.length >= 1, 'Product should have at least 1 servicing distributor');

  const topDist = dataCompare.distributors[0];
  assert.ok(topDist.batch_number, 'Distributor batch must include batch_number');
  assert.ok(topDist.expiry_date, 'Batch must include expiry_date');
  assert.ok(Number(topDist.ptr) > 0, 'Must include positive PTR');
  assert.ok(Number(topDist.net_landing_price) > 0, 'Must compute net landing price');
  console.log(`  ✓ Product "${sampleProduct.brand_name}" verified across ${dataCompare.distributors.length} stockist(s) with FEFO expiry ${topDist.expiry_date}.`);
  passedCount++;

  // 4. GET /api/replenishment/suggestions (Demand Velocity & Deficit Math)
  console.log('\n[2.4] Testing GET /api/replenishment/suggestions (Auto-Replenish Engine)...');
  const resReplenish = await fetch(`${BASE_URL}/api/replenishment/suggestions?retailer_id=${careChemist.id}`);
  assert.equal(resReplenish.status, 200, 'Replenishment API should return HTTP 200');
  const dataReplenish = await resReplenish.json();
  assert.ok(Array.isArray(dataReplenish.suggestions), 'Should return suggestions array');
  assert.ok(dataReplenish.suggestions.length >= 1, 'Should generate replenishment suggestions for Care Chemist');

  const repItem = dataReplenish.suggestions[0];
  assert.ok(repItem.suggested_qty > 0, 'Suggested reorder qty must be > 0');
  assert.ok(['CRITICAL', 'NORMAL'].includes(repItem.urgency), 'Urgency must be CRITICAL or NORMAL');
  assert.ok(
    repItem.data_source.includes('POS') || repItem.data_source.includes('Velocity'),
    'Data source must be transparently tagged'
  );
  console.log(`  ✓ Replenishment generated ${dataReplenish.suggestions.length} SKU recommendation(s) with urgency: ${repItem.urgency}.`);
  passedCount++;

  // 5. GET /api/distributor/batches (Distributor Order Workstation)
  console.log('\n[2.5] Testing GET /api/distributor/batches...');
  const resWorkstation = await fetch(`${BASE_URL}/api/distributor/batches?distributor_id=${medLife.id}`);
  assert.equal(resWorkstation.status, 200, 'Distributor batches API should return HTTP 200');
  const dataWorkstation = await resWorkstation.json();
  assert.ok(Array.isArray(dataWorkstation.batches), 'Should return batches array');
  assert.ok(dataWorkstation.batches.length >= 5, 'MedLife should hold >= 5 stock batches');
  console.log(`  ✓ Distributor Workstation retrieved ${dataWorkstation.batches.length} live inventory batches.`);
  passedCount++;

  // 6. POST /api/orders/checkout Validation & Order Placement
  console.log('\n[2.6] Testing POST /api/orders/checkout (Validation & Atomic Checkout)...');

  // 6a. Negative test: Missing required fields
  const resBadCheckout = await fetch(`${BASE_URL}/api/orders/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  assert.equal(resBadCheckout.status, 400, 'Empty checkout payload must be rejected with 400');
  console.log('  ✓ Missing fields correctly rejected with HTTP 400.');

  // 6b. Positive test: Successful atomic FEFO checkout
  const batchToOrder = dataWorkstation.batches[0];
  const orderPayload = {
    retailer_id: careChemist.id,
    distributor_id: medLife.id,
    generation_mode: 'RETAILER_SELECTED',
    items: [
      {
        batch_id: batchToOrder.id,
        master_product_id: batchToOrder.master_product_id,
        brand_name: batchToOrder.brand_name,
        batch_number: batchToOrder.batch_number,
        pack_size: batchToOrder.pack_size || '10 Tablets',
        unit_ptr: Number(batchToOrder.ptr),
        gst_pct: Number(batchToOrder.gst_percentage || 12),
        quantity: Math.max(5, batchToOrder.moq || 1),
        distributor_id: medLife.id,
        distributor_name: medLife.trade_name,
      },
    ],
  };

  const resCheckout = await fetch(`${BASE_URL}/api/orders/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderPayload),
  });
  assert.equal(resCheckout.status, 200, 'Checkout must succeed with HTTP 200');
  const dataCheckout = await resCheckout.json();
  assert.ok(dataCheckout.success, 'Checkout response must indicate success');
  assert.ok(dataCheckout.order_id, 'Must return created order_id');
  assert.ok(dataCheckout.order_number, 'Must return order_number (e.g. ORD-...)');
  assert.ok(Number(dataCheckout.grand_total) > 0, 'Grand total must be positive');
  console.log(`  ✓ Order created successfully: ${dataCheckout.order_number} (Total: ₹${Number(dataCheckout.grand_total).toFixed(2)}).`);
  passedCount++;

  const createdOrderId = dataCheckout.order_id;

  // 7. Order Lifecycle Transitions: ACCEPTED -> DISPATCHED (Auto-generates Invoice)
  console.log('\n[2.7] Testing Order Lifecycle State Machine & Auto-Invoicing...');

  // Accept order
  const resAccept = await fetch(`${BASE_URL}/api/orders/${createdOrderId}/status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      status: 'ACCEPTED',
      accepted_items: [{ item_id: dataCheckout.items?.[0]?.id, accepted_qty: orderPayload.items[0].quantity }],
    }),
  });
  assert.equal(resAccept.status, 200, 'Order accept should return HTTP 200');
  console.log('  ✓ State transition: AWAITING_DISTRIBUTOR_CONFIRMATION → ACCEPTED.');

  // Dispatch order (Triggers GST Invoice Creation)
  const resDispatch = await fetch(`${BASE_URL}/api/orders/${createdOrderId}/status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'DISPATCHED' }),
  });
  assert.equal(resDispatch.status, 200, 'Order dispatch should return HTTP 200');
  console.log('  ✓ State transition: ACCEPTED → DISPATCHED (Automated GST Tax Invoice Generated).');
  passedCount++;

  // 8. GET /api/invoices/[id] (GST Rule 46 Verification)
  console.log('\n[2.8] Testing GET /api/invoices/[id] (Rule 46 Invoice Breakdown)...');
  const resInvoice = await fetch(`${BASE_URL}/api/invoices/${createdOrderId}`);
  assert.equal(resInvoice.status, 200, 'Invoice API should return HTTP 200');
  const dataInvoice = await resInvoice.json();
  assert.ok(dataInvoice.success, 'Invoice response must be success');
  assert.ok(dataInvoice.invoice, 'Must return invoice object');

  const inv = dataInvoice.invoice;
  assert.ok(inv.invoice_number, 'Must have official invoice number (e.g. INV-...)');
  assert.equal(inv.seller_legal_name, medLife.legal_name, 'Seller must be fulfilling distributor');
  assert.equal(inv.buyer_legal_name, careChemist.legal_name, 'Buyer must be registered retailer');
  assert.ok(Number(inv.total_invoice_amount) > 0, 'Total invoice amount must be positive');
  assert.ok(Number(inv.cgst_amount) >= 0, 'CGST must be non-negative');
  assert.ok(Number(inv.sgst_amount) >= 0, 'SGST must be non-negative');
  console.log(`  ✓ Rule 46 Tax Invoice verified: ${inv.invoice_number} issued by ${inv.seller_legal_name} to ${inv.buyer_legal_name}.`);
  passedCount++;

  // 9. GET /api/ledger & POST /api/ledger/payment (Credit Utilization & UPI Settlement)
  console.log('\n[2.9] Testing Credit Ledger & Payment Settlements...');
  const resLedger = await fetch(`${BASE_URL}/api/ledger?retailer_id=${careChemist.id}`);
  assert.equal(resLedger.status, 200, 'Ledger API should return HTTP 200');
  const dataLedger = await resLedger.json();
  assert.ok(dataLedger.success, 'Ledger response must be success');
  assert.ok(Array.isArray(dataLedger.links), 'Ledger must return commercial links array');
  assert.ok(dataLedger.links.length >= 1, 'Care Chemist should have commercial link with stockist');

  const medLifeLink = dataLedger.links.find((l) => l.distributor_id === medLife.id);
  assert.ok(medLifeLink, 'Commercial credit link to MedLife must exist');
  assert.ok(Number(medLifeLink.credit_limit) > 0, 'Credit limit must be positive');
  console.log(`  ✓ Ledger: Credit limit ₹${medLifeLink.credit_limit}, Outstanding ₹${medLifeLink.current_outstanding}, Credit days: ${medLifeLink.credit_days}d.`);

  // Record a payment settlement
  const resPayment = await fetch(`${BASE_URL}/api/ledger/payment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      retailer_id: careChemist.id,
      distributor_id: medLife.id,
      amount: 250.0,
      payment_method: 'UPI',
      transaction_ref: `UPI-TEST-${Date.now().toString().slice(-6)}`,
    }),
  });
  assert.equal(resPayment.status, 200, 'Payment settlement should return HTTP 200');
  const dataPayment = await resPayment.json();
  assert.ok(dataPayment.success, 'Payment response must indicate success');
  console.log('  ✓ Payment of ₹250.00 via UPI recorded; ledger updated.');
  passedCount++;

  // 10. POST /api/catalog/bulk-csv (CSV Staging Parser & Error Reporting)
  console.log('\n[2.10] Testing POST /api/catalog/bulk-csv (Bulk Ingestion Engine)...');
  const sampleCsvRows = [
    {
      sku_code: 'MED-TELM-40',
      batch_number: 'BT-TELM-TEST-1',
      expiry_date: '2027-12-31',
      mrp: 110.0,
      ptr: 78.5,
      available_qty: 200,
      moq: 5,
      scheme_description: '10+1 Free',
    },
    {
      sku_code: 'INVALID-UNKNOWN-SKU',
      batch_number: 'BT-FAIL-1',
      expiry_date: '2027-06-30',
      mrp: 50.0,
      ptr: 35.0,
      available_qty: 100,
      moq: 10,
    },
  ];

  const resCsv = await fetch(`${BASE_URL}/api/catalog/bulk-csv`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      distributor_id: medLife.id,
      rows: sampleCsvRows,
    }),
  });
  assert.equal(resCsv.status, 200, 'Bulk CSV API should return HTTP 200');
  const dataCsv = await resCsv.json();
  assert.ok(dataCsv.success, 'CSV processing should return success object');
  assert.equal(dataCsv.success_count, 1, 'Should recognize exactly 1 valid SKU row');
  assert.equal(dataCsv.failed_count, 1, 'Should catch exactly 1 invalid SKU row (INVALID-UNKNOWN-SKU)');
  console.log(`  ✓ CSV Parser correctly staged ${dataCsv.success_count} valid row and flagged ${dataCsv.failed_count} unmapped SKU row.`);
  passedCount++;

  console.log(`\n🎉 Suite 2 Complete: ${passedCount}/${passedCount} HTTP API integration tests passed!`);
  return { passed: true, count: passedCount };
}

// Allow direct execution
if (!process.env.RUN_AS_SUITE || process.argv[1]?.includes('api-integration')) {
  runApiIntegrationTests().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
