;(() => {
  // Nueva versión del aviso: pedimos la elección de nuevo tras corregir su carga.
  // Después de esta primera vez la decisión continúa guardada normalmente.
  const storageKey = 'skb_cookie_preferences_v2'
  const getMeasurementId = () => {
    try {
      return String(window.SKYBLOCK_GA_MEASUREMENT_ID || window.top?.SKYBLOCK_GA_MEASUREMENT_ID || document.documentElement.dataset.gaMeasurementId || '').trim()
    } catch {
      return String(window.SKYBLOCK_GA_MEASUREMENT_ID || document.documentElement.dataset.gaMeasurementId || '').trim()
    }
  }
  const consent = (analytics) => {
    window.dataLayer = window.dataLayer || []
    window.gtag = window.gtag || function () { window.dataLayer.push(arguments) }
    window.gtag('consent', 'update', { analytics_storage: analytics ? 'granted' : 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' })
    if (!analytics) return
    const id = getMeasurementId()
    if (!id || document.querySelector(`script[data-skb-ga="${id}"]`)) return
    const script = document.createElement('script')
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`
    script.dataset.skbGa = id
    script.onload = () => window.gtag('config', id, { anonymize_ip: true })
    document.head.appendChild(script)
  }
  const read = () => {
    try { return JSON.parse(localStorage.getItem(storageKey) || 'null') } catch { return null }
  }
  const save = (analytics) => {
    const value = { necessary: true, analytics: Boolean(analytics), updatedAt: new Date().toISOString() }
    localStorage.setItem(storageKey, JSON.stringify(value))
    consent(value.analytics)
    return value
  }
  window.dataLayer = window.dataLayer || []
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments) }
  window.gtag('consent', 'default', { analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', functionality_storage: 'granted', security_storage: 'granted', wait_for_update: 500 })

  const style = `
    .skb-cookie{position:fixed;z-index:10000;right:20px;bottom:20px;width:min(470px,calc(100vw - 32px));padding:23px;background:#111214;color:#fff;box-shadow:0 18px 55px #0006;font-family:var(--body,Arial,sans-serif)}
    .skb-cookie[hidden]{display:none}.skb-cookie__eyebrow{display:block;margin-bottom:9px;color:#aaa;font:600 9px var(--display,Arial,sans-serif);letter-spacing:.15em;text-transform:uppercase}.skb-cookie h2{margin:0 0 9px;font:600 25px/1 var(--display,Arial,sans-serif);text-transform:uppercase}.skb-cookie p{margin:0;color:#d5d5d1;font-size:12px;line-height:1.55}.skb-cookie a{color:#fff;text-decoration:underline;text-underline-offset:3px}.skb-cookie__actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:20px}.skb-cookie button{min-height:39px;padding:0 14px;border:1px solid #777;background:transparent;color:#fff;font:600 10px var(--display,Arial,sans-serif);letter-spacing:.08em;text-transform:uppercase;cursor:pointer}.skb-cookie button.skb-cookie__accept{border-color:#fff;background:#fff;color:#111}.skb-cookie button:hover{border-color:#fff}.skb-cookie__settings{display:none;margin-top:18px;padding-top:15px;border-top:1px solid #454545}.skb-cookie.is-settings .skb-cookie__settings{display:block}.skb-cookie__option{display:flex;align-items:flex-start;justify-content:space-between;gap:15px;padding:11px 0;border-bottom:1px solid #333}.skb-cookie__option:last-child{border:0}.skb-cookie__option b{display:block;font:600 11px var(--display,Arial,sans-serif);letter-spacing:.06em;text-transform:uppercase}.skb-cookie__option small{display:block;margin-top:5px;color:#bbb;font-size:10px;line-height:1.45}.skb-cookie__toggle{position:relative;flex:0 0 42px;margin-top:3px}.skb-cookie__toggle input{position:absolute;opacity:0}.skb-cookie__toggle span{display:block;width:38px;height:20px;border:1px solid #a1a1a1;background:#5a5a5a;cursor:pointer}.skb-cookie__toggle span:after{content:'';position:absolute;top:4px;left:4px;width:10px;height:10px;background:#fff;transition:.18s}.skb-cookie__toggle input:checked+span{background:#fff}.skb-cookie__toggle input:checked+span:after{left:22px;background:#111}.skb-cookie__toggle input:disabled+span{opacity:.55;cursor:not-allowed}@media(max-width:600px){.skb-cookie{right:16px;bottom:16px;padding:20px}.skb-cookie h2{font-size:22px}.skb-cookie__actions button{flex:1 1 auto;padding:0 10px}}
  `
  const render = () => {
    if (document.getElementById('skbCookieConsent')) return
    const node = document.createElement('section')
    node.id = 'skbCookieConsent'
    node.className = 'skb-cookie'
    node.setAttribute('role', 'dialog')
    node.setAttribute('aria-label', 'Preferencias de cookies')
    node.innerHTML = `<span class="skb-cookie__eyebrow">Tu privacidad</span><h2>Cookies a tu medida.</h2><p>Usamos cookies necesarias para que el sitio funcione y, si lo permites, Google Analytics para entender cómo mejorar la experiencia. Puedes cambiar tu elección cuando quieras.</p><div class="skb-cookie__settings"><div class="skb-cookie__option"><div><b>Necesarias</b><small>Seguridad, inicio de sesión y recuerdo de esta preferencia.</small></div><label class="skb-cookie__toggle"><input type="checkbox" checked disabled><span></span></label></div><div class="skb-cookie__option"><div><b>Analíticas</b><small>Medición anónima de visitas y uso mediante Google Analytics.</small></div><label class="skb-cookie__toggle"><input id="skbAnalyticsChoice" type="checkbox"><span></span></label></div></div><div class="skb-cookie__actions"><button class="skb-cookie__accept" type="button" data-cookie-action="accept">Aceptar analíticas</button><button type="button" data-cookie-action="reject">Rechazar</button><button type="button" data-cookie-action="settings">Configurar</button></div>`
    document.head.insertAdjacentHTML('beforeend', `<style data-skb-cookie-style>${style}</style>`)
    document.body.appendChild(node)
    const close = () => node.remove()
    node.addEventListener('click', (event) => {
      const action = event.target.closest('[data-cookie-action]')?.dataset.cookieAction
      if (action === 'accept') { save(true); close() }
      if (action === 'reject') { save(false); close() }
      if (action === 'settings') {
        if (!node.classList.contains('is-settings')) { node.classList.add('is-settings'); event.target.textContent = 'Guardar elección'; return }
        save(Boolean(node.querySelector('#skbAnalyticsChoice').checked)); close()
      }
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
    localStorage.removeItem(storageKey)
    render()
  })
})()
