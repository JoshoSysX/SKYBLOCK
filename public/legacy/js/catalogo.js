const nav = document.getElementById('nav');
const menuButton = document.getElementById('menuBtn');
const mobileNav = document.getElementById('mobileNav');
const cards = [...document.querySelectorAll('.catalog-card')];
const filterButtons = [...document.querySelectorAll('[data-filter]')];
const grid = document.getElementById('catalogGrid');
const searchInput = document.getElementById('searchInput');
const sortSelect = document.getElementById('sortSelect');
const count = document.getElementById('resultCount');
const emptyState = document.getElementById('emptyState');
let category = 'all';

const catalogProductIds = {
  'Camiseta Void':'void',
  'Sudadera Skyblock':'skyblock',
  'Gorra Architect':'architect',
  'Beanie Grid':'grid'
};
let managedProducts = [];
try { managedProducts = JSON.parse(localStorage.getItem('skyblockStudioProducts') || '[]'); }
catch { managedProducts = []; }

cards.forEach((card) => {
  const productId = catalogProductIds[card.dataset.name];
  const product = managedProducts.find((item) => item.id === productId);
  if (!product) return;
  card.dataset.productId = product.id;
  card.dataset.name = product.name;
  card.dataset.price = String(product.price);
  card.dataset.blocked = String(Boolean(product.blocked));
  card.querySelector('.catalog-copy h2').textContent = product.name;
  card.querySelector('.catalog-copy p').textContent = product.description;
  card.querySelector('.catalog-copy strong').textContent = new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(product.price);
  const imageWrap = card.querySelector('.catalog-image');
  const image = imageWrap.querySelector('img');
  if (product.blocked) {
    image.src = 'assets/image/skb-bloqueado.png';
    image.alt = `${product.name} bloqueado temporalmente`;
    imageWrap.querySelectorAll('.tag').forEach((tag) => tag.remove());
    imageWrap.insertAdjacentHTML('afterbegin','<span class="tag blocked-tag">Bloqueado</span>');
    card.querySelector('.quick-add').innerHTML = 'No disponible <span>×</span>';
    card.classList.add('catalog-card-blocked');
  } else {
    image.src = product.image;
    image.alt = product.name;
  }
});

window.addEventListener('scroll', () => nav.classList.toggle('fixed', window.scrollY > 40));
menuButton.addEventListener('click', () => {
  const open = mobileNav.classList.toggle('open');
  document.body.classList.toggle('lock', open);
  menuButton.setAttribute('aria-expanded', String(open));
});

function updateCatalog() {
  const query = searchInput.value.trim().toLocaleLowerCase('es');
  let visible = 0;
  cards.forEach((card) => {
    const matchesCategory = category === 'all' || card.dataset.category === category;
    const matchesQuery = card.dataset.name.toLocaleLowerCase('es').includes(query);
    const show = matchesCategory && matchesQuery;
    card.classList.toggle('hidden', !show);
    if (show) visible += 1;
  });
  count.textContent = visible;
  emptyState.classList.toggle('show', visible === 0);
}

filterButtons.forEach((button) => button.addEventListener('click', () => {
  category = button.dataset.filter;
  filterButtons.forEach((item) => item.classList.toggle('active', item === button));
  updateCatalog();
}));
searchInput.addEventListener('input', updateCatalog);
sortSelect.addEventListener('change', () => {
  const mode = sortSelect.value;
  cards.sort((a, b) => {
    if (mode === 'low') return Number(a.dataset.price) - Number(b.dataset.price);
    if (mode === 'high') return Number(b.dataset.price) - Number(a.dataset.price);
    if (mode === 'name') return a.dataset.name.localeCompare(b.dataset.name, 'es');
    return 0;
  }).forEach((card) => grid.appendChild(card));
});

const productSlugs = {
  'Camiseta Void': 'void',
  'Sudadera Skyblock': 'skyblock',
  'Gorra Architect': 'architect',
  'Bolso Utility': 'utility',
  'Camiseta Foundation': 'foundation',
  'Sudadera Blueprint': 'blueprint',
  'Camiseta Altitude': 'altitude',
  'Beanie Grid': 'grid'
};

cards.forEach((card) => {
  card.tabIndex = 0;
  card.setAttribute('role', 'link');
  const openProduct = () => {
    if (card.dataset.blocked === 'true') return;
    window.location.href = `producto.html?id=${card.dataset.productId || productSlugs[card.dataset.name]}`;
  };
  card.addEventListener('click', openProduct);
  card.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') openProduct();
  });
});
