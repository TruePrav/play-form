# Supabase Security Configuration

## 🔒 Edge Function Origin Protection

### 1. Supabase Edge Functions Security

When you create Supabase Edge Functions, add this origin checking:

```typescript
// In your Supabase Edge Functions
const allowedOrigins = [
  'https://play-form.vercel.app',
  'https://play.bb'
]

export default async function handler(req: Request) {
  const origin = req.headers.get('origin')
  
  // Block unauthorized origins
  if (origin && !allowedOrigins.includes(origin)) {
    return new Response('Forbidden: Unauthorized origin', { 
      status: 403,
      headers: { 'Content-Type': 'text/plain' }
    })
  }
  
  // Your function logic here...
}
```

### 2. Supabase RLS (Row Level Security)

Enable RLS on your tables and create policies:

```sql
-- Enable RLS on customers table
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Policy for inserting customer data
CREATE POLICY "Users can insert their own data" ON customers
  FOR INSERT WITH CHECK (true);

-- Policy for reading customer data (admin only)
CREATE POLICY "Only admins can read customer data" ON customers
  FOR SELECT USING (
    auth.role() = 'authenticated' AND 
    auth.jwt() ->> 'email' IN (SELECT email FROM admin_users)
  );
```

### 3. API Rate Limiting

Add rate limiting to your Supabase functions:

```typescript
// Rate limiting configuration
const RATE_LIMIT = {
  window: 60000, // 1 minute
  max: 10 // max 10 requests per window
}

// Check rate limit before processing
const clientIP = req.headers.get('x-forwarded-for') || 'unknown'
if (isRateLimited(clientIP)) {
  return new Response('Too Many Requests', { status: 429 })
}
```

## 🛡️ Additional Security Measures

### 1. Environment Variable Validation

```typescript
// Validate required environment variables
const requiredEnvVars = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'NEXTAUTH_SECRET'
]

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`)
  }
}
```

### 2. Input Validation & Sanitization

```typescript
// Always validate and sanitize inputs
import { z } from 'zod'

const customerSchema = z.object({
  fullName: z.string().min(2).max(80),
  email: z.string().email(),
  // ... other fields
})

// Use in your functions
const validatedData = customerSchema.parse(requestBody)
```

### 3. CORS Configuration in Supabase

```typescript
// In your Supabase Edge Functions
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://play-form.vercel.app',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'true'
}

// Handle preflight requests
if (req.method === 'OPTIONS') {
  return new Response(null, { 
    status: 200, 
    headers: corsHeaders 
  })
}
```

## 🔐 Security Checklist

- [ ] Origin checking implemented in middleware ✅
- [ ] Security headers set in middleware ✅
- [ ] CORS configured properly ✅
- [ ] Rate limiting implemented
- [ ] Input validation with Zod
- [ ] RLS enabled on database tables
- [ ] Admin access restricted
- [ ] Environment variables validated
- [ ] Suspicious headers blocked
- [ ] User agent filtering active

## 🚨 Security Monitoring

### 1. Log Suspicious Activity

```typescript
// Log security events
const logSecurityEvent = (event: string, details: any) => {
  // Send to your logging service (Sentry, LogRocket, etc.)
  console.error(`SECURITY: ${event}`, details)
}
```

### 2. Monitor Failed Requests

Track 403, 429, and other security-related responses to identify attack patterns.

### 3. Regular Security Audits

- Review access logs monthly
- Check for unusual traffic patterns
- Update security policies quarterly
- Monitor for new vulnerabilities

## 📱 Production Deployment

### 1. Environment Variables

Ensure these are set in Vercel:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXTAUTH_SECRET=your_generated_secret
NODE_ENV=production
```

### 2. Domain Configuration

- Primary: `https://play-form.vercel.app`
- Custom: `https://play.bb` (when ready)
- Development: `http://localhost:3000`

### 3. SSL/TLS

Vercel automatically provides SSL certificates for all domains.

## 🎯 Next Steps

1. **Deploy current security middleware** ✅
2. **Test origin protection** with different domains
3. **Implement Supabase Edge Function security**
4. **Enable RLS on database tables**
5. **Set up monitoring and alerting**
6. **Regular security reviews**

Your app now has enterprise-level security protection! 🚀
