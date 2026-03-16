-- ============================================================
-- Issue Reports Table
-- Stores user-submitted issue/bug reports from the website footer
-- Run this in Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS public.issue_reports (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Reporter info (optional — can be anonymous)
    reporter_name   TEXT,
    reporter_email  TEXT,
    reporter_phone  TEXT,
    
    -- Issue details  
    issue_type      TEXT NOT NULL DEFAULT 'general',
    -- Values: 'order_issue', 'payment_issue', 'product_issue', 'website_bug', 'delivery_issue', 'general'
    
    order_id        TEXT,       -- Optional: related Order ID like ORD-XXXXXXXX-XXX
    description     TEXT NOT NULL,
    
    -- Status tracking (admin use)
    status          TEXT NOT NULL DEFAULT 'open',
    -- Values: 'open', 'in_review', 'resolved', 'closed'
    
    admin_notes     TEXT,
    resolved_at     TIMESTAMPTZ,
    
    -- Metadata
    user_id         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_agent      TEXT   -- Browser info for debugging
);

-- Index for admin queries
CREATE INDEX IF NOT EXISTS idx_issue_reports_status ON public.issue_reports(status);
CREATE INDEX IF NOT EXISTS idx_issue_reports_created_at ON public.issue_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_issue_reports_user_id ON public.issue_reports(user_id);

-- RLS: Everyone can insert (to report issues), only admin can read/update
ALTER TABLE public.issue_reports ENABLE ROW LEVEL SECURITY;

-- Allow anyone to submit a report (insert)
CREATE POLICY "Anyone can submit an issue report"
    ON public.issue_reports
    FOR INSERT
    TO public
    WITH CHECK (true);

-- Only authenticated admins can read reports
CREATE POLICY "Admins can view all issue reports"
    ON public.issue_reports
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Only admins can update (change status, add notes)
CREATE POLICY "Admins can update issue reports"
    ON public.issue_reports
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Allow users to view their own submitted reports
CREATE POLICY "Users can view their own reports"
    ON public.issue_reports
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

COMMENT ON TABLE public.issue_reports IS 'Customer-submitted issue and bug reports from the website footer Report Issue form.';
