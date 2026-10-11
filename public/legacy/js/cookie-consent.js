;(() => {
  const storageKey = 'skb_cookie_preferences_v2'
  const getMeasurementId = () => {
    try {
      return String(window.SKYBLOCK_GA_MEASUREMENT_ID || window.top?.SKYBLOCK_GA_MEASUREMENT_ID || document.documentElement.dataset.gaMeasurementId || '').trim()
    } catch {
      return String(window.SKYBLOCK_GA_MEASUREMENT_ID || document.documentElement.dataset.gaMeasurementId || '').trim()
    }
  }
  // El sitio público se renderiza dentro de un iframe. La etiqueta debe vivir en
  // la ventana principal para que Google Analytics pueda detectarla correctamente.
  const analyticsScope = () => {
    try { return window.top && window.top.document ? window.top : window } catch { return window }
  }
  const consent = (analytics) => {
    const scope = analyticsScope()
    scope.dataLayer = scope.dataLayer || []
    scope.gtag = scope.gtag || function () { scope.dataLayer.push(arguments) }
    scope.gtag('consent', 'update', { analytics_storage: analytics ? 'granted' : 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' })
    if (!analytics) return
    const id = getMeasurementId()
    if (!id) return
    if (scope.document.querySelector(`script[data-skb-ga="${id}"]`)) {
      scope.gtag('config', id, { anonymize_ip: true })
      return
    }
    const script = scope.document.createElement('script')
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`
    script.dataset.skbGa = id
    script.onload = () => scope.gtag('config', id, { anonymize_ip: true })
    scope.document.head.appendChild(script)
  }
  const storages = () => {
    const all = [window.localStorage]
    try { if (analyticsScope().localStorage !== window.localStorage) all.push(analyticsScope().localStorage) } catch {}
    return all
  }
  const read = () => {
    for (const storage of storages()) {
      try {
        const value = JSON.parse(storage.getItem(storageKey) || 'null')
        if (value && typeof value.analytics === 'boolean') return value
      } catch {}
    }
    return null
  }
  const save = (analytics) => {
    const value = { necessary: true, analytics: Boolean(analytics), updatedAt: new Date().toISOString() }
    storages().forEach((storage) => { try { storage.setItem(storageKey, JSON.stringify(value)) } catch {} })
    consent(value.analytics)
    return value
  }
  const scope = analyticsScope()
  scope.dataLayer = scope.dataLayer || []
  scope.gtag = scope.gtag || function () { scope.dataLayer.push(arguments) }
  scope.gtag('consent', 'default', { analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', functionality_storage: 'granted', security_storage: 'granted', wait_for_update: 500 })

  const style = `
    .skb-cookie{position:fixed;z-index:10000;right:20px;bottom:20px;width:min(470px,calc(100vw - 32px));padding:23px;background:#111214;color:#fff;box-shadow:0 18px 55px #0006;font-family:var(--body,Arial,sans-serif)}
    .skb-cookie[hidden]{display:none}.skb-cookie__eyebrow{display:block;margin-bottom:9px;color:#aaa;font:600 9px var(--display,Arial,sans-serif);letter-spacing:.15em;text-transform:uppercase}.skb-cookie h2{margin:0 0 9px;font:600 25px/1 var(--display,Arial,sans-serif);text-transform:uppercase}.skb-cookie p{margin:0;color:#d5d5d1;font-size:12px;line-height:1.55}.skb-cookie a{color:#fff;text-decoration:underline;text-underline-offset:3px}.skb-cookie__actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:20px}.skb-cookie button{min-height:39px;padding:0 14px;border:1px solid #777;background:transparent;color:#fff;font:600 10px var(--display,Arial,sans-serif);letter-spacing:.08em;text-transform:uppercase;cursor:pointer}.skb-cookie button.skb-cookie__accept{border-color:#fff;background:#fff;color:#111}.skb-cookie button:hover{border-color:#fff}@media(max-width:600px){.skb-cookie{right:16px;bottom:16px;padding:20px}.skb-cookie h2{font-size:22px}.skb-cookie__actions button{flex:1 1 auto;padding:0 10px}}
  `
  const render = () => {
    if (document.getElementById('skbCookieConsent')) return
    const node = document.createElement('section')
    node.id = 'skbCookieConsent'
    node.className = 'skb-cookie'
    node.setAttribute('role', 'dialog')
    node.setAttribute('aria-label', 'Preferencias de cookies')
    node.innerHTML = `<span class="skb-cookie__eyebrow">Tu privacidad</span><h2>Cookies a tu medida.</h2><p>Usamos cookies necesarias para que el sitio funcione y, con tu permiso, Google Analytics para conocer el uso de la página y mejorarla.</p><div class="skb-cookie__actions"><button class="skb-cookie__accept" type="button" data-cookie-action="accept">Sí, aceptar</button><button type="button" data-cookie-action="reject">No aceptar</button></div>`
    document.head.insertAdjacentHTML('beforeend', `<style data-skb-cookie-style>${style}</style>`)
    document.body.appendChild(node)
    const close = () => node.remove()
    node.addEventListener('click', (event) => {
      const action = event.target.closest('[data-cookie-action]')?.dataset.cookieAction
      if (action === 'accept') { save(true); close() }
      if (action === 'reject') { save(false); close() }
    })
  }
  const renderWhenReady = () => {
    const attempt = () => {
      if (document.body) {
        render()
        return
      }
      requestAnimationFrame(attempt)
    }
    // Este archivo se añade de forma dinámica desde el shell de React. En algunas
    // navegaciones el DOMContentLoaded ya ocurrió al terminar de descargarlo, por
    // lo que depender solo de ese evento dejaba el aviso sin mostrarse.
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', attempt, { once: true })
    attempt()
  }
  const preferences = read()
  if (preferences) consent(Boolean(preferences.analytics)); else renderWhenReady()
  document.addEventListener('click', (event) => {
    if (!event.target.closest('[data-cookie-settings]')) return
    event.preventDefault()
    storages().forEach((storage) => { try { storage.removeItem(storageKey) } catch {} })
    render()
  })
})()
