import { Pool } from 'pg';

let pool: Pool | undefined;

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://postgres.qvfvnmsruwwblyjrapiy:dK%24_5A8w_jf3Q7r@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres';

export function getDbPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString,
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

export default getDbPool;

