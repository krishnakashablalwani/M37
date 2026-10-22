const { Pool } = require('pg');

const pool = new Pool({
  host: 'aws-0-ap-southeast-1.pooler.supabase.com',
  port: 5432,
  database: 'postgres',
  user: 'postgres.qvfvnmsruwwblyjrapiy',
  password: 'dK$_5A8w_jf3Q7r',
  ssl: { rejectUnauthorized: false },
});

async function main() {
  const products = await pool.query(`
    SELECT mp.brand_name, mp.generic_composition, mp.category, mp.schedule, db.batch_number, db.mrp, db.ptr, db.available_qty, org.trade_name as distributor_name
    FROM master_products mp
    JOIN distributor_batches db ON mp.id = db.master_product_id
    JOIN organizations org ON db.distributor_id = org.id
    ORDER BY mp.brand_name;
  `);

  console.log(`Found ${products.rows.length} product-batch listings:`);
  console.table(products.rows);
  await pool.end();
}

main().catch(console.error);
