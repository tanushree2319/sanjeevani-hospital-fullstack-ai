import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import 'dotenv/config';
import { Pool } from 'pg';

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL || undefined,
  connectionTimeoutMillis: 3000,
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: true } : undefined,
});

export async function initializeDatabase() {
  const schema = await readFile(resolve(process.cwd(), 'schema.sql'), 'utf8');
  await pool.query(schema);
}