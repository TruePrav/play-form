-- Update database schema to support separate first and last name fields
-- This script adds new columns and updates the RPC function

-- Add new columns to customers table
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS guardian_first_name TEXT,
ADD COLUMN IF NOT EXISTS guardian_last_name TEXT;

-- Update the create_player_profile function to accept separate name fields
DROP FUNCTION IF EXISTS public.create_player_profile CASCADE;

CREATE OR REPLACE FUNCTION public.create_player_profile(
  p_first_name TEXT,
  p_last_name TEXT,
  p_date_of_birth DATE,
  p_whatsapp_number TEXT,
  p_email TEXT DEFAULT NULL,
  p_parish TEXT DEFAULT NULL,
  p_gender TEXT DEFAULT NULL,
  p_guardian_first_name TEXT DEFAULT NULL,
  p_guardian_last_name TEXT DEFAULT NULL,
  p_guardian_date_of_birth DATE DEFAULT NULL,
  p_guardian_whatsapp_number TEXT DEFAULT NULL,
  p_is_minor BOOLEAN DEFAULT false,
  p_phone_verified BOOLEAN DEFAULT false,
  p_terms_accepted BOOLEAN DEFAULT false,
  p_terms_accepted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  p_shop_categories TEXT[] DEFAULT ARRAY['video_games'],
  p_gift_cards JSONB DEFAULT '[]'::jsonb,
  p_consoles TEXT[] DEFAULT ARRAY[]::TEXT[],
  p_retro_consoles TEXT[] DEFAULT ARRAY[]::TEXT[]
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  customer_id UUID;
  gift_card JSONB;
  console_item TEXT;
  retro_console_item TEXT;
  category_item TEXT;
BEGIN
  -- Insert customer with separate name fields
  INSERT INTO customers (
    first_name,
    last_name,
    full_name, -- Keep full_name for backward compatibility
    date_of_birth,
    whatsapp_number,
    email,
    parish,
    gender,
    guardian_first_name,
    guardian_last_name,
    guardian_full_name, -- Keep guardian_full_name for backward compatibility
    guardian_date_of_birth,
    guardian_whatsapp_number,
    is_minor,
    phone_verified,
    terms_accepted,
    terms_accepted_at
  ) VALUES (
    p_first_name,
    p_last_name,
    CONCAT(p_first_name, ' ', p_last_name), -- Generate full_name from parts
    p_date_of_birth,
    p_whatsapp_number,
    p_email,
    p_parish,
    p_gender,
    p_guardian_first_name,
    p_guardian_last_name,
    CASE 
      WHEN p_guardian_first_name IS NOT NULL AND p_guardian_last_name IS NOT NULL 
      THEN CONCAT(p_guardian_first_name, ' ', p_guardian_last_name)
      ELSE NULL 
    END, -- Generate guardian_full_name from parts
    p_guardian_date_of_birth,
    CASE WHEN p_guardian_whatsapp_number = '' THEN NULL ELSE p_guardian_whatsapp_number END,
    p_is_minor,
    p_phone_verified,
    p_terms_accepted,
    p_terms_accepted_at
  ) RETURNING id INTO customer_id;

  -- Insert shopping categories
  FOREACH category_item IN ARRAY p_shop_categories LOOP
    INSERT INTO customer_shopping_categories (customer_id, category) 
    VALUES (customer_id, category_item);
  END LOOP;

  -- Insert gift cards
  FOR gift_card IN SELECT * FROM jsonb_array_elements(p_gift_cards) LOOP
    INSERT INTO customer_gift_cards (customer_id, gift_card_type, username) 
    VALUES (
      customer_id, 
      (gift_card->>'id')::TEXT, 
      (gift_card->>'username')::TEXT
    );
  END LOOP;

  -- Insert consoles
  FOREACH console_item IN ARRAY p_consoles LOOP
    INSERT INTO customer_consoles (customer_id, console_type, is_retro) 
    VALUES (customer_id, console_item, false);
  END LOOP;

  -- Insert retro consoles
  FOREACH retro_console_item IN ARRAY p_retro_consoles LOOP
    INSERT INTO customer_consoles (customer_id, console_type, is_retro) 
    VALUES (customer_id, retro_console_item, true);
  END LOOP;

  RETURN customer_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.create_player_profile TO authenticated;

-- Add comments for documentation
COMMENT ON COLUMN customers.first_name IS 'Customer legal first name';
COMMENT ON COLUMN customers.last_name IS 'Customer legal last name';
COMMENT ON COLUMN customers.guardian_first_name IS 'Parent/Guardian legal first name';
COMMENT ON COLUMN customers.guardian_last_name IS 'Parent/Guardian legal last name';
