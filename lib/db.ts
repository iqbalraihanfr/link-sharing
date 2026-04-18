import { Pool, type PoolClient, type QueryResultRow } from "pg";

import { assertDatabaseConfigured, config } from "@/lib/config";

declare global {
  var __handshakePool: Pool | undefined;
  var __handshakeSchemaReady: Promise<void> | undefined;
}

const schemaStatements = [
  `CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      display_name TEXT NOT NULL,
      instagram_handle TEXT,
      linkedin_slug TEXT,
      instagram_url TEXT,
      linkedin_url TEXT,
      status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'flagged', 'hidden', 'expired')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      expires_at TIMESTAMPTZ NOT NULL,
      edit_token_hash TEXT NOT NULL,
      report_count INTEGER NOT NULL DEFAULT 0
    )`,
  `CREATE TABLE IF NOT EXISTS reports (
      id TEXT PRIMARY KEY,
      profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      reason TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      reporter_ip_hash TEXT NOT NULL
    )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS profiles_instagram_active_unique
    ON profiles (instagram_handle)
    WHERE instagram_handle IS NOT NULL AND status IN ('active', 'flagged')`,
  `CREATE UNIQUE INDEX IF NOT EXISTS profiles_linkedin_active_unique
    ON profiles (linkedin_slug)
    WHERE linkedin_slug IS NOT NULL AND status IN ('active', 'flagged')`,
  `CREATE UNIQUE INDEX IF NOT EXISTS reports_profile_reporter_unique
    ON reports (profile_id, reporter_ip_hash)`,
  `CREATE INDEX IF NOT EXISTS profiles_public_idx
    ON profiles (status, updated_at DESC, expires_at DESC)`,
  `CREATE INDEX IF NOT EXISTS reports_profile_idx
    ON reports (profile_id, created_at DESC)`,
];

function getPool() {
  assertDatabaseConfigured();

  if (!globalThis.__handshakePool) {
    globalThis.__handshakePool = new Pool({
      connectionString: config.databaseUrl,
      max: 10,
    });
  }

  return globalThis.__handshakePool;
}

async function ensureSchema() {
  if (!globalThis.__handshakeSchemaReady) {
    const pool = getPool();
    globalThis.__handshakeSchemaReady = (async () => {
      for (const statement of schemaStatements) {
        await pool.query(statement);
      }
    })();
  }

  await globalThis.__handshakeSchemaReady;
}

export async function query<T extends QueryResultRow>(
  text: string,
  values?: unknown[],
) {
  await ensureSchema();
  return getPool().query<T>(text, values);
}

export async function withTransaction<T>(
  callback: (client: PoolClient) => Promise<T>,
) {
  await ensureSchema();
  const client = await getPool().connect();

  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
