import assert from 'node:assert/strict';

export async function runPharmaRegulatoryTests() {
  console.log('\n============================================================');
  console.log('🧪 SUITE 3: Pharma Regulatory Rules, GST & Replenishment Math');
  console.log('============================================================');

  let passedCount = 0;

  // ---------------------------------------------------------------------------
  // [3.1] Drug Licensing Guardrail (Drugs & Cosmetics Act 1940 / Rule 65)
  // ---------------------------------------------------------------------------
  console.log('\n[3.1] Testing Drug Licensing Guardrails (Rule 65 & Section 18c)...');

  const checkCompliance = (retailer, productSchedule) => {
    const restrictedSchedules = ['SCHEDULE_H', 'SCHEDULE_H1', 'SCHEDULE_X'];
    if (!restrictedSchedules.includes(productSchedule)) {
      return { allowed: true, reason: 'Non-restricted category / OTC' };
    }

    if (!retailer.drug_license_no_20 || !retailer.drug_license_no_21) {
      return {
        allowed: false,
        reason: 'Missing State Drug License Form 20 or 21 on file',
      };
    }

    if (retailer.kyc_state !== 'APPROVED') {
      return {
        allowed: false,
        reason: `Retailer KYC state is ${retailer.kyc_state}. Must be APPROVED.`,
      };
    }

    if (retailer.dl_valid_until && new Date(retailer.dl_valid_until) < new Date()) {
      return {
        allowed: false,
        reason: 'State Drug License has expired',
      };
    }

    return { allowed: true, reason: 'Valid Drug License verified' };
  };

  const approvedPharmacy = {
    trade_name: 'Care Chemist',
    drug_license_no_20: 'TG/HYD/20/2021/6541',
    drug_license_no_21: 'TG/HYD/21/2021/6542',
    dl_valid_until: '2028-12-31',
    kyc_state: 'APPROVED',
  };

  const expiredPharmacy = {
    trade_name: 'City Medico',
    drug_license_no_20: 'TG/HYD/20/2018/1122',
    drug_license_no_21: 'TG/HYD/21/2018/1123',
    dl_valid_until: '2024-01-01', // Expired
    kyc_state: 'APPROVED',
  };

  const fmcgStore = {
    trade_name: 'Krishna Super Store',
    drug_license_no_20: null,
    drug_license_no_21: null,
    kyc_state: 'APPROVED',
  };

  // Schedule H check
  assert.equal(checkCompliance(approvedPharmacy, 'SCHEDULE_H').allowed, true);
  assert.equal(checkCompliance(expiredPharmacy, 'SCHEDULE_H').allowed, false);
  assert.equal(checkCompliance(fmcgStore, 'SCHEDULE_H').allowed, false);

  // Schedule H1 check
  assert.equal(checkCompliance(approvedPharmacy, 'SCHEDULE_H1').allowed, true);
  assert.equal(checkCompliance(fmcgStore, 'SCHEDULE_H1').allowed, false);

  // OTC / FMCG check
  assert.equal(checkCompliance(fmcgStore, 'OTC').allowed, true);
  assert.equal(checkCompliance(fmcgStore, 'NON_PHARMA').allowed, true);

  console.log('  ✓ Section 18(c) compliance verified: Approved DL, expired DL, and FMCG store guardrails enforced.');
  passedCount++;

  // ---------------------------------------------------------------------------
  // [3.2] Indian GST Rule 46 Intra-State vs Inter-State Tax Engine
  // ---------------------------------------------------------------------------
  console.log('\n[3.2] Testing Indian GST Rule 46 Tax Formula (Intra vs Inter-State)...');

  const computeGST = ({ sellerState, buyerState, lines }) => {
    const isInterState = sellerState.trim().toLowerCase() !== buyerState.trim().toLowerCase();
    let taxableValue = 0;
    let cgstAmount = 0;
    let sgstAmount = 0;
    let igstAmount = 0;

    lines.forEach((line) => {
      const lineTaxable = Number(line.ptr) * Number(line.quantity) * (1 - Number(line.discount_pct || 0) / 100);
      const gstRate = Number(line.gst_percentage) / 100;
      taxableValue += lineTaxable;

      if (isInterState) {
        igstAmount += lineTaxable * gstRate;
      } else {
        cgstAmount += lineTaxable * (gstRate / 2);
        sgstAmount += lineTaxable * (gstRate / 2);
      }
    });

    const totalTax = cgstAmount + sgstAmount + igstAmount;
    const totalPayable = taxableValue + totalTax;

    return {
      isInterState,
      taxableValue: Number(taxableValue.toFixed(2)),
      cgstAmount: Number(cgstAmount.toFixed(2)),
      sgstAmount: Number(sgstAmount.toFixed(2)),
      igstAmount: Number(igstAmount.toFixed(2)),
      totalTax: Number(totalTax.toFixed(2)),
      totalPayable: Number(totalPayable.toFixed(2)),
    };
  };

  const sampleLines = [
    { brand: 'Telma-AM', ptr: 167.85, quantity: 10, discount_pct: 5, gst_percentage: 12 }, // 167.85 * 10 * 0.95 = 1594.575
    { brand: 'Eno Fruit Salt', ptr: 138.0, quantity: 6, discount_pct: 0, gst_percentage: 18 }, // 138 * 6 = 828
  ];

  // Case A: Intra-state (Telangana -> Telangana): CGST 50% + SGST 50%
  const intraGst = computeGST({
    sellerState: 'Telangana',
    buyerState: 'Telangana',
    lines: sampleLines,
  });
  assert.equal(intraGst.isInterState, false, 'Should be intra-state');
  assert.equal(intraGst.igstAmount, 0, 'Intra-state IGST must be 0');
  assert.equal(intraGst.cgstAmount, intraGst.sgstAmount, 'CGST must equal SGST in intra-state');
  assert.ok(Math.abs(intraGst.taxableValue - 2422.58) <= 0.05, 'Taxable value should match ₹2422.58');
  assert.ok(Math.abs(intraGst.totalPayable - 2762.96) <= 0.05, 'Total payable should match ₹2762.96');
  console.log(`  ✓ Intra-state GST (Telangana → Telangana): Taxable ₹${intraGst.taxableValue}, CGST ₹${intraGst.cgstAmount}, SGST ₹${intraGst.sgstAmount}, Total ₹${intraGst.totalPayable}.`);

  // Case B: Inter-state (Telangana -> Andhra Pradesh): IGST 100%
  const interGst = computeGST({
    sellerState: 'Telangana',
    buyerState: 'Andhra Pradesh',
    lines: sampleLines,
  });
  assert.equal(interGst.isInterState, true, 'Should be inter-state');
  assert.equal(interGst.cgstAmount, 0, 'Inter-state CGST must be 0');
  assert.equal(interGst.sgstAmount, 0, 'Inter-state SGST must be 0');
  assert.ok(Math.abs(interGst.igstAmount - (intraGst.cgstAmount + intraGst.sgstAmount)) <= 0.05, 'IGST must equal CGST + SGST total');
  assert.ok(Math.abs(interGst.totalPayable - intraGst.totalPayable) <= 0.05, 'Total payable must match intra-state total');
  console.log(`  ✓ Inter-state GST (Telangana → Andhra Pradesh): IGST ₹${interGst.igstAmount}, CGST ₹0, SGST ₹0, Total ₹${interGst.totalPayable}.`);
  passedCount++;

  // ---------------------------------------------------------------------------
  // [3.3] Free Goods Trade Scheme Arithmetic (e.g. 10+1 Free) & Net Landing Price
  // ---------------------------------------------------------------------------
  console.log('\n[3.3] Testing Trade Scheme Arithmetic (Buy 10 Get 1 Free)...');

  const calculateEffectiveNetLandingPrice = ({ ptr, gstPct, discountPct, schemeBase, schemeFree, orderQty }) => {
    let freeQty = 0;
    if (schemeBase && schemeFree && schemeBase > 0) {
      freeQty = Math.floor(orderQty / schemeBase) * schemeFree;
    }

    const billedQty = orderQty;
    const totalReceivedQty = billedQty + freeQty;

    const billedAmount = billedQty * ptr * (1 - (discountPct || 0) / 100);
    const taxAmount = billedAmount * (gstPct / 100);
    const totalOutflow = billedAmount + taxAmount;

    // Effective Net Landing Price per piece
    const netLandingPricePerUnit = totalOutflow / totalReceivedQty;

    return {
      billedQty,
      freeQty,
      totalReceivedQty,
      totalOutflow: Number(totalOutflow.toFixed(2)),
      netLandingPricePerUnit: Number(netLandingPricePerUnit.toFixed(2)),
    };
  };

  // 20 units ordered with scheme: 10 + 1 Free
  const schemeResult = calculateEffectiveNetLandingPrice({
    ptr: 24.39, // Dolo 650
    gstPct: 12,
    discountPct: 5, // 5% extra cash discount
    schemeBase: 10,
    schemeFree: 1,
    orderQty: 20,
  });

  assert.equal(schemeResult.billedQty, 20, 'Billed quantity should be 20');
  assert.equal(schemeResult.freeQty, 2, 'Free quantity should be 2 (20 / 10 * 1)');
  assert.equal(schemeResult.totalReceivedQty, 22, 'Total units received should be 22');
  assert.ok(
    schemeResult.netLandingPricePerUnit < 24.39,
    'Effective net landing price per unit must be significantly below standard PTR due to free units and cash discount'
  );
  console.log(`  ✓ Scheme math verified: Ordered 20, got 2 free (22 total). Standard PTR: ₹24.39 → Effective Net Landing: ₹${schemeResult.netLandingPricePerUnit}/unit.`);
  passedCount++;

  // ---------------------------------------------------------------------------
  // [3.4] Auto-Replenishment Velocity & MOQ Pack Snapping Formula (TRD Section 4)
  // ---------------------------------------------------------------------------
  console.log('\n[3.4] Testing Auto-Replenishment Velocity & MOQ Pack Snapping Formula...');

  const calculateAutoReplenish = ({ avgDailySales, leadTimeDays, safetyBufferDays, currentStock, inTransit, moq, minThreshold }) => {
    const targetStock = Math.round(avgDailySales * (leadTimeDays + safetyBufferDays));
    const effectiveStock = currentStock + (inTransit || 0);
    const rawDeficit = Math.max(0, targetStock - effectiveStock);

    let suggestedQty = 0;
    if (rawDeficit > 0) {
      suggestedQty = Math.ceil(rawDeficit / moq) * moq;
    }

    const urgency = effectiveStock <= minThreshold ? 'CRITICAL' : 'NORMAL';

    return { targetStock, rawDeficit, suggestedQty, urgency };
  };

  // Scenario 1: Critical stock deficit
  const rep1 = calculateAutoReplenish({
    avgDailySales: 12.0,
    leadTimeDays: 2,
    safetyBufferDays: 2, // Target: 12 * 4 = 48
    currentStock: 8,
    inTransit: 0,
    moq: 10,
    minThreshold: 15,
  });

  assert.equal(rep1.targetStock, 48, 'Target stock should be 48');
  assert.equal(rep1.rawDeficit, 40, 'Deficit should be 40 (48 - 8)');
  assert.equal(rep1.suggestedQty, 40, 'Suggested qty should snap to multiple of MOQ 10');
  assert.equal(rep1.urgency, 'CRITICAL', 'Stock 8 <= threshold 15 must be CRITICAL');

  // Scenario 2: Deficit requiring round-up snap
  const rep2 = calculateAutoReplenish({
    avgDailySales: 7.5,
    leadTimeDays: 2,
    safetyBufferDays: 1, // Target: 7.5 * 3 = 23
    currentStock: 10,
    inTransit: 0,
    moq: 6,
    minThreshold: 8,
  });

  assert.equal(rep2.targetStock, 23);
  assert.equal(rep2.rawDeficit, 13);
  assert.equal(rep2.suggestedQty, 18, 'Deficit of 13 must snap UP to next MOQ multiple of 6 (18 units)');
  assert.equal(rep2.urgency, 'NORMAL');

  // Scenario 3: Healthy stock (zero deficit)
  const rep3 = calculateAutoReplenish({
    avgDailySales: 5.0,
    leadTimeDays: 2,
    safetyBufferDays: 2, // Target: 20
    currentStock: 25,
    inTransit: 0,
    moq: 5,
    minThreshold: 10,
  });

  assert.equal(rep3.suggestedQty, 0, 'Healthy stock should generate 0 suggested order');
  console.log('  ✓ Replenishment engine verified across critical deficits, pack multiple snapping, and zero-order buffers.');
  passedCount++;

  // ---------------------------------------------------------------------------
  // [3.5] Multi-Factor Smart Distributor Scoring Algorithm (TRD Section 3)
  // ---------------------------------------------------------------------------
  console.log('\n[3.5] Testing Multi-Factor Smart Distributor Scoring Algorithm...');

  const scoreDistributor = (dist, weights) => {
    // Weights default: preferred: 30, fill_rate: 35, price: 20, reliability: 15
    const preferredPts = dist.is_preferred ? weights.preferred : 0;
    const fillRatePts = (dist.fill_rate / 100) * weights.fill_rate;
    const pricePts = (dist.price_competitiveness / 100) * weights.price;
    const reliabilityPts = (dist.reliability_score / 100) * weights.reliability;

    return Number((preferredPts + fillRatePts + pricePts + reliabilityPts).toFixed(2));
  };

  const weights = { preferred: 30, fill_rate: 35, price: 20, reliability: 15 };

  const distA = {
    name: 'Distributor A (Preferred, 100% Fill Rate, High Reliability)',
    is_preferred: true,
    fill_rate: 100,
    price_competitiveness: 85,
    reliability_score: 98,
  };

  const distB = {
    name: 'Distributor B (Non-Preferred, 60% Fill Rate, Low Price)',
    is_preferred: false,
    fill_rate: 60,
    price_competitiveness: 100,
    reliability_score: 90,
  };

  const scoreA = scoreDistributor(distA, weights);
  const scoreB = scoreDistributor(distB, weights);

  // Score A: 30 + 35 + 17 + 14.7 = 96.7
  // Score B: 0 + 21 + 20 + 13.5 = 54.5
  assert.ok(scoreA > scoreB, 'Distributor A should rank higher due to preferred status and 100% fill rate');
  assert.ok(scoreA >= 90, `Distributor A score should be >= 90 (got ${scoreA})`);
  console.log(`  ✓ Distributor scoring formula verified: ${distA.name} [Score: ${scoreA}] vs ${distB.name} [Score: ${scoreB}].`);
  passedCount++;

  console.log(`\n🎉 Suite 3 Complete: ${passedCount}/${passedCount} regulatory & mathematical rule tests passed!`);
  return { passed: true, count: passedCount };
}

// Allow direct execution
if (!process.env.RUN_AS_SUITE || process.argv[1]?.includes('pharma-regulatory-rules')) {
  runPharmaRegulatoryTests().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
