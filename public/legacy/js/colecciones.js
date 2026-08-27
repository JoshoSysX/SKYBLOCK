const nav = document.getElementById('nav');
const menuButton = document.getElementById('menuBtn');
const mobileNav = document.getElementById('mobileNav');

window.addEventListener('scroll', () => nav.classList.toggle('fixed', window.scrollY > 40));
menuButton.addEventListener('click', () => {
  const open = mobileNav.classList.toggle('open');
  document.body.classList.toggle('lock', open);
  menuButton.setAttribute('aria-expanded', String(open));
});

const carousel = document.getElementById('collectionCarousel');
const collectionGuide = document.querySelector('.collection-guide');
if (carousel && collectionGuide) {
  const scrollScreens = [carousel,collectionGuide];
  let screenScrollLocked = false;
  window.addEventListener('wheel',(event) => {
    if (screenScrollLocked || Math.abs(event.deltaY) < 8) return;
    const viewportHeight = window.innerHeight || 1;
    const currentIndex = scrollScreens.map((section,index) => ({ index,distance:Math.abs(section.getBoundingClientRect().top) })).sort((a,b) => a.distance - b.distance)[0].index;
    const currentTop = scrollScreens[currentIndex].getBoundingClientRect().top;
    if (Math.abs(currentTop) > viewportHeight * .48) return;
    const nextIndex = currentIndex + (event.deltaY > 0 ? 1 : -1);
    if (nextIndex < 0 || nextIndex >= scrollScreens.length) return;
    event.preventDefault();screenScrollLocked = true;
    scrollScreens[nextIndex].scrollIntoView({ behavior:'smooth',block:'start' });
    window.setTimeout(() => { screenScrollLocked = false; },850);
  },{ passive:false });
}
