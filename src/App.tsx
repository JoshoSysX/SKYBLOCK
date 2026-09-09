import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from './lib/supabase'

type Datos = { productos: unknown[]; colecciones: unknown[]; publicaciones: unknown[]; error?: string }
type Rol = { rol: string } | null
type FilaImagen = { id?: string; identificador_publico?: string; url_segura?: string; tipo_recurso?: string; posicion?: number }
const MAX_IMAGE_SIZE_BYTES = 150 * 1024 * 1024
const CLOUDINARY_CHUNK_SIZE_BYTES = 20 * 1024 * 1024
const paginas = new Set(['inicio','catalogo','colecciones','coleccion','producto','posts','nosotros','contacto','privacidad','terminos','verificar','login','registro','admin'])
const rutaInicial = paginas.has(location.pathname.split('/').filter(Boolean)[0] || '') ? location.pathname.split('/').filter(Boolean)[0] : 'inicio'
const SEO:Record<string,{title:string;description:string;path:string;index?:boolean}> = {
  inicio:{title:'SKYBLOCK STUDIO | Ropa urbana de edición limitada',description:'SKYBLOCK STUDIO, marca de ropa urbana de ediciones limitadas creada en Tarapoto, Perú. Del bloque para el cielo.',path:'/'},
  catalogo:{title:'Catálogo de ropa urbana | SKYBLOCK STUDIO',description:'Descubre prendas urbanas, diseños exclusivos y ediciones limitadas de SKYBLOCK STUDIO en Tarapoto.',path:'/catalogo'},
  colecciones:{title:'Colecciones limitadas | SKYBLOCK STUDIO',description:'Conoce las colecciones y colaboraciones de ropa urbana creadas por SKYBLOCK STUDIO.',path:'/colecciones'},
  coleccion:{title:'Colección | SKYBLOCK STUDIO',description:'Historia, concepto y prendas de una colección limitada de SKYBLOCK STUDIO.',path:'/coleccion'},
  producto:{title:'Producto | SKYBLOCK STUDIO',description:'Consulta el diseño, tallas, disponibilidad y autenticidad de esta prenda SKYBLOCK STUDIO.',path:'/producto'},
  posts:{title:'Novedades y procesos | SKYBLOCK STUDIO',description:'Publicaciones, procesos creativos, lanzamientos y novedades de SKYBLOCK STUDIO.',path:'/posts'},
  nosotros:{title:'Nuestra historia | SKYBLOCK STUDIO',description:'Conoce el origen de SKYBLOCK, su historia en Tarapoto y el movimiento Del bloque para el cielo.',path:'/nosotros'},
  contacto:{title:'Contacto en Tarapoto | SKYBLOCK STUDIO',description:'Contacta con SKYBLOCK STUDIO para consultar productos, tallas, disponibilidad y colaboraciones.',path:'/contacto'},
  verificar:{title:'Verificar autenticidad | SKYBLOCK STUDIO',description:'Verifica el código, diseño, colección y número de serie de tu prenda SKYBLOCK STUDIO.',path:'/verificar'},
  privacidad:{title:'Política de privacidad | SKYBLOCK STUDIO',description:'Conoce cómo SKYBLOCK STUDIO trata y protege tus datos personales conforme a las normas peruanas.',path:'/privacidad'},
  terminos:{title:'Términos y condiciones | SKYBLOCK STUDIO',description:'Términos y condiciones de uso y contratación de SKYBLOCK STUDIO conforme a la normativa peruana.',path:'/terminos'},
  login:{title:'Iniciar sesión | SKYBLOCK STUDIO',description:'Acceso privado a SKYBLOCK STUDIO.',path:'/login',index:false},
  registro:{title:'Crear cuenta | SKYBLOCK STUDIO',description:'Registro de cuenta en SKYBLOCK STUDIO.',path:'/registro',index:false},
  admin:{title:'Panel administrativo | SKYBLOCK STUDIO',description:'Panel privado de administración.',path:'/admin',index:false},
}
const upsertMeta = (selector:string,attribute:string,value:string) => {
  let element=document.head.querySelector<HTMLMetaElement>(selector)
  if(!element){element=document.createElement('meta');document.head.appendChild(element)}
  element.setAttribute(attribute,value)
}
const actualizarSeo = (pagina:string) => {
  const seo=SEO[pagina] || SEO.inicio
  const query=['producto','coleccion'].includes(pagina) ? location.search : ''
  const canonical=`https://www.skyblocktpp.com${seo.path}${query}`
  document.title=seo.title
  upsertMeta('meta[name="description"]','content',seo.description)
  upsertMeta('meta[name="robots"]','content',seo.index===false?'noindex,nofollow':'index,follow,max-image-preview:large')
  upsertMeta('meta[property="og:title"]','content',seo.title)
  upsertMeta('meta[property="og:description"]','content',seo.description)
  upsertMeta('meta[property="og:url"]','content',canonical)
  let link=document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if(!link){link=document.createElement('link');link.rel='canonical';document.head.appendChild(link)}
  link.href=canonical
}

