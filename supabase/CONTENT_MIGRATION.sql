-- ============================================
-- CONTENT MANAGEMENT MIGRATION
-- ============================================

-- 1. Create table for Site Content (Singleton row usually)
CREATE TABLE IF NOT EXISTS public.site_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hero_title_en TEXT,
    hero_title_te TEXT,
    hero_description_en TEXT,
    hero_description_te TEXT,
    about_title_en TEXT,
    about_title_te TEXT,
    about_description_en TEXT,
    about_description_te TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Public can read site content"
    ON public.site_content FOR SELECT
    USING (true);

-- Allow admins to update
CREATE POLICY "Admins can update site content"
    ON public.site_content FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 2. Insert initial default row if not exists
INSERT INTO public.site_content (
    hero_title_en, 
    hero_title_te, 
    hero_description_en, 
    hero_description_te
) VALUES (
    'Experience the Purity of Nature',
    'ప్రకృతి స్వచ్ఛతను అనుభవించండి',
    'Handcrafted organic products made with traditional Ayurvedic wisdom. Pure, chemical-free, and sustainable for your holistic well-being.',
    'సాంప్రదాయ ఆయుర్వేద విజ్ఞానంతో తయారు చేయబడిన చేతితో తయారు చేసిన సేంద్రీయ ఉత్పత్తులు. మీ సంపూర్ణ శ్రేయస్సు కోసం స్వచ్ఛమైన, రసాయన రహిత మరియు స్థిరమైనది.'
) ON CONFLICT DO NOTHING; -- UUID pk might prevent conflict if not specified, but typically we want just one row.

-- Ensure there is at least one row for the admin panel to edit
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.site_content) THEN
        INSERT INTO public.site_content (hero_title_en) VALUES ('Welcome to Charan Organics');
    END IF;
END $$;
