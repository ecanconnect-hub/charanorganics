-- Migration: Add payment_status column to orders table if it doesn't exist
-- Run this in Supabase SQL Editor

-- Check if payment_status column exists, if not add it
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'payment_status'
    ) THEN
        ALTER TABLE orders 
        ADD COLUMN payment_status TEXT DEFAULT 'pending';
        
        RAISE NOTICE 'payment_status column added successfully';
    ELSE
        RAISE NOTICE 'payment_status column already exists';
    END IF;
END $$;

-- Also ensure email column exists for guest checkout
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'email'
    ) THEN
        ALTER TABLE orders 
        ADD COLUMN email TEXT;
        
        RAISE NOTICE 'email column added successfully';
    ELSE
        RAISE NOTICE 'email column already exists';
    END IF;
END $$;
