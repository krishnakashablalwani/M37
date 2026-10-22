import { NextRequest, NextResponse } from 'next/server';
import { query, getDbPool } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const retailerId = searchParams.get('retailer_id');
    const distributorId = searchParams.get('distributor_id');

    let sql = `
      SELECT 
        rma.*,
        o.order_number,
        mp.brand_name,
        mp.generic_composition,
        mp.pack_size,
        r.trade_name as retailer_name,
        d.trade_name as distributor_name
      FROM rma_requests rma
      JOIN orders o ON rma.order_id = o.id
      JOIN master_products mp ON rma.master_product_id = mp.id
      JOIN organizations r ON rma.retailer_id = r.id
      JOIN organizations d ON rma.distributor_id = d.id
      WHERE 1=1
    `;
    const params: any[] = [];
    if (retailerId) {
      sql += ` AND rma.retailer_id = $${params.length + 1}`;
      params.push(retailerId);
    }
    if (distributorId) {
      sql += ` AND rma.distributor_id = $${params.length + 1}`;
      params.push(distributorId);
    }
    sql += ` ORDER BY rma.created_at DESC;`;

    const rmas = await query(sql, params);
    return NextResponse.json({ success: true, count: rmas.length, rmas });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      order_id,
      distributor_id,
      retailer_id,
      master_product_id,
      batch_number,
      return_qty,
      reason,
      comments,
      photo_url,
    } = body;

    if (!order_id || !distributor_id || !retailer_id || !master_product_id || !batch_number || !return_qty || !reason) {
      return NextResponse.json({ success: false, error: 'Missing mandatory RMA fields' }, { status: 400 });
    }

    const rand = Math.floor(1000 + Math.random() * 9000);
    const rmaNumber = `RMA-${Date.now().toString().slice(-6)}-${rand}`;

    const inserted = await query(
      `
      INSERT INTO rma_requests (
        rma_number, order_id, distributor_id, retailer_id, master_product_id,
        batch_number, return_qty, reason, comments, photo_url, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'PENDING')
      RETURNING *;
      `,
      [
        rmaNumber,
        order_id,
        distributor_id,
        retailer_id,
        master_product_id,
        batch_number,
        parseInt(return_qty, 10),
        reason,
        comments || null,
        photo_url || null,
      ]
    );

    // Update order status to RETURN_REQUESTED
    await query(`UPDATE orders SET status = 'RETURN_REQUESTED' WHERE id = $1`, [order_id]);

    return NextResponse.json({ success: true, rma: inserted[0] });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { rma_id, action, credit_note_amount } = body;

    if (!rma_id || !['APPROVE', 'REJECT'].includes(action)) {
      return NextResponse.json({ success: false, error: 'Invalid RMA action' }, { status: 400 });
    }

    const pool = getDbPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const rmaRes = await client.query(`SELECT * FROM rma_requests WHERE id = $1 FOR UPDATE`, [rma_id]);
      if (rmaRes.rows.length === 0) throw new Error('RMA request not found');
      const rma = rmaRes.rows[0];

      const newStatus = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';
      const creditAmt = action === 'APPROVE' ? Number(credit_note_amount || 0) : 0;

      const updated = await client.query(
        `
        UPDATE rma_requests
        SET status = $1,
            credit_note_amount = $2,
            resolved_at = now()
        WHERE id = $3
        RETURNING *;
        `,
        [newStatus, creditAmt, rma_id]
      );

      // If approved, adjust retailer's ledger outstanding balance
      if (action === 'APPROVE' && creditAmt > 0) {
        await client.query(
          `
          UPDATE retailer_distributor_links
          SET current_outstanding = GREATEST(0, current_outstanding - $1),
              updated_at = now()
          WHERE retailer_id = $2 AND distributor_id = $3;
          `,
          [creditAmt, rma.retailer_id, rma.distributor_id]
        );
      }

      await client.query('COMMIT');

      return NextResponse.json({ success: true, rma: updated.rows[0] });
    } catch (txErr: any) {
      await client.query('ROLLBACK');
      throw txErr;
    } finally {
      client.release();
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
