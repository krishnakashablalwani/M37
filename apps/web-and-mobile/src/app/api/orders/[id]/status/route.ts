import { NextRequest, NextResponse } from 'next/server';
import { query, getDbPool } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;
    const body = await request.json();
    const { status: targetStatus, rejection_reason } = body;

    const allowed = [
      'ACCEPTED',
      'PROCESSING',
      'PACKED',
      'DISPATCHED',
      'DELIVERED',
      'REJECTED',
      'CANCELLED',
    ];

    if (!allowed.includes(targetStatus)) {
      return NextResponse.json(
        { success: false, error: `Invalid target status: ${targetStatus}` },
        { status: 400 }
      );
    }

    const pool = getDbPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const orderRes = await client.query(`SELECT * FROM orders WHERE id = $1 FOR UPDATE`, [orderId]);
      if (orderRes.rows.length === 0) {
        throw new Error('Order not found');
      }
      const order = orderRes.rows[0];

      // Update Order Status
      let updateSql = `UPDATE orders SET status = $1, updated_at = now()`;
      const updateParams: any[] = [targetStatus];
      let pIdx = 2;

      if (targetStatus === 'DISPATCHED') {
        updateSql += `, dispatched_at = now()`;
      } else if (targetStatus === 'DELIVERED') {
        updateSql += `, delivered_at = now()`;
      } else if (targetStatus === 'REJECTED') {
        updateSql += `, rejection_reason = $${pIdx}`;
        updateParams.push(rejection_reason || 'Rejected by Distributor');
        pIdx++;
      }

      updateSql += ` WHERE id = $${pIdx} RETURNING *;`;
      updateParams.push(orderId);

      const updatedOrder = (await client.query(updateSql, updateParams)).rows[0];

      // If REJECTED or CANCELLED, release reserved stock back to available!
      if (['REJECTED', 'CANCELLED'].includes(targetStatus)) {
        const items = await client.query(
          `SELECT * FROM order_items WHERE order_id = $1`,
          [orderId]
        );
        for (const it of items.rows) {
          const totalQty = (it.accepted_qty || it.requested_qty) + (it.free_scheme_qty || 0);
          await client.query(
            `
            UPDATE distributor_batches
            SET available_qty = available_qty + $1,
                reserved_qty = GREATEST(0, reserved_qty - $1),
                updated_at = now()
            WHERE id = $2;
            `,
            [totalQty, it.allocated_batch_id]
          );
        }
      }

      // If DISPATCHED, generate legal Distributor GST Tax Invoice!
      let generatedInvoice: any = null;
      if (targetStatus === 'DISPATCHED') {
        // Check if invoice already exists
        const existingInv = await client.query(
          `SELECT * FROM invoices WHERE order_id = $1`,
          [orderId]
        );

        if (existingInv.rows.length === 0) {
          const randSuffix = Math.floor(1000 + Math.random() * 9000);
          const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
          const invoiceNumber = `INV-${dateStr}-${randSuffix}`;

          const taxableVal = Number(order.subtotal);
          const taxVal = Number(order.tax_total);
          const cgst = Number((taxVal / 2).toFixed(2));
          const sgst = Number((taxVal / 2).toFixed(2));
          const grandTotal = Number(order.grand_total);

          const invRes = await client.query(
            `
            INSERT INTO invoices (
              invoice_number, order_id, distributor_id, retailer_id,
              taxable_value, cgst_amount, sgst_amount, igst_amount,
              total_invoice_amount, payment_state, due_date
            ) VALUES (
              $1, $2, $3, $4,
              $5, $6, $7, 0,
              $8, 'UNPAID', CURRENT_DATE + INTERVAL '21 days'
            ) RETURNING *;
            `,
            [
              invoiceNumber,
              orderId,
              order.distributor_id,
              order.retailer_id,
              taxableVal,
              cgst,
              sgst,
              grandTotal,
            ]
          );
          generatedInvoice = invRes.rows[0];

          // Increment retailer's current_outstanding balance
          await client.query(
            `
            UPDATE retailer_distributor_links
            SET current_outstanding = current_outstanding + $1,
                updated_at = now()
            WHERE retailer_id = $2 AND distributor_id = $3;
            `,
            [grandTotal, order.retailer_id, order.distributor_id]
          );
        } else {
          generatedInvoice = existingInv.rows[0];
        }
      }

      await client.query('COMMIT');

      return NextResponse.json({
        success: true,
        order: updatedOrder,
        invoice: generatedInvoice,
      });
    } catch (txErr: any) {
      await client.query('ROLLBACK');
      throw txErr;
    } finally {
      client.release();
    }
  } catch (err: any) {
    console.error('Order status update error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
