const nav = document.getElementById('nav');
const menuButton = document.getElementById('menuBtn');
const mobileNav = document.getElementById('mobileNav');

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
    window.location.href = `producto.html?id=${featuredProducts[index]}`;
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

if (hologramSection && hologramStage) {
  hologramStage.addEventListener('dragstart', (event) => event.preventDefault());
  let rotationX = -4;
  let rotationY = 0;
  let velocityX = 0;
  let velocityY = .08;
  let draggingLogo = false;
  let lastLogoX = 0;
  let lastLogoY = 0;

  const animateImageLogo = () => {
    if (!draggingLogo) {
      rotationX += velocityX;
      rotationY += velocityY;
      velocityX *= .94;
      velocityY = velocityY * .98 + .08 * .02;
    }
    rotationX = Math.max(-55,Math.min(55,rotationX));
    hologramStage.style.transform = `rotateX(${rotationX}deg) rotateY(${rotationY}deg)`;
    requestAnimationFrame(animateImageLogo);
  };

  hologramStage.addEventListener('pointerdown', (event) => {
    draggingLogo = true;
    lastLogoX = event.clientX;
    lastLogoY = event.clientY;
    velocityX = 0;
    velocityY = 0;
    hologramStage.classList.add('dragging');
    hologramStage.setPointerCapture(event.pointerId);
  });
  hologramStage.addEventListener('pointermove', (event) => {
    if (draggingLogo) {
      const deltaX = event.clientX - lastLogoX;
      const deltaY = event.clientY - lastLogoY;
      velocityY = deltaX * .3;
      velocityX = -deltaY * .2;
      rotationY += velocityY;
      rotationX += velocityX;
      lastLogoX = event.clientX;
      lastLogoY = event.clientY;
    }
    const rect = hologramSection.getBoundingClientRect();
    hologramSection.style.setProperty('--holo-x', `${((event.clientX - rect.left) / rect.width) * 100}%`);
    hologramSection.style.setProperty('--holo-y', `${((event.clientY - rect.top) / rect.height) * 100}%`);
  });
  const releaseImageLogo = (event) => {
    draggingLogo = false;
    hologramStage.classList.remove('dragging');
    if (hologramStage.hasPointerCapture(event.pointerId)) hologramStage.releasePointerCapture(event.pointerId);
  };
  hologramStage.addEventListener('pointerup', releaseImageLogo);
  hologramStage.addEventListener('pointercancel', releaseImageLogo);
  animateImageLogo();
}
