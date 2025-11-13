/**
 * Analytics tracking utility
 * Sends events to both Google Analytics/GTM and our database
 */

interface AnalyticsEvent {
  eventType: string;
  eventName: string;
  userAgent?: string;
  referrer?: string;
  pageUrl?: string;
  sessionId?: string;
}

// Generate or retrieve session ID
function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  
  const storageKey = 'analytics_session_id';
  const sessionExpiry = 30 * 60 * 1000; // 30 minutes
  
  let sessionId = sessionStorage.getItem(storageKey);
  const sessionTimestamp = sessionStorage.getItem(`${storageKey}_timestamp`);
  
  // Check if session expired
  if (sessionId && sessionTimestamp) {
    const timestamp = parseInt(sessionTimestamp, 10);
    if (Date.now() - timestamp > sessionExpiry) {
      sessionId = null;
    }
  }
  
  // Create new session if needed
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem(storageKey, sessionId);
    sessionStorage.setItem(`${storageKey}_timestamp`, Date.now().toString());
  }
  
  return sessionId;
}

/**
 * Track an analytics event
 * Sends to both Google Analytics/GTM and our database
 */
export async function trackEvent(eventName: string, eventType: string = 'giveaway'): Promise<void> {
  if (typeof window === 'undefined') return;
  
  // 1. Send to Google Analytics / GTM (existing behavior)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const win = window as any;
  if (win.gtag) {
    win.gtag('event', eventName);
  } else if (win.dataLayer) {
    win.dataLayer.push({ event: eventName });
  }
  
  // 2. Send to our database
  try {
    const { supabase } = await import('@/lib/supabase');
    
    const event: AnalyticsEvent = {
      eventType,
      eventName,
      userAgent: navigator.userAgent,
      referrer: document.referrer || undefined,
      pageUrl: window.location.href,
      sessionId: getSessionId(),
    };
    
    const { error } = await supabase.rpc('log_analytics_event', {
      p_event_type: event.eventType,
      p_event_name: event.eventName,
      p_user_agent: event.userAgent,
      p_referrer: event.referrer,
      p_page_url: event.pageUrl,
      p_session_id: event.sessionId,
    });
    
    if (error) {
      // Silently fail - don't break the user experience if analytics fails
      // Only log in development
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.error('Failed to log analytics event:', error);
      }
    }
  } catch (error) {
    // Silently fail - don't break the user experience if analytics fails
    // Only log in development
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.error('Analytics tracking error:', error);
    }
  }
}

/**
 * Track CTA click
 */
export function trackCTAClick(): void {
  trackEvent('giveaway_cta_click', 'giveaway');
}

/**
 * Track form submit success
 */
export function trackSubmitSuccess(): void {
  trackEvent('giveaway_submit_success', 'giveaway');
}

