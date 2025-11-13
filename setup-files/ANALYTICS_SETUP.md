# Analytics Setup Guide

## Overview

The giveaway tracking system now stores analytics events in your Supabase database, allowing you to view them directly in the admin panel. Events are also still sent to Google Analytics/GTM if configured.

## How Tracking Works

### Current Implementation

1. **Dual Tracking**: Events are sent to both:
   - Google Analytics/GTM (if configured) - for external analytics
   - Supabase database - for admin panel viewing

2. **Tracked Events**:
   - `giveaway_cta_click` - When users click "Enter the Giveaway" button
   - `giveaway_submit_success` - When users successfully submit the form

3. **Data Collected**:
   - Event type and name
   - User agent (browser info)
   - Referrer (where they came from)
   - Page URL
   - Session ID (30-minute sessions)
   - Timestamp

## Setup Steps

### 1. Run Database Setup

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Open and run `setup-files/analytics_database_setup.sql`
4. This will create:
   - `analytics_events` table
   - `log_analytics_event` function
   - `analytics_summary` view
   - Required indexes and RLS policies

### 2. Verify Setup

After running the SQL, verify:
- Table `analytics_events` exists
- Function `log_analytics_event` exists
- View `analytics_summary` exists

### 3. Test Tracking

1. Visit your homepage
2. Click the "Enter the Giveaway" button
3. Check the admin panel - you should see the event appear

## Admin Panel Analytics

### Accessing Analytics

1. Log into the admin panel
2. Click "Show Analytics" button
3. View:
   - **Summary Stats**: Total CTA clicks, form submissions, unique sessions
   - **Daily Summary**: Events grouped by date
   - **Recent Events**: Last 20 events with timestamps

### Analytics Features

- **Real-time Updates**: Refresh the page to see latest events
- **Session Tracking**: Unique sessions are tracked (30-minute windows)
- **Event Details**: See page URLs, timestamps, and event types

## Code Integration

### For Form Submission Tracking

The form should call `window.gwTrackSubmitSuccess()` on successful submission:

```javascript
// In your form success handler
if (window.gwTrackSubmitSuccess) {
  window.gwTrackSubmitSuccess();
}
```

This is already set up in the CustomerInfoForm component.

## Troubleshooting

### No Events Appearing

1. **Check Database Setup**: Ensure SQL script ran successfully
2. **Check RLS Policies**: Verify anonymous users can insert events
3. **Check Browser Console**: Look for any errors in the console
4. **Check Network Tab**: Verify API calls to Supabase are succeeding

### Events Not Saving

- Check Supabase logs for errors
- Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set
- Ensure RLS policies allow anonymous inserts

## Database Schema

### analytics_events Table

```sql
- id: uuid (primary key)
- event_type: text (e.g., 'giveaway')
- event_name: text (e.g., 'giveaway_cta_click')
- user_agent: text (optional)
- referrer: text (optional)
- page_url: text (optional)
- session_id: text (optional)
- created_at: timestamp
```

### analytics_summary View

Aggregated view showing:
- Event name
- Event type
- Event date
- Event count
- Unique sessions

## Performance Considerations

- Events are inserted asynchronously (won't block user experience)
- Only last 100 events are loaded in admin panel
- Summary view is pre-aggregated for fast queries
- Indexes are created for common query patterns

