-- Deprecated helper.
--
-- We no longer change `storage.objects` policies here because many Supabase
-- projects reject those statements from the SQL editor with:
--   ERROR: 42501: must be owner of table objects
--
-- The application now enforces order-scoped payment proofs in app code by:
-- 1. uploading files into the existing allowed folders:
--    - authenticated: <user_id>/<ORDER_ID>-<timestamp>.<ext>
--    - guest: guest-uploads/<ORDER_ID>-<timestamp>.<ext>
-- 2. validating on submit that the filename starts with the exact order ID
--
-- Existing storage policies from `supabase/create_payment_bucket.sql` are
-- sufficient for this flow. This file is intentionally a no-op so it can be
-- run safely without ownership errors.

SELECT
    'No storage policy change required. Order-scoped payment proof validation now runs in application code.' AS message;
