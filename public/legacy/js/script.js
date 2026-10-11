const nav = document.getElementById('nav');
const menuButton = document.getElementById('menuBtn');
const mobileNav = document.getElementById('mobileNav');
const navegarDesdeIframe = (destino) => {
  const url = new URL(destino, location.href);
  if (window.top !== window) {
    url.searchParams.set('__embed', '1');
    const version = new URL(location.href).searchParams.get('_skb');
    if (version) url.searchParams.set('_skb', version);
  }
  window.location.href = `${url.pathname}${url.search}${url.hash}`;
};

window.addEventListener('scroll', () => {
  nav.classList.toggle('fixed', window.scrollY > 80);
});

menuButton.addEventListener('click', () => {
  const isOpen = mobileNav.classList.toggle('open');
  document.body.classList.toggle('lock', isOpen);
  menuButton.setAttribute('aria-expanded', String(isOpen));
});

mobileNav.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    mobileNav.classList.remove('open');
    document.body.classList.remove('lock');
    menuButton.setAttribute('aria-expanded', 'false');
  });
});

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.reveal').forEach((element) => revealObserver.observe(element));

const chapterLinks = document.querySelectorAll('[data-scroll-section]');
const chapterSections = document.querySelectorAll('[data-chapter]');

chapterLinks.forEach((link) => {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    const target = document.getElementById(link.dataset.scrollSection);
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

const chapterObserver = new IntersectionObserver((entries) => {
  const visible = entries
    .filter((entry) => entry.isIntersecting)
    .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

  if (!visible) return;
  const currentChapter = visible.target.dataset.chapter;
  chapterLinks.forEach((link) => {
    link.classList.toggle('active', link.dataset.scrollSection === currentChapter);
  });
}, { rootMargin: '-28% 0px -48% 0px', threshold: [0, 0.15, 0.4] });

chapterSections.forEach((section) => chapterObserver.observe(section));

const featuredProducts = ['void', 'skyblock', 'architect', 'utility'];
document.querySelectorAll('.featured-grid .product').forEach((product, index) => {
  product.style.cursor = 'pointer';
  product.addEventListener('click', () => {
    navegarDesdeIframe(`producto.html?id=${featuredProducts[index]}`);
  });
});

const hologramSection = document.querySelector('.hologram-section');
const hologramStage = document.querySelector('.hologram-stage');

const introHero = document.querySelector('.home-page .hero');
const featuredCollection = document.querySelector('.home-page #shop');
if (introHero && hologramSection && featuredCollection) {
  const introScrollSections = [introHero,hologramSection,featuredCollection];
  let introScrollLocked = false;
  window.addEventListener('wheel', (event) => {
    if (introScrollLocked || Math.abs(event.deltaY) < 8) return;
    const viewportHeight = window.innerHeight || 1;
    const currentIndex = introScrollSections
      .map((section,index) => ({ index,distance:Math.abs(section.getBoundingClientRect().top) }))
      .sort((a,b) => a.distance - b.distance)[0].index;
    const currentTop = introScrollSections[currentIndex].getBoundingClientRect().top;
    if (Math.abs(currentTop) > viewportHeight * .48) return;

    const direction = event.deltaY > 0 ? 1 : -1;
    const nextIndex = currentIndex + direction;
    if (nextIndex < 0 || nextIndex >= introScrollSections.length) return;
    event.preventDefault();
    introScrollLocked = true;
    introScrollSections[nextIndex].scrollIntoView({ behavior:'smooth',block:'start' });
    window.setTimeout(() => { introScrollLocked = false; }, 850);
  }, { passive:false });
}

const logoCarousel = document.getElementById('logoCarousel');
if (hologramSection && logoCarousel) {
  const track = logoCarousel.querySelector('.logo-carousel-track');
  const viewport = logoCarousel.querySelector('.logo-carousel-viewport');
  let slides = [...logoCarousel.querySelectorAll('.logo-carousel-slide')];
  const dots = [...document.querySelectorAll('.logo-carousel-dots button')];
  const previous = logoCarousel.querySelector('.previous');
  const next = logoCarousel.querySelector('.next');
  const title = document.getElementById('logoCarouselTitle');
  const meta = document.getElementById('logoCarouselMeta');
  const footer = document.getElementById('logoCarouselFooter');
  const aboutLink = document.getElementById('logoCarouselAbout');
  let currentLogo = 0;
  let timer;
  let dragStartX = null;
  let switchTimer;

  const showLogo = (index) => {
    currentLogo = (index + slides.length) % slides.length;
    logoCarousel.classList.remove('is-switching');
    window.clearTimeout(switchTimer);
    requestAnimationFrame(() => logoCarousel.classList.add('is-switching'));
    switchTimer = window.setTimeout(() => logoCarousel.classList.remove('is-switching'), 760);
    slides.forEach((slide, slideIndex) => {
      slide.classList.toggle('is-active', slideIndex === currentLogo);
      slide.classList.toggle('is-prev', slideIndex === (currentLogo - 1 + slides.length) % slides.length);
      slide.classList.toggle('is-next', slideIndex === (currentLogo + 1) % slides.length);
    });
    dots.forEach((dot, dotIndex) => dot.classList.toggle('is-active', dotIndex === currentLogo));
    title.textContent = slides[currentLogo].dataset.logoTitle;
    meta.textContent = slides[currentLogo].dataset.logoMeta;
    footer.textContent = slides[currentLogo].dataset.logoFooter || 'IDENTIDAD PRINCIPAL DE LA MARCA';
    aboutLink.hidden = slides[currentLogo].dataset.aboutLink !== 'true';
    if (!aboutLink.hidden) aboutLink.href = slides[currentLogo].dataset.aboutUrl || 'nosotros.html';
  };
  const restart = () => {
    window.clearInterval(timer);
    timer = window.setInterval(() => showLogo(currentLogo + 1), 4800);
  };
  previous.addEventListener('click', () => { showLogo(currentLogo - 1); restart(); });
  next.addEventListener('click', () => { showLogo(currentLogo + 1); restart(); });
  dots.forEach((dot, index) => dot.addEventListener('click', () => { showLogo(index); restart(); }));
  viewport.addEventListener('pointerdown', (event) => {
    dragStartX = event.clientX;
    viewport.classList.add('dragging');
    viewport.setPointerCapture(event.pointerId);
    window.clearInterval(timer);
  });
  const finishDrag = (event) => {
    if (dragStartX === null) return;
    const distance = event.clientX - dragStartX;
    if (Math.abs(distance) > 35) showLogo(currentLogo + (distance < 0 ? 1 : -1));
    dragStartX = null;
    viewport.classList.remove('dragging');
    if (viewport.hasPointerCapture(event.pointerId)) viewport.releasePointerCapture(event.pointerId);
    restart();
  };
  viewport.addEventListener('pointerup', finishDrag);
  viewport.addEventListener('pointercancel', finishDrag);
  logoCarousel.addEventListener('pointermove', (event) => {
    const rect = hologramSection.getBoundingClientRect();
    hologramSection.style.setProperty('--holo-x', `${((event.clientX - rect.left) / rect.width) * 100}%`);
    hologramSection.style.setProperty('--holo-y', `${((event.clientY - rect.top) / rect.height) * 100}%`);
  });
  logoCarousel.addEventListener('mouseenter', () => window.clearInterval(timer));
  logoCarousel.addEventListener('mouseleave', restart);
  document.addEventListener('SKYBLOCK_COLABORACIONES', (event) => {
    track.querySelectorAll('.logo-collaboration').forEach((node) => node.remove());
    (event.detail || []).forEach((item) => {
      const logo = (item.imagenes || []).slice().sort((a,b) => (a.posicion || 0) - (b.posicion || 0))[1]?.url_segura;
      if (!logo || !item.slug) return;
      const slide = document.createElement('article');
      slide.className = 'logo-carousel-slide logo-collaboration';
      slide.dataset.logoTitle = item.nombre || 'Colaboración';
      slide.dataset.logoMeta = item.logo_meta || 'COLABORACIÓN / SKYBLOCK';
      slide.dataset.logoFooter = item.logo_pie || 'IDENTIDAD COLABORATIVA';
      slide.dataset.aboutLink = 'true';
      slide.dataset.aboutUrl = `coleccion.html?colaboracion=${encodeURIComponent(item.slug)}`;
      const image = document.createElement('img'); image.className = 'skb-logo-image'; image.src = logo; image.alt = `Logo de ${item.nombre || 'colaboración'}`; image.draggable = false;
      image.style.objectPosition = `${Number(item.logo_ajuste_x ?? 50)}% ${Number(item.logo_ajuste_y ?? 50)}%`;
      // El encuadre ya se hornea al guardar; no se debe mover otra vez dentro del carrusel.
      image.style.transform = 'scale(1)';
      image.style.translate = '0 0';
      slide.append(image); track.append(slide);
    });
    slides = [...logoCarousel.querySelectorAll('.logo-carousel-slide')];
    showLogo(currentLogo); restart();
  });
  if (Array.isArray(window.skyblockCollaborations)) document.dispatchEvent(new CustomEvent('SKYBLOCK_COLABORACIONES', { detail: window.skyblockCollaborations }));
  showLogo(0);
  restart();
}
