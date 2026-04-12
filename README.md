# BonoitecPilot

Logiciel SaaS de gestion pour ateliers de réparation d'appareils électroniques (smartphones, tablettes, consoles, ordinateurs).

**Production:** https://bonoitecpilot.fr

## Stack

- **Frontend:** Vite + React 18 + TypeScript + Tailwind CSS + shadcn/ui
- **Backend:** Supabase (Postgres + Auth + Edge Functions + Storage)
- **Hosting:** Vercel
- **Email:** Resend (`noreply@bonoitecpilot.fr`)
- **AI:** OpenRouter (Gemini 2.5 Flash)
- **Payments:** Stripe (subscriptions)
- **CAPTCHA:** Cloudflare Turnstile (optional)

## Features

- Repair workflow (intake wizard → diagnostic → status board → restitution)
- Client & device management with IMEI lookup
- Quotes & invoices with PDF generation
- Inventory management with auto-deduction on parts use
- Real-time profitability tracking and margin analysis
- AI diagnostic assistant
- QR code customer deposits
- Public repair tracking page
- Multi-tenant architecture with full RLS isolation

## Local development

Requires Node.js 20+ and a Supabase project (or use the existing one configured in `.env`).

```sh
git clone https://github.com/bonoitec/bonoitec-pilot-pro-selfhost.git
cd bonoitec-pilot-pro-selfhost
npm install
cp .env.example .env  # then edit with your Supabase credentials
npm run dev
```

App opens at http://localhost:8081

## Environment variables

| Name | Required | Description |
|------|----------|-------------|
| `VITE_SUPABASE_URL` | Yes | Your Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Yes | Supabase anon key |
| `VITE_SUPABASE_PROJECT_ID` | Yes | Supabase project ref |
| `VITE_APP_URL` | No | Public URL (defaults to `window.location.origin`) |
| `VITE_TURNSTILE_SITE_KEY` | No | Cloudflare Turnstile site key (leave empty to disable) |

## Edge function secrets

Set via `npx supabase secrets set KEY=value --project-ref <ref>`:

| Name | Used by |
|------|---------|
| `RESEND_API_KEY` | `send-email`, `send-repair-notification` |
| `OPENROUTER_API_KEY` | `ai-diagnostic`, `product-assistant` |
| `OPENROUTER_MODEL` | `ai-diagnostic`, `product-assistant` |
| `STRIPE_SECRET_KEY` | `create-checkout`, `check-subscription`, `customer-portal` |
| `TURNSTILE_SECRET_KEY` | `verify-turnstile` |

## Database & migrations

Schema lives in `supabase/migrations/`. Push to a linked project:

```sh
npx supabase link --project-ref <project-ref>
npx supabase db push --include-all
```

## Edge functions

```sh
npx supabase functions deploy
```

## Auth config

`supabase/config.toml` controls auth settings (site URL, SMTP, OAuth providers). Push with:

```sh
RESEND_API_KEY=... GOOGLE_CLIENT_ID=... GOOGLE_CLIENT_SECRET=... npx supabase config push --project-ref <ref>
```

## License

Proprietary.
