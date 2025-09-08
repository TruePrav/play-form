-- Update create_player_profile function to include phone_verified parameter
-- Run this in Supabase SQL Editor

-- Drop and recreate the function with phone_verified parameter
DROP FUNCTION IF EXISTS public.create_player_profile CASCADE;

-- Create the updated create_player_profile function with phone_verified parameter
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
    p_phone_verified boolean DEFAULT false,
    p_terms_accepted boolean DEFAULT false,
    p_terms_accepted_at timestamptz DEFAULT NULL,
    p_shop_categories text[] DEFAULT NULL,
    p_gift_cards jsonb DEFAULT NULL,
    p_consoles text[] DEFAULT NULL,
    p_retro_consoles text[] DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_customer_id uuid;
    v_gift_card jsonb;
    v_console text;
    v_category text;
BEGIN
    -- Insert into customers table
    INSERT INTO public.customers (
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
        phone_verified,
        terms_accepted,
        terms_accepted_at,
        source_channel,
        marketing_consent
    ) VALUES (
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
        p_phone_verified,
        p_terms_accepted,
        p_terms_accepted_at,
        'web_form',
        true
    ) RETURNING id INTO v_customer_id;

    -- Insert shopping categories
    IF p_shop_categories IS NOT NULL THEN
        FOREACH v_category IN ARRAY p_shop_categories
        LOOP
            INSERT INTO public.customer_shopping_categories (customer_id, category)
            VALUES (v_customer_id, v_category);
        END LOOP;
    END IF;

    -- Insert gift cards
    IF p_gift_cards IS NOT NULL THEN
        FOR v_gift_card IN SELECT * FROM jsonb_array_elements(p_gift_cards)
        LOOP
            INSERT INTO public.customer_gift_cards (customer_id, gift_card_type, username)
            VALUES (
                v_customer_id,
                v_gift_card->>'id',
                v_gift_card->>'username'
            );
        END LOOP;
    END IF;

    -- Insert consoles
    IF p_consoles IS NOT NULL THEN
        FOREACH v_console IN ARRAY p_consoles
        LOOP
            INSERT INTO public.customer_consoles (customer_id, console_type, is_retro)
            VALUES (v_customer_id, v_console, false);
        END LOOP;
    END IF;

    -- Insert retro consoles
    IF p_retro_consoles IS NOT NULL THEN
        FOREACH v_console IN ARRAY p_retro_consoles
        LOOP
            INSERT INTO public.customer_consoles (customer_id, console_type, is_retro)
            VALUES (v_customer_id, v_console, true);
        END LOOP;
    END IF;

    RETURN v_customer_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.create_player_profile TO authenticated;

-- Test the function (optional)
-- SELECT create_player_profile(
--     'Test User',
--     '2000-01-01',
--     '+12461234567',
--     'test@example.com',
--     'St. Michael',
--     'Male',
--     NULL,
--     NULL,
--     NULL,
--     false,
--     true,  -- phone_verified = true
--     true,
--     NOW(),
--     ARRAY['video_games'],
--     NULL,
--     NULL,
--     NULL
-- );
