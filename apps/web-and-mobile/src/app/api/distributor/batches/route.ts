import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const distributorId = searchParams.get('distributor_id');
    const filter = searchParams.get('filter') || 'ALL';

    if (!distributorId) {
      return NextResponse.json(
        { success: false, error: 'distributor_id is required' },
        { status: 400 }
      );
    }

    const query = `
      SELECT 
        b.id,
        b.batch_number,
        TO_CHAR(b.expiry_date, 'YYYY-MM-DD') as expiry_date,
        b.expiry_date - CURRENT_DATE as days_to_expiry,
        b.ptr,
        b.mrp,
        (b.available_qty + b.reserved_qty) as physical_stock,
        b.reserved_qty,
        b.available_qty,
        b.moq,
        b.scheme_description,
        p.id as master_product_id,
        p.brand_name,
        p.generic_composition,
        p.pack_size,
        p.schedule,
        p.hsn_code
      FROM distributor_batches b
      JOIN master_products p ON b.master_product_id = p.id
      WHERE b.distributor_id = $1
      ORDER BY b.expiry_date ASC, p.brand_name ASC
    `;

    const { rows } = await getDbPool().query(query, [distributorId]);

    let batches = rows.map((r) => {
      const days = Number(r.days_to_expiry);
      let status = 'ACTIVE';
      if (days <= 0) status = 'EXPIRED';
      else if (days <= 90) status = 'EXPIRING_SOON';
      else if (Number(r.available_qty) === 0) status = 'ZERO_STOCK';

      return {
        id: r.id,
        batch_number: r.batch_number,
        expiry_date: r.expiry_date,
        days_to_expiry: days,
        ptr: Number(r.ptr),
        mrp: Number(r.mrp),
        physical_stock: Number(r.physical_stock),
        reserved_qty: Number(r.reserved_qty),
        available_qty: Number(r.available_qty),
        moq: Number(r.moq || 1),
        scheme_description: r.scheme_description,
        master_product_id: r.master_product_id,
        brand_name: r.brand_name,
        generic_composition: r.generic_composition,
        pack_size: r.pack_size,
        schedule: r.schedule,
        hsn_code: r.hsn_code,
        status: status,
      };
    });

    if (filter === 'EXPIRING_90') {
      batches = batches.filter((b) => b.days_to_expiry <= 90 && b.days_to_expiry > 0);
    } else if (filter === 'ZERO_STOCK') {
      batches = batches.filter((b) => b.available_qty === 0);
    } else if (filter === 'ACTIVE') {
      batches = batches.filter((b) => b.status === 'ACTIVE');
    }

    return NextResponse.json({
      success: true,
      batches,
      total_count: batches.length,
    });
  } catch (error: any) {
    console.error('Error fetching distributor batches:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Database error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { batch_id, available_qty, ptr } = body;

    if (!batch_id) {
      return NextResponse.json(
        { success: false, error: 'batch_id is required' },
        { status: 400 }
      );
    }

    const updates: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (available_qty !== undefined) {
      updates.push(`available_qty = $${idx++}`);
      values.push(Math.max(0, parseInt(available_qty, 10)));
    }

    if (ptr !== undefined) {
      updates.push(`ptr = $${idx++}`);
      values.push(parseFloat(ptr));
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No fields provided to update' },
        { status: 400 }
      );
    }

    updates.push(`updated_at = now()`);
    values.push(batch_id);

    const query = `
      UPDATE distributor_batches
      SET ${updates.join(', ')}
      WHERE id = $${idx}
      RETURNING *
    `;

    const { rows } = await getDbPool().query(query, values);

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Batch not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      batch: rows[0],
      message: 'Batch inventory updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating batch:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Database error' },
      { status: 500 }
    );
  }
}
