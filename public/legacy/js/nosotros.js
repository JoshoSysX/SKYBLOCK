const nav = document.getElementById('nav');
const menuButton = document.getElementById('menuBtn');
const mobileNav = document.getElementById('mobileNav');

window.addEventListener('scroll', () => nav.classList.toggle('fixed', window.scrollY > 40));
menuButton.addEventListener('click', () => {
  const open = mobileNav.classList.toggle('open');
  document.body.classList.toggle('lock', open);
  menuButton.setAttribute('aria-expanded', String(open));
});

mobileNav.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
  mobileNav.classList.remove('open');
  document.body.classList.remove('lock');
  menuButton.setAttribute('aria-expanded', 'false');
}));
