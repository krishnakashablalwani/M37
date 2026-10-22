const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const regions = ['ap-south-1', 'ap-southeast-1', 'eu-central-1', 'us-east-1'];
const password = process.env.DB_PASSWORD || 'dK$_5A8w_jf3Q7r';

async function testConnection(region) {
  const host = `aws-0-${region}.pooler.supabase.com`;
  const user = 'postgres.qvfvnmsruwwblyjrapiy';
  console.log(`Trying ${host}:5432 with user ${user}...`);
  const client = new Client({
    host,
    port: 5432, // session mode on Supavisor pooler
    database: 'postgres',
    user,
    password,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000,
  });

  try {
    await client.connect();
    console.log(`>>> Connected successfully to ${region}!`);
    return client;
  } catch (err) {
    console.log(`Failed for ${region}: ${err.message}`);
    await client.end().catch(() => {});
    return null;
  }
}

async function runMigration() {
  let connectedClient = null;
  for (const reg of regions) {
    connectedClient = await testConnection(reg);
    if (connectedClient) break;
  }

  if (!connectedClient) {
    console.error('Could not connect to any pooler region.');
    process.exit(1);
  }

  const client = connectedClient;
  try {
    const schemaPath = path.resolve(__dirname, '../../../packages/database/schema.sql');
    console.log(`Reading schema from ${schemaPath}...`);
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    console.log('Executing schema.sql...');
    await client.query(schemaSql);
    console.log('schema.sql executed successfully!');

    const seedPath = path.resolve(__dirname, '../../../packages/database/seed.sql');
    console.log(`Reading seed from ${seedPath}...`);
    const seedSql = fs.readFileSync(seedPath, 'utf8');

    console.log('Executing seed.sql...');
    await client.query(seedSql);
    console.log('seed.sql executed successfully!');

    // Verify created tables and counts
    const tablesRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    console.log('\n=============================================');
    console.log('Verified Tables in Public Schema:');
    console.log('=============================================');
    for (const row of tablesRes.rows) {
      try {
        const countRes = await client.query(`SELECT count(*) FROM "${row.table_name}";`);
        console.log(`- ${row.table_name}: ${countRes.rows[0].count} rows`);
      } catch (e) {
        console.log(`- ${row.table_name}: (could not count)`);
      }
    }

    // Verify stored procedure
    const funcRes = await client.query(`
      SELECT routine_name 
      FROM information_schema.routines 
      WHERE routine_name = 'reserve_order_stock';
    `);
    console.log('\nVerified RPC Stored Procedure:');
    console.log(`- reserve_order_stock: ${funcRes.rows.length > 0 ? 'INSTALLED & READY' : 'NOT FOUND'}`);

  } catch (err) {
    console.error('Migration execution error:', err);
    process.exit(1);
  } finally {
    await client.end();
    console.log('Database connection closed.');
  }
}

runMigration();
