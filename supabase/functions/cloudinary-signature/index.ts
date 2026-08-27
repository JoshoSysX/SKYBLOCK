import { createClient } from 'npm:@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Content-Type': 'application/json',
}

const hex = (buffer: ArrayBuffer) => [...new Uint8Array(buffer)].map((value) => value.toString(16).padStart(2, '0')).join('')

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: cors })
  try {
    const authorization = request.headers.get('Authorization') || ''
    const publishableKeys = JSON.parse(Deno.env.get('SUPABASE_PUBLISHABLE_KEYS') || '{}')
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, publishableKeys.default || Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false },
    })
    const { data: { user }, error: userError } = await supabase.auth.getUser(authorization.replace(/^Bearer\s+/i, ''))
    if (userError || !user) return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401, headers: cors })
    const { data: role } = await supabase.from('roles_usuario').select('rol').eq('usuario_id', user.id).maybeSingle()
    if (!role || !['administrador', 'superadministrador'].includes(role.rol)) return new Response(JSON.stringify({ error: 'Acceso administrativo requerido' }), { status: 403, headers: cors })

    const cloudName = Deno.env.get('CLOUDINARY_CLOUD_NAME')!
    const apiKey = Deno.env.get('CLOUDINARY_API_KEY')!
    const apiSecret = Deno.env.get('CLOUDINARY_API_SECRET')!
    const uploadPreset = Deno.env.get('CLOUDINARY_UPLOAD_PRESET')!
    if (!cloudName || !apiKey || !apiSecret || !uploadPreset) throw new Error('Faltan secretos de Cloudinary')

    const timestamp = Math.floor(Date.now() / 1000)
    const folder = 'skyblock-studio/posts'
    const params = `folder=${folder}&timestamp=${timestamp}&upload_preset=${uploadPreset}`
    const signature = hex(await crypto.subtle.digest('SHA-1', new TextEncoder().encode(params + apiSecret)))
    return new Response(JSON.stringify({ cloudName, apiKey, uploadPreset, timestamp, folder, signature }), { headers: cors })
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Error interno' }), { status: 500, headers: cors })
  }
})
