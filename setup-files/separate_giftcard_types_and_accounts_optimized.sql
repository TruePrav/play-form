-- Optimized Gift Card Types and Accounts Separation
-- This version uses a single table approach that's more scalable and cleaner
-- customer_giftcard_accounts will store both types and usernames

-- 1. Create the optimized customer_giftcard_accounts table
CREATE TABLE IF NOT EXISTS public.customer_giftcard_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  gift_card_type TEXT NOT NULL,
  username TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT customer_giftcard_accounts_customer_id_gift_card_type_key UNIQUE(customer_id, gift_card_type)
);

-- 2. Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_customer_giftcard_accounts_customer_id 
  ON public.customer_giftcard_accounts(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_giftcard_accounts_gift_card_type 
  ON public.customer_giftcard_accounts(gift_card_type);
CREATE INDEX IF NOT EXISTS idx_customer_giftcard_accounts_username 
  ON public.customer_giftcard_accounts(username) WHERE username IS NOT NULL;

-- 3. Migrate existing data from customer_gift_cards to customer_giftcard_accounts
-- Migrate all rows (with or without usernames) to the new table
INSERT INTO public.customer_giftcard_accounts (customer_id, gift_card_type, username, created_at)
SELECT cgc.customer_id, cgc.gift_card_type, 
       CASE WHEN cgc.username IS NOT NULL AND cgc.username != '' THEN cgc.username ELSE NULL END,
       cgc.created_at
FROM public.customer_gift_cards cgc
ON CONFLICT ON CONSTRAINT customer_giftcard_accounts_customer_id_gift_card_type_key DO NOTHING;

-- 4. Update the create_player_profile function to use only customer_giftcard_accounts
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
  gift_card_type TEXT;
  gift_card_username TEXT;
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

  -- Insert gift card types and accounts into single table
  -- This table stores both: if a customer has a gift card type, there's a row
  -- If they also have a username, it's stored in the same row
  FOR gift_card IN SELECT * FROM jsonb_array_elements(p_gift_cards) LOOP
    gift_card_type := (gift_card->>'id')::TEXT;
    gift_card_username := (gift_card->>'username')::TEXT;
    
    -- Insert or update: always create a row for the gift card type
    -- Username can be NULL if not provided
    INSERT INTO public.customer_giftcard_accounts (customer_id, gift_card_type, username)
    VALUES (
      v_customer_id, 
      gift_card_type, 
      CASE WHEN gift_card_username IS NOT NULL AND gift_card_username != '' 
           THEN gift_card_username 
           ELSE NULL 
      END
    )
    ON CONFLICT ON CONSTRAINT customer_giftcard_accounts_customer_id_gift_card_type_key
    DO UPDATE SET 
      username = COALESCE(EXCLUDED.username, customer_giftcard_accounts.username),
      updated_at = CASE WHEN EXCLUDED.username IS NOT NULL THEN NOW() ELSE customer_giftcard_accounts.updated_at END;
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
COMMENT ON TABLE public.customer_giftcard_accounts IS 'Stores gift card types and usernames for each customer. A row exists for each gift card type a customer has, with username being optional.';
COMMENT ON COLUMN public.customer_giftcard_accounts.gift_card_type IS 'Type of gift card (roblox, apple, psn, etc.)';
COMMENT ON COLUMN public.customer_giftcard_accounts.username IS 'Username/account for this gift card type (nullable - customer may have type without username yet)';

-- 7. Optional: You can deprecate customer_gift_cards table later if desired
-- For now, we keep it for backward compatibility, but new data goes to customer_giftcard_accounts

