-- OTP Verification Database Setup
-- Run this in your Supabase SQL Editor

-- 1. Create OTP verification table
CREATE TABLE IF NOT EXISTS public.whatsapp_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number text NOT NULL,
  otp_code text NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  verified boolean DEFAULT false,
  attempts integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  verified_at timestamp with time zone NULL
);

-- 2. Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_whatsapp_verifications_phone 
ON public.whatsapp_verifications (phone_number);

CREATE INDEX IF NOT EXISTS idx_whatsapp_verifications_expires 
ON public.whatsapp_verifications (expires_at);

-- 3. Create function to clean up expired OTPs
CREATE OR REPLACE FUNCTION public.cleanup_expired_otps()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.whatsapp_verifications 
  WHERE expires_at < NOW() - INTERVAL '1 hour';
END;
$$;

-- 4. Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_verifications TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_otps TO authenticated;

-- 5. Create RLS policies
ALTER TABLE public.whatsapp_verifications ENABLE ROW LEVEL SECURITY;

-- Allow users to insert their own OTPs
CREATE POLICY "Users can insert their own OTPs" ON public.whatsapp_verifications
  FOR INSERT WITH CHECK (true);

-- Allow users to update their own OTPs
CREATE POLICY "Users can update their own OTPs" ON public.whatsapp_verifications
  FOR UPDATE USING (true);

-- Allow users to select their own OTPs
CREATE POLICY "Users can select their own OTPs" ON public.whatsapp_verifications
  FOR SELECT USING (true);
