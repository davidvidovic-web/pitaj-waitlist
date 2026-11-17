import type { APIRoute } from 'astro';
import { PUBLIC_COUNT_THRESHOLD, ensureWaitlistTable, getDb } from '../../lib/waitlist-db';

export const prerender = false;

const SOURCES = new Set(['hero', 'bottom', 'waitlist']);
const MAX_EMAIL_LENGTH = 254;
const RATE_LIMIT = { max: 5, windowMs: 60_000 };
const attempts = new Map<string, number[]>();

function json(body: Record<string, unknown>, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...headers },
  });
}

function isValidEmail(email: string): boolean {
  return email.length <= MAX_EMAIL_LENGTH && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** Ograničenje po IP adresi u memoriji instance; štiti od jednostavnog zloupotrebljavanja, ne od distribuiranog napada. */
function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (attempts.get(ip) ?? []).filter((time) => now - time < RATE_LIMIT.windowMs);
  recent.push(now);
  attempts.set(ip, recent);
  if (attempts.size > 5000) {
    for (const [key, times] of attempts) {
      if (times.every((time) => now - time >= RATE_LIMIT.windowMs)) attempts.delete(key);
    }
  }
  return recent.length > RATE_LIMIT.max;
}

/** Broj prijava za javni prikaz; null kad baza nije dostupna ili je broj ispod praga. */
export const GET: APIRoute = async () => {
  const cacheHeaders = { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' };
  try {
    const db = getDb();
    if (!db) return json({ count: null }, 200, cacheHeaders);
    await ensureWaitlistTable(db);
    const result = await db.execute('SELECT COUNT(*) AS cnt FROM waitlist');
    const count = Number(result.rows[0]?.cnt ?? 0);
    return json({ count: count >= PUBLIC_COUNT_THRESHOLD ? count : null }, 200, cacheHeaders);
  } catch {
    return json({ count: null }, 200, { 'Cache-Control': 'no-store' });
  }
};

export const POST: APIRoute = async ({ request, clientAddress }) => {
  try {
    if (isRateLimited(clientAddress || request.headers.get('x-forwarded-for') || 'unknown')) {
      return json({ success: false, error: 'Previše pokušaja. Pokušajte ponovo za minutu.' }, 429, { 'Retry-After': '60' });
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return json({ success: false, error: 'Neispravan format zahtjeva.' }, 400);
    }

    // Skriveno polje koje ljudi ne popunjavaju; botovi dobivaju isti odgovor kao uspjeh.
    if (typeof body.website === 'string' && body.website.trim() !== '') {
      return json({ success: true });
    }

    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const source = typeof body.source === 'string' && SOURCES.has(body.source) ? body.source : 'waitlist';

    if (!email || !isValidEmail(email)) {
      return json({ success: false, error: 'Molimo unesite ispravnu e-mail adresu.' }, 400);
    }

    const db = getDb();
    if (!db) {
      if (import.meta.env.DEV) {
        return json({ success: true, mock: true });
      }
      console.error('[Waitlist API] TURSO_DATABASE_URL / TURSO_AUTH_TOKEN nisu postavljeni.');
      return json({ success: false, error: 'Prijava trenutno nije dostupna. Pokušajte kasnije.' }, 503);
    }

    await ensureWaitlistTable(db);
    // Jedan atomski upis; ponovljena prijava istog e-maila je uspjeh i ne otkriva je li adresa već na listi.
    await db.execute({
      sql: 'INSERT INTO waitlist (email, source) VALUES (?, ?) ON CONFLICT(email) DO NOTHING',
      args: [email, source],
    });

    return json({ success: true });
  } catch (err) {
    console.error('[Waitlist API] Greška pri spremanju u bazu:', err);
    return json({ success: false, error: 'Došlo je do greške prilikom spremanja. Molimo pokušajte ponovo.' }, 500);
  }
};
