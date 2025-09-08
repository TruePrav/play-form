# Setup Files

This folder contains files used during the initial setup and development of the PLAY Barbados form application.

## Database Setup Files

### `database_update.sql`
- Adds `parish` and `gender` columns to the `customers` table
- Updates the `create_player_profile` RPC function to handle new fields
- Run this in your Supabase SQL editor to add the new form fields

### `otp_database_setup.sql`
- Creates the `whatsapp_verifications` table for OTP storage
- Sets up RLS policies for the OTP table
- Run this before deploying the OTP functions

## Configuration Files

### `supabase.toml`
- Supabase configuration file
- Configures Edge Functions with `verify_jwt = false`
- Used for local development and deployment

## Test Files

### `test-db-access.sql`
- Test queries to verify database connectivity
- Used during development to test database access

### `test-twilio.js`
- Test script for Twilio WhatsApp integration
- Used during development to verify Twilio setup

## Documentation Files

### `supabase_security_config.md`
- Security configuration documentation for Supabase
- Reference for RLS policies and security setup

### `TWILIO_QUICK_SETUP.md`
- Quick setup guide for Twilio WhatsApp integration
- Step-by-step instructions for Twilio configuration

### `TWILIO_SETUP_GUIDE.md`
- Detailed Twilio setup guide
- Comprehensive instructions for WhatsApp API setup

## Documentation Files

### `PRODUCTION_CHECKLIST.md`
- Complete production deployment checklist
- Security, performance, and deployment verification steps
- Use this before going live

### `PRODUCTION_READINESS_REPORT.md`
- Detailed readiness assessment report
- Lists all completed features and fixes
- Reference for production status

### `DATABASE_SETUP.md`
- Database setup instructions
- Function creation and verification steps
- Database configuration guide

### `SECURITY.md`
- Security features documentation
- Authentication, authorization, and protection measures
- Security best practices reference

## Deployment Scripts

### `deploy.bat` (Windows)
- Windows batch script for production deployment
- Automated deployment process for Windows environments

### `deploy.sh` (Linux/Mac)
- Bash script for production deployment
- Automated deployment process for Unix environments

## Deployment Notes

1. **Database Setup**: Run the SQL files in order (otp_database_setup.sql first, then database_update.sql)
2. **Edge Functions**: Deploy with `--no-verify-jwt` flag
3. **Environment Variables**: Ensure Twilio credentials are set in Supabase

## Files Not Needed for Production

These files are only needed for:
- Initial setup
- Development
- Database migrations
- Testing

The main application will work without these files once deployed.
