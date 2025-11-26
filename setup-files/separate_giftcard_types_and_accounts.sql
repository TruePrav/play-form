-- Separate Gift Card Types from Gift Card Accounts
-- This migration creates a new table for gift card accounts (usernames)
-- and updates the structure so gift card types and usernames are stored separately

-- 1. Create the new customer_giftcard_accounts table
CREATE TABLE IF NOT EXISTS public.customer_giftcard_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  gift_card_type TEXT NOT NULL,
  username TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT customer_giftcard_accounts_customer_id_gift_card_type_key UNIQUE(customer_id, gift_card_type)
);

-- 2. Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_customer_giftcard_accounts_customer_id 
  ON public.customer_giftcard_accounts(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_giftcard_accounts_gift_card_type 
  ON public.customer_giftcard_accounts(gift_card_type);

-- 3. Migrate existing data from customer_gift_cards to customer_giftcard_accounts
-- Only migrate rows that have a username
INSERT INTO public.customer_giftcard_accounts (customer_id, gift_card_type, username, created_at)
SELECT cgc.customer_id, cgc.gift_card_type, cgc.username, cgc.created_at
FROM public.customer_gift_cards cgc
WHERE cgc.username IS NOT NULL AND cgc.username != ''
ON CONFLICT ON CONSTRAINT customer_giftcard_accounts_customer_id_gift_card_type_key DO NOTHING;

-- 4. Update the create_player_profile function to save types and accounts separately
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
  v_customer_id UUID;
  gift_card JSONB;
  console_item TEXT;
  retro_console_item TEXT;
  category_item TEXT;
  v_gift_card_type TEXT;
  v_gift_card_username TEXT;
BEGIN
  -- Insert customer with separate name fields
  INSERT INTO customers (
    first_name,
    last_name,
    full_name,
    date_of_birth,
    whatsapp_number,
    email,
    parish,
    gender,
    guardian_first_name,
    guardian_last_name,
    guardian_full_name,
    guardian_date_of_birth,
    guardian_whatsapp_number,
    is_minor,
    phone_verified,
    terms_accepted,
    terms_accepted_at
  ) VALUES (
    p_first_name,
    p_last_name,
    CONCAT(p_first_name, ' ', p_last_name),
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
    END,
    p_guardian_date_of_birth,
    CASE WHEN p_guardian_whatsapp_number = '' THEN NULL ELSE p_guardian_whatsapp_number END,
    p_is_minor,
    p_phone_verified,
    p_terms_accepted,
    p_terms_accepted_at
  ) RETURNING id INTO v_customer_id;

  -- Insert shopping categories
  FOREACH category_item IN ARRAY p_shop_categories LOOP
    INSERT INTO customer_shopping_categories (customer_id, category) 
    VALUES (v_customer_id, category_item);
  END LOOP;

  -- Insert gift card types and accounts separately
  FOR gift_card IN SELECT * FROM jsonb_array_elements(p_gift_cards) LOOP
    v_gift_card_type := (gift_card->>'id')::TEXT;
    v_gift_card_username := (gift_card->>'username')::TEXT;
    
    -- Insert gift card type (keep in customer_gift_cards for backward compatibility, but without username)
    -- Check if it already exists first to avoid duplicates
    IF NOT EXISTS (
      SELECT 1 FROM customer_gift_cards cgc
      WHERE cgc.customer_id = v_customer_id 
        AND cgc.gift_card_type = v_gift_card_type
    ) THEN
      INSERT INTO customer_gift_cards (customer_id, gift_card_type, username)
      VALUES (v_customer_id, v_gift_card_type, NULL);
    END IF;
    
    -- Insert or update username in customer_giftcard_accounts if provided
    IF v_gift_card_username IS NOT NULL AND v_gift_card_username != '' THEN
      INSERT INTO public.customer_giftcard_accounts (customer_id, gift_card_type, username)
      VALUES (v_customer_id, v_gift_card_type, v_gift_card_username)
      ON CONFLICT ON CONSTRAINT customer_giftcard_accounts_customer_id_gift_card_type_key
      DO UPDATE SET 
        username = EXCLUDED.username, 
        updated_at = NOW();
    END IF;
  END LOOP;

  -- Insert consoles
  FOREACH console_item IN ARRAY p_consoles LOOP
    INSERT INTO customer_consoles (customer_id, console_type, is_retro) 
    VALUES (v_customer_id, console_item, false);
  END LOOP;

  -- Insert retro consoles
  FOREACH console_item IN ARRAY p_retro_consoles LOOP
    INSERT INTO customer_consoles (customer_id, console_type, is_retro) 
    VALUES (v_customer_id, console_item, true);
  END LOOP;

  RETURN v_customer_id;
END;
$$;

-- 5. Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_giftcard_accounts TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_player_profile TO authenticated;

-- 6. Add comments for documentation
COMMENT ON TABLE public.customer_giftcard_accounts IS 'Stores usernames/accounts for each gift card type per customer';
COMMENT ON COLUMN public.customer_giftcard_accounts.gift_card_type IS 'Type of gift card (roblox, apple, psn, etc.)';
COMMENT ON COLUMN public.customer_giftcard_accounts.username IS 'Username/account for this gift card type';

