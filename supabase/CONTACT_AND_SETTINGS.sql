-- ============================================
-- CONTACT MESSAGES & APP SETTINGS MIGRATION
-- ============================================

-- 1. Create table for Contact Page Submissions
CREATE TABLE IF NOT EXISTS public.contact_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for contact_messages
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Allow anyone (anon) to INSERT messages
CREATE POLICY "Anyone can submit contact form"
    ON public.contact_messages FOR INSERT
    WITH CHECK (true);

-- Allow Admins to View/Update/Delete messages
CREATE POLICY "Admins can manage messages"
    ON public.contact_messages FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 2. Create table for Admin/App Settings (Key-Value Store)
CREATE TABLE IF NOT EXISTS public.app_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS for app_settings
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Allow Admins to manage settings
CREATE POLICY "Admins can manage settings"
    ON public.app_settings FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Allow everyone to READ public settings (we might need to filter sensitive ones later, but for now assuming most are public config)
-- Actually, better to limit to auth users or specific keys if sensitive.
-- For now, let's keep it restricted to admins for writing, and PUBLIC for reading is risky if we store secrets.
-- Let's make it readable by admins only, and expose specific public configs via API or separate function if needed.
-- Wait, the backend needs to read this to send emails. Backend (Service Role) bypasses RLS.
-- Frontend might need to read "maintenance_mode" etc.
-- Let's allow SELECT for anon for now, but be careful what we store.
CREATE POLICY "Public can read settings"
    ON public.app_settings FOR SELECT
    USING (true);


-- 3. Initial Settings Seed
INSERT INTO public.app_settings (key, value, description)
VALUES 
    ('order_notification_email', '"admin@charanorganics.com"', 'Email address to receive new order notifications'),
    ('site_maintenance', 'false', 'Put website in maintenance mode')
ON CONFLICT (key) DO NOTHING;


-- 4. FIX SECURITY AUDIT LOG RELATIONSHIP ISSUE (for "Error fetching logs: {}")
-- The client-side query fails because it tries to join 'profiles' using a foreign key that Supabase might not fully recognize for auto-joins since both reference auth.users.
-- We can create a secure VIEW that pre-joins this data.

CREATE OR REPLACE VIEW public.security_audit_log_view AS
SELECT 
    l.id,
    l.user_id,
    l.action_type,
    l.resource_type,
    l.resource_id,
    l.ip_address,
    l.request_path,
    l.request_method,
    l.success,
    l.failure_reason,
    l.metadata,
    l.created_at,
    p.email,
    p.full_name
FROM public.security_audit_log l
LEFT JOIN public.profiles p ON l.user_id = p.id;

-- Grant access to the view (RLS still relies on underlying tables usually, but Views run as owner unless security_invoker=true)
-- We want security_invoker=true so RLS on tables applies.
ALTER VIEW public.security_audit_log_view SET (security_invoker = true);


-- 5. FUNCTION TO SEND ORDER NOTIFICATION (simulated logic for now, stored in DB trigger or Edge Function)
-- Since we are using Next.js for email, we don't need a DB function for sending.
-- We just need to ensure the App Settings table exists so Next.js can read the target email.

DO $$
BEGIN
    RAISE NOTICE '✅ Contact messages and App Settings tables created.';
    RAISE NOTICE '✅ Security Audit View created to fix log fetching errors.';
END $$;
