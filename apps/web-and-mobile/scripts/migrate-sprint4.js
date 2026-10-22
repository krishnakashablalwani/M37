const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres.qvfvnmsruwwblyjrapiy:dK%24_5A8w_jf3Q7r@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres',
  ssl: { rejectUnauthorized: false },
});

async function run() {
  console.log('Connecting to Supabase...');
  const client = await pool.connect();
  try {
    console.log('Creating rma_requests and payments tables...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS rma_requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        rma_number TEXT UNIQUE NOT NULL,
        order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        distributor_id UUID NOT NULL REFERENCES organizations(id),
        retailer_id UUID NOT NULL REFERENCES organizations(id),
        master_product_id UUID NOT NULL REFERENCES master_products(id),
        batch_number TEXT NOT NULL,
        return_qty INT NOT NULL CHECK (return_qty > 0),
        reason TEXT NOT NULL CHECK (reason IN ('DAMAGED', 'SHORT_SUPPLY', 'NEAR_EXPIRY', 'INCORRECT_ITEM')),
        comments TEXT,
        photo_url TEXT,
        status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
        credit_note_amount NUMERIC(12,2) DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT now(),
        resolved_at TIMESTAMPTZ
      );

      CREATE INDEX IF NOT EXISTS idx_rma_distributor ON rma_requests(distributor_id);
      CREATE INDEX IF NOT EXISTS idx_rma_retailer ON rma_requests(retailer_id);

      CREATE TABLE IF NOT EXISTS payments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        receipt_number TEXT UNIQUE NOT NULL,
        invoice_id UUID REFERENCES invoices(id),
        retailer_id UUID NOT NULL REFERENCES organizations(id),
        distributor_id UUID NOT NULL REFERENCES organizations(id),
        amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
        payment_method TEXT NOT NULL CHECK (payment_method IN ('UPI', 'BANK_TRANSFER', 'CHEQUE', 'CASH')),
        transaction_ref TEXT,
        payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
        created_at TIMESTAMPTZ DEFAULT now()
      );

      CREATE INDEX IF NOT EXISTS idx_payments_retailer ON payments(retailer_id);
      CREATE INDEX IF NOT EXISTS idx_payments_distributor ON payments(distributor_id);
    `);
    console.log('Tables rma_requests and payments created successfully!');
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch(console.error);
