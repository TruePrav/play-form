# 🚀 Quick Twilio Setup Guide

## 1. Environment Variables

Add to your `.env.local` file:

```bash
# Twilio Configuration
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_actual_auth_token_here
TWILIO_PHONE_NUMBER=+14155238886
```

**Important:** Replace `your_actual_auth_token_here` with your real auth token from Twilio console.

## 2. Get Your Auth Token

1. Go to [Twilio Console](https://console.twilio.com)
2. Find **Account SID** and **Auth Token** on the dashboard
3. Copy the **Auth Token** (it's hidden by default, click to reveal)

## 3. Test Your Setup

You can test if your credentials work by running this in your terminal:

```bash
curl -X POST https://api.twilio.com/2010-04-01/Accounts/ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx/Messages.json \
  --data-urlencode "From=+14155238886" \
  --data-urlencode "To=+12461234567" \
  --data-urlencode "Body=Test message from PLAY Barbados" \
  -u ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx:your_auth_token_here
```

Replace `+12461234567` with your actual phone number for testing.

## 4. Deploy Edge Functions

```bash
# Install Supabase CLI if you haven't
npm install -g supabase

# Login and link your project
supabase login
supabase link --project-ref your-project-ref

# Deploy functions
supabase functions deploy send-otp
supabase functions deploy verify-otp

# Set secrets
supabase secrets set TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
supabase secrets set TWILIO_AUTH_TOKEN=your_actual_auth_token_here
supabase secrets set TWILIO_PHONE_NUMBER=+14155238886
```

## 5. Test the Form

1. Start your development server: `npm run dev`
2. Go to your form
3. Enter your phone number on Page 1
4. Click "Next" - you should receive an SMS with the OTP code

## 🔧 Troubleshooting

- **No SMS received**: Check your phone number format (include country code)
- **Function errors**: Check Supabase function logs
- **Auth errors**: Verify your Twilio credentials are correct
- **Rate limits**: Twilio has rate limits for trial accounts

## 📱 Phone Number Format

Make sure phone numbers are in international format:
- ✅ `+12461234567` (Barbados)
- ✅ `+1234567890` (US)
- ❌ `2461234567` (missing +)
- ❌ `12461234567` (missing +)
