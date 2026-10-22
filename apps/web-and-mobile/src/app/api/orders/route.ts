import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const distributorId = searchParams.get('distributor_id');
    const retailerId = searchParams.get('retailer_id');
    const status = searchParams.get('status');

    let sql = `
      SELECT 
        o.id,
        o.order_number,
        o.retailer_id,
        o.distributor_id,
        o.status,
        o.subtotal::float,
        o.tax_total::float,
        o.discount_total::float,
        o.delivery_fee::float,
        o.grand_total::float,
        o.rejection_reason,
        TO_CHAR(o.created_at, 'YYYY-MM-DD HH24:MI') as created_at,
        TO_CHAR(o.confirmed_by_retailer_at, 'YYYY-MM-DD HH24:MI') as confirmed_at,
        TO_CHAR(o.dispatched_at, 'YYYY-MM-DD HH24:MI') as dispatched_at,
        TO_CHAR(o.delivered_at, 'YYYY-MM-DD HH24:MI') as delivered_at,
        r.trade_name as retailer_name,
        r.legal_name as retailer_legal_name,
        r.pincode as retailer_pincode,
        r.address_line as retailer_address,
        r.phone as retailer_phone,
        d.trade_name as distributor_name,
        d.legal_name as distributor_legal_name,
        d.phone as distributor_phone,
        inv.id as invoice_id,
        inv.invoice_number,
        inv.payment_state,
        inv.total_invoice_amount::float as invoice_amount
      FROM orders o
      JOIN organizations r ON o.retailer_id = r.id
      JOIN organizations d ON o.distributor_id = d.id
      LEFT JOIN invoices inv ON o.id = inv.order_id
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramIndex = 1;

    if (distributorId) {
      sql += ` AND o.distributor_id = $${paramIndex}`;
      params.push(distributorId);
      paramIndex++;
    }

    if (retailerId) {
      sql += ` AND o.retailer_id = $${paramIndex}`;
      params.push(retailerId);
      paramIndex++;
    }

    if (status) {
      sql += ` AND o.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    sql += ` ORDER BY o.created_at DESC`;

    const orders = await query(sql, params);

    // Fetch line items for each order
    const orderIds = orders.map((o: any) => o.id);
    let itemsMap: Record<string, any[]> = {};

    if (orderIds.length > 0) {
      const items = await query(
        `
        SELECT 
          oi.id,
          oi.order_id,
          oi.master_product_id,
          oi.allocated_batch_id,
          oi.requested_qty,
          oi.accepted_qty,
          oi.free_scheme_qty,
          oi.unit_ptr::float,
          oi.gst_pct::float,
          oi.discount_amount::float,
          oi.line_total::float,
          mp.brand_name,
          mp.generic_composition,
          mp.pack_size,
          mp.hsn_code,
          db.batch_number,
          TO_CHAR(db.expiry_date, 'YYYY-MM-DD') as expiry_date
        FROM order_items oi
        JOIN master_products mp ON oi.master_product_id = mp.id
        LEFT JOIN distributor_batches db ON oi.allocated_batch_id = db.id
        WHERE oi.order_id = ANY($1)
        ORDER BY oi.id ASC;
        `,
        [orderIds]
      );

      items.forEach((it: any) => {
        if (!itemsMap[it.order_id]) itemsMap[it.order_id] = [];
        itemsMap[it.order_id].push(it);
      });
    }

    const fullOrders = orders.map((o: any) => ({
      ...o,
      items: itemsMap[o.id] || [],
    }));

    return NextResponse.json({ success: true, count: fullOrders.length, orders: fullOrders });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
