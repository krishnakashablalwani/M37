import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { distributor_id, rows } = body;

    if (!distributor_id) {
      return NextResponse.json(
        { success: false, error: 'distributor_id is required' },
        { status: 400 }
      );
    }

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'rows must be a non-empty array' },
        { status: 400 }
      );
    }

    const errors: Array<{ rowIndex: number; sku_code: string; reason: string }> = [];
    const insertedBatches: any[] = [];

    // Pre-fetch all known master SKU codes
    const masterRows = await query(`SELECT id, sku_code, brand_name FROM master_products`);
    const masterSkuMap = new Map<string, string>();
    masterRows.forEach((m: any) => masterSkuMap.set(m.sku_code.toUpperCase(), m.id));

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const sku = (row.sku_code || '').trim().toUpperCase();
      const batchNo = (row.batch_number || '').trim();
      const expiry = (row.expiry_date || '').trim();
      const mrp = Number(row.mrp);
      const ptr = Number(row.ptr);
      const qty = parseInt(row.available_qty, 10);
      const moq = parseInt(row.moq || '1', 10);
      const discountPct = Number(row.discount_pct || 0);

      // Validation 1: SKU existence
      const masterId = masterSkuMap.get(sku);
      if (!masterId) {
        errors.push({
          rowIndex: i + 1,
          sku_code: sku,
          reason: `SKU '${sku}' not found in Admin Master Catalog. Submit SKU creation request first.`,
        });
        continue;
      }

      // Validation 2: Batch & Expiry
      if (!batchNo) {
        errors.push({
          rowIndex: i + 1,
          sku_code: sku,
          reason: 'Missing batch_number.',
        });
        continue;
      }

      if (!expiry || isNaN(Date.parse(expiry))) {
        errors.push({
          rowIndex: i + 1,
          sku_code: sku,
          reason: `Invalid expiry_date '${expiry}'. Expected format YYYY-MM-DD.`,
        });
        continue;
      }

      // Validation 3: Pricing
      if (isNaN(ptr) || ptr <= 0 || isNaN(mrp) || mrp <= 0) {
        errors.push({
          rowIndex: i + 1,
          sku_code: sku,
          reason: `Invalid price: PTR (${ptr}) and MRP (${mrp}) must be positive numbers.`,
        });
        continue;
      }

      if (ptr > mrp) {
        errors.push({
          rowIndex: i + 1,
          sku_code: sku,
          reason: `Price violation: PTR (₹${ptr}) cannot exceed MRP (₹${mrp}).`,
        });
        continue;
      }

      if (isNaN(qty) || qty < 0) {
        errors.push({
          rowIndex: i + 1,
          sku_code: sku,
          reason: `Invalid available_qty '${row.available_qty}'. Must be >= 0.`,
        });
        continue;
      }

      // Upsert into distributor_batches
      try {
        const res = await query(
          `
          INSERT INTO distributor_batches (
            distributor_id, master_product_id, batch_number, expiry_date,
            mrp, ptr, discount_pct, scheme_description, scheme_base_qty, scheme_free_qty,
            moq, available_qty
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          ON CONFLICT (distributor_id, master_product_id, batch_number) DO UPDATE
          SET expiry_date = EXCLUDED.expiry_date,
              mrp = EXCLUDED.mrp,
              ptr = EXCLUDED.ptr,
              discount_pct = EXCLUDED.discount_pct,
              scheme_description = EXCLUDED.scheme_description,
              scheme_base_qty = EXCLUDED.scheme_base_qty,
              scheme_free_qty = EXCLUDED.scheme_free_qty,
              moq = EXCLUDED.moq,
              available_qty = EXCLUDED.available_qty,
              updated_at = now()
          RETURNING *;
          `,
          [
            distributor_id,
            masterId,
            batchNo,
            expiry,
            mrp,
            ptr,
            discountPct,
            row.scheme_description || null,
            row.scheme_base_qty ? parseInt(row.scheme_base_qty, 10) : null,
            row.scheme_free_qty ? parseInt(row.scheme_free_qty, 10) : null,
            moq,
            qty,
          ]
        );
        insertedBatches.push(res[0]);
      } catch (dbErr: any) {
        errors.push({
          rowIndex: i + 1,
          sku_code: sku,
          reason: `Database error: ${dbErr.message}`,
        });
      }
    }

    return NextResponse.json({
      success: true,
      processed: rows.length,
      success_count: insertedBatches.length,
      failed_count: errors.length,
      errors,
      batches: insertedBatches,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
