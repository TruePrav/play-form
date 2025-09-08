import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  console.log('Request method:', req.method)
  console.log('Request URL:', req.url)
  console.log('Request headers:', Object.fromEntries(req.headers.entries()))
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request')
    return new Response('ok', { headers: corsHeaders })
  }

  // Allow unauthenticated access for OTP verification
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405, 
      headers: corsHeaders 
    })
  }

  try {
    // Initialize Supabase client with service role for database access
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const { phoneNumber, otpCode } = await req.json()

    if (!phoneNumber || !otpCode) {
      return new Response(
        JSON.stringify({ error: 'Phone number and OTP code are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Clean the phone number - remove all non-digit characters except +
    let cleanPhoneNumber = phoneNumber.replace(/[^\d+]/g, '')
    
    // Ensure it starts with +
    if (!cleanPhoneNumber.startsWith('+')) {
      cleanPhoneNumber = '+' + cleanPhoneNumber
    }
    
    console.log('Original phone number:', phoneNumber)
    console.log('Cleaned phone number:', cleanPhoneNumber)

    // Find the OTP record
    const { data: otpRecord, error: fetchError } = await supabaseClient
      .from('whatsapp_verifications')
      .select('*')
      .eq('phone_number', cleanPhoneNumber)
      .eq('verified', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (fetchError || !otpRecord) {
      return new Response(
        JSON.stringify({ 
          error: 'No valid OTP found for this phone number',
          success: false 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check if OTP has expired
    const now = new Date()
    const expiresAt = new Date(otpRecord.expires_at)
    
    if (now > expiresAt) {
      return new Response(
        JSON.stringify({ 
          error: 'OTP has expired. Please request a new one.',
          success: false 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check attempt limit (max 3 attempts)
    if (otpRecord.attempts >= 3) {
      return new Response(
        JSON.stringify({ 
          error: 'Too many attempts. Please request a new OTP.',
          success: false 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Verify OTP code
    if (otpRecord.otp_code !== otpCode) {
      // Increment attempts
      await supabaseClient
        .from('whatsapp_verifications')
        .update({ attempts: otpRecord.attempts + 1 })
        .eq('id', otpRecord.id)

      return new Response(
        JSON.stringify({ 
          error: 'Invalid OTP code. Please try again.',
          success: false,
          attemptsLeft: 3 - (otpRecord.attempts + 1)
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Mark as verified
    const { error: updateError } = await supabaseClient
      .from('whatsapp_verifications')
      .update({ 
        verified: true,
        verified_at: new Date().toISOString()
      })
      .eq('id', otpRecord.id)

    if (updateError) {
      throw updateError
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Phone number verified successfully' 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error verifying OTP:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to verify OTP',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
