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
  consent.src = 'js/cookie-consent.js?v=20261010'
  consent.defer = true
  document.head.appendChild(consent)
})()
