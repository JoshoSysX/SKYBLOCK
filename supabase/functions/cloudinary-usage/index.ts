import { createClient } from 'npm:@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Content-Type': 'application/json',
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: cors })
  try {
    const authorization = request.headers.get('Authorization') || ''
    const publishableKeys = JSON.parse(Deno.env.get('SUPABASE_PUBLISHABLE_KEYS') || '{}')
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, publishableKeys.default || Deno.env.get('SUPABASE_ANON_KEY')!, { global:{ headers:{ Authorization:authorization } }, auth:{ persistSession:false } })
    const { data:{ user }, error:userError } = await supabase.auth.getUser(authorization.replace(/^Bearer\s+/i, ''))
    if (userError || !user) return new Response(JSON.stringify({ ok:false, error:'No autorizado' }), { status:401, headers:cors })
    const { data: role } = await supabase.from('roles_usuario').select('rol').eq('usuario_id',user.id).maybeSingle()
    if (!role || !['administrador','superadministrador'].includes(role.rol)) return new Response(JSON.stringify({ ok:false, error:'Acceso administrativo requerido' }), { status:403, headers:cors })

    const cloudName = Deno.env.get('CLOUDINARY_CLOUD_NAME') || ''
    const apiKey = Deno.env.get('CLOUDINARY_API_KEY') || ''
    const apiSecret = Deno.env.get('CLOUDINARY_API_SECRET') || ''
    if (!cloudName || !apiKey || !apiSecret) throw new Error('Cloudinary no está configurado')
    const credentials = btoa(`${apiKey}:${apiSecret}`)
    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/usage`, { headers:{ Authorization:`Basic ${credentials}` } })
    const usage = await response.json()
    if (!response.ok) throw new Error(usage?.error?.message || 'No se pudo consultar Cloudinary')
    return new Response(JSON.stringify({
      ok:true,
      imagenesSubidas:usage?.resources ?? usage?.objects?.usage ?? null,
      almacenamientoUsado:usage?.storage?.usage ?? null,
      almacenamientoLimite:usage?.storage?.limit ?? null,
      anchoBandaUsado:usage?.bandwidth?.usage ?? null,
      anchoBandaLimite:usage?.bandwidth?.limit ?? null,
    }), { headers:cors })
  } catch (error) {
    return new Response(JSON.stringify({ ok:false, error:error instanceof Error ? error.message : 'Error interno' }), { status:500, headers:cors })
  }
})
