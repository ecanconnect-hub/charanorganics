-- Add image_url to sections table if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sections' AND column_name = 'image_url') THEN
        ALTER TABLE public.sections ADD COLUMN image_url TEXT;
    END IF;
END $$;
