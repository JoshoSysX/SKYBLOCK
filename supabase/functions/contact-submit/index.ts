import { createClient } from 'npm:@supabase/supabase-js@2.112.4'

const allowedOrigins = new Set([
  'https://skyblocktpp.com',
  'https://www.skyblocktpp.com',
])

const jsonHeaders = (origin:string) => ({
  'Access-Control-Allow-Origin': origin,
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
  'Vary': 'Origin',
})

const respond = (origin:string, body:Record<string,unknown>, status=200) =>
  new Response(JSON.stringify(body), { status, headers:jsonHeaders(origin) })

const digest = async (value:string) => {
  const bytes = await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))
  return [...new Uint8Array(bytes)].map(byte=>byte.toString(16).padStart(2,'0')).join('')
}

Deno.serve(async (request) => {
  const origin=request.headers.get('Origin') || ''
  if(!allowedOrigins.has(origin)) return new Response(JSON.stringify({ok:false,mensaje:'Origen no permitido.'}),{status:403,headers:{'Content-Type':'application/json'}})
  if(request.method==='OPTIONS') return new Response('ok',{headers:jsonHeaders(origin)})
  if(request.method!=='POST') return respond(origin,{ok:false,mensaje:'Método no permitido.'},405)

  try {
    const body=await request.json()
    const nombre=String(body?.nombre||'').trim()
    const correo=String(body?.correo||'').trim().toLowerCase()
    const asunto=String(body?.motivo||'').trim()
    const mensaje=String(body?.mensaje||'').trim()
    const turnstileToken=String(body?.turnstileToken||'')
    if(nombre.length<2||nombre.length>120||!/^\S+@\S+\.\S+$/.test(correo)||correo.length>254||asunto.length<2||asunto.length>160||mensaje.length<10||mensaje.length>4000)
      return respond(origin,{ok:false,mensaje:'Revisa los datos y completa correctamente todos los campos.'},400)
    if(!turnstileToken||turnstileToken.length>2048)
      return respond(origin,{ok:false,mensaje:'Completa la verificación de seguridad.'},400)

    const ip=(request.headers.get('cf-connecting-ip')||request.headers.get('x-forwarded-for')?.split(',')[0]||'desconocida').trim()
    const secret=Deno.env.get('TURNSTILE_SECRET_KEY')
    const serviceKey=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if(!secret||!serviceKey) throw new Error('Configuración de seguridad incompleta')
    const verificationBody=new FormData()
    verificationBody.append('secret',secret)
    verificationBody.append('response',turnstileToken)
    if(ip!=='desconocida') verificationBody.append('remoteip',ip)
    const verificationResponse=await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',body:verificationBody})
    const verification=await verificationResponse.json()
    if(!verificationResponse.ok||!verification?.success||!['skyblocktpp.com','www.skyblocktpp.com'].includes(String(verification.hostname||'')))
      return respond(origin,{ok:false,mensaje:'La verificación de seguridad no fue válida. Inténtalo nuevamente.'},403)

    const supabase=createClient(Deno.env.get('SUPABASE_URL')!,serviceKey,{auth:{persistSession:false,autoRefreshToken:false}})
    const ipHash=await digest(`${ip}:${serviceKey}`)
    const windowStart=new Date(Date.now()-15*60*1000).toISOString()
    const attempts=await supabase.from('contacto_intentos').select('id',{count:'exact',head:true}).eq('ip_hash',ipHash).gte('creado_en',windowStart)
    if(attempts.error) throw attempts.error
    if((attempts.count||0)>=5) return respond(origin,{ok:false,mensaje:'Has enviado varios mensajes. Espera 15 minutos antes de intentarlo nuevamente.'},429)
    const attempt=await supabase.from('contacto_intentos').insert({ip_hash:ipHash})
    if(attempt.error) throw attempt.error
    const saved=await supabase.from('mensajes_contacto').insert({nombre,correo,asunto,mensaje,estado:'nuevo'})
    if(saved.error) throw saved.error
    void supabase.from('contacto_intentos').delete().lt('creado_en',new Date(Date.now()-24*60*60*1000).toISOString())
    return respond(origin,{ok:true,mensaje:'Gracias por escribirnos. Te responderemos en un máximo de 12–24 horas.'})
  } catch(error) {
    console.error('contact-submit',error instanceof Error?error.message:'Error interno')
    return respond(origin,{ok:false,mensaje:'No se pudo enviar el mensaje. Inténtalo nuevamente.'},500)
  }
})
