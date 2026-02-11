-- Create the 'payments' storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('payments', 'payments', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects (Often already enabled, skipping to avoid permission errors)
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy: Allow Public Read Access (Admins need to view proofs)
DROP POLICY IF EXISTS "Public Payment Read" ON storage.objects;
CREATE POLICY "Public Payment Read"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'payments' 
);

-- Policy: Allow Authenticated Users to Upload Payment Proofs
DROP POLICY IF EXISTS "Auth User Upload" ON storage.objects;
CREATE POLICY "Auth User Upload"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'payments' 
    AND (auth.role() = 'authenticated')
);
