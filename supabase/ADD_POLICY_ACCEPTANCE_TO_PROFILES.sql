-- Add policy acceptance preference to user profiles.
-- Default is TRUE so existing users remain allowed unless they turn it off.

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS privacy_policy_accepted BOOLEAN DEFAULT TRUE;

UPDATE public.profiles
SET privacy_policy_accepted = TRUE
WHERE privacy_policy_accepted IS NULL;
