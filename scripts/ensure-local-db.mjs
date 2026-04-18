import pg from "pg";

const { Client } = pg;

function getConnectionDetails() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is missing. Add it to .env.local first.");
  }

  const parsed = new URL(databaseUrl);

  return {
    host: parsed.hostname,
    port: Number(parsed.port || 5432),
    user: decodeURIComponent(parsed.username || process.env.USER || "postgres"),
    password: parsed.password ? decodeURIComponent(parsed.password) : undefined,
    database: parsed.pathname.replace(/^\//, ""),
    ssl:
      parsed.searchParams.get("sslmode") === "require"
        ? { rejectUnauthorized: false }
        : undefined,
  };
}

function quoteIdentifier(value) {
  return `"${value.replaceAll('"', '""')}"`;
}

const connection = getConnectionDetails();

const adminClient = new Client({
  host: connection.host,
  port: connection.port,
  user: connection.user,
  password: connection.password,
  database: "postgres",
  ssl: connection.ssl,
});

try {
  await adminClient.connect();

  const exists = await adminClient.query(
    "SELECT 1 FROM pg_database WHERE datname = $1",
    [connection.database],
  );

  if (exists.rowCount) {
    console.log(`Database "${connection.database}" already exists.`);
  } else {
    await adminClient.query(`CREATE DATABASE ${quoteIdentifier(connection.database)}`);
    console.log(`Database "${connection.database}" created.`);
  }
} finally {
  await adminClient.end().catch(() => {});
}