export default function App() {
  const frame = useRef<HTMLIFrameElement>(null)
  const [datos, setDatos] = useState<Datos>({ productos: [], colecciones: [], publicaciones: [] })

  const cargarPublicos = useCallback(async () => {
    const [p, c, posts] = await Promise.all([
      supabase.from('productos').select('*,tipo:tipos_producto(*),coleccion:colecciones(*),tallas:tallas_producto(*),imagenes(*)').in('estado', ['publicado', 'archivado']).order('creado_en', { ascending: false }),
      supabase.from('colecciones').select('*,imagenes(*)').eq('estado', 'publicado').order('publicado_en', { ascending: false }),
      supabase.from('publicaciones').select('*,imagenes(*)').eq('estado', 'publicado').lte('publicado_en', new Date().toISOString()).order('publicado_en', { ascending: false }),
    ])
    const next = p.error || c.error || posts.error
      ? { productos: [], colecciones: [], publicaciones: [], error: 'No se pudieron cargar los datos.' }
      : { productos: p.data ?? [], colecciones: c.data ?? [], publicaciones: posts.data ?? [] }
    setDatos(next)
    return next
  }, [])

  useEffect(() => { document.body.className = 'legacy-shell'; actualizarSeo(rutaInicial); void cargarPublicos() }, [cargarPublicos])

  const obtenerAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data: rol } = user ? await supabase.from('roles_usuario').select('rol').eq('usuario_id', user.id).maybeSingle() : { data: null }
    const esRolAdmin = Boolean(rol && ['administrador', 'superadministrador'].includes(rol.rol))
    const { data: nivel } = user && esRolAdmin ? await supabase.auth.mfa.getAuthenticatorAssuranceLevel() : { data: null }
    const mfaVerificado = nivel?.currentLevel === 'aal2'
    return { user, rol: rol as Rol, esRolAdmin, mfaVerificado, esAdmin: esRolAdmin && mfaVerificado }
  }

  const iniciarMfaAdmin = async () => {
    const niveles = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
    if (niveles.error) throw niveles.error
    if (niveles.data.currentLevel === 'aal2') return { verificado:true }
    const factores = await supabase.auth.mfa.listFactors()
    if (factores.error) throw factores.error
    const verificado = factores.data.totp.find((factor) => factor.status === 'verified')
    if (verificado) return { verificado:false, modo:'desafio', factorId:verificado.id }
    for (const factor of factores.data.totp.filter((item) => item.status !== 'verified')) await supabase.auth.mfa.unenroll({ factorId:factor.id })
    const registro = await supabase.auth.mfa.enroll({ factorType:'totp', friendlyName:'SKYBLOCK Admin' })
    if (registro.error) throw registro.error
    return { verificado:false, modo:'registro', factorId:registro.data.id, qr:registro.data.totp.qr_code, secreto:registro.data.totp.secret }
  }

  const enviar = useCallback(async () => {
    const ventana = frame.current?.contentWindow
    ventana?.postMessage({ tipo: 'SKYBLOCK_DATOS_PUBLICOS', datos }, location.origin)
    try {
      const documento = frame.current?.contentDocument
      if (documento?.title) document.title = documento.title
      const { user, esRolAdmin, esAdmin } = await obtenerAdmin()
      documento?.body.classList.toggle('skyblock-admin-auth', esAdmin)
      documento?.body.classList.toggle('skyblock-signed-out', !user)
      ventana?.postMessage({ tipo: 'SKYBLOCK_ESTADO_AUTH', conectado: Boolean(user), esAdmin }, location.origin)
      const ruta = ventana?.location.pathname || ''
      const pagina = ruta.split('/').pop()?.replace(/\.html$/, '') || 'inicio'
      if (paginas.has(pagina)) {
        const rutaLimpia = `/${pagina}${ventana?.location.search || ''}`
        if (`${location.pathname}${location.search}` !== rutaLimpia) history.replaceState(null, '', rutaLimpia)
        actualizarSeo(pagina)
      }
      if (ruta.endsWith('/admin.html') && !user) { ventana!.location.href = 'login.html'; return }
      if (ruta.endsWith('/admin.html') && !esAdmin) { ventana!.location.href = esRolAdmin ? 'login.html' : 'inicio.html'; return }
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
    if (archivo.size > MAX_IMAGE_SIZE_BYTES) throw new Error('Cada imagen debe pesar como máximo 150 MB')
    const { data: firma, error } = await supabase.functions.invoke('cloudinary-signature')
    if (error || !firma?.signature) throw new Error(firma?.error || 'No se pudo firmar la imagen')
    const endpoint = `https://api.cloudinary.com/v1_1/${firma.cloudName}/image/upload`
    const crearFormulario = (contenido: Blob) => {
      const form = new FormData()
      form.append('file', contenido, archivo.name)
      form.append('api_key', firma.apiKey)
      form.append('timestamp', String(firma.timestamp))
      form.append('signature', firma.signature)
      form.append('folder', firma.folder)
      form.append('upload_preset', firma.uploadPreset)
      return form
    }
    if (archivo.size <= 100 * 1024 * 1024) {
      const response = await fetch(endpoint, { method: 'POST', body: crearFormulario(archivo) })
      const result = await response.json()
      if (!response.ok) throw new Error(result?.error?.message || 'Cloudinary rechazó la imagen')
      return result
    }
    const uploadId = crypto.randomUUID()
    let result: any = null
    for (let inicio = 0; inicio < archivo.size; inicio += CLOUDINARY_CHUNK_SIZE_BYTES) {
      const fin = Math.min(inicio + CLOUDINARY_CHUNK_SIZE_BYTES, archivo.size)
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'X-Unique-Upload-Id': uploadId, 'Content-Range': `bytes ${inicio}-${fin - 1}/${archivo.size}` },
        body: crearFormulario(archivo.slice(inicio, fin)),
      })
      result = await response.json()
      if (!response.ok) throw new Error(result?.error?.message || 'Cloudinary rechazó la imagen')
    }
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
      supabase.from('codigos_autenticidad').select('*,coleccion:colecciones(id,nombre),producto:productos(id,nombre,unidades_limitadas)').order('creado_en', { ascending: false }),
    ])
    const error = productos.error || colecciones.error || tipos.error || codigos.error
    const cs = (colecciones.data ?? []).map((c: any) => ({ id:c.id, name:c.nombre, slug:c.slug, edition:c.numero_edicion, status:c.estado === 'publicado' ? 'published' : c.estado === 'archivado' ? 'upcoming' : 'draft', limited:false, description:c.descripcion, story:c.historia, cover:[...(c.imagenes || [])].sort((a:FilaImagen,b:FilaImagen)=>(a.posicion||0)-(b.posicion||0))[0]?.url_segura || '' }))
    const ps = (productos.data ?? []).map((p: any) => { const images=[...(p.imagenes || [])].sort((a:FilaImagen,b:FilaImagen)=>(a.posicion||0)-(b.posicion||0)); return { id:p.id, name:p.nombre, type:p.tipo?.nombre || '', collection:p.coleccion?.nombre || '', price:Number(p.precio), description:p.descripcion, sizes:Object.fromEntries((p.tallas || []).map((t:any)=>[t.talla,t.stock])), limited:p.es_limitado, limitedUnits:p.unidades_limitadas, blocked:p.estado === 'archivado', image:images[0]?.url_segura || '', gallery:images.slice(1).map((i:FilaImagen)=>i.url_segura) } })
    const codes = (codigos.data ?? []).map((c:any) => ({ id:c.id, hash:String(c.codigo_hmac || '').replace(/^\\x/,''), codeHint:`•••• ${c.ultimos_cuatro}`, series:c.numero_serie, collection:c.coleccion?.nombre || '', product:c.producto?.nombre || '', owner:c.propietario_nombre || 'Sin registrar', status:c.estado === 'bloqueado' || c.estado === 'anulado' ? 'blocked' : 'active' }))
    return { productos: ps, colecciones: cs, tipos: (tipos.data ?? []).map((t:any)=>t.nombre), codigos: codes, error: error?.message || '' }
  }

  useEffect(() => {
    const recibir = async (e: MessageEvent) => {
      if (e.origin !== location.origin) return
      if (e.data?.tipo === 'SKYBLOCK_SOLICITAR_DATOS') { void enviar(); return }
      if (e.data?.tipo === 'SKYBLOCK_VERIFICAR_CODIGO') {
        const { data, error } = await supabase.rpc('verificar_codigo_autenticidad', { codigo_hash: String(e.data.hash || '') })
        const row = Array.isArray(data) ? data[0] : data
        e.source?.postMessage({ tipo:'SKYBLOCK_VERIFICAR_RESULTADO', id:e.data.id, registro: error || !row ? null : { series:row.numero_serie, collection:row.coleccion, design:row.diseno, limitedUnits:row.unidades_limitadas, owner:row.propietario_nombre || 'Sin registrar', status:['bloqueado','anulado'].includes(row.estado) ? 'blocked' : 'active' } }, { targetOrigin:e.origin })
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
            const limitedUnits=Number(d.limitedUnits||0);if(d.limited&&limitedUnits<1)throw new Error('Indica cuántas prendas limitadas tendrá el diseño')
            const totalStock=Object.values(d.sizes||{}).reduce((sum:number,stock:any)=>sum+Number(stock||0),0);if(d.limited&&limitedUnits<totalStock)throw new Error(`La cantidad limitada no puede ser menor al stock total (${totalStock})`)
            if(idValido&&d.limited){const codigos=await supabase.from('codigos_autenticidad').select('id',{count:'exact',head:true}).eq('producto_id',d.id);if(codigos.error)throw codigos.error;if((codigos.count||0)>limitedUnits)throw new Error(`Este diseño ya tiene ${codigos.count} códigos y no puede reducirse a ${limitedUnits} prendas`)}
            const payload={tipo_producto_id:tipo.id,coleccion_id:coleccion.id,nombre:String(d.name||'').trim(),slug:String(d.name||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''),precio:Number(d.price),moneda:'PEN',descripcion:String(d.description||'').trim(),estado:d.blocked?'archivado':'publicado',es_limitado:Boolean(d.limited),unidades_limitadas:d.limited?limitedUnits:null,creado_por:user.id}
            const saved=idValido?await supabase.from('productos').update(payload).eq('id',d.id).select('id').single():await supabase.from('productos').insert(payload).select('id').single(); if(saved.error)throw saved.error
            const tallasEliminadas=await supabase.from('tallas_producto').delete().eq('producto_id',saved.data.id);if(tallasEliminadas.error)throw tallasEliminadas.error
            const tallas=Object.entries(d.sizes||{}).map(([talla,stock])=>({producto_id:saved.data.id,talla,stock:Number(stock)}));if(!tallas.length)throw new Error('Selecciona al menos una talla');if(tallas.length){const tr=await supabase.from('tallas_producto').insert(tallas).select('talla');if(tr.error)throw tr.error;if((tr.data||[]).length!==tallas.length)throw new Error('No se guardaron todas las tallas seleccionadas')}
            const nuevas=[d.image,...(d.gallery||[]).slice(0,2)].filter((x:string)=>String(x||'').startsWith('data:')); if(nuevas.length){await eliminarImagenesRelacion('producto_id',saved.data.id);for(let i=0;i<nuevas.length;i++)await guardarImagen(nuevas[i],{producto_id:saved.data.id},i,user.id,d.name)}
          } else if (e.data.tipo === 'SKYBLOCK_ADMIN_ELIMINAR_PRODUCTO') {
            const id = String(d.id || '')
            const codigosAsociados = await supabase.from('codigos_autenticidad').select('id', { count:'exact', head:true }).eq('producto_id',id)
            if (codigosAsociados.error) throw codigosAsociados.error
            if ((codigosAsociados.count || 0) > 0) throw new Error(`El producto tiene ${codigosAsociados.count} código(s) de autenticidad asociado(s)`)
            await eliminarImagenesRelacion('producto_id',id)
            const result = await supabase.from('productos').delete().eq('id',id).select('id').single()
            if (result.error) throw result.error
          } else if (e.data.tipo === 'SKYBLOCK_ADMIN_GUARDAR_TIPO') {
            const slug=String(d.nombre||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''); const result=await supabase.from('tipos_producto').insert({nombre:d.nombre,slug});if(result.error)throw result.error
          } else if (e.data.tipo === 'SKYBLOCK_ADMIN_ELIMINAR_TIPO') {
            const result=await supabase.from('tipos_producto').delete().eq('nombre',d.nombre);if(result.error)throw result.error
          } else if (e.data.tipo === 'SKYBLOCK_ADMIN_GUARDAR_CODIGO') {
            const idValido = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(d.id || ''))
            const {data:coleccion,error:ce}=await supabase.from('colecciones').select('id').eq('nombre',d.collection).single();if(ce)throw ce
            const {data:producto,error:pe}=await supabase.from('productos').select('id,unidades_limitadas').eq('coleccion_id',coleccion.id).eq('nombre',d.product).single();if(pe)throw pe
            if(!producto.unidades_limitadas)throw new Error('El diseño no tiene una cantidad limitada configurada')
            const serie=String(d.series||'').match(/^(\d+)\/(\d+)$/);if(!serie||Number(serie[2])!==producto.unidades_limitadas||Number(serie[1])<1||Number(serie[1])>producto.unidades_limitadas)throw new Error(`La serie debe usar el límite ${producto.unidades_limitadas}`)
            const existentes=await supabase.from('codigos_autenticidad').select('id',{count:'exact',head:true}).eq('producto_id',producto.id);if(existentes.error)throw existentes.error
            if(!idValido&&(existentes.count||0)>=producto.unidades_limitadas)throw new Error('Ya se crearon todos los códigos permitidos para este diseño')
            const payload={producto_id:producto.id,coleccion_id:coleccion.id,codigo_hmac:`\\x${d.hash}`,ultimos_cuatro:String(d.codeHint||'').slice(-4),numero_serie:d.series,estado:d.status==='blocked'?'bloqueado':'disponible',propietario_nombre:d.owner==='Sin registrar'?null:d.owner,creado_por:user.id}
            const result=idValido?await supabase.from('codigos_autenticidad').update(payload).eq('id',d.id):await supabase.from('codigos_autenticidad').insert(payload);if(result.error)throw result.error
          } else if (e.data.tipo === 'SKYBLOCK_ADMIN_ELIMINAR_CODIGO') { const result=await supabase.from('codigos_autenticidad').delete().eq('id',d.id);if(result.error)throw result.error }
          else return
        } catch(caught:any) { error=caught }
        const adminData=await cargarAdmin()
        e.source?.postMessage({tipo:'SKYBLOCK_ADMIN_DATOS',...adminData},{targetOrigin:e.origin})
        const eliminandoColeccion=e.data.tipo==='SKYBLOCK_ADMIN_ELIMINAR_COLECCION'
        const eliminandoProducto=e.data.tipo==='SKYBLOCK_ADMIN_ELIMINAR_PRODUCTO'
        const eliminando=eliminandoColeccion||eliminandoProducto
        e.source?.postMessage({tipo:'SKYBLOCK_ADMIN_ACCION_RESULTADO',ok:!error,mensaje:error?`${eliminando?'No se pudo eliminar':'No se pudo guardar'}: ${error.message||'error desconocido'}`:eliminandoColeccion?'Colección eliminada de Supabase.':eliminandoProducto?'Producto e imágenes eliminados.':'Cambios guardados en Supabase.'},{targetOrigin:e.origin})
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
        const { data, error } = await supabase.functions.invoke('contact-submit',{body:d})
        e.source?.postMessage({ tipo:'SKYBLOCK_CONTACTO_RESULTADO',ok:!error&&Boolean(data?.ok),mensaje:data?.mensaje||(error?'No se pudo validar el envío. Inténtalo nuevamente.':'Mensaje procesado.') },{targetOrigin:e.origin});return
      }
      if(e.data?.tipo==='SKYBLOCK_SOLICITAR_CONFIGURACION_PUBLICA'){
        e.source?.postMessage({tipo:'SKYBLOCK_CONFIGURACION_PUBLICA',turnstileSiteKey:import.meta.env.VITE_TURNSTILE_SITE_KEY||''},{targetOrigin:e.origin});return
      }
      if (e.data?.tipo === 'SKYBLOCK_LOGOUT') { await supabase.auth.signOut(); if (frame.current?.contentWindow) frame.current.contentWindow.location.href = 'inicio.html'; return }
      if (e.data?.tipo === 'SKYBLOCK_LOGIN') {
        const { correo, contrasena } = e.data
        const { data, error } = await supabase.auth.signInWithPassword({ email: correo, password: contrasena })
        if (error || !data.user) { const mensaje = error?.code === 'email_not_confirmed' ? 'Debes confirmar tu correo antes de iniciar sesión.' : error?.code === 'invalid_credentials' ? 'Correo o contraseña incorrectos.' : 'No se pudo iniciar sesión. Inténtalo nuevamente.'; e.source?.postMessage({ tipo: 'SKYBLOCK_AUTH_RESULTADO', ok: false, mensaje }, { targetOrigin: e.origin }); return }
        const { data: rol, error: errorRol } = await supabase.from('roles_usuario').select('rol').eq('usuario_id', data.user.id).maybeSingle()
        if (errorRol) { e.source?.postMessage({ tipo: 'SKYBLOCK_AUTH_RESULTADO', ok: false, mensaje: 'La sesión inició, pero no se pudo comprobar el acceso administrativo.' }, { targetOrigin: e.origin }); return }
        const esAdmin = Boolean(rol && ['administrador', 'superadministrador'].includes(rol.rol))
        if (!esAdmin) { e.source?.postMessage({ tipo:'SKYBLOCK_AUTH_RESULTADO', ok:true, esAdmin:false, mensaje:'Sesión iniciada correctamente.' }, { targetOrigin:e.origin }); return }
        try {
          const mfa=await iniciarMfaAdmin()
          if(mfa.verificado){e.source?.postMessage({tipo:'SKYBLOCK_AUTH_RESULTADO',ok:true,esAdmin:true,mensaje:'Acceso administrativo concedido.'},{targetOrigin:e.origin});return}
          e.source?.postMessage({tipo:'SKYBLOCK_MFA_REQUERIDO',...mfa,mensaje:mfa.modo==='registro'?'Escanea el código QR y escribe el código de 6 dígitos.':'Escribe el código de Google Authenticator.'},{targetOrigin:e.origin})
        } catch { await supabase.auth.signOut(); e.source?.postMessage({tipo:'SKYBLOCK_AUTH_RESULTADO',ok:false,mensaje:'No se pudo preparar la verificación en dos pasos.'},{targetOrigin:e.origin}) }
        return
      }
      if (e.data?.tipo === 'SKYBLOCK_MFA_VERIFICAR') {
        const factorId=String(e.data.factorId||''),code=String(e.data.code||'').replace(/\D/g,'').slice(0,6)
        if(!factorId||code.length!==6){e.source?.postMessage({tipo:'SKYBLOCK_MFA_RESULTADO',ok:false,mensaje:'Ingresa los 6 dígitos de Google Authenticator.'},{targetOrigin:e.origin});return}
        const challenge=await supabase.auth.mfa.challenge({factorId})
        if(challenge.error){e.source?.postMessage({tipo:'SKYBLOCK_MFA_RESULTADO',ok:false,mensaje:'No se pudo iniciar la comprobación. Inténtalo nuevamente.'},{targetOrigin:e.origin});return}
        const verify=await supabase.auth.mfa.verify({factorId,challengeId:challenge.data.id,code})
        if(verify.error){e.source?.postMessage({tipo:'SKYBLOCK_MFA_RESULTADO',ok:false,mensaje:'El código no es correcto o ya venció.'},{targetOrigin:e.origin});return}
        const {esAdmin}=await obtenerAdmin()
        e.source?.postMessage({tipo:'SKYBLOCK_MFA_RESULTADO',ok:esAdmin,mensaje:esAdmin?'Verificación completada. Abriendo el panel…':'No se pudo confirmar el acceso administrativo.'},{targetOrigin:e.origin})
      }
    }
    addEventListener('message', recibir); void enviar(); return () => removeEventListener('message', recibir)
  }, [cargarPublicos, enviar])

  return <iframe ref={frame} className="legacy-frontend" src={`/legacy/${rutaInicial}.html${location.search}`} title="SKYBLOCK STUDIO" onLoad={enviar} />
}
