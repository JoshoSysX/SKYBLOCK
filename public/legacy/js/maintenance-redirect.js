// Las páginas legacy solo deben vivir dentro de la aplicación principal.
// Si se intenta abrir una directamente, se vuelve a la ruta protegida.
;(() => {
  if (window.top === window.self) {
    const page = location.pathname.split('/').pop()?.replace(/\.html$/, '') || 'inicio'
    const route = page === 'inicio' ? '/' : `/${page}`
    const params = new URLSearchParams(location.search)
    params.delete('__embed'); params.delete('_skb')
    location.replace(`${route}${params.toString() ? `?${params}` : ''}${location.hash}`)
    return
  }
  const consent = document.createElement('script')
  consent.src = 'js/cookie-consent.js?v=20261010-5'
  consent.async = false
  document.head.appendChild(consent)

  // La navegación pública la controla el shell. Interceptarla al capturar el clic
  // evita que el iframe cargue primero la página anterior y luego se corrija.
  document.addEventListener('click', (event) => {
    const link = event.target instanceof Element ? event.target.closest('a[href]') : null
    if (!link || link.target === '_blank' || event.defaultPrevented) return
    const target = new URL(link.href, location.href)
    if (target.origin !== location.origin || !target.pathname.startsWith('/legacy/') || !target.pathname.endsWith('.html')) return
    const page = target.pathname.split('/').pop()?.replace(/\.html$/, '') || 'inicio'
    event.preventDefault()
    event.stopPropagation()
    window.top.postMessage({ tipo:'SKYBLOCK_NAVEGAR', pagina:page, search:target.search, hash:target.hash }, location.origin)
  }, true)
})()
