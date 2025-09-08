-- Database Update for PLAY Barbados Form
-- Add parish and gender fields to customers table and update RPC function

-- 1. Add new columns to customers table
ALTER TABLE public.customers 
ADD COLUMN IF NOT EXISTS parish text,
ADD COLUMN IF NOT EXISTS gender text;

-- 2. Add comments for documentation
COMMENT ON COLUMN public.customers.parish IS 'Barbados parish where the customer resides';
COMMENT ON COLUMN public.customers.gender IS 'Customer gender preference';

-- 3. Drop all existing versions of the function to avoid conflicts
DROP FUNCTION IF EXISTS public.create_player_profile CASCADE;

-- 4. Create the create_player_profile function with new parameters
CREATE OR REPLACE FUNCTION public.create_player_profile(
    p_full_name text,
    p_date_of_birth date,
    p_whatsapp_number text,
    p_email text DEFAULT NULL,
    p_parish text DEFAULT NULL,
    p_gender text DEFAULT NULL,
    p_guardian_full_name text DEFAULT NULL,
    p_guardian_date_of_birth date DEFAULT NULL,
    p_guardian_whatsapp_number text DEFAULT NULL,
    p_is_minor boolean DEFAULT false,
    p_terms_accepted boolean DEFAULT false,
    p_terms_accepted_at timestamp with time zone DEFAULT NULL,
    p_shop_categories text[] DEFAULT ARRAY[]::text[],
    p_gift_cards jsonb DEFAULT '[]'::jsonb,
    p_consoles text[] DEFAULT ARRAY[]::text[],
    p_retro_consoles text[] DEFAULT ARRAY[]::text[]
)
RETURNS uuid
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
  INSERT INTO customers (
    full_name,
    date_of_birth,
    whatsapp_number,
    email,
    parish,
    gender,
    guardian_full_name,
    guardian_date_of_birth,
    guardian_whatsapp_number,
    is_minor,
    terms_accepted,
    terms_accepted_at
  ) VALUES (
    p_full_name,
    p_date_of_birth,
    p_whatsapp_number,
    p_email,
    p_parish,
    p_gender,
    p_guardian_full_name,
    p_guardian_date_of_birth,
    CASE 
      WHEN p_guardian_whatsapp_number = '' THEN NULL 
      ELSE p_guardian_whatsapp_number 
    END,
    p_is_minor,
    p_terms_accepted,
    p_terms_accepted_at
  ) RETURNING id INTO customer_id;

  FOREACH category_item IN ARRAY p_shop_categories
  LOOP
    INSERT INTO customer_shopping_categories (customer_id, category)
    VALUES (customer_id, category_item);
  END LOOP;

  FOR gift_card IN SELECT * FROM jsonb_array_elements(p_gift_cards)
  LOOP
    INSERT INTO customer_gift_cards (customer_id, gift_card_type, username)
    VALUES (
      customer_id,
      (gift_card->>'id')::TEXT,
      (gift_card->>'username')::TEXT
    );
  END LOOP;

  FOREACH console_item IN ARRAY p_consoles
  LOOP
    INSERT INTO customer_consoles (customer_id, console_type, is_retro)
    VALUES (customer_id, console_item, false);
  END LOOP;

  FOREACH retro_console_item IN ARRAY p_retro_consoles
  LOOP
    INSERT INTO customer_consoles (customer_id, console_type, is_retro)
    VALUES (customer_id, retro_console_item, true);
  END LOOP;

  RETURN customer_id;
END;
$$;

-- 5. Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.create_player_profile TO authenticated;

-- 6. Create a simple wrapper function for basic success/failure response
CREATE OR REPLACE FUNCTION public.create_player_profile_simple(
    p_full_name text,
    p_date_of_birth date,
    p_whatsapp_number text,
    p_email text DEFAULT NULL,
    p_parish text DEFAULT NULL,
    p_gender text DEFAULT NULL,
    p_guardian_full_name text DEFAULT NULL,
    p_guardian_date_of_birth date DEFAULT NULL,
    p_guardian_whatsapp_number text DEFAULT NULL,
    p_is_minor boolean DEFAULT false,
    p_terms_accepted boolean DEFAULT false,
    p_terms_accepted_at timestamp with time zone DEFAULT NULL,
    p_shop_categories text[] DEFAULT ARRAY[]::text[],
    p_gift_cards jsonb DEFAULT '[]'::jsonb,
    p_consoles text[] DEFAULT ARRAY[]::text[],
    p_retro_consoles text[] DEFAULT ARRAY[]::text[]
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    PERFORM public.create_player_profile(
        p_full_name,
        p_date_of_birth,
        p_whatsapp_number,
        p_email,
        p_parish,
        p_gender,
        p_guardian_full_name,
        p_guardian_date_of_birth,
        p_guardian_whatsapp_number,
        p_is_minor,
        p_terms_accepted,
        p_terms_accepted_at,
        p_shop_categories,
        p_gift_cards,
        p_consoles,
        p_retro_consoles
    );
    RETURN true;
EXCEPTION
    WHEN OTHERS THEN
        RETURN false;
END;
$$;

-- 7. Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.create_player_profile_simple TO authenticated;

-- 8. Test the function (optional - remove this section after testing)
-- Uncomment the following lines to test the function:
/*
SELECT create_player_profile(
    'Test User',
    '2000-01-01',
    '+12461234567',
    'test@example.com',
    'st_michael',
    'male',
    NULL,
    NULL,
    NULL,
    false,
    true,
    NOW(),
    ARRAY['video_games', 'gift_cards'],
    '[{"id": "amazon", "username": "testuser"}]'::jsonb,
    ARRAY['xboxone'],
    ARRAY['ps1']
);
*/
