-- Idempotency table for Stripe webhook events.
-- Stripe retries on 5xx and may also redeliver successful events.
-- Without dedup, invoice.payment_failed re-sends the customer email on
-- every retry. We insert event.id with a PK constraint and short-circuit
-- on conflict before any side-effect (DB writes, email sends).
CREATE TABLE IF NOT EXISTS public.stripe_webhook_events (
  event_id   text PRIMARY KEY,
  event_type text NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now()
);

-- Sweep old rows to keep the table small. Stripe retries on the same
-- event.id are bounded to ~3 days; keep 30 days for forensics.
CREATE INDEX IF NOT EXISTS stripe_webhook_events_received_at_idx
  ON public.stripe_webhook_events (received_at);

-- Service role only — webhook handler uses service role; no end-user access.
ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;
-- (No policies = no access for anon/auth users; service role bypasses RLS.)
