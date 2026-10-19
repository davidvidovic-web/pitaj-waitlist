# pitaj-waitlist

Službena lista čekanja (Waitlist Landing Page) za **[Pitaj.io](https://pitaj.io)**.

Pojednostavljena, visoko-konvertirajuća verzija početne stranice napravljena u [Astro](https://astro.build) i [Tailwind CSS v4](https://tailwindcss.com), fokusirana na prikupljanje e-mailova za rani pristup platformi.

---

## 🚀 Pokretanje lokalno

```bash
# Instalacija zavisnosti
npm install

# Pokretanje dev servera (http://localhost:4321)
npm run dev

# Izrada produkcijskog builda
npm run build

# Pregled builda
npm run preview
```

---

## 📁 Struktura projekta

- `src/layouts/Layout.astro` — Osnovni layout s meta tagovima, OpenGraph i fontovima
- `src/components/Header.astro` — Čisti header s logom i brzim CTA gumbom
- `src/components/HeroWaitlist.astro` — Glavni Hero sa potpisnim videom i interaktivnom waitlist formom
- `src/components/IntegrationBar.astro` — 8 integracija (WooCommerce, Shopify, Meta...) s dual-layer hover efektom
- `src/components/CoreFeatures.astro` — 3 ključna bento stuba (Omnichannel, Zalihe/Narudžbe, Ljudski ko-pilot)
- `src/components/EarlyPerks.astro` — Pogodnosti za rane korisnike (-40% popusta, besplatan setup...)
- `src/components/BottomCta.astro` — Završna forma na dnu stranice
- `src/components/Footer.astro` — Podnožje s velikim wordmarkom i certifikatima (GDPR, SOC2, HIPAA)
- `src/pages/api/waitlist.ts` — API endpoint za obradu prijava
