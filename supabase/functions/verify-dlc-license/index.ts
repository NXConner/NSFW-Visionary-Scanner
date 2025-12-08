// Verify DLC License
// Verifies and activates DLC licenses for NSFW content unlock

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { licenseKey, userId, deviceId } = await req.json()

    if (!licenseKey || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: licenseKey, userId' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Verify license key format (basic validation)
    if (!/^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(licenseKey)) {
      return new Response(
        JSON.stringify({ error: 'Invalid license key format' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Check if license exists and is valid
    const { data: existingLicense, error: fetchError } = await supabaseClient
      .from('dlc_licenses')
      .select('*')
      .eq('license_key', licenseKey)
      .single()

    if (fetchError || !existingLicense) {
      return new Response(
        JSON.stringify({ error: 'Invalid license key' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Check if license is already assigned to another user
    if (existingLicense.user_id !== userId) {
      return new Response(
        JSON.stringify({ error: 'License key already assigned to another user' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Check if license is expired
    if (existingLicense.expiration_date) {
      const expirationDate = new Date(existingLicense.expiration_date)
      if (expirationDate < new Date()) {
        return new Response(
          JSON.stringify({ error: 'License key has expired' }),
          {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }
    }

    // Check if license is active
    if (!existingLicense.is_active) {
      return new Response(
        JSON.stringify({ error: 'License key is not active' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Update license with device ID if provided
    if (deviceId && existingLicense.device_id !== deviceId) {
      const { error: updateError } = await supabaseClient
        .from('dlc_licenses')
        .update({
          device_id: deviceId,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingLicense.id)

      if (updateError) {
        console.error('Error updating license device ID:', updateError)
      }
    }

    // Return license information
    return new Response(
      JSON.stringify({
        valid: true,
        license: {
          id: existingLicense.id,
          userId: existingLicense.user_id,
          licenseKey: existingLicense.license_key,
          purchaseDate: existingLicense.purchase_date,
          expirationDate: existingLicense.expiration_date,
          deviceId: existingLicense.device_id || deviceId,
          contentVersion: existingLicense.content_version,
          signature: existingLicense.signature,
          isActive: existingLicense.is_active,
          createdAt: existingLicense.created_at,
          updatedAt: existingLicense.updated_at
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Error verifying DLC license:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

