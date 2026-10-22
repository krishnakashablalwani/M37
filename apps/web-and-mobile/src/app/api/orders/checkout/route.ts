import { NextRequest, NextResponse } from 'next/server';
import { query, getDbPool } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { retailer_id, distributor_id, items, generation_mode } = body;

    if (!retailer_id || !distributor_id || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Missing required order details.' },
        { status: 400 }
      );
    }

    // 1. Fetch Retailer details & check Drug License compliance
    const retailerRows = await query(`SELECT * FROM organizations WHERE id = $1`, [retailer_id]);
    if (retailerRows.length === 0) {
      return NextResponse.json({ success: false, error: 'Retailer not found.' }, { status: 404 });
    }
    const retailer = retailerRows[0];

    // Check if any item in cart is restricted Schedule H/H1/X
    for (const it of items) {
      if (['SCHEDULE_H', 'SCHEDULE_H1', 'SCHEDULE_X'].includes(it.schedule)) {
        const hasValidDl =
          retailer.kyc_state === 'APPROVED' &&
          retailer.drug_license_no_20 &&
          retailer.dl_valid_until &&
          new Date(retailer.dl_valid_until) >= new Date();

        if (!hasValidDl) {
          return NextResponse.json(
            {
              success: false,
              compliance_violation: true,
              error: `Compliance Block: Retailer '${retailer.trade_name}' lacks a verified Drug License (Form 20/21) required to purchase ${it.schedule} product '${it.brand_name}'.`,
            },
            { status: 403 }
          );
        }
      }
    }

    // 2. Fetch distributor details for delivery fee & min order value
    const distRows = await query(`SELECT * FROM organizations WHERE id = $1`, [distributor_id]);
    const distributor = distRows[0];
    const deliveryFee = Number(distributor?.delivery_charge || 0);

    // Calculate subtotal, tax, and grand total
    let subtotal = 0;
    let taxTotal = 0;
    let discountTotal = 0;

    for (const it of items) {
      const lineSubtotal = it.unit_ptr * it.quantity;
      const lineTax = lineSubtotal * (it.gst_pct / 100);
      subtotal += lineSubtotal;
      taxTotal += lineTax;
      discountTotal += (it.discount_amount || 0) * it.quantity;
    }

    const grandTotal = subtotal + taxTotal + deliveryFee;

    // Generate unique order number: e.g. ORD-20261022-XXXX
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `ORD-${Date.now().toString().slice(-6)}-${randomSuffix}`;

    // 3. Insert order and order items in transaction and run atomic reservation
    const pool = getDbPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const orderRes = await client.query(
        `
        INSERT INTO orders (
          order_number, retailer_id, distributor_id, generation_mode, status,
          subtotal, tax_total, discount_total, delivery_fee, grand_total,
          confirmed_by_retailer_at
        ) VALUES ($1, $2, $3, $4, 'ORDER_PLACED', $5, $6, $7, $8, $9, now())
        RETURNING *;
        `,
        [
          orderNumber,
          retailer_id,
          distributor_id,
          generation_mode || 'RETAILER_SELECTED',
          subtotal,
          taxTotal,
          discountTotal,
          deliveryFee,
          grandTotal,
        ]
      );

      const order = orderRes.rows[0];

      // Insert line items
      for (const it of items) {
        const lineTotal = it.unit_ptr * it.quantity * (1 + it.gst_pct / 100);
        await client.query(
          `
          INSERT INTO order_items (
            order_id, master_product_id, allocated_batch_id, requested_qty,
            accepted_qty, free_scheme_qty, unit_ptr, gst_pct, discount_amount, line_total
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10);
          `,
          [
            order.id,
            it.master_product_id,
            it.batch_id,
            it.quantity,
            it.quantity, // accepted_qty defaults to requested
            it.free_scheme_qty || 0,
            it.unit_ptr,
            it.gst_pct,
            it.discount_amount || 0,
            lineTotal,
          ]
        );
      }

      // 4. Call Atomic FEFO Stock Reservation stored procedure!
      await client.query(`SELECT reserve_order_stock($1);`, [order.id]);

      await client.query('COMMIT');

      return NextResponse.json({
        success: true,
        order_number: order.order_number,
        order_id: order.id,
        grand_total: Number(order.grand_total),
        status: order.status,
      });
    } catch (txErr: any) {
      await client.query('ROLLBACK');
      throw txErr;
    } finally {
      client.release();
    }
  } catch (err: any) {
    console.error('Checkout error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Checkout failed' },
      { status: 500 }
    );
  }
}
