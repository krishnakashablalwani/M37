import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get('q') || '').trim();
    const category = searchParams.get('category') || 'ALL';
    const schedule = searchParams.get('schedule') || 'ALL';
    const pincode = searchParams.get('pincode') || '500003';

    let sql = `
      SELECT 
        mp.id,
        mp.sku_code,
        mp.barcode,
        mp.brand_name,
        mp.generic_composition,
        mp.manufacturer,
        mp.category,
        mp.schedule,
        mp.pack_size,
        mp.uom,
        mp.hsn_code,
        mp.gst_percentage,
        mp.image_url,
        COUNT(DISTINCT db.distributor_id)::int as distributor_count,
        COALESCE(MIN(db.ptr), 0)::float as min_ptr,
        COALESCE(MAX(db.mrp), 0)::float as max_mrp,
        COALESCE(SUM(db.available_qty), 0)::int as total_available_qty,
        COALESCE(
          (SELECT scheme_description FROM distributor_batches 
           WHERE master_product_id = mp.id AND scheme_description IS NOT NULL AND available_qty > 0 
           LIMIT 1),
          NULL
        ) as best_scheme
      FROM master_products mp
      LEFT JOIN distributor_batches db ON mp.id = db.master_product_id AND db.available_qty > 0
      LEFT JOIN organizations org ON db.distributor_id = org.id
      WHERE mp.is_active = true
    `;

    const params: any[] = [];
    let paramIndex = 1;

    if (q) {
      sql += ` AND (
        mp.brand_name ILIKE $${paramIndex} OR 
        mp.generic_composition ILIKE $${paramIndex} OR 
        mp.manufacturer ILIKE $${paramIndex} OR 
        mp.sku_code ILIKE $${paramIndex} OR 
        mp.barcode ILIKE $${paramIndex}
      )`;
      params.push(`%${q}%`);
      paramIndex++;
    }

    if (category && category !== 'ALL') {
      sql += ` AND mp.category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    if (schedule && schedule !== 'ALL') {
      sql += ` AND mp.schedule = $${paramIndex}`;
      params.push(schedule);
      paramIndex++;
    }

    sql += `
      GROUP BY mp.id
      ORDER BY 
        CASE WHEN mp.brand_name ILIKE $1 THEN 0 ELSE 1 END,
        total_available_qty DESC, 
        mp.brand_name ASC
    `;

    // If no query string was given, remove the CASE WHEN $1
    if (!q) {
      sql = sql.replace('CASE WHEN mp.brand_name ILIKE $1 THEN 0 ELSE 1 END,', '');
    }

    const rows = await query(sql, params);

    return NextResponse.json({
      success: true,
      count: rows.length,
      pincode,
      products: rows,
    });
  } catch (error: any) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
