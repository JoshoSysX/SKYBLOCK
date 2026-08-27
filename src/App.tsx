import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from './lib/supabase'

type Datos = { productos: unknown[]; colecciones: unknown[]; publicaciones: unknown[]; error?: string }
type Rol = { rol: string } | null
type FilaImagen = { id?: string; identificador_publico?: string; url_segura?: string; tipo_recurso?: string; posicion?: number }
const paginas = new Set(['inicio','catalogo','colecciones','coleccion','producto','posts','nosotros','contacto','privacidad','terminos','verificar','login','admin'])
const rutaInicial = paginas.has(location.pathname.split('/').filter(Boolean)[0] || '') ? location.pathname.split('/').filter(Boolean)[0] : 'inicio'

export default function App() {
  const frame = useRef<HTMLIFrameElement>(null)
  const [datos, setDatos] = useState<Datos>({ productos: [], colecciones: [], publicaciones: [] })

  const cargarPublicos = useCallback(async () => {
    const [p, c, posts] = await Promise.all([
      supabase.from('productos').select('*,tipo:tipos_producto(*),coleccion:colecciones(*),tallas:tallas_producto(*),imagenes(*)').eq('estado', 'publicado').order('creado_en', { ascending: false }),
      supabase.from('colecciones').select('*,imagenes(*)').eq('estado', 'publicado').order('publicado_en', { ascending: false }),
      supabase.from('publicaciones').select('*,imagenes(*)').eq('estado', 'publicado').lte('publicado_en', new Date().toISOString()).order('publicado_en', { ascending: false }),
    ])
    const next = p.error || c.error || posts.error
      ? { productos: [], colecciones: [], publicaciones: [], error: 'No se pudieron cargar los datos.' }
      : { productos: p.data ?? [], colecciones: c.data ?? [], publicaciones: posts.data ?? [] }
    setDatos(next)
    return next
  }, [])

  useEffect(() => { document.body.className = 'legacy-shell'; void cargarPublicos() }, [cargarPublicos])

  const obtenerAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data: rol } = user ? await supabase.from('roles_usuario').select('rol').eq('usuario_id', user.id).maybeSingle() : { data: null }
    return { user, rol: rol as Rol, esAdmin: Boolean(rol && ['administrador', 'superadministrador'].includes(rol.rol)) }
  }

  const enviar = useCallback(async () => {
    const ventana = frame.current?.contentWindow
    ventana?.postMessage({ tipo: 'SKYBLOCK_DATOS_PUBLICOS', datos }, location.origin)
    try {
      const documento = frame.current?.contentDocument
      if (documento?.title) document.title = documento.title
      const { user, esAdmin } = await obtenerAdmin()
      documento?.body.classList.toggle('skyblock-admin-auth', esAdmin)
      documento?.body.classList.toggle('skyblock-signed-out', !user)
      ventana?.postMessage({ tipo: 'SKYBLOCK_ESTADO_AUTH', conectado: Boolean(user), esAdmin }, location.origin)
      const ruta = ventana?.location.pathname || ''
      const pagina = ruta.split('/').pop()?.replace(/\.html$/, '') || 'inicio'
      if (paginas.has(pagina)) {
        const rutaLimpia = `/${pagina}${ventana?.location.search || ''}`
        if (`${location.pathname}${location.search}` !== rutaLimpia) history.replaceState(null, '', rutaLimpia)
      }
      if (ruta.endsWith('/admin.html') && !user) { ventana!.location.href = 'login.html'; return }
      if (ruta.endsWith('/admin.html') && !esAdmin) { ventana!.location.href = 'inicio.html'; return }
      if (ruta.endsWith('/admin.html')) {
        const [{ data: mensajes, error }, { data: publicaciones, error: errorPosts }, adminData] = await Promise.all([
          supabase.from('mensajes_contacto').select('*').order('creado_en', { ascending: false }),
          supabase.from('publicaciones').select('*,imagenes(*)').order('creado_en', { ascending: false }),
          cargarAdmin(),
        ])
        ventana?.postMessage({ tipo: 'SKYBLOCK_ADMIN_MENSAJES', mensajes: mensajes ?? [], error: Boolean(error) }, location.origin)
        ventana?.postMessage({ tipo: 'SKYBLOCK_ADMIN_POSTS', publicaciones: publicaciones ?? [], error: Boolean(errorPosts) }, location.origin)
        ventana?.postMessage({ tipo: 'SKYBLOCK_ADMIN_DATOS', ...adminData }, location.origin)
      }
    } catch { /* iframe del mismo origen */ }
  }, [datos])

  const subirCloudinary = async (archivo: File) => {
    const { data: firma, error } = await supabase.functions.invoke('cloudinary-signature')
    if (error || !firma?.signature) throw new Error(firma?.error || 'No se pudo firmar la imagen')
    const form = new FormData()
    form.append('file', archivo)
    form.append('api_key', firma.apiKey)
    form.append('timestamp', String(firma.timestamp))
    form.append('signature', firma.signature)
    form.append('folder', firma.folder)
    form.append('upload_preset', firma.uploadPreset)
    const response = await fetch(`https://api.cloudinary.com/v1_1/${firma.cloudName}/image/upload`, { method: 'POST', body: form })
    const result = await response.json()
    if (!response.ok) throw new Error(result?.error?.message || 'Cloudinary rechazó la imagen')
    return result
  }

  const archivoDesdeDataUrl = async (dataUrl: string, nombre: string) => {
    const blob = await (await fetch(dataUrl)).blob()
    return new File([blob], nombre, { type: blob.type || 'image/jpeg' })
  }

  const guardarImagen = async (dataUrl: string, relacion: { producto_id?: string; coleccion_id?: string }, posicion: number, userId: string, alt: string) => {
    if (!dataUrl.startsWith('data:')) return
    const cloud = await subirCloudinary(await archivoDesdeDataUrl(dataUrl, `${relacion.producto_id || relacion.coleccion_id}-${posicion}.jpg`))
    const { error } = await supabase.from('imagenes').insert({ ...relacion, identificador_publico: cloud.public_id, url_segura: cloud.secure_url, tipo_recurso: cloud.resource_type, formato: cloud.format, ancho: cloud.width, alto: cloud.height, bytes: cloud.bytes, texto_alternativo: alt, posicion, subido_por: userId })
    if (error) throw error
  }

  const eliminarArchivosCloudinary = async (imagenes: FilaImagen[]) => {
    const assets = imagenes.filter((imagen) => imagen.identificador_publico).map((imagen) => ({ publicId:imagen.identificador_publico, resourceType:imagen.tipo_recurso || 'image' }))
    if (!assets.length) return
    const { data, error } = await supabase.functions.invoke('cloudinary-delete', { body:{ assets } })
    if (error || data?.error) throw new Error(data?.error || error?.message || 'No se pudieron eliminar los archivos de Cloudinary')
  }

  const eliminarImagenesRelacion = async (columna: 'producto_id'|'coleccion_id'|'publicacion_id', id: string) => {
    const { data: imagenes, error } = await supabase.from('imagenes').select('id,identificador_publico,tipo_recurso').eq(columna,id)
    if (error) throw error
    await eliminarArchivosCloudinary(imagenes || [])
    const borrado = await supabase.from('imagenes').delete().eq(columna,id)
    if (borrado.error) throw borrado.error
  }

  const cargarAdmin = async () => {
    const [productos, colecciones, tipos, codigos] = await Promise.all([
      supabase.from('productos').select('*,tipo:tipos_producto(*),coleccion:colecciones(*),tallas:tallas_producto(*),imagenes(*)').order('creado_en', { ascending: false }),
      supabase.from('colecciones').select('*,imagenes(*)').order('creado_en', { ascending: false }),
      supabase.from('tipos_producto').select('*').order('nombre'),
      supabase.from('codigos_autenticidad').select('*,coleccion:colecciones(id,nombre)').order('creado_en', { ascending: false }),
    ])
    const error = productos.error || colecciones.error || tipos.error || codigos.error
    const cs = (colecciones.data ?? []).map((c: any) => ({ id:c.id, name:c.nombre, slug:c.slug, edition:c.numero_edicion, status:c.estado === 'publicado' ? 'published' : c.estado === 'archivado' ? 'upcoming' : 'draft', limited:false, description:c.descripcion, story:c.historia, cover:[...(c.imagenes || [])].sort((a:FilaImagen,b:FilaImagen)=>(a.posicion||0)-(b.posicion||0))[0]?.url_segura || '' }))
    const ps = (productos.data ?? []).map((p: any) => { const images=[...(p.imagenes || [])].sort((a:FilaImagen,b:FilaImagen)=>(a.posicion||0)-(b.posicion||0)); return { id:p.id, name:p.nombre, type:p.tipo?.nombre || '', collection:p.coleccion?.nombre || '', price:Number(p.precio), description:p.descripcion, sizes:Object.fromEntries((p.tallas || []).map((t:any)=>[t.talla,t.stock])), limited:p.es_limitado, blocked:p.estado === 'archivado', image:images[0]?.url_segura || '', gallery:images.slice(1).map((i:FilaImagen)=>i.url_segura) } })
    const codes = (codigos.data ?? []).map((c:any) => ({ id:c.id, hash:String(c.codigo_hmac || '').replace(/^\\x/,''), codeHint:`•••• ${c.ultimos_cuatro}`, series:c.numero_serie, collection:c.coleccion?.nombre || '', owner:c.propietario_nombre || 'Sin registrar', status:c.estado === 'bloqueado' || c.estado === 'anulado' ? 'blocked' : 'active' }))
    return { productos: ps, colecciones: cs, tipos: (tipos.data ?? []).map((t:any)=>t.nombre), codigos: codes, error: error?.message || '' }
  }

  useEffect(() => {
    const recibir = async (e: MessageEvent) => {
      if (e.origin !== location.origin) return
      if (e.data?.tipo === 'SKYBLOCK_SOLICITAR_DATOS') { void enviar(); return }
      if (e.data?.tipo === 'SKYBLOCK_VERIFICAR_CODIGO') {
        const { data, error } = await supabase.rpc('verificar_codigo_autenticidad', { codigo_hash: String(e.data.hash || '') })
        const row = Array.isArray(data) ? data[0] : data
        e.source?.postMessage({ tipo:'SKYBLOCK_VERIFICAR_RESULTADO', id:e.data.id, registro: error || !row ? null : { series:row.numero_serie, collection:row.coleccion, owner:row.propietario_nombre || 'Sin registrar', status:['bloqueado','anulado'].includes(row.estado) ? 'blocked' : 'active' } }, { targetOrigin:e.origin })
        return
      }
      if (String(e.data?.tipo || '').startsWith('SKYBLOCK_ADMIN_') && !['SKYBLOCK_ADMIN_GUARDAR_POST','SKYBLOCK_ADMIN_ELIMINAR_POST','SKYBLOCK_ADMIN_ELIMINAR_MENSAJE'].includes(e.data.tipo)) {
        const { user, esAdmin } = await obtenerAdmin(); let error: any = null
        try {
          if (!user || !esAdmin) throw new Error('Acceso no autorizado')
          const d = e.data.datos || {}
          if (e.data.tipo === 'SKYBLOCK_ADMIN_GUARDAR_COLECCION') {
            const idValido = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(d.id || ''))
            const payload = { nombre:String(d.name||'').trim(), slug:String(d.slug||'').trim(), numero_edicion:String(d.edition||'').trim(), descripcion:String(d.description||'').trim(), historia:String(d.story||'').trim(), estado:d.status === 'published' ? 'publicado' : d.status === 'upcoming' ? 'archivado' : 'borrador', publicado_en:d.status === 'published' ? new Date().toISOString() : null, creado_por:user.id }
            const saved = idValido ? await supabase.from('colecciones').update(payload).eq('id',d.id).select('id').single() : await supabase.from('colecciones').insert(payload).select('id').single()
            if (saved.error) throw saved.error
            if (String(d.cover||'').startsWith('data:')) { if (idValido) await eliminarImagenesRelacion('coleccion_id',saved.data.id); await guardarImagen(d.cover,{coleccion_id:saved.data.id},0,user.id,d.name) }
          } else if (e.data.tipo === 'SKYBLOCK_ADMIN_ELIMINAR_COLECCION') {
            const id = String(d.id || '')
            const [productosAsociados, codigosAsociados] = await Promise.all([
              supabase.from('productos').select('id', { count:'exact', head:true }).eq('coleccion_id',id),
              supabase.from('codigos_autenticidad').select('id', { count:'exact', head:true }).eq('coleccion_id',id)
            ])
            if (productosAsociados.error) throw productosAsociados.error
            if (codigosAsociados.error) throw codigosAsociados.error
            if ((productosAsociados.count || 0) > 0 || (codigosAsociados.count || 0) > 0) {
              throw new Error(`La colección tiene ${productosAsociados.count || 0} producto(s) y ${codigosAsociados.count || 0} código(s) asociados`)
            }
            await eliminarImagenesRelacion('coleccion_id',id)
            const result = await supabase.from('colecciones').delete().eq('id',id).select('id').single()
            if (result.error) throw result.error
          } else if (e.data.tipo === 'SKYBLOCK_ADMIN_GUARDAR_PRODUCTO') {
            const idValido = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(d.id || ''))
            const { data:coleccion, error:ce } = await supabase.from('colecciones').select('id').eq('nombre',d.collection).single(); if (ce) throw ce
            let { data:tipo } = await supabase.from('tipos_producto').select('id').eq('nombre',d.type).maybeSingle()
            if (!tipo) { const created=await supabase.from('tipos_producto').insert({nombre:d.type,slug:String(d.type).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')}).select('id').single(); if(created.error)throw created.error; tipo=created.data }
            const total=Object.values(d.sizes||{}).reduce((sum:number,v:any)=>sum+Number(v||0),0)
            const payload={tipo_producto_id:tipo.id,coleccion_id:coleccion.id,nombre:String(d.name||'').trim(),slug:String(d.name||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''),precio:Number(d.price),moneda:'USD',descripcion:String(d.description||'').trim(),estado:d.blocked?'archivado':'publicado',es_limitado:Boolean(d.limited),unidades_limitadas:d.limited?Math.max(total,1):null,creado_por:user.id}
            const saved=idValido?await supabase.from('productos').update(payload).eq('id',d.id).select('id').single():await supabase.from('productos').insert(payload).select('id').single(); if(saved.error)throw saved.error
            const tallasEliminadas=await supabase.from('tallas_producto').delete().eq('producto_id',saved.data.id);if(tallasEliminadas.error)throw tallasEliminadas.error
            const tallas=Object.entries(d.sizes||{}).map(([talla,stock])=>({producto_id:saved.data.id,talla,stock:Number(stock)}));if(!tallas.length)throw new Error('Selecciona al menos una talla');if(tallas.length){const tr=await supabase.from('tallas_producto').insert(tallas).select('talla');if(tr.error)throw tr.error;if((tr.data||[]).length!==tallas.length)throw new Error('No se guardaron todas las tallas seleccionadas')}
            const nuevas=[d.image,...(d.gallery||[])].filter((x:string)=>String(x||'').startsWith('data:')); if(nuevas.length){await eliminarImagenesRelacion('producto_id',saved.data.id);for(let i=0;i<nuevas.length;i++)await guardarImagen(nuevas[i],{producto_id:saved.data.id},i,user.id,d.name)}
          } else if (e.data.tipo === 'SKYBLOCK_ADMIN_GUARDAR_TIPO') {
            const slug=String(d.nombre||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''); const result=await supabase.from('tipos_producto').insert({nombre:d.nombre,slug});if(result.error)throw result.error
          } else if (e.data.tipo === 'SKYBLOCK_ADMIN_ELIMINAR_TIPO') {
            const result=await supabase.from('tipos_producto').delete().eq('nombre',d.nombre);if(result.error)throw result.error
          } else if (e.data.tipo === 'SKYBLOCK_ADMIN_GUARDAR_CODIGO') {
            const idValido = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(d.id || ''))
            const {data:coleccion,error:ce}=await supabase.from('colecciones').select('id').eq('nombre',d.collection).single();if(ce)throw ce
            const payload={coleccion_id:coleccion.id,codigo_hmac:`\\x${d.hash}`,ultimos_cuatro:String(d.codeHint||'').slice(-4),numero_serie:d.series,estado:d.status==='blocked'?'bloqueado':'disponible',propietario_nombre:d.owner==='Sin registrar'?null:d.owner,creado_por:user.id}
            const result=idValido?await supabase.from('codigos_autenticidad').update(payload).eq('id',d.id):await supabase.from('codigos_autenticidad').insert(payload);if(result.error)throw result.error
          } else if (e.data.tipo === 'SKYBLOCK_ADMIN_ELIMINAR_CODIGO') { const result=await supabase.from('codigos_autenticidad').delete().eq('id',d.id);if(result.error)throw result.error }
          else return
        } catch(caught:any) { error=caught }
        const adminData=await cargarAdmin()
        e.source?.postMessage({tipo:'SKYBLOCK_ADMIN_DATOS',...adminData},{targetOrigin:e.origin})
        const eliminandoColeccion=e.data.tipo==='SKYBLOCK_ADMIN_ELIMINAR_COLECCION'
        e.source?.postMessage({tipo:'SKYBLOCK_ADMIN_ACCION_RESULTADO',ok:!error,mensaje:error?`${eliminandoColeccion?'No se pudo eliminar':'No se pudo guardar'}: ${error.message||'error desconocido'}`:eliminandoColeccion?'Colección eliminada de Supabase.':'Cambios guardados en Supabase.'},{targetOrigin:e.origin})
        if(!error){const next=await cargarPublicos();setDatos(next)}
        return
      }
      if (e.data?.tipo === 'SKYBLOCK_ADMIN_GUARDAR_POST' || e.data?.tipo === 'SKYBLOCK_ADMIN_ELIMINAR_POST') {
        const { user, esAdmin } = await obtenerAdmin()
        let error: unknown = new Error('Acceso no autorizado')
        try {
          if (!user || !esAdmin) throw error
          if (e.data.tipo === 'SKYBLOCK_ADMIN_ELIMINAR_POST') {
            await eliminarImagenesRelacion('publicacion_id',String(e.data.id || ''))
            const result = await supabase.from('publicaciones').delete().eq('id', String(e.data.id || ''))
            if (result.error) throw result.error
          } else {
            const d = e.data.datos || {}, id = String(d.id || '')
            const payload = { titulo: String(d.titulo || '').trim(), descripcion: String(d.descripcion || '').trim(), contenido: String(d.descripcion || '').trim(), estado: 'publicado' as const, autor_id: user.id, publicado_en: new Date().toISOString() }
            const saved = id
              ? await supabase.from('publicaciones').update(payload).eq('id', id).select('id').single()
              : await supabase.from('publicaciones').insert({ ...payload, slug: `${String(d.titulo || 'post').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${Date.now()}` }).select('id').single()
            if (saved.error) throw saved.error
            if (d.archivo instanceof File) {
              const cloud = await subirCloudinary(d.archivo)
              if (id) await eliminarImagenesRelacion('publicacion_id',saved.data.id)
              const imageResult = await supabase.from('imagenes').insert({ publicacion_id: saved.data.id, identificador_publico: cloud.public_id, url_segura: cloud.secure_url, tipo_recurso: cloud.resource_type, formato: cloud.format, ancho: cloud.width, alto: cloud.height, bytes: cloud.bytes, texto_alternativo: String(d.alt || d.titulo || '').trim(), posicion: 0, subido_por: user.id })
              if (imageResult.error) throw imageResult.error
            }
          }
          error = null
        } catch (caught) { error = caught }
        const next = await cargarPublicos()
        frame.current?.contentWindow?.postMessage({ tipo: 'SKYBLOCK_DATOS_PUBLICOS', datos: next }, location.origin)
        e.source?.postMessage({ tipo: 'SKYBLOCK_ADMIN_POST_RESULTADO', ok: !error, mensaje: error ? `No se pudo guardar el post: ${error instanceof Error ? error.message : 'error desconocido'}` : 'Post e imagen guardados correctamente.' }, { targetOrigin: e.origin })
        setTimeout(() => void enviar(), 0)
        return
      }
      if (e.data?.tipo === 'SKYBLOCK_ADMIN_ELIMINAR_MENSAJE') {
        const { esAdmin } = await obtenerAdmin()
        const { error } = esAdmin ? await supabase.from('mensajes_contacto').delete().eq('id', String(e.data.id || '')) : { error: new Error('Acceso no autorizado') }
        e.source?.postMessage({ tipo: 'SKYBLOCK_ADMIN_ELIMINAR_MENSAJE_RESULTADO', ok: !error, mensaje: error ? 'No se pudo eliminar el mensaje.' : 'Mensaje eliminado.' }, { targetOrigin: e.origin })
        if (!error) void enviar(); return
      }
      if (e.data?.tipo === 'SKYBLOCK_CONTACTO') {
        const d = e.data.datos || {}
        const { error } = await supabase.from('mensajes_contacto').insert({ nombre: String(d.nombre || '').trim(), correo: String(d.correo || '').trim().toLowerCase(), asunto: String(d.motivo || '').trim(), mensaje: String(d.mensaje || '').trim(), estado: 'nuevo' })
        e.source?.postMessage({ tipo: 'SKYBLOCK_CONTACTO_RESULTADO', ok: !error, mensaje: error ? 'No se pudo enviar el mensaje. Revisa los datos e inténtalo nuevamente.' : 'Gracias por escribirnos. Te responderemos en un máximo de 12–24 horas.' }, { targetOrigin: e.origin }); return
      }
      if (e.data?.tipo === 'SKYBLOCK_LOGOUT') { await supabase.auth.signOut(); if (frame.current?.contentWindow) frame.current.contentWindow.location.href = 'inicio.html'; return }
      if (e.data?.tipo === 'SKYBLOCK_LOGIN') {
        const { correo, contrasena } = e.data
        const { data, error } = await supabase.auth.signInWithPassword({ email: correo, password: contrasena })
        if (error || !data.user) { const mensaje = error?.code === 'email_not_confirmed' ? 'Debes confirmar tu correo antes de iniciar sesión.' : error?.code === 'invalid_credentials' ? 'Correo o contraseña incorrectos.' : 'No se pudo iniciar sesión. Inténtalo nuevamente.'; e.source?.postMessage({ tipo: 'SKYBLOCK_AUTH_RESULTADO', ok: false, mensaje }, { targetOrigin: e.origin }); return }
        const { data: rol, error: errorRol } = await supabase.from('roles_usuario').select('rol').eq('usuario_id', data.user.id).maybeSingle()
        if (errorRol) { e.source?.postMessage({ tipo: 'SKYBLOCK_AUTH_RESULTADO', ok: false, mensaje: 'La sesión inició, pero no se pudo comprobar el acceso administrativo.' }, { targetOrigin: e.origin }); return }
        const esAdmin = Boolean(rol && ['administrador', 'superadministrador'].includes(rol.rol))
        e.source?.postMessage({ tipo: 'SKYBLOCK_AUTH_RESULTADO', ok: true, esAdmin, mensaje: esAdmin ? 'Acceso administrativo concedido.' : 'Sesión iniciada correctamente.' }, { targetOrigin: e.origin })
      }
    }
    addEventListener('message', recibir); void enviar(); return () => removeEventListener('message', recibir)
  }, [cargarPublicos, enviar])

  return <iframe ref={frame} className="legacy-frontend" src={`/legacy/${rutaInicial}.html${location.search}`} title="SKYBLOCK STUDIO" onLoad={enviar} />
}
