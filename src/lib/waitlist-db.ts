import { createClient, type Client } from '@libsql/client/web';

/** Najmanji broj prijava koji se javno prikazuje; ispod toga se brojač ne prikazuje. */
export const PUBLIC_COUNT_THRESHOLD = 25;

let client: Client | null = null;
let tableReady: Promise<unknown> | null = null;

// Samo adresa baze (nije tajna). Zadržana kao rezerva dok se ne potvrdi da je TURSO_DATABASE_URL postavljen na Vercelu; tada je ukloniti.
const FALLBACK_URL = 'libsql://pitajio-waitlist-davidvidovic-web.aws-eu-west-1.turso.io';

/** Vraća bazu samo kad je token konfiguriran; inače null. */
export function getDb(): Client | null {
  const url = import.meta.env.TURSO_DATABASE_URL || process.env.TURSO_DATABASE_URL || FALLBACK_URL;
  const authToken = import.meta.env.TURSO_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN;
  if (!url || !authToken) return null;
  client ??= createClient({ url, authToken });
  return client;
}

/** Tablica se kreira jednom po instanci, a ne pri svakom zahtjevu. */
export function ensureWaitlistTable(db: Client): Promise<unknown> {
  tableReady ??= db
    .execute(`
      CREATE TABLE IF NOT EXISTS waitlist (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE,
        source TEXT DEFAULT 'waitlist',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `)
    .catch((error) => {
      tableReady = null;
      throw error;
    });
  return tableReady;
}
