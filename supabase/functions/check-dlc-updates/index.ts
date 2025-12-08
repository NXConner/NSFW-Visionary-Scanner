// Check DLC Updates
// Checks if there are updates available for the user's DLC content

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

    const { currentVersion, userId } = await req.json()

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Missing userId' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Check if user has active DLC license
    const { data: license, error: licenseError } = await supabaseClient
      .from('dlc_licenses')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single()

    if (licenseError || !license) {
      return new Response(
        JSON.stringify({ hasUpdate: false, error: 'No active DLC license' }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Get latest content package
    const { data: latestPackage, error: packageError } = await supabaseClient
      .from('dlc_content_packages')
      .select('*')
      .eq('is_active', true)
      .order('version', { ascending: false })
      .limit(1)
      .single()

    if (packageError || !latestPackage) {
      return new Response(
        JSON.stringify({ hasUpdate: false }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Compare versions (simple string comparison, can be enhanced with semver)
    const userVersion = currentVersion || license.content_version
    const hasUpdate = latestPackage.version !== userVersion

    if (!hasUpdate) {
      return new Response(
        JSON.stringify({ hasUpdate: false }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Return update information
    return new Response(
      JSON.stringify({
        hasUpdate: true,
        package: {
          version: latestPackage.version,
          downloadUrl: latestPackage.download_url,
          checksum: latestPackage.checksum,
          size: latestPackage.size_bytes,
          releaseDate: latestPackage.release_date,
          changelog: latestPackage.changelog || []
        },
        currentVersion: userVersion
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Error checking DLC updates:', error)
    return new Response(
      JSON.stringify({ hasUpdate: false, error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

