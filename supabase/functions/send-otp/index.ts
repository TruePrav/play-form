import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Allow unauthenticated access for OTP sending
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

    const { phoneNumber } = await req.json()

    if (!phoneNumber) {
      return new Response(
        JSON.stringify({ error: 'Phone number is required' }),
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
    
    console.log('Original phone number:', JSON.stringify(phoneNumber))
    console.log('Cleaned phone number:', JSON.stringify(cleanPhoneNumber))
    console.log('Phone number length:', phoneNumber.length)
    console.log('Cleaned length:', cleanPhoneNumber.length)

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes from now

    // Clean up any existing OTPs for this phone number
    await supabaseClient
      .from('whatsapp_verifications')
      .delete()
      .eq('phone_number', cleanPhoneNumber)

    // Store OTP in database
    const { error: insertError } = await supabaseClient
      .from('whatsapp_verifications')
      .insert({
        phone_number: cleanPhoneNumber,
        otp_code: otpCode,
        expires_at: expiresAt.toISOString(),
        verified: false,
        attempts: 0
      })

    if (insertError) {
      throw insertError
    }

    // Send SMS via Twilio
    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID')
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN')
    const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER')

    console.log('Twilio Account SID:', twilioAccountSid ? 'SET' : 'NOT SET')
    console.log('Twilio Auth Token:', twilioAuthToken ? 'SET' : 'NOT SET')
    console.log('Twilio Phone Number:', twilioPhoneNumber)

    if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
      throw new Error('Twilio credentials not configured')
    }

    // Use WhatsApp template instead of plain text
    const templateSid = Deno.env.get('TWILIO_TEMPLATE_SID') || 'HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
    const templateName = 'play_otp_verification'
    
    console.log('Sending WhatsApp template message to:', `whatsapp:${cleanPhoneNumber}`)
    console.log('From WhatsApp number:', `whatsapp:${twilioPhoneNumber}`)
    console.log('Using template:', templateName)
    console.log('OTP code:', otpCode)

    const twilioResponse = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(`${twilioAccountSid}:${twilioAuthToken}`)}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: `whatsapp:${cleanPhoneNumber}`,
          From: `whatsapp:${twilioPhoneNumber}`,
          ContentSid: templateSid,
          ContentVariables: JSON.stringify({
            '1': otpCode // The OTP code as the first parameter
          }),
        }),
      }
    )

    console.log('Twilio response status:', twilioResponse.status)
    console.log('Twilio response headers:', Object.fromEntries(twilioResponse.headers.entries()))

    if (!twilioResponse.ok) {
      const errorText = await twilioResponse.text()
      console.error('Twilio error response:', errorText)
      throw new Error(`Twilio error: ${errorText}`)
    }

    const twilioData = await twilioResponse.text()
    console.log('Twilio success response:', twilioData)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'OTP sent successfully',
        expiresAt: expiresAt.toISOString()
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error sending OTP:', error)
    console.error('Error stack:', error.stack)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to send OTP',
        details: error.message,
        stack: error.stack
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
