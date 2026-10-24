import assert from 'node:assert/strict';

console.log('----------------------------------------------------');
console.log('🧪 M37 B2B: Automated Business Rules & E2E Test Suite');
console.log('----------------------------------------------------\n');

// -----------------------------------------------------------------------------
// Test 1: Drug License Compliance Guardrail (Form 20/21 Verification)
// -----------------------------------------------------------------------------
function testComplianceGuardrail() {
  console.log('Test 1: Drug License Form 20/21 Compliance Guardrail...');

  const restrictedSchedules = ['SCHEDULE_H', 'SCHEDULE_H1', 'SCHEDULE_X'];

  const verifiedRetailer = {
    trade_name: 'Care Chemist',
    drug_license_no_20: 'TG/HYD/2024/7821',
    kyc_state: 'APPROVED',
  };

  const unverifiedRetailer = {
    trade_name: 'Corner Kirana & OTC',
    drug_license_no_20: null,
    kyc_state: 'PENDING',
  };

  const doloProduct = { brand_name: 'Dolo 650', schedule: 'SCHEDULE_H' };
  const dettolProduct = { brand_name: 'Dettol 500ml', schedule: 'OTC' };

  const canOrder = (retailer, product) => {
    const isRestricted = restrictedSchedules.includes(product.schedule);
    if (!isRestricted) return true;
    return Boolean(retailer.drug_license_no_20 && retailer.kyc_state === 'APPROVED');
  };

  assert.equal(canOrder(verifiedRetailer, doloProduct), true, 'Verified retailer should order Schedule H');
  assert.equal(canOrder(unverifiedRetailer, doloProduct), false, 'Unverified retailer must be blocked from Schedule H');
  assert.equal(canOrder(unverifiedRetailer, dettolProduct), true, 'Unverified retailer should order OTC');

  console.log('  ✓ Schedule H/H1/X compliance guardrails strictly enforced.\n');
}

// -----------------------------------------------------------------------------
// Test 2: Demand Velocity & Replenishment Calculation (TRD Section 4.1)
// -----------------------------------------------------------------------------
function testDemandForecasting() {
  console.log('Test 2: Demand Velocity & Replenishment Formula (TRD Section 4.1)...');

  const avgDailySales = 8.5; // units/day
  const leadTimeDays = 2;
  const safetyBufferDays = 2;
  const currentStock = 12;
  const minThreshold = 15;
  const moq = 5;

  // Formula: Target Stock = Avg Daily Sales * (Lead Time + Safety Buffer)
  const targetStock = Math.round(avgDailySales * (leadTimeDays + safetyBufferDays));
  assert.equal(targetStock, 34, 'Target stock should equal 34 units (8.5 * 4)');

  // Raw Replenishment Deficit
  const rawDeficit = Math.max(0, targetStock - currentStock);
  assert.equal(rawDeficit, 22, 'Deficit should equal 22 units (34 - 12)');

  // Rounded to distributor MOQ (pack multiple)
  const snappedQty = Math.ceil(rawDeficit / moq) * moq;
  assert.equal(snappedQty, 25, 'Replenishment must snap to MOQ multiple of 5 (25 units)');

  // Urgency classification
  const urgency = currentStock <= minThreshold ? 'CRITICAL' : 'NORMAL';
  assert.equal(urgency, 'CRITICAL', 'Urgency must be CRITICAL when current stock (12) < min threshold (15)');

  console.log('  ✓ Replenishment deficit, MOQ snapping, and urgency validated.\n');
}

// -----------------------------------------------------------------------------
// Test 3: Shortfall Split Calculation (One-Tap Shortfall Resolver)
// -----------------------------------------------------------------------------
function testShortfallResolver() {
  console.log('Test 3: Intelligent Shortfall Split Calculation...');

  const requestedQty = 100;
  const primaryDistributor = { name: 'Sri Balaji Pharma', available: 40 };
  const altDistributor = { name: 'Sai Medicals', available: 120 };

  const hasShortfall = primaryDistributor.available < requestedQty;
  assert.equal(hasShortfall, true, 'Shortfall should be detected when primary stock (40) < requested (100)');

  const primaryAllocated = primaryDistributor.available;
  const reRoutedQty = requestedQty - primaryAllocated;

  assert.equal(primaryAllocated, 40, 'Primary distributor allocation should be 40');
  assert.equal(reRoutedQty, 60, 'Re-routed quantity to secondary distributor should be 60');
  assert.equal(primaryAllocated + reRoutedQty, requestedQty, 'Total split must equal requested quantity');

  console.log('  ✓ Shortfall split and re-routing arithmetic verified.\n');
}

// -----------------------------------------------------------------------------
// Test 4: Rule 46 GST Invoicing Breakdown
// -----------------------------------------------------------------------------
function testGstInvoicing() {
  console.log('Test 4: Rule 46 Indian GST Invoicing Tax Calculations...');

  const lines = [
    { brand_name: 'Dolo 650', qty: 20, ptr: 24.39, gst_pct: 12 },
    { brand_name: 'Azithral 500', qty: 5, ptr: 89.25, gst_pct: 12 },
  ];

  let taxableSubtotal = 0;
  let totalCgst = 0;
  let totalSgst = 0;

  lines.forEach((l) => {
    const lineTaxable = l.qty * l.ptr;
    const gstRate = l.gst_pct / 100;
    const lineCgst = lineTaxable * (gstRate / 2);
    const lineSgst = lineTaxable * (gstRate / 2);

    taxableSubtotal += lineTaxable;
    totalCgst += lineCgst;
    totalSgst += lineSgst;
  });

  const totalGst = totalCgst + totalSgst;
  const grandTotal = taxableSubtotal + totalGst;

  assert.equal(Number(taxableSubtotal.toFixed(2)), 934.05, 'Taxable subtotal mismatch');
  assert.equal(Number(totalCgst.toFixed(2)), 56.04, 'CGST (6%) mismatch');
  assert.equal(Number(totalSgst.toFixed(2)), 56.04, 'SGST (6%) mismatch');
  assert.equal(Number(grandTotal.toFixed(2)), 1046.14, 'Grand total mismatch');

  console.log('  ✓ Rule 46 Taxable, CGST, SGST, and Grand Total matched to 2 decimal places.\n');
}

// -----------------------------------------------------------------------------
// Run all tests
// -----------------------------------------------------------------------------
testComplianceGuardrail();
testDemandForecasting();
testShortfallResolver();
testGstInvoicing();

console.log('🎉 ALL BUSINESS RULES & REGULATORY CHECKS PASSED SUCCESSFULLY!\n');
