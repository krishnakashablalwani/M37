import { Pool } from 'pg';

let pool: Pool;

export function getDbPool(): Pool {
  if (!pool) {
    pool = new Pool({
      host: process.env.PGHOST || 'aws-0-ap-southeast-1.pooler.supabase.com',
      port: Number(process.env.PGPORT) || 5432,
      database: process.env.PGDATABASE || 'postgres',
      user: process.env.PGUSER || 'postgres.qvfvnmsruwwblyjrapiy',
      password: process.env.PGPASSWORD || 'dK$_5A8w_jf3Q7r',
      ssl: { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
  }
  return pool;
}

export async function query<T = any>(text: string, params?: any[]): Promise<T[]> {
  const p = getDbPool();
  const res = await p.query(text, params);
  return res.rows as T[];
}
