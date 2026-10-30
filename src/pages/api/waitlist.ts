import type { APIRoute } from 'astro';
import { createClient } from '@libsql/client/web';

export const prerender = false;

// Email validation helper
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

const DEFAULT_TURSO_URL = 'libsql://pitajio-waitlist-davidvidovic-web.aws-eu-west-1.turso.io';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json().catch(() => null);

    if (!body || typeof body !== 'object') {
      return new Response(
        JSON.stringify({ success: false, error: 'Neispravan format zahtjeva.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const source = typeof body.source === 'string' ? body.source.trim() : 'waitlist';

    if (!email || !isValidEmail(email)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Molimo unesite ispravnu e-mail adresu.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Load Turso credentials from environment
    const url = import.meta.env.TURSO_DATABASE_URL || process.env.TURSO_DATABASE_URL || DEFAULT_TURSO_URL;
    const authToken = import.meta.env.TURSO_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN;

    if (!authToken) {
      console.warn('[Waitlist API] TURSO_AUTH_TOKEN nije postavljen u .env. Prijava je prihvaćena u demo modu.');
      return new Response(
        JSON.stringify({
          success: true,
          mock: true,
          message: 'Uspješno ste na listi čekanja (demo mod: dodajte TURSO_AUTH_TOKEN u .env za spremanje u bazu).',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const db = createClient({ url, authToken });

    // Ensure the table exists
    await db.execute(`
      CREATE TABLE IF NOT EXISTS waitlist (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE,
        source TEXT DEFAULT 'waitlist',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Check if email already exists
    const existing = await db.execute({
      sql: `SELECT id FROM waitlist WHERE email = ?`,
      args: [email],
    });

    if (existing.rows.length > 0) {
      return new Response(
        JSON.stringify({
          success: false,
          duplicate: true,
          error: 'Ova e-mail adresa je već prijavljena za demo.',
        }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Insert new subscriber entry
    await db.execute({
      sql: `INSERT INTO waitlist (email, source) VALUES (?, ?)`,
      args: [email, source],
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Čestitamo! Vaše mjesto na listi je osigurano.',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('[Waitlist API] Greška pri spremanju u bazu:', err);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Došlo je do greške prilikom spremanja. Molimo pokušajte ponovo.',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
