import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const orgs = await query(`
      SELECT 
        id, org_type, legal_name, trade_name, phone, email, gstin,
        drug_license_no_20, drug_license_no_21, dl_valid_until, kyc_state,
        pincode, city, state, address_line, min_order_value, reliability_score
      FROM organizations
      ORDER BY org_type, trade_name;
    `);

    return NextResponse.json({ success: true, organizations: orgs });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
