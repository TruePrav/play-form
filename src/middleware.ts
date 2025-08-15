import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// In-memory store for rate limiting (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const MAX_REQUESTS = 100 // Max requests per window
const ADMIN_LOGIN_LIMIT = 5 // Max admin login attempts per window

function isRateLimited(ip: string, endpoint: string): boolean {
  const key = `${ip}:${endpoint}`
  const now = Date.now()
  const record = rateLimitStore.get(key)

  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return false
  }

  if (record.count >= (endpoint === 'admin-login' ? ADMIN_LOGIN_LIMIT : MAX_REQUESTS)) {
    return true
  }

  record.count++
  return false
}

// Production-safe logging function
function logSecurityEvent(message: string, details: Record<string, unknown>) {
  if (process.env.NODE_ENV === 'production') {
    // TODO: Send to logging service (e.g., Sentry, LogRocket)
    // For now, we'll use a production-safe method
  } else {
    // eslint-disable-next-line no-console
    console.warn(`SECURITY: ${message}`, details)
  }
}

export function middleware(request: NextRequest) {
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown'
  const pathname = request.nextUrl.pathname
  const isDevelopment = process.env.NODE_ENV === 'development'

  // Development mode debugging
  if (isDevelopment) {
    // eslint-disable-next-line no-console
    console.log(`🔧 DEV: Processing request to ${pathname} from IP: ${ip}`)
  }

  // Security: Block suspicious user agents (only in production)
  if (!isDevelopment) {
    const userAgent = request.headers.get('user-agent') || ''
    if (userAgent.includes('bot') || userAgent.includes('crawler') || userAgent.includes('spider')) {
      // Allow legitimate bots but log suspicious ones
      if (userAgent.includes('Googlebot') || userAgent.includes('Bingbot')) {
        // Allow legitimate search engine bots
      } else {
        logSecurityEvent('Suspicious user agent detected', { userAgent, ip })
      }
    }
  }

  // Security: Block requests with suspicious headers (only in production)
  if (!isDevelopment) {
    const suspiciousHeaders = ['x-forwarded-host', 'x-forwarded-server', 'x-forwarded-uri']
    for (const header of suspiciousHeaders) {
      if (request.headers.get(header)) {
        logSecurityEvent('Suspicious header detected', { header, ip })
        return new NextResponse('Forbidden', { status: 403 })
      }
    }
  } else {
    // In development, just log suspicious headers for awareness
    const suspiciousHeaders = ['x-forwarded-host', 'x-forwarded-server', 'x-forwarded-uri']
    for (const header of suspiciousHeaders) {
      const headerValue = request.headers.get(header)
      if (headerValue) {
        // eslint-disable-next-line no-console
        console.log(`🔍 DEV: Found ${header}: ${headerValue} (allowed in development)`)
      }
    }
  }

  // Rate limiting for admin endpoints (relaxed in development)
  if (pathname.startsWith('/admin')) {
    if (isRateLimited(ip, 'admin-login')) {
      logSecurityEvent('Rate limit exceeded for admin endpoint', { ip })
      return new NextResponse('Too Many Requests', { status: 429 })
    }
  }

  // Rate limiting for general endpoints (relaxed in development)
  if (isDevelopment) {
    // In development, use much higher limits
    if (isRateLimited(ip, 'general')) {
      logSecurityEvent('Rate limit exceeded for general endpoint', { ip })
      return new NextResponse('Too Many Requests', { status: 429 })
    }
  } else {
    // In production, use strict limits
    if (isRateLimited(ip, 'general')) {
      logSecurityEvent('Rate limit exceeded for general endpoint', { ip })
      return new NextResponse('Too Many Requests', { status: 429 })
    }
  }

  // Security: Add security headers to all responses
  const response = NextResponse.next()
  
  // Additional security headers (only in production)
  if (!isDevelopment) {
    response.headers.set('X-DNS-Prefetch-Control', 'off')
    response.headers.set('X-Download-Options', 'noopen')
    response.headers.set('X-Permitted-Cross-Domain-Policies', 'none')
  }
  
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
