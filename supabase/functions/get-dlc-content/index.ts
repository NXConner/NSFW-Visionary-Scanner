// Get DLC Content Package
// Returns download information for DLC content packages

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

    // Verify user authentication
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Check if user has active DLC license
    const { data: license, error: licenseError } = await supabaseClient
      .from('dlc_licenses')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (licenseError || !license) {
      return new Response(
        JSON.stringify({ error: 'No active DLC license found' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Check if license is expired
    if (license.expiration_date) {
      const expirationDate = new Date(license.expiration_date)
      if (expirationDate < new Date()) {
        return new Response(
          JSON.stringify({ error: 'DLC license has expired' }),
          {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }
    }

    // Get content package for user's license version or latest
    const { data: contentPackage, error: packageError } = await supabaseClient
      .from('dlc_content_packages')
      .select('*')
      .eq('is_active', true)
      .order('version', { ascending: false })
      .limit(1)
      .single()

    if (packageError || !contentPackage) {
      return new Response(
        JSON.stringify({ error: 'No content package available' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Return content package information
    return new Response(
      JSON.stringify({
        package: {
          version: contentPackage.version,
          downloadUrl: contentPackage.download_url,
          checksum: contentPackage.checksum,
          size: contentPackage.size_bytes,
          releaseDate: contentPackage.release_date,
          changelog: contentPackage.changelog || []
        },
        license: {
          version: license.content_version,
          hasUpdate: contentPackage.version !== license.content_version
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Error getting DLC content:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

