import { Pool } from 'pg'

// Serverless-friendly singleton pool. Connects as the schema-scoped `pupil_app`
// role through the Supabase transaction pooler (see .env.local). The role can ONLY
// touch the `pupil` schema — buddy's data is unreachable.
const g = globalThis as unknown as { _pupilPool?: Pool }

export function pool(): Pool {
  if (!g._pupilPool) {
    g._pupilPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 3,
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 10_000,
    })
  }
  return g._pupilPool
}

export async function q<T = Record<string, unknown>>(
  text: string,
  params?: unknown[],
): Promise<T[]> {
  const res = await pool().query(text, params)
  return res.rows as T[]
}

export async function q1<T = Record<string, unknown>>(
  text: string,
  params?: unknown[],
): Promise<T | null> {
  const rows = await q<T>(text, params)
  return rows[0] ?? null
}
