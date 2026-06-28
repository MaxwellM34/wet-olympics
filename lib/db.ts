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
  // SSL behavior:
  //   - URL contains sslmode= → let pg parse it from the URL
  //   - URL points at localhost / 127.0.0.1 (e.g. SSH-tunneled Postgres) → no SSL
  //   - anything else (remote DB without sslmode) → SSL with relaxed CA
  const url = process.env.DATABASE_URL;
  const explicitSsl = url.includes("sslmode=");
  const isLocal = /@(localhost|127\.0\.0\.1|\[::1\])(:|\/)/.test(url);
  const sslOpt = explicitSsl
    ? undefined
    : isLocal
      ? false
      : { rejectUnauthorized: false };

  if (!global._pgPool) {
    global._pgPool = new Pool({
      connectionString: url,
      ssl: sslOpt,
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
