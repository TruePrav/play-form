# Testing Checklist - Simplified Gift Card Structure

## ✅ Pre-Testing Verification

### Database
- [x] Run `simplified_giftcard_structure.sql` migration
- [x] Verify `customer_gift_cards` table exists
- [x] Verify `username` column is nullable
- [x] Verify unique constraint on `(customer_id, gift_card_type)`
- [x] Verify indexes are created
- [x] Verify `updated_at` column exists (added by migration)

### Code Consistency
- [x] `CustomerInfoForm.tsx` sends data as `{id, username}` ✓
- [x] Database function expects `{id, username}` format ✓
- [x] `AdminPanel.tsx` uses `customer_gift_cards` table ✓
- [x] No references to `customer_giftcard_accounts` in source code ✓
- [x] All gift card operations use single table ✓

## 🧪 Testing Steps

### 1. Form Submission Test
- [ ] Submit form with gift cards selected but NO usernames
  - Expected: Gift card types saved, usernames are NULL
- [ ] Submit form with gift cards AND usernames
  - Expected: Both types and usernames saved correctly
- [ ] Submit form with "Other" gift card type
  - Expected: Custom type name saved correctly
- [ ] Submit form with multiple gift cards
  - Expected: All gift cards saved correctly

### 2. Admin Panel Display Test
- [ ] View customer with gift cards
  - Expected: "Gift Card Types" shows all types as badges
  - Expected: "Gift Card Accounts" shows only ones with usernames
- [ ] Edit gift card username
  - Expected: Can edit and save username
  - Expected: Changes persist after refresh
- [ ] View customer with NULL usernames
  - Expected: Warning badge shows "⚠️ NULL Username"
  - Expected: NULL username alert section appears

### 3. CSV Export Test
- [ ] Export CSV with gift cards
  - Expected: "Gift Card Types" column shows types (e.g., "Roblox, Apple iTunes")
  - Expected: "Gift Card Accounts" column shows "Type: Username" pairs
  - Expected: No "undefined" prefixes
  - Expected: Phone numbers don't cause formula errors in Google Sheets

### 4. Filtering Test
- [ ] Filter by gift card type
  - Expected: Only customers with that type shown
- [ ] Filter by "NULL Usernames"
  - Expected: Only customers with NULL usernames shown

### 5. Edge Cases
- [ ] Customer with gift card type but no username
  - Expected: Type appears, no account shown
- [ ] Customer with multiple gift cards, some with usernames
  - Expected: All types shown, only accounts with usernames shown
- [ ] Update username from NULL to value
  - Expected: Account appears in "Gift Card Accounts" section
- [ ] Update username from value to NULL
  - Expected: Account disappears from "Gift Card Accounts" section

## 🔍 Verification Points

1. **Database Structure**
   - Single table: `customer_gift_cards`
   - Columns: `id`, `customer_id`, `gift_card_type`, `username`, `created_at`, `updated_at`
   - Foreign key: `customer_id` → `customers(id)`
   - Unique constraint: `(customer_id, gift_card_type)`

2. **Data Flow**
   - Form → `{id, username}` → Function → `customer_gift_cards` table ✓
   - Admin Panel → Reads from `customer_gift_cards` → Displays separately ✓

3. **No Orphaned Data**
   - All gift card data in `customer_gift_cards` table
   - No references to `customer_giftcard_accounts` table

## 🚨 Common Issues to Watch For

1. **Ambiguous column errors** - Should be fixed with `v_` prefix on variables
2. **NULL username handling** - Should work correctly with nullable column
3. **Duplicate entries** - Prevented by unique constraint
4. **CSV export format** - Should show types and accounts separately

## ✅ Success Criteria

- [ ] Form submissions work without errors
- [ ] Gift card types and usernames save correctly
- [ ] Admin panel displays types and accounts separately
- [ ] CSV export shows correct format
- [ ] No database errors in console
- [ ] All existing data still accessible

