import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: invoiceId } = await params;

    // Fetch invoice with distributor, retailer, and order metadata
    const invRows = await query(
      `
      SELECT 
        inv.*,
        o.order_number,
        o.delivery_fee::float,
        d.legal_name as seller_legal_name,
        d.trade_name as seller_trade_name,
        d.gstin as seller_gstin,
        d.drug_license_no_20 as seller_dl_20b,
        d.drug_license_no_21 as seller_dl_21b,
        d.address_line as seller_address,
        d.city as seller_city,
        d.state as seller_state,
        d.pincode as seller_pincode,
        d.phone as seller_phone,
        r.legal_name as buyer_legal_name,
        r.trade_name as buyer_trade_name,
        r.gstin as buyer_gstin,
        r.drug_license_no_20 as buyer_dl_20,
        r.drug_license_no_21 as buyer_dl_21,
        r.address_line as buyer_address,
        r.city as buyer_city,
        r.state as buyer_state,
        r.pincode as buyer_pincode,
        r.phone as buyer_phone
      FROM invoices inv
      JOIN organizations d ON inv.distributor_id = d.id
      JOIN organizations r ON inv.retailer_id = r.id
      JOIN orders o ON inv.order_id = o.id
      WHERE inv.id = $1 OR inv.order_id = $1
      `,
      [invoiceId]
    );

    if (invRows.length === 0) {
      return NextResponse.json({ success: false, error: 'Invoice not found' }, { status: 404 });
    }

    const invoice = invRows[0];

    // Fetch line items
    const items = await query(
      `
      SELECT 
        oi.*,
        mp.brand_name,
        mp.generic_composition,
        mp.pack_size,
        mp.hsn_code,
        mp.uom,
        db.batch_number,
        TO_CHAR(db.expiry_date, 'MM/YYYY') as expiry_month_year,
        db.mrp::float
      FROM order_items oi
      JOIN master_products mp ON oi.master_product_id = mp.id
      LEFT JOIN distributor_batches db ON oi.allocated_batch_id = db.id
      WHERE oi.order_id = $1
      ORDER BY oi.id ASC;
      `,
      [invoice.order_id]
    );

    return NextResponse.json({
      success: true,
      invoice,
      items,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
