// Database configuration
// DSR v0.2.0 Enterprise Foundation

import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'dsr_dev',
  user: process.env.DB_USER || 'dsr',
  password: process.env.DB_PASSWORD || 'dsr_dev_password',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Health check
export async function checkDatabaseHealth() {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    return { status: 'healthy', latency: 'ok' };
  } catch (error) {
    return { status: 'unhealthy', error: error.message };
  }
}

export { pool };
export default pool;
