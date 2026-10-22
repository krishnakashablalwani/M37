import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const retailerPincode = searchParams.get('pincode') || '500003';
    const retailerId = searchParams.get('retailerId');

    // 1. Fetch master product info for GST & details
    const productRows = await query(
      `SELECT * FROM master_products WHERE id = $1`,
      [id]
    );

    if (productRows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    const product = productRows[0];
    const gstPct = Number(product.gst_percentage) || 12;

    // 2. Query all distributor batches serving this product
    const batchRows = await query(
      `
      SELECT 
        db.id as batch_id,
        db.batch_number,
        TO_CHAR(db.expiry_date, 'YYYY-MM-DD') as expiry_date,
        db.mrp::float,
        db.ptr::float,
        db.discount_pct::float,
        db.scheme_description,
        db.scheme_base_qty,
        db.scheme_free_qty,
        db.moq,
        db.available_qty,
        org.id as distributor_id,
        org.trade_name as distributor_name,
        org.legal_name as distributor_legal_name,
        org.phone as distributor_phone,
        org.city,
        org.state,
        org.reliability_score::float,
        org.min_order_value::float,
        org.delivery_charge::float,
        COALESCE(
          $2 = ANY(org.serviceable_pincodes),
          true
        ) as is_serviceable,
        COALESCE(rdl.is_preferred, false) as is_preferred,
        COALESCE(rdl.credit_limit, 0)::float as credit_limit,
        COALESCE(rdl.credit_days, 0) as credit_days,
        COALESCE(rdl.current_outstanding, 0)::float as current_outstanding
      FROM distributor_batches db
      JOIN organizations org ON db.distributor_id = org.id
      LEFT JOIN retailer_distributor_links rdl 
        ON rdl.distributor_id = org.id AND rdl.retailer_id = $3
      WHERE db.master_product_id = $1 
        AND db.available_qty > 0
        AND org.kyc_state = 'APPROVED'
      ORDER BY 
        is_preferred DESC,
        db.expiry_date ASC,
        db.ptr ASC
      `,
      [id, retailerPincode, retailerId || '00000000-0000-0000-0000-000000000000']
    );

    // Compute Net Landing Price & SLA
    const distributors = batchRows.map((batch: any) => {
      const ptr = Number(batch.ptr);
      const discountPct = Number(batch.discount_pct) || 0;
      const baseDiscountedPtr = ptr * (1 - discountPct / 100);

      // Factor in scheme free quantity (e.g. 10+1 free gives 11 units for price of 10)
      let effectivePtr = baseDiscountedPtr;
      if (batch.scheme_base_qty && batch.scheme_free_qty && batch.scheme_free_qty > 0) {
        const totalUnits = batch.scheme_base_qty + batch.scheme_free_qty;
        effectivePtr = (baseDiscountedPtr * batch.scheme_base_qty) / totalUnits;
      }

      const gstAmount = effectivePtr * (gstPct / 100);
      const netLandingPrice = Number((effectivePtr + gstAmount).toFixed(2));

      // Delivery SLA based on reliability
      const deliverySla =
        batch.reliability_score >= 98
          ? 'Next Day Morning (by 10:00 AM)'
          : 'Standard Delivery (24-36 hrs)';

      return {
        ...batch,
        net_landing_price: netLandingPrice,
        gst_percentage: gstPct,
        delivery_sla: deliverySla,
      };
    });

    return NextResponse.json({
      success: true,
      product,
      distributors,
    });
  } catch (error: any) {
    console.error('Distributors comparison API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
