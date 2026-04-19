-- Backfill: shorten currently-active free trials so their end date sits
-- 14 days after their start date (instead of the legacy 30).
--
-- Scope: only rows still in 'trial' status. Paid subscribers, expired trials,
-- and any non-trial states are untouched.
--
-- Safety: as of 2026-04-19, the oldest active trial started 7 days ago, so
-- no organization will be retroactively pushed past its new end date.
-- If this migration is replayed in a future state where some trial would
-- already be expired under the new rule, those orgs will simply flip to
-- expired on next page load — which matches the stated 14-day policy.
UPDATE public.organizations
   SET trial_end_date = trial_start_date + interval '14 days',
       updated_at = now()
 WHERE subscription_status = 'trial'
   AND trial_start_date IS NOT NULL
   AND trial_end_date <> trial_start_date + interval '14 days';
