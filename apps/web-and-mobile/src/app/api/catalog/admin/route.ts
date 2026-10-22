import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const products = await query(`
      SELECT 
        mp.*,
        COUNT(DISTINCT db.distributor_id)::int as distributor_count,
        COALESCE(SUM(db.available_qty), 0)::int as total_stock
      FROM master_products mp
      LEFT JOIN distributor_batches db ON mp.id = db.master_product_id
      GROUP BY mp.id
      ORDER BY mp.created_at DESC
    `);

    return NextResponse.json({ success: true, count: products.length, products });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      sku_code,
      barcode,
      brand_name,
      generic_composition,
      manufacturer,
      category,
      schedule,
      pack_size,
      uom,
      hsn_code,
      gst_percentage,
    } = body;

    if (!sku_code || !brand_name || !manufacturer || !category || !pack_size || !uom || !hsn_code) {
      return NextResponse.json(
        { success: false, error: 'Missing mandatory SKU fields.' },
        { status: 400 }
      );
    }

    // Check duplicate SKU
    const existing = await query(`SELECT id FROM master_products WHERE sku_code = $1`, [sku_code]);
    if (existing.length > 0) {
      return NextResponse.json(
        { success: false, error: `SKU code '${sku_code}' already exists in canonical catalog.` },
        { status: 409 }
      );
    }

    const inserted = await query(
      `
      INSERT INTO master_products (
        sku_code, barcode, brand_name, generic_composition, manufacturer,
        category, schedule, pack_size, uom, hsn_code, gst_percentage
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
      `,
      [
        sku_code.trim(),
        barcode?.trim() || null,
        brand_name.trim(),
        generic_composition?.trim() || null,
        manufacturer.trim(),
        category,
        schedule || 'NON_PHARMA',
        pack_size.trim(),
        uom.trim(),
        hsn_code.trim(),
        Number(gst_percentage) || 12,
      ]
    );

    return NextResponse.json({ success: true, product: inserted[0] }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
