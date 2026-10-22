import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const retailerId = searchParams.get('retailer_id');
    const distributorId = searchParams.get('distributor_id');

    if (!retailerId && !distributorId) {
      return NextResponse.json(
        { success: false, error: 'retailer_id or distributor_id required' },
        { status: 400 }
      );
    }

    // 1. Fetch Commercial links
    let linksSql = `
      SELECT 
        rdl.*,
        r.trade_name as retailer_name,
        r.phone as retailer_phone,
        d.trade_name as distributor_name,
        d.phone as distributor_phone
      FROM retailer_distributor_links rdl
      JOIN organizations r ON rdl.retailer_id = r.id
      JOIN organizations d ON rdl.distributor_id = d.id
      WHERE 1=1
    `;
    const linkParams: any[] = [];
    if (retailerId) {
      linksSql += ` AND rdl.retailer_id = $${linkParams.length + 1}`;
      linkParams.push(retailerId);
    }
    if (distributorId) {
      linksSql += ` AND rdl.distributor_id = $${linkParams.length + 1}`;
      linkParams.push(distributorId);
    }

    const links = await query(linksSql, linkParams);

    // 2. Fetch Invoices
    let invSql = `
      SELECT 
        inv.*,
        o.order_number,
        r.trade_name as retailer_name,
        d.trade_name as distributor_name,
        CASE 
          WHEN inv.payment_state != 'PAID' AND inv.due_date < CURRENT_DATE THEN 'OVERDUE'
          ELSE inv.payment_state
        END as calculated_status
      FROM invoices inv
      JOIN organizations r ON inv.retailer_id = r.id
      JOIN organizations d ON inv.distributor_id = d.id
      JOIN orders o ON inv.order_id = o.id
      WHERE 1=1
    `;
    const invParams: any[] = [];
    if (retailerId) {
      invSql += ` AND inv.retailer_id = $${invParams.length + 1}`;
      invParams.push(retailerId);
    }
    if (distributorId) {
      invSql += ` AND inv.distributor_id = $${invParams.length + 1}`;
      invParams.push(distributorId);
    }
    invSql += ` ORDER BY inv.issued_at DESC`;

    const invoices = await query(invSql, invParams);

    // 3. Fetch Payments
    let paySql = `
      SELECT 
        p.*,
        inv.invoice_number,
        r.trade_name as retailer_name,
        d.trade_name as distributor_name
      FROM payments p
      LEFT JOIN invoices inv ON p.invoice_id = inv.id
      JOIN organizations r ON p.retailer_id = r.id
      JOIN organizations d ON p.distributor_id = d.id
      WHERE 1=1
    `;
    const payParams: any[] = [];
    if (retailerId) {
      paySql += ` AND p.retailer_id = $${payParams.length + 1}`;
      payParams.push(retailerId);
    }
    if (distributorId) {
      paySql += ` AND p.distributor_id = $${payParams.length + 1}`;
      payParams.push(distributorId);
    }
    paySql += ` ORDER BY p.created_at DESC`;

    const payments = await query(paySql, payParams);

    return NextResponse.json({
      success: true,
      links,
      invoices,
      payments,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
