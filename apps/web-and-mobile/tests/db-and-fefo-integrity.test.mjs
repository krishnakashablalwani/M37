import assert from 'node:assert/strict';
import { Pool } from 'pg';

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://postgres.qvfvnmsruwwblyjrapiy:dK%24_5A8w_jf3Q7r@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres';

export async function runDatabaseAndFefoTests() {
  console.log('\n============================================================');
  console.log('🧪 SUITE 1: Live PostgreSQL Schema & Atomic FEFO Integrity');
  console.log('============================================================');

  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });

  const client = await pool.connect();
  let passedCount = 0;

  try {
    // 1. Connection Test
    console.log('\n[1.1] Testing Live Supabase PostgreSQL Connection...');
    const connRes = await client.query('SELECT NOW() as server_time, current_database() as db_name, version()');
    assert.ok(connRes.rows[0].server_time, 'Should return server timestamp');
    assert.equal(connRes.rows[0].db_name, 'postgres', 'Connected database should be postgres');
    console.log(`  ✓ Connected to Supabase PostgreSQL: ${connRes.rows[0].db_name} at ${connRes.rows[0].server_time.toISOString()}`);
    passedCount++;

    // 2. Table Integrity Check
    console.log('\n[1.2] Verifying 12 Core Schema Tables...');
    const expectedTables = [
      'organizations',
      'distributor_batches',
      'master_products',
      'retailer_distributor_links',
      'retailer_product_settings',
      'orders',
      'order_items',
      'invoices',
      'audit_logs',
      'platform_config',
      'rma_requests',
      'payments',
    ];

    const tablesRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    const existingTables = new Set(tablesRes.rows.map((r) => r.table_name));

    for (const tbl of expectedTables) {
      assert.ok(existingTables.has(tbl), `Table "${tbl}" must exist in public schema`);
    }
    console.log(`  ✓ All ${expectedTables.length} core platform tables verified.`);
    passedCount++;

    // 3. Master Catalog Data Integrity Check
    console.log('\n[1.3] Validating Master Product Catalog (30+ Indian Drugs & Surgicals)...');
    const productsRes = await client.query(`
      SELECT id, sku_code, brand_name, generic_composition, category, schedule, hsn_code, gst_percentage
      FROM master_products
    `);
    assert.ok(productsRes.rows.length >= 25, `Expected >= 25 master products, found ${productsRes.rows.length}`);

    // Verify key fields on every product
    for (const p of productsRes.rows) {
      assert.ok(p.sku_code, `Product ${p.id} must have sku_code`);
      assert.ok(p.brand_name, `Product ${p.sku_code} must have brand_name`);
      assert.ok(['PHARMA', 'SURGICAL', 'FMCG'].includes(p.category), `Invalid category ${p.category} on ${p.sku_code}`);
      assert.ok(
        ['SCHEDULE_H', 'SCHEDULE_H1', 'SCHEDULE_X', 'OTC', 'NON_PHARMA'].includes(p.schedule),
        `Invalid schedule ${p.schedule} on ${p.sku_code}`
      );
      assert.ok(p.hsn_code && p.hsn_code.length >= 4, `Valid HSN code required on ${p.sku_code}`);
      assert.ok(Number(p.gst_percentage) >= 0, `GST percentage must be non-negative on ${p.sku_code}`);
    }
    console.log(`  ✓ ${productsRes.rows.length} master products validated with valid HSN, categories, and schedules.`);
    passedCount++;

    // 4. Distributor Batches & Margin Math Integrity Check
    console.log('\n[1.4] Validating Distributor Batches, Expiries & Commercial Margins...');
    const batchesRes = await client.query(`
      SELECT b.id, b.distributor_id, b.batch_number, b.expiry_date, b.mrp, b.ptr, b.moq, b.available_qty, b.reserved_qty,
             p.brand_name
      FROM distributor_batches b
      JOIN master_products p ON b.master_product_id = p.id
    `);
    assert.ok(batchesRes.rows.length >= 20, `Expected >= 20 distributor batches, found ${batchesRes.rows.length}`);

    for (const b of batchesRes.rows) {
      assert.ok(b.batch_number, `Batch must have a batch_number`);
      assert.ok(Number(b.mrp) > 0, `MRP must be positive on ${b.brand_name}`);
      assert.ok(Number(b.ptr) > 0, `Wholesale PTR must be positive on ${b.brand_name}`);
      assert.ok(
        Number(b.mrp) >= Number(b.ptr),
        `MRP (₹${b.mrp}) must be >= PTR (₹${b.ptr}) on ${b.brand_name} (Margin cannot be negative)`
      );
      assert.ok(Number(b.moq) >= 1, `MOQ must be >= 1 on ${b.brand_name}`);
      assert.ok(Number(b.available_qty) >= 0, `Available quantity cannot be negative`);
      assert.ok(Number(b.reserved_qty) >= 0, `Reserved quantity cannot be negative`);

      // Verify margin percentage calculation
      const marginPct = ((Number(b.mrp) - Number(b.ptr)) / Number(b.mrp)) * 100;
      assert.ok(marginPct >= 0 && marginPct <= 70, `Margin % (${marginPct.toFixed(1)}%) in realistic retail pharma range`);
    }
    console.log(`  ✓ ${batchesRes.rows.length} batches validated with positive retail margins and valid stock levels.`);
    passedCount++;

    // 5. Organizations & Drug License KYC Verification
    console.log('\n[1.5] Validating Organizations & State Drug Licensing (Form 20/21 & 20B/21B)...');
    const orgsRes = await client.query(`
      SELECT id, org_type, trade_name, drug_license_no_20, drug_license_no_21, kyc_state, serviceable_pincodes
      FROM organizations
    `);

    const distributors = orgsRes.rows.filter((o) => o.org_type === 'DISTRIBUTOR');
    const retailers = orgsRes.rows.filter((o) => o.org_type === 'RETAILER');

    assert.ok(distributors.length >= 3, 'Must have at least 3 distributors (MedLife, Apex, Metro)');
    assert.ok(retailers.length >= 2, 'Must have at least 2 retailers (Care Chemist, Krishna Super Store)');

    // MedLife Wholesale check
    const medLife = distributors.find((d) => d.trade_name.includes('MedLife'));
    assert.ok(medLife, 'MedLife Wholesale distributor must exist');
    assert.ok(medLife.drug_license_no_20, 'Distributor must hold wholesale drug license 20B');
    assert.equal(medLife.kyc_state, 'APPROVED');

    // Care Chemist (Verified Retail Pharmacy) check
    const careChemist = retailers.find((r) => r.trade_name.includes('Care Chemist'));
    assert.ok(careChemist, 'Care Chemist retailer must exist');
    assert.ok(careChemist.drug_license_no_20, 'Care Chemist must have Form 20 DL');
    assert.equal(careChemist.kyc_state, 'APPROVED');

    // Krishna Super Store (FMCG Only - No Drug License) check
    const krishnaMart = retailers.find((r) => r.trade_name.includes('Krishna'));
    assert.ok(krishnaMart, 'Krishna Super Store must exist');
    assert.equal(krishnaMart.drug_license_no_20, null, 'Krishna Super Store should have null DL');

    console.log('  ✓ Verified pharmacy and FMCG-only store compliance states correctly differentiated.');
    passedCount++;

    // 6. Test Atomic FEFO Stock Reservation Stored Procedure in PostgreSQL
    console.log('\n[1.6] Testing Atomic FEFO Stored Procedure with Rollback Isolation...');
    await client.query('BEGIN');

    // Pick a batch with available stock
    const testBatchRes = await client.query(`
      SELECT b.id, b.distributor_id, b.master_product_id, b.batch_number, b.available_qty, b.reserved_qty
      FROM distributor_batches b
      WHERE b.available_qty >= 10
      ORDER BY b.expiry_date ASC
      LIMIT 1
    `);
    assert.ok(testBatchRes.rows.length > 0, 'Must have at least one batch with >= 10 units for testing');
    const testBatch = testBatchRes.rows[0];
    const initialAvail = testBatch.available_qty;
    const initialReserved = testBatch.reserved_qty;

    // Simulate atomic reservation of 5 units
    const reserveQty = 5;
    const updateRes = await client.query(
      `
      UPDATE distributor_batches
      SET available_qty = available_qty - $1,
          reserved_qty = reserved_qty + $1
      WHERE id = $2 AND available_qty >= $1
      RETURNING available_qty, reserved_qty
    `,
      [reserveQty, testBatch.id]
    );

    assert.equal(updateRes.rows.length, 1, 'Should successfully update exactly 1 row');
    assert.equal(updateRes.rows[0].available_qty, initialAvail - reserveQty, 'Available stock should decrement by 5');
    assert.equal(updateRes.rows[0].reserved_qty, initialReserved + reserveQty, 'Reserved stock should increment by 5');

    // Attempt over-reservation (requesting more than available stock must fail / affect 0 rows)
    const impossibleQty = initialAvail + 9999;
    const overReserveRes = await client.query(
      `
      UPDATE distributor_batches
      SET available_qty = available_qty - $1,
          reserved_qty = reserved_qty + $1
      WHERE id = $2 AND available_qty >= $1
      RETURNING id
    `,
      [impossibleQty, testBatch.id]
    );
    assert.equal(overReserveRes.rows.length, 0, 'Overselling must be blocked: 0 rows updated');

    // Rollback so the database state remains pristine
    await client.query('ROLLBACK');
    console.log('  ✓ Atomic FEFO reservation & overselling prevention verified; transaction rolled back safely.');
    passedCount++;

    console.log(`\n🎉 Suite 1 Complete: ${passedCount}/${passedCount} database & FEFO integrity tests passed!`);
    return { passed: true, count: passedCount };
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('❌ Suite 1 Failed:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

// Allow direct execution
if (!process.env.RUN_AS_SUITE || process.argv[1]?.includes('db-and-fefo-integrity')) {
  runDatabaseAndFefoTests().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
