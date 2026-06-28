import { Pool } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var _pgPool: Pool | undefined;
}

/**
 * Postgres connection pool. Uses DATABASE_URL.
 *
 * In dev (Next.js HMR) we reuse the global pool to avoid leaking connections
 * across hot reloads. In production, the module-scope pool is fine because
 * each serverless function instance gets one pool and reuses it.
 */
export function db(): Pool {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }
  if (process.env.NODE_ENV === "production") {
    if (!global._pgPool) {
      global._pgPool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.DATABASE_URL.includes("sslmode=") ? undefined : { rejectUnauthorized: false },
        max: 5,
      });
    }
    return global._pgPool;
  }
  if (!global._pgPool) {
    global._pgPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL.includes("sslmode=") ? undefined : { rejectUnauthorized: false },
      max: 5,
    });
  }
  return global._pgPool;
}

export async function query<T = unknown>(text: string, params?: unknown[]): Promise<T[]> {
  const res = await db().query(text, params as unknown as never);
  return res.rows as T[];
}

export async function queryOne<T = unknown>(text: string, params?: unknown[]): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}
