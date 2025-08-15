import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Security configuration
const ALLOWED_ORIGINS = [
  'https://play-form.vercel.app',
  'https://play.bb',
  'http://localhost:3000' // Development
]

const isDevelopment = process.env.NODE_ENV === 'development'

export function middleware(request: NextRequest) {
  const origin = request.headers.get('origin')
  const pathname = request.nextUrl.pathname
  
  // Development mode logging
  if (isDevelopment) {
    console.log(`🔧 DEV: Processing request to ${pathname} from origin: ${origin}`)
  }

  // CORS & Origin Protection
  if (origin) {
    // Block requests from unauthorized origins
    if (!ALLOWED_ORIGINS.includes(origin)) {
      if (isDevelopment) {
        console.log(`🚫 DEV: Blocked request from unauthorized origin: ${origin}`)
      }
      return new NextResponse('Forbidden: Unauthorized origin', { 
        status: 403,
        headers: {
          'Content-Type': 'text/plain',
        }
      })
    }
  }

  // Security: Block suspicious user agents (only in production)
  if (!isDevelopment) {
    const userAgent = request.headers.get('user-agent') || ''
    if (userAgent.includes('bot') || userAgent.includes('crawler') || userAgent.includes('spider')) {
      // Allow legitimate search engine bots
      if (!userAgent.includes('Googlebot') && !userAgent.includes('Bingbot')) {
        return new NextResponse('Forbidden: Suspicious user agent', { 
          status: 403,
          headers: {
            'Content-Type': 'text/plain',
          }
        })
      }
    }
  }

  // Security: Block requests with suspicious headers
  const suspiciousHeaders = ['x-forwarded-host', 'x-forwarded-server', 'x-forwarded-uri']
  for (const header of suspiciousHeaders) {
    if (request.headers.get(header)) {
      if (isDevelopment) {
        console.log(`🔍 DEV: Found suspicious header: ${header}`)
      } else {
        return new NextResponse('Forbidden: Suspicious headers', { 
          status: 403,
          headers: {
            'Content-Type': 'text/plain',
          }
        })
      }
    }
  }

  // Create response with security headers
  const response = NextResponse.next()
  
  // CORS Headers
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin)
  }
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  response.headers.set('Access-Control-Allow-Credentials', 'true')
  
  // Security Headers
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  
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
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}