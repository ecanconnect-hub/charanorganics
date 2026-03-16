-- Create the 'payments' storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('payments', 'payments', false)
ON CONFLICT (id) DO NOTHING;

-- Ensure the bucket is private (payment proofs must never be publicly readable)
UPDATE storage.buckets SET public = false WHERE id = 'payments';

-- Enable RLS on storage.objects (required for storage policies to work)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop legacy/insecure policies
DROP POLICY IF EXISTS "Public Payment Read" ON storage.objects;
DROP POLICY IF EXISTS "Auth User Upload" ON storage.objects;
DROP POLICY IF EXISTS "Payments - Secure Selection" ON storage.objects;
DROP POLICY IF EXISTS "Payments - Secure Restricted Access" ON storage.objects;
DROP POLICY IF EXISTS "Payments - SECURE Authenticated Upload" ON storage.objects;
DROP POLICY IF EXISTS "Payments - SECURE Guest Upload" ON storage.objects;
DROP POLICY IF EXISTS "Payments - Secure Select" ON storage.objects;
DROP POLICY IF EXISTS "Payments - Secure Auth Upload" ON storage.objects;
DROP POLICY IF EXISTS "Payments - Secure Guest Upload" ON storage.objects;

-- Policy: Only Admins or the uploading user can read payment proofs
CREATE POLICY "Payments - Secure Select"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'payments'
    AND (
        public.is_admin()
        OR (auth.uid()::text = (storage.foldername(name))[1])
    )
);

-- Policy: Authenticated users can upload only to their own folder: <uid>/<file>
CREATE POLICY "Payments - Secure Auth Upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'payments'
    AND auth.uid()::text = (storage.foldername(name))[1]
    AND array_length(storage.foldername(name), 1) = 1
    AND (LOWER(storage.extension(name)) IN ('jpg', 'jpeg', 'png', 'webp'))
);

-- Policy: Guests can upload only to guest-uploads/, with strict filename + extension checks
CREATE POLICY "Payments - Secure Guest Upload"
ON storage.objects FOR INSERT
TO public
WITH CHECK (
    bucket_id = 'payments'
    AND auth.role() = 'anon'
    AND (storage.foldername(name))[1] = 'guest-uploads'
    AND array_length(storage.foldername(name), 1) = 1
    AND (LOWER(storage.extension(name)) IN ('jpg', 'jpeg', 'png', 'webp'))
    AND storage.filename(name) ~ E'^ORD-[0-9]{8}-[0-9]{3,}-[0-9]{13}\\.(jpg|jpeg|png|webp)$'
);
