-- Test database access for Edge Functions
-- Run this in Supabase SQL Editor

-- Check if the table exists and is accessible
SELECT * FROM whatsapp_verifications LIMIT 1;

-- Test inserting a record (this should work with service role)
INSERT INTO whatsapp_verifications (
  phone_number,
  otp_code,
  expires_at,
  verified,
  attempts
) VALUES (
  '+1234567890',
  '123456',
  NOW() + INTERVAL '10 minutes',
  false,
  0
);

-- Check if the insert worked
SELECT * FROM whatsapp_verifications WHERE phone_number = '+1234567890';

-- Clean up test data
DELETE FROM whatsapp_verifications WHERE phone_number = '+1234567890';
