document.querySelector('.product-thumbs')?.addEventListener('click', (event) => {
  const button = event.target.closest('button');
  const image = button?.querySelector('img');
  if (!button || button.hidden || !image?.getAttribute('src')) return;
  document.querySelectorAll('.product-thumbs button').forEach((item) => item.classList.toggle('active', item === button));
  productImage.src = image.src;
  productImage.alt = image.alt;
});

addToCart.onclick = () => {
  const selected = document.querySelector('.size-picker button.active');
  if (!selected) return sizeError.classList.add('show');
  const currentProduct = productName.textContent.trim();
  const selectedSize = selected.textContent.trim();
  const message = `Hola SKB, estoy interesado en: ${currentProduct}. Talla: ${selectedSize}. ¿Está disponible?`;
  window.open(`https://wa.me/51904604842?text=${encodeURIComponent(message)}`, '_blank', 'noopener');
};

menuBtn.onclick = () => {
  const open = mobileNav.classList.toggle('open');
  document.body.classList.toggle('lock', open);
  menuBtn.setAttribute('aria-expanded', String(open));
};
