const collections = {
  nebula: {
    title: 'SKB — Nébula', edition: 'Colaboración / 001', tagline: 'Vestir lo que todavía no existe.',
    hero: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=2100&q=90',
    heading: 'Una señal desde otro lugar.',
    story: ['Nébula nació de una conversación sobre todo lo que imaginamos antes de construirlo. Junto al estudio creativo Nébula convertimos mapas celestes, interferencias y texturas nocturnas en prendas de uso diario.', 'La colección mezcla siluetas amplias, tonos profundos y detalles reflectivos que aparecen con la luz. Cada pieza fue producida en una serie numerada y no tendrá reposición.'],
    quote: 'No miramos el cielo para escapar. Lo miramos para recordar hasta dónde podemos llegar.',
    products: [
      ['Sudadera Eclipse', 'Felpa premium · Negro espacial', '$69.99', 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=900&q=90', 'skyblock'],
      ['Camiseta Órbita', 'Algodón pesado · Grafito', '$42.99', 'https://images.unsplash.com/photo-1583743814966-8936f37f4678?auto=format&fit=crop&w=900&q=90', 'void'],
      ['Gorra Signal', 'Sarga técnica · Negro', '$27.99', 'https://images.unsplash.com/photo-1534215754734-18e55d13e346?auto=format&fit=crop&w=900&q=90', 'architect']
    ]
  },
  distrito: {
    title: 'SKB — Distrito 11', edition: 'Colaboración / 002', tagline: 'La ciudad deja marcas.',
    hero: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=2100&q=90',
    heading: 'Hecha en el ruido de la ciudad.',
    story: ['Distrito 11 reúne a fotógrafos, skaters y músicos que documentan la ciudad cuando cae la noche. Esta colaboración transforma sus rutas, códigos y carteles desgastados en una identidad gráfica directa.', 'Prendas resistentes, cortes relajados y una paleta de concreto componen una cápsula diseñada para moverse. Cada etiqueta guarda las coordenadas del lugar donde comenzó la historia.'],
    quote: 'La calle no es el fondo de la historia. Es quien la escribe.',
    products: [
      ['Chaqueta Tránsito', 'Nailon técnico · Asfalto', '$84.99', 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=900&q=90', 'utility'],
      ['Camiseta Bloque 11', 'Algodón 280 g · Hueso', '$44.99', 'https://images.unsplash.com/photo-1503341504253-dff4815485f1?auto=format&fit=crop&w=900&q=90', 'foundation'],
      ['Beanie Frecuencia', 'Punto acanalado · Carbón', '$24.99', 'https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?auto=format&fit=crop&w=900&q=90', 'grid']
    ]
  },
  origen: {
    title: 'SKB — Origen', edition: 'Colaboración / 003', tagline: 'Antes del nombre, estuvo la idea.',
    hero: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=2100&q=90',
    heading: 'Volver al primer trazo.',
    story: ['Origen revisita los primeros bocetos de SKYBLOCK STUDIO y los conecta con el trabajo de artesanos textiles locales. Las líneas imperfectas y las pruebas de taller se convierten en el lenguaje principal de la colaboración.', 'Materiales naturales, colores sin exceso y acabados visibles celebran el proceso detrás de cada prenda. Una colección sobre comenzar, equivocarse y volver a construir.'],
    quote: 'Toda gran construcción comienza con una línea que alguien se atrevió a dibujar.',
    products: [
      ['Camiseta Primer Trazo', 'Algodón pesado · Crudo', '$39.99', 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=90', 'altitude'],
      ['Sudadera Manifiesto', 'Felpa premium · Cemento', '$64.99', 'https://images.unsplash.com/photo-1578681994506-b8f463449011?auto=format&fit=crop&w=900&q=90', 'blueprint'],
      ['Bolso Taller', 'Lona encerada · Arena', '$34.99', 'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?auto=format&fit=crop&w=900&q=90', 'utility']
    ]
  }
};

Object.assign(collections, {
  essentials: {
    ...collections.origen,
    title:'SKB — Essentials', edition:'Colección / 001', tagline:'Lo esencial también construye identidad.',
    hero:'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=2100&q=90',
    heading:'Diseñada para permanecer.',
    story:['Essentials reúne las piezas fundamentales de SKYBLOCK STUDIO. Prendas directas, materiales resistentes y una construcción pensada para acompañar todos los días.','Cada silueta elimina lo innecesario para concentrarse en el peso, el ajuste y la duración. Es el punto de partida sobre el que se construye todo lo demás.'],
    quote:'Lo esencial no es básico. Es aquello que sigue funcionando cuando todo cambia.'
  },
  faith: {
    ...collections.nebula,
    title:'SKB — Faith Collection', edition:'Colección / 002', tagline:'Vestir aquello en lo que creemos.',
    hero:'https://images.unsplash.com/photo-1503341504253-dff4815485f1?auto=format&fit=crop&w=2100&q=90',
    heading:'Convicción convertida en símbolo.',
    story:['Faith Collection nace de las señales que elegimos conservar. Símbolos discretos, mensajes interiores y contrastes profundos construyen una cápsula sobre la convicción personal.','Las piezas combinan algodón pesado, bordados precisos y acabados sobrios. Cada detalle fue colocado para descubrirse con el uso, no para exigir atención.'],
    quote:'La identidad comienza cuando decides qué significado llevar contigo.'
  },
  oversize: {
    ...collections.distrito,
    title:'SKB — Oversize Collection', edition:'Colección / 003', tagline:'Más espacio. Más movimiento.',
    hero:'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=2100&q=90',
    heading:'El volumen como lenguaje.',
    story:['Oversize Collection explora la libertad de las proporciones amplias. Hombros extendidos, caídas pesadas y líneas relajadas crean prendas que cambian con cada movimiento.','La colección está construida con tejidos densos y estructuras equilibradas para conservar su forma sin perder comodidad. Volumen con intención, no exceso.'],
    quote:'Ocupar espacio también es una forma de decir quién eres.'
  },
  limited: {
    ...collections.nebula,
    title:'SKB — Limited Edition', edition:'Edición limitada / 004', tagline:'Cuando termine, no volverá.',
    hero:'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=2100&q=90',
    heading:'Pocas piezas. Una identidad intacta.',
    story:['Limited Edition reúne experimentos de taller producidos en series numeradas. Materiales especiales, procesos más lentos y decisiones que solo existen en esta edición.','No habrá reposición. Cada pieza lleva su número de producción y registra el momento exacto en el que esta idea formó parte de SKYBLOCK STUDIO.'],
    quote:'La escasez no crea el valor. Lo crea la intención detrás de cada pieza.'
  },
  'new-drop': {
    ...collections.origen,
    title:'SKB — New Drop', edition:'Nuevo lanzamiento / 005', tagline:'La siguiente señal ya está aquí.',
    hero:'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=2100&q=90',
    heading:'Una nueva etapa en construcción.',
    story:['New Drop presenta la evolución más reciente de SKYBLOCK STUDIO. Nuevos pesos, detalles técnicos y una paleta reducida conectan la experiencia del archivo con lo que viene.','La cápsula fue diseñada como un sistema: piezas que funcionan por separado y se transforman cuando se combinan. El comienzo de un nuevo capítulo de la marca.'],
    quote:'Cada lanzamiento es una oportunidad para volver a construir desde otro lugar.'
  }
});

const id = new URLSearchParams(window.location.search).get('id') || 'nebula';
const collection = collections[id] || collections.nebula;
document.title = `${collection.title} | SKYBLOCK STUDIO`;
document.getElementById('collectionHero').src = collection.hero;
document.getElementById('collectionHero').alt = `Portada de ${collection.title}`;
document.getElementById('collectionEdition').textContent = collection.edition;
document.getElementById('collectionTitle').textContent = collection.title;
document.getElementById('collectionTagline').textContent = collection.tagline;
document.getElementById('storyHeading').textContent = collection.heading;
document.getElementById('storyOne').textContent = collection.story[0];
document.getElementById('storyTwo').textContent = collection.story[1];
document.getElementById('storyQuote').textContent = collection.quote;
document.getElementById('productCount').textContent = collection.products.length;
document.getElementById('collectionProductGrid').innerHTML = collection.products.map(([name, detail, price, image, slug]) => `
  <a class="catalog-card" href="producto.html?id=${slug}">
    <div class="catalog-image"><span class="tag">${collection.edition}</span><img src="${image}" alt="${name}"></div>
    <div class="catalog-copy"><div><h2>${name}</h2><p>${detail}</p></div><strong>${price}</strong><span class="collection-buy">Ver prenda <b>→</b></span></div>
  </a>`).join('');

const nav = document.getElementById('nav');
const menuButton = document.getElementById('menuBtn');
const mobileNav = document.getElementById('mobileNav');
window.addEventListener('scroll', () => nav.classList.toggle('fixed', window.scrollY > 40));
menuButton.addEventListener('click', () => {
  const open = mobileNav.classList.toggle('open');
  document.body.classList.toggle('lock', open);
  menuButton.setAttribute('aria-expanded', String(open));
});
