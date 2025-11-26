# Gift Card Types and Accounts Separation Migration

## Overview
This migration separates gift card types from gift card usernames/accounts into different storage structures:
- **Gift Card Types**: Stored in `customer_gift_cards` table (just the types: Roblox, Apple, PSN, etc.)
- **Gift Card Accounts**: Stored in new `customer_giftcard_accounts` table (usernames linked to each type)

## Migration Steps

### 1. Run the SQL Migration
Execute the SQL file in your Supabase SQL Editor:
```sql
-- Run: setup-files/separate_giftcard_types_and_accounts.sql
```

This will:
- Create the new `customer_giftcard_accounts` table
- Migrate existing username data from `customer_gift_cards` to the new table
- Update the `create_player_profile` function to save types and accounts separately

### 2. Verify the Migration
After running the migration:
1. Check that `customer_giftcard_accounts` table exists
2. Verify existing data was migrated correctly
3. Test creating a new customer with gift cards

## Changes Made

### Database Structure
- **New Table**: `customer_giftcard_accounts`
  - `id` (UUID, primary key)
  - `customer_id` (UUID, foreign key to customers)
  - `gift_card_type` (TEXT)
  - `username` (TEXT, nullable)
  - `created_at` (TIMESTAMP)
  - `updated_at` (TIMESTAMP)
  - Unique constraint on `(customer_id, gift_card_type)`

- **Updated Table**: `customer_gift_cards`
  - Still stores gift card types (for backward compatibility)
  - `username` field is now deprecated (set to NULL for new entries)

### Code Changes

#### AdminPanel.tsx
- Added `CustomerGiftCardAccount` interface
- Added `giftCardAccounts` state
- Updated `fetchData()` to fetch from `customer_giftcard_accounts`
- Added `getCustomerGiftCardAccounts()` helper function
- Updated display to show:
  - **Gift Card Types**: Just the types (Roblox, Apple, PSN, etc.) as badges
  - **Gift Card Accounts**: Usernames with their associated types, editable
- Updated CSV export to have separate columns:
  - `Gift Card Types`: Comma-separated list of types
  - `Gift Card Accounts`: Semicolon-separated list of "Type: Username" pairs
- Updated `handleSaveGiftCard()` to save to `customer_giftcard_accounts` table
- Updated null username detection logic

#### CustomerInfoForm.tsx
- No changes needed - form still sends data in the same format
- Database function handles the separation automatically

## CSV Export Format

The CSV export now includes:
- **Gift Card Types**: `Roblox, Apple iTunes, PlayStation Network`
- **Gift Card Accounts**: `Roblox: username123; Apple iTunes: appleuser; PlayStation Network: psnuser`

## Backward Compatibility

- Existing data is automatically migrated
- `customer_gift_cards` table is kept for backward compatibility
- The form submission format remains unchanged
- The database function handles both old and new data structures

## Testing Checklist

- [ ] Run SQL migration
- [ ] Verify `customer_giftcard_accounts` table exists
- [ ] Check existing data was migrated
- [ ] Test creating new customer with gift cards
- [ ] Verify AdminPanel displays types and accounts separately
- [ ] Test editing gift card usernames
- [ ] Verify CSV export shows separate columns
- [ ] Test null username detection and filtering

