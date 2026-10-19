(() => {
  const boot = () => {
  const header = document.getElementById('nav');
  const desktopNav = header?.querySelector('.desktop-nav');
  if (!header || !desktopNav) return;

  const brand = header.querySelector('.brand');
  if (brand && !brand.querySelector('img')) {
    brand.replaceChildren();
    const wordmark = document.createElement('img');
    wordmark.src = 'assets/image/skyblock-wordmark.png';
    wordmark.alt = 'Skyblock';
    brand.append(wordmark);
    brand.classList.add('brand--wordmark');
  }

  // Los paneles desplegables quedan pausados por ahora: el encabezado conserva
  // sus enlaces principales directos, sin cuadros informativos adicionales.
  const showInfoPanels = false;
  if (!showInfoPanels) return;

  const sections = {
    'catalogo.html': { title: 'Catálogo', eyebrow: 'Explora por categoría' },
    'colecciones.html': { title: 'Colecciones', eyebrow: 'Series publicadas' },
    'posts.html': { title: 'Posts', eyebrow: 'Comunidad SKYBLOCK' },
    'verificar.html': { title: 'Autenticidad', eyebrow: 'Tu prenda SKYBLOCK' },
  };
  const triggers = [...desktopNav.querySelectorAll('a')].filter((link) => sections[link.getAttribute('href')]);
  if (!triggers.length) return;

  const menu = document.createElement('section');
  menu.className = 'header-mega-menu';
  menu.setAttribute('aria-label', 'Opciones de navegación');
  menu.hidden = true;
  document.body.append(menu);

  let current = null;
  let closeTimer = 0;
  let catalogTags = [];
  let collections = [];
  const compact = () => window.matchMedia('(max-width: 1000px)').matches;
  const close = () => {
    window.clearTimeout(closeTimer);
    current?.setAttribute('aria-expanded', 'false');
    current = null;
    document.body.classList.remove('header-mega-open');
    menu.hidden = true;
  };
  const scheduleClose = () => {
    window.clearTimeout(closeTimer);
    closeTimer = window.setTimeout(close, 150);
  };
  const updatePosition = () => {
    if (menu.hidden) return;
    const headerBox = header.getBoundingClientRect();
    const triggerBox = current?.getBoundingClientRect();
    const menuWidth = Math.min(320, window.innerWidth - 24);
    const left = Math.max(12, Math.min(triggerBox?.left || headerBox.left, window.innerWidth - menuWidth - 12));
    menu.style.top = `${Math.round(headerBox.bottom)}px`;
    menu.style.left = `${Math.round(left)}px`;
  };
  const addLink = (parent, label, href, description = '') => {
    const link = document.createElement('a');
    link.href = href;
    const title = document.createElement('strong');
    title.textContent = label;
    link.append(title);
    if (description) {
      const copy = document.createElement('span');
      copy.textContent = description;
      link.append(copy);
    }
    parent.append(link);
  };
  const draw = (route) => {
    const details = sections[route];
    if (!details) return;
    menu.replaceChildren();
    const inner = document.createElement('div');
    inner.className = 'header-mega-menu-inner';
    const intro = document.createElement('div');
    intro.className = 'header-mega-menu-intro';
    const eyebrow = document.createElement('span');
    eyebrow.textContent = details.eyebrow;
    const heading = document.createElement('h2');
    heading.textContent = details.title;
    intro.append(eyebrow, heading);
    const links = document.createElement('div');
    links.className = 'header-mega-menu-links';

    if (route === 'catalogo.html') {
      addLink(links, 'Ver todo el catálogo', 'catalogo.html', 'Todas las piezas disponibles');
      (catalogTags.length ? catalogTags : [{ label: 'Próximamente', href: 'catalogo.html' }]).forEach((tag) => addLink(links, tag.label, tag.href));
    }
    if (route === 'colecciones.html') {
      addLink(links, 'Todas las colecciones', 'colecciones.html', 'Explora cada edición');
      (collections.length ? collections : [{ label: 'Próximamente', href: 'colecciones.html' }]).forEach((collection) => addLink(links, collection.label, collection.href, collection.edition));
    }
    if (route === 'posts.html') addLink(links, 'Perfil de la página', 'posts.html', 'Noticias y publicaciones de SKYBLOCK');
    if (route === 'verificar.html') addLink(links, 'Verificador de autenticidad', 'verificar.html', 'Comprueba el código único de tu prenda');
    inner.append(intro, links);
    menu.append(inner);
  };
  const open = (trigger) => {
    if (compact()) return;
    window.clearTimeout(closeTimer);
    if (current && current !== trigger) current.setAttribute('aria-expanded', 'false');
    current = trigger;
    const route = trigger.getAttribute('href');
    draw(route);
    trigger.setAttribute('aria-expanded', 'true');
    menu.hidden = false;
    document.body.classList.add('header-mega-open');
    updatePosition();
  };
  const setData = (data = {}) => {
    const tags = new Map();
    (data.productos || []).forEach((product) => {
      const type = product?.tipo;
      const label = String(type?.nombre || type?.slug || '').trim();
      if (!label) return;
      tags.set(label.toLocaleLowerCase('es'), { label, href: 'catalogo.html' });
    });
    catalogTags = [...tags.values()].sort((a, b) => a.label.localeCompare(b.label, 'es'));
    collections = (data.colecciones || [])
      .filter((collection) => collection?.estado === 'publicado' && collection?.slug && collection.slug !== '__proximamente__')
      .map((collection) => ({
        label: String(collection.nombre || 'Colección'),
        edition: String(collection.numero_edicion || ''),
        href: `coleccion.html?id=${encodeURIComponent(collection.slug)}`,
      }));
    if (current) draw(current.getAttribute('href'));
  };

  triggers.forEach((trigger) => {
    trigger.setAttribute('aria-haspopup', 'true');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.addEventListener('pointerenter', () => open(trigger));
    trigger.addEventListener('focus', () => open(trigger));
    trigger.addEventListener('pointerleave', scheduleClose);
  });
  menu.addEventListener('pointerenter', () => window.clearTimeout(closeTimer));
  menu.addEventListener('pointerleave', scheduleClose);
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') close(); });
  window.addEventListener('resize', () => { if (compact()) close(); else updatePosition(); });
  window.addEventListener('scroll', updatePosition, { passive: true });
  window.addEventListener('message', (event) => {
    if (event.origin === location.origin && event.data?.tipo === 'SKYBLOCK_DATOS_PUBLICOS') setData(event.data.datos);
  });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
