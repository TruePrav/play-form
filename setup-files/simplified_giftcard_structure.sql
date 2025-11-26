-- Simplified Gift Card Structure
-- Single table approach: customer_gift_cards stores both types and usernames
-- This is the most scalable and simple solution

-- 1. Ensure customer_gift_cards table has the right structure
-- (It should already exist, but we'll make sure username can be NULL)
ALTER TABLE public.customer_gift_cards 
  ALTER COLUMN username DROP NOT NULL;

-- Add updated_at column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'customer_gift_cards' 
      AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.customer_gift_cards 
      ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END $$;

-- 2. Add unique constraint if it doesn't exist to prevent duplicates
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'customer_gift_cards_customer_id_gift_card_type_key'
  ) THEN
    ALTER TABLE public.customer_gift_cards 
      ADD CONSTRAINT customer_gift_cards_customer_id_gift_card_type_key 
      UNIQUE(customer_id, gift_card_type);
  END IF;
END $$;

-- 3. Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_customer_gift_cards_customer_id 
  ON public.customer_gift_cards(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_gift_cards_gift_card_type 
  ON public.customer_gift_cards(gift_card_type);
CREATE INDEX IF NOT EXISTS idx_customer_gift_cards_username 
  ON public.customer_gift_cards(username) WHERE username IS NOT NULL;

-- 4. Update the create_player_profile function to use single table
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

  -- Insert gift cards: single table stores both type and username
  -- If customer has a gift card type, there's a row
  -- Username can be NULL if not provided yet
  FOR gift_card IN SELECT * FROM jsonb_array_elements(p_gift_cards) LOOP
    v_gift_card_type := (gift_card->>'id')::TEXT;
    v_gift_card_username := (gift_card->>'username')::TEXT;
    
    -- Insert or update gift card
    -- If username is provided, store it; otherwise store NULL
    INSERT INTO public.customer_gift_cards (customer_id, gift_card_type, username)
    VALUES (
      v_customer_id, 
      v_gift_card_type, 
      CASE WHEN v_gift_card_username IS NOT NULL AND v_gift_card_username != '' 
           THEN v_gift_card_username 
           ELSE NULL 
      END
    )
    ON CONFLICT ON CONSTRAINT customer_gift_cards_customer_id_gift_card_type_key
    DO UPDATE SET 
      username = COALESCE(EXCLUDED.username, customer_gift_cards.username),
      updated_at = CASE WHEN EXCLUDED.username IS NOT NULL THEN NOW() ELSE customer_gift_cards.updated_at END;
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
GRANT EXECUTE ON FUNCTION public.create_player_profile TO authenticated;

-- 6. Add comments for documentation
COMMENT ON TABLE public.customer_gift_cards IS 'Stores gift card types and usernames for each customer. A row exists for each gift card type a customer has, with username being optional.';
COMMENT ON COLUMN public.customer_gift_cards.gift_card_type IS 'Type of gift card (roblox, apple, psn, etc.)';
COMMENT ON COLUMN public.customer_gift_cards.username IS 'Username/account for this gift card type (nullable - customer may have type without username yet)';

-- 8. Optional cleanup: If you previously ran the separate_giftcard_types_and_accounts.sql
-- and created customer_giftcard_accounts table, you can drop it now since we're using
-- customer_gift_cards for everything. Uncomment the line below if needed:
-- DROP TABLE IF EXISTS public.customer_giftcard_accounts CASCADE;

