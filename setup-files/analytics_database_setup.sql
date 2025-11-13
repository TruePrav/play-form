-- Analytics Database Setup for Giveaway Tracking
-- Run this in your Supabase SQL Editor

-- 1. Create analytics events table
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  event_name text NOT NULL,
  user_agent text,
  referrer text,
  page_url text,
  session_id text,
  created_at timestamp with time zone DEFAULT now()
);

-- 2. Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON public.analytics_events (event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_name ON public.analytics_events (event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created ON public.analytics_events (created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session ON public.analytics_events (session_id);

-- 3. Create function to log analytics events
CREATE OR REPLACE FUNCTION public.log_analytics_event(
  p_event_type text,
  p_event_name text,
  p_user_agent text DEFAULT NULL,
  p_referrer text DEFAULT NULL,
  p_page_url text DEFAULT NULL,
  p_session_id text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  event_id uuid;
BEGIN
  INSERT INTO public.analytics_events (
    event_type,
    event_name,
    user_agent,
    referrer,
    page_url,
    session_id
  ) VALUES (
    p_event_type,
    p_event_name,
    p_user_agent,
    p_referrer,
    p_page_url,
    p_session_id
  ) RETURNING id INTO event_id;
  
  RETURN event_id;
END;
$$;

-- 4. Grant permissions
GRANT SELECT, INSERT ON public.analytics_events TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_analytics_event TO authenticated;
GRANT SELECT ON public.analytics_events TO anon;

-- 5. Enable RLS
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies
-- Allow authenticated users to insert events
CREATE POLICY "Allow authenticated users to insert events" ON public.analytics_events
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to read all events (for admin panel)
CREATE POLICY "Allow authenticated users to read events" ON public.analytics_events
  FOR SELECT TO authenticated
  USING (true);

-- Allow anonymous users to insert events (for tracking)
CREATE POLICY "Allow anonymous users to insert events" ON public.analytics_events
  FOR INSERT TO anon
  WITH CHECK (true);

-- 7. Create view for analytics summary
CREATE OR REPLACE VIEW public.analytics_summary AS
SELECT 
  event_name,
  event_type,
  DATE(created_at) as event_date,
  COUNT(*) as event_count,
  COUNT(DISTINCT session_id) as unique_sessions
FROM public.analytics_events
GROUP BY event_name, event_type, DATE(created_at)
ORDER BY event_date DESC, event_count DESC;

-- Grant access to the view
GRANT SELECT ON public.analytics_summary TO authenticated;
