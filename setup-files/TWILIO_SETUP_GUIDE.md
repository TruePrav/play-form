# 🚀 Twilio SMS OTP Setup Guide

## 📋 Step 1: Environment Variables

Add these to your `.env.local` file:

```bash
# Twilio Configuration
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
```

## 📋 Step 2: Deploy Edge Functions

1. Install Supabase CLI:
```bash
npm install -g supabase
```

2. Login to Supabase:
```bash
supabase login
```

3. Link your project:
```bash
supabase link --project-ref your-project-ref
```

4. Deploy the functions:
```bash
supabase functions deploy send-otp
supabase functions deploy verify-otp
```

5. Set environment variables for functions:
```bash
supabase secrets set TWILIO_ACCOUNT_SID=your_account_sid
supabase secrets set TWILIO_AUTH_TOKEN=your_auth_token
supabase secrets set TWILIO_PHONE_NUMBER=+1234567890
```

## 📋 Step 3: Database Setup

Run the `otp_database_setup.sql` file in your Supabase SQL Editor.

## 📋 Step 4: Test the Setup

1. Go to your Supabase project dashboard
2. Navigate to **Edge Functions**
3. Test the `send-otp` function with:
```json
{
  "phoneNumber": "+12461234567"
}
```

4. Test the `verify-otp` function with:
```json
{
  "phoneNumber": "+12461234567",
  "otpCode": "123456"
}
```

## 📋 Step 5: Frontend Integration

The next steps will involve:
1. Creating OTP input components
2. Adding verification to your form
3. Handling verification states

## 🔧 Troubleshooting

### Common Issues:
1. **Twilio credentials not working**: Double-check your Account SID and Auth Token
2. **Phone number format**: Ensure phone numbers include country code (+1 for US/Barbados)
3. **Edge function errors**: Check the Supabase function logs
4. **Database permissions**: Ensure RLS policies are set correctly

### Testing:
- Use your own phone number for testing
- Check Twilio console for message delivery status
- Monitor Supabase function logs for errors
