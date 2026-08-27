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
    if (request.method !== 'POST') return new Response(JSON.stringify({ error: 'Método no permitido' }), { status: 405, headers: cors })
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
    if (!cloudName || !apiKey || !apiSecret) throw new Error('Faltan secretos de Cloudinary')

    const body = await request.json()
    const assets = Array.isArray(body?.assets) ? body.assets.slice(0, 50) : []
    if (!assets.length) return new Response(JSON.stringify({ deleted: 0 }), { headers: cors })
    for (const asset of assets) {
      const publicId = String(asset?.publicId || '')
      const resourceType = ['image', 'video', 'raw'].includes(asset?.resourceType) ? asset.resourceType : 'image'
      if (!publicId.startsWith('skyblock-studio/')) throw new Error('Identificador de archivo no permitido')
      const timestamp = Math.floor(Date.now() / 1000)
      const params = `invalidate=true&public_id=${publicId}&timestamp=${timestamp}`
      const signature = hex(await crypto.subtle.digest('SHA-1', new TextEncoder().encode(params + apiSecret)))
      const form = new FormData()
      form.append('public_id', publicId)
      form.append('timestamp', String(timestamp))
      form.append('invalidate', 'true')
      form.append('api_key', apiKey)
      form.append('signature', signature)
      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/destroy`, { method: 'POST', body: form })
      const result = await response.json()
      if (!response.ok || !['ok', 'not found'].includes(result?.result)) throw new Error(result?.error?.message || `No se pudo eliminar ${publicId}`)
    }
    return new Response(JSON.stringify({ deleted: assets.length }), { headers: cors })
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Error interno' }), { status: 500, headers: cors })
  }
})
