/**
 * Merge Video Chunks Edge Function
 * Merges uploaded video chunks into a single file
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const { file_path, total_chunks, bucket } = await req.json()

    if (!file_path || !total_chunks || !bucket) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Download all chunks
    const chunks: Uint8Array[] = []
    for (let i = 0; i < total_chunks; i++) {
      const chunkPath = `${file_path}.chunk.${i}`
      const { data, error } = await supabase.storage
        .from(bucket)
        .download(chunkPath)

      if (error) {
        return new Response(
          JSON.stringify({ error: `Failed to download chunk ${i}: ${error.message}` }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        )
      }

      const arrayBuffer = await data.arrayBuffer()
      chunks.push(new Uint8Array(arrayBuffer))
    }

    // Merge chunks
    const totalSize = chunks.reduce((sum, chunk) => sum + chunk.length, 0)
    const merged = new Uint8Array(totalSize)
    let offset = 0
    for (const chunk of chunks) {
      merged.set(chunk, offset)
      offset += chunk.length
    }

    // Upload merged file
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(file_path, merged, {
        cacheControl: '3600',
        upsert: true,
        contentType: 'video/mp4'
      })

    if (uploadError) {
      return new Response(
        JSON.stringify({ error: `Failed to upload merged file: ${uploadError.message}` }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Delete chunks
    const chunkPaths = Array.from({ length: total_chunks }, (_, i) => `${file_path}.chunk.${i}`)
    await supabase.storage
      .from(bucket)
      .remove(chunkPaths)

    return new Response(
      JSON.stringify({ success: true, path: file_path }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in merge-video-chunks:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})

