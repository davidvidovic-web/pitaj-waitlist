import type { APIRoute } from 'astro';
import { Resend } from 'resend';

export const prerender = false;

// Email validation helper
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Generate branded confirmation email HTML
function generateConfirmationEmailHtml(email: string): string {
  return `
<!DOCTYPE html>
<html lang="bs">
<head>
  <meta charset="utf-8">
  <title>Dobrodošli na Pitaj.io listu čekanja</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #09090b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f4f5; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 580px; background-color: #ffffff; border-radius: 16px; border: 1px solid #e4e4e7; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
          
          <!-- Header with Logo -->
          <tr>
            <td style="padding: 32px 36px 24px; border-bottom: 1px solid #f4f4f5;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <div style="font-size: 20px; font-weight: 700; color: #09090b; letter-spacing: -0.02em;">
                      pitaj<span style="color: #71717a; font-weight: 400;">.io</span>
                    </div>
                  </td>
                  <td align="right">
                    <span style="background-color: #f4f4f5; border: 1px solid #e4e4e7; color: #52525b; font-size: 11px; font-weight: 600; text-transform: uppercase; padding: 4px 10px; border-radius: 999px; letter-spacing: 0.05em;">
                      Lista čekanja
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 36px 36px 28px;">
              <h1 style="margin: 0 0 16px; font-size: 24px; font-weight: 600; line-height: 1.25; color: #09090b; letter-spacing: -0.02em;">
                Vaše mjesto na listi je osigurano.
              </h1>
              
              <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: #52525b;">
                Hvala vam na interesu za <strong>Pitaj.io</strong>. Uspješno ste se prijavili s adresom <strong style="color: #09090b;">${email}</strong>. Gradimo vodeću regionalnu platformu za pametne AI agente koji automatiziraju korisničku podršku i prodaju 24/7.
              </p>

              <!-- Perks Card -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #fafafa; border: 1px solid #e4e4e7; border-radius: 12px; margin: 0 0 28px; padding: 20px;">
                <tr>
                  <td>
                    <div style="font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #162ea8; margin-bottom: 12px;">
                      Ekskluzivne pogodnosti za vas:
                    </div>
                    
                    <div style="margin-bottom: 10px; font-size: 14px; color: #09090b; line-height: 1.5;">
                      <strong>✨ Prioritetan onboarding</strong> — 1-na-1 asistencija i tehnički setup direktno od našeg inženjerskog tima.
                    </div>
                    
                    <div style="margin-bottom: 10px; font-size: 14px; color: #09090b; line-height: 1.5;">
                      <strong>🏷️ -40% popusta na prvu godinu</strong> — Trajno zaključana cijena za rane članove na godišnjem planu.
                    </div>

                    <div style="font-size: 14px; color: #09090b; line-height: 1.5;">
                      <strong>🛠️ Direktan uticaj na razvoj</strong> — Vaše specifične integracije i rješenja dobijaju najviši prioritet.
                    </div>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 8px; font-size: 14px; line-height: 1.6; color: #52525b;">
                Javit ćemo vam se čim prva grupa korisnika dobije pristup, zajedno s vašim aktivacijskim linkom.
              </p>
            </td>
          </tr>

          <!-- Signature & Footer -->
          <tr>
            <td style="padding: 24px 36px 32px; background-color: #fafafa; border-top: 1px solid #f4f4f5;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <div style="font-size: 13px; font-weight: 600; color: #09090b;">Pitaj.io Tim</div>
                    <div style="font-size: 12px; color: #71717a; margin-top: 2px;">
                      <a href="https://pitaj.io" style="color: #162ea8; text-decoration: none;">pitaj.io</a> • Pametni AI agenti koji poznaju vaš biznis
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top: 16px; font-size: 11px; color: #a1a1aa; line-height: 1.4;">
                    Ovaj e-mail ste primili jer ste se prijavili na listu čekanja na pitaj.io. EU serveri • GDPR usklađeno.
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

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

    // Load Resend API Key from environment
    const apiKey = import.meta.env.RESEND_API_KEY || process.env.RESEND_API_KEY;

    if (!apiKey) {
      console.warn('[Waitlist API] RESEND_API_KEY nije konfigurisan u .env. Prijava je prihvaćena u mock modu.');
      return new Response(
        JSON.stringify({
          success: true,
          mock: true,
          message: 'Uspješno ste na listi čekanja (demo mod: dodajte RESEND_API_KEY u .env za slanje stvarnih e-mailova).',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const resend = new Resend(apiKey);
    const audienceId = import.meta.env.RESEND_AUDIENCE_ID || process.env.RESEND_AUDIENCE_ID;
    const fromEmail = import.meta.env.RESEND_FROM_EMAIL || process.env.RESEND_FROM_EMAIL || 'Pitaj.io <info@pitaj.io>';
    const notifyEmail = import.meta.env.RESEND_NOTIFY_EMAIL || process.env.RESEND_NOTIFY_EMAIL;

    // 1. Add contact to Resend Audience if configured
    if (audienceId) {
      try {
        await resend.contacts.create({
          email,
          audienceId,
          unsubscribed: false,
        });
      } catch (contactErr) {
        // Audience duplicate or creation error should not block confirmation email
        console.warn('[Waitlist API] Resend Audience zabilješka:', contactErr);
      }
    }

    // 2. Send confirmation email to subscriber
    let sendResult;
    try {
      sendResult = await resend.emails.send({
        from: fromEmail,
        to: [email],
        subject: 'Dobrodošli na Pitaj.io listu čekanja — Vaš rani pristup je osiguran',
        html: generateConfirmationEmailHtml(email),
      });
    } catch (sendErr: any) {
      console.error('[Waitlist API] Greška pri slanju konfirmacijskog e-maila:', sendErr);
      
      // If error is due to unverified custom domain, try fallback to onboarding@resend.dev
      if (fromEmail !== 'onboarding@resend.dev') {
        try {
          console.info('[Waitlist API] Pokušavam slanje preko onboarding@resend.dev fallback-a...');
          sendResult = await resend.emails.send({
            from: 'Pitaj.io <onboarding@resend.dev>',
            to: [email],
            subject: 'Dobrodošli na Pitaj.io listu čekanja — Vaš rani pristup je osiguran',
            html: generateConfirmationEmailHtml(email),
          });
        } catch (fallbackErr) {
          console.error('[Waitlist API] Fallback slanje također nije uspjelo:', fallbackErr);
        }
      }
    }

    // 3. Optional: Notify internal team of new waitlist lead
    if (notifyEmail) {
      try {
        await resend.emails.send({
          from: fromEmail !== 'onboarding@resend.dev' ? fromEmail : 'Pitaj.io <onboarding@resend.dev>',
          to: [notifyEmail],
          subject: `[Waitlist] Nova prijava: ${email}`,
          text: `Nova prijava na Pitaj.io listu čekanja:\n\nEmail: ${email}\nIzvor: ${source}\nVrijeme: ${new Date().toISOString()}`,
        });
      } catch (notifyErr) {
        console.warn('[Waitlist API] Greška pri internom obavještavanju tima:', notifyErr);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Uspješno ste prijavljeni na listu čekanja! Poslali smo vam potvrdu na e-mail.',
        id: sendResult?.data?.id || null,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('[Waitlist API] Neočekivana greška:', err);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Došlo je do greške prilikom obrade prijave. Molimo pokušajte ponovo.',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
