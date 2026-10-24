import assert from 'node:assert';
import { validateGstinOffline, calculateGstinChecksum } from '../src/lib/verification/gstinValidator.ts';
import { validateDrugLicense } from '../src/lib/verification/drugLicenseValidator.ts';
import { validateDoctorCredentials } from '../src/lib/verification/doctorNmcValidator.ts';
import { detectReplenishmentSpike } from '../src/lib/replenishment/anomalyDetector.ts';
import { generateMargOrderFile, generateProfitMakerOrderFile } from '../src/lib/erp/margProfitMakerBridge.ts';
import { brandSkuCache } from '../src/lib/cache/brandSkuCache.ts';

console.log('============================================================');
console.log('🧪 VERIFYING 6 USER REQUIREMENTS & BUSINESS RULE LOGIC');
console.log('============================================================\n');

// 1. GSTIN Validation & Mod 36 Checksum Test
console.log('[1] Testing GSTIN Offline Validation & Mod 36 Checksum...');
const validGstin = '36AABCM1234F1ZY';
const checkGstin1 = validateGstinOffline(validGstin);
assert.strictEqual(checkGstin1.isValid, true, 'Valid GSTIN should pass offline check');
assert.strictEqual(checkGstin1.stateCode, '36', 'State code should be 36 (Telangana)');
assert.strictEqual(checkGstin1.pan, 'AABCM1234F', 'PAN extracted correctly');
assert.strictEqual(checkGstin1.isChecksumValid, true, 'Mod 36 checksum verified');

// Test invalid checksum digit (ending in 8 instead of Y)
const invalidChecksumGstin = '36AABCM1234F1Z8';
const checkGstin2 = validateGstinOffline(invalidChecksumGstin);
assert.strictEqual(checkGstin2.isValid, false, 'Invalid checksum should fail');
assert.strictEqual(checkGstin2.isChecksumValid, false, 'Checksum flag false');
console.log('  ✓ GSTIN Mod-36 Checksum & State parsing verified with zero API token calls.\n');

// 2. Drug License Form 20/21 & 20B/21B Multi-State Test
console.log('[2] Testing Drug License Classification (Form 20/21 vs 20B/21B)...');
const retailDl = validateDrugLicense('TS/HYD/20/12456', 'TS', '2028-12-31');
assert.strictEqual(retailDl.isValid, true);
assert.strictEqual(retailDl.formType, 'FORM_20');
assert.strictEqual(retailDl.tierType, 'RETAIL_CHEMIST');

const wholesaleDl = validateDrugLicense('MH-TZ1-20B-334125', 'MH', '2028-12-31');
assert.strictEqual(wholesaleDl.isValid, true);
assert.strictEqual(wholesaleDl.formType, 'FORM_20B');
assert.strictEqual(wholesaleDl.tierType, 'WHOLESALE_STOCKIST');

// Test expired DL
const expiredDl = validateDrugLicense('TS/HYD/20/12456', 'TS', '2020-01-01');
assert.strictEqual(expiredDl.isValid, false);
assert.strictEqual(expiredDl.isExpired, true);
console.log('  ✓ State DCA Form 20/21 & 20B/21B classification and Rule 65 expiry guardrails verified.\n');

// 3. Doctor NMC / SMC Registration Test
console.log('[3] Testing Doctor NMC & State Medical Council (SMC) UID Verification...');
const docCheck = validateDoctorCredentials({
  nmcUid: 'NMR-2019-TSMC-88214',
  smcCode: 'TSMC',
  registrationNumber: '88214',
  registrationYear: 2019,
  doctorName: 'Dr. Rajesh Sharma, MD',
});
assert.strictEqual(docCheck.isValid, true);
assert.strictEqual(docCheck.status, 'ACTIVE');
assert.strictEqual(docCheck.canPrescribeScheduleH_H1_X, true);
assert.strictEqual(docCheck.smcCode, 'TSMC');
console.log('  ✓ Doctor NMC/NMR registration UID and Schedule H/H1/X prescribing authority verified.\n');

