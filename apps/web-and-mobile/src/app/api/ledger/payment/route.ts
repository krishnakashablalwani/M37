import { NextRequest, NextResponse } from 'next/server';
import { query, getDbPool } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      invoice_id,
      retailer_id,
      distributor_id,
      amount,
      payment_method,
      transaction_ref,
    } = body;

    const payAmount = Number(amount);
    if (!retailer_id || !distributor_id || !payAmount || payAmount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Missing mandatory payment details or invalid amount' },
        { status: 400 }
      );
    }

    const pool = getDbPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const randSuffix = Math.floor(1000 + Math.random() * 9000);
      const receiptNumber = `RCP-${Date.now().toString().slice(-6)}-${randSuffix}`;

      // 1. Insert payment record
      const payRes = await client.query(
        `
        INSERT INTO payments (
          receipt_number, invoice_id, retailer_id, distributor_id,
          amount, payment_method, transaction_ref, payment_date
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_DATE)
        RETURNING *;
        `,
        [
          receiptNumber,
          invoice_id || null,
          retailer_id,
          distributor_id,
          payAmount,
          payment_method || 'UPI',
          transaction_ref || `UPI-${Date.now()}`,
        ]
      );

      // 2. If tied to an invoice, update invoice amount_paid & payment_state
      if (invoice_id) {
        const invRes = await client.query(
          `SELECT * FROM invoices WHERE id = $1 FOR UPDATE`,
          [invoice_id]
        );
        if (invRes.rows.length > 0) {
          const inv = invRes.rows[0];
          const newPaid = Number(inv.amount_paid || 0) + payAmount;
          const totalInv = Number(inv.total_invoice_amount);
          const newState = newPaid >= totalInv ? 'PAID' : 'PARTIALLY_PAID';

          await client.query(
            `
            UPDATE invoices
            SET amount_paid = $1,
                payment_state = $2
            WHERE id = $3;
            `,
            [newPaid, newState, invoice_id]
          );
        }
      }

      // 3. Decrement retailer's current_outstanding in commercial link
      await client.query(
        `
        UPDATE retailer_distributor_links
        SET current_outstanding = GREATEST(0, current_outstanding - $1),
            updated_at = now()
        WHERE retailer_id = $2 AND distributor_id = $3;
        `,
        [payAmount, retailer_id, distributor_id]
      );

      await client.query('COMMIT');

      return NextResponse.json({
        success: true,
        receipt: payRes.rows[0],
      });
    } catch (txErr: any) {
      await client.query('ROLLBACK');
      throw txErr;
    } finally {
      client.release();
    }
  } catch (err: any) {
    console.error('Payment record error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