// 4. Marg ERP and ProfitMaker On-Premise Bridge Test
console.log('[4] Testing Marg ERP (.ORD) & ProfitMaker (.CSV) File Generation...');
const sampleOrder = {
  orderNumber: 'ORD-2026-9901',
  orderDate: '2026-10-24',
  retailerName: 'Care Chemist Hyderabad',
  retailerMargCode: 'CARE001',
  retailerGstin: '36AABCM1234F1Z8',
  retailerDrugLicense: 'TS/HYD/20/12456',
  distributorName: 'MedLife Wholesale',
  totalAmount: 2762.96,
  items: [
    {
      skuCode: 'MED-DOLO-650',
      brandName: 'Dolo 650 Tablet',
      batchNumber: 'DL24B02',
      quantity: 40,
      freeSchemeQty: 4,
      ptr: 24.39,
      mrp: 34.15,
      discountPct: 0,
      gstPct: 12,
    },
  ],
};

const margOrd = generateMargOrderFile(sampleOrder);
assert.ok(margOrd.includes('[HEADER]'));
assert.ok(margOrd.includes('CARE001'));
assert.ok(margOrd.includes('MED-DOLO-650'));
assert.ok(margOrd.includes('[END_ORDER]'));

const profitMakerCsv = generateProfitMakerOrderFile(sampleOrder);
assert.ok(profitMakerCsv.includes('H,"ORD-2026-9901"'));
assert.ok(profitMakerCsv.includes('D,"ORD-2026-9901","MED-DOLO-650"'));
console.log('  ✓ Native Marg ERP .ORD and ProfitMaker inward formats generated successfully.\n');

// 5. Replenishment Anomaly & Outlier Spike Detection (3-4 Month Patient Orders)
console.log('[5] Testing Anomaly & Outlier Spike Detection for Chronic Patient Refills...');
const spikeAnalysis = detectReplenishmentSpike({
  brandName: 'Glycomet-GP 2 Tablet',
  currentStock: 4,
  minThreshold: 10,
  targetStock: 50,
  avgDailySales: 12.0, // Inflated by one-time 45 unit purchase
  leadTimeDays: 2,
  safetyBufferDays: 2,
  unitPtr: 110.0,
  recentTransactions: [
    { date: '2026-10-23', qty: 2 },
    { date: '2026-10-22', qty: 1 },
    { date: '2026-10-21', qty: 45, customerType: 'CHRONIC_PATIENT_3M_REFILL' }, // Outlier!
    { date: '2026-10-20', qty: 2 },
  ],
});

assert.strictEqual(spikeAnalysis.isSpikeDetected, true, 'Spike should be detected');
assert.strictEqual(spikeAnalysis.anomalyType, 'CHRONIC_PATIENT_BULK_PURCHASE');
assert.ok(spikeAnalysis.rawSuggestedQty > spikeAnalysis.dampenedSuggestedQty, 'Dampened suggested qty should be lower than raw');
assert.ok(spikeAnalysis.capitalAtRisk > 0, 'Capital at risk calculated');
console.log(`  ✓ Spike detected: Raw suggested = ${spikeAnalysis.rawSuggestedQty} vs Recommended dampened = ${spikeAnalysis.dampenedSuggestedQty}`);
console.log(`  ✓ Protected Chemist working capital: ₹${spikeAnalysis.capitalAtRisk.toLocaleString('en-IN')}\n`);

// 6. Client Brand & SKU Local Cache Hierarchy
console.log('[6] Testing Client Brand & SKU Local Cache Hierarchy (DOLO, AZITHRAL, PAN)...');
const searchResults = brandSkuCache.searchLocal('DOLO');
assert.ok(searchResults.length > 0, 'DOLO brand found in local memory');
const doloBrand = searchResults[0].brand;
assert.strictEqual(doloBrand.brandName, 'DOLO');
assert.ok(doloBrand.skus.length >= 4, 'DOLO has 650mg, 325mg, 125mg DT tab and 125mg syrup');

const dolo650 = doloBrand.skus.find((s) => s.strength === '650mg');
const doloSyrup = doloBrand.skus.find((s) => s.form === 'Syrup');
assert.ok(dolo650, 'DOLO 650mg tablet exists in SKU hierarchy');
assert.ok(doloSyrup, 'DOLO 125mg Syrup exists in SKU hierarchy');
console.log(`  ✓ Local brand hierarchy verified: DOLO parent contains ${doloBrand.skus.map((s) => s.strength + ' ' + s.form).join(', ')} with zero server roundtrips.\n`);

console.log('🎉 ALL 6 USER REQUIREMENTS & BUSINESS RULE VALIDATION TESTS PASSED 100%!');
