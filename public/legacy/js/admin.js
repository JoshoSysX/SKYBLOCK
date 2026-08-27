const views = [...document.querySelectorAll('.admin-view')];
const viewButtons = [...document.querySelectorAll('[data-admin-view]')];
const sidebar = document.getElementById('adminSidebar');
const menuToggle = document.getElementById('adminMenuToggle');
const modal = document.getElementById('productModal');
const toast = document.getElementById('adminToast');

const confirmModal = document.getElementById('adminConfirm');
const confirmTitle = document.getElementById('adminConfirmTitle');
const confirmMessage = document.getElementById('adminConfirmMessage');
const confirmAccept = document.getElementById('adminConfirmAccept');
const confirmCancel = document.getElementById('adminConfirmCancel');
window.skyblockConfirm = ({ title='¿Estás seguro?', message='', confirmText='Eliminar' }={}) => new Promise((resolve) => {
  confirmTitle.textContent = title;
  confirmMessage.textContent = message;
  confirmAccept.textContent = confirmText;
  confirmModal.classList.add('open');confirmModal.setAttribute('aria-hidden','false');
  const finish = (accepted) => { confirmModal.classList.remove('open');confirmModal.setAttribute('aria-hidden','true');confirmAccept.onclick=null;confirmCancel.onclick=null;confirmModal.onclick=null;document.removeEventListener('keydown',onKey);resolve(accepted); };
  const onKey = (event) => { if(event.key==='Escape')finish(false);if(event.key==='Enter')finish(true); };
  confirmAccept.onclick=()=>finish(true);confirmCancel.onclick=()=>finish(false);confirmModal.onclick=(event)=>{if(event.target===confirmModal)finish(false)};
  document.addEventListener('keydown',onKey);confirmCancel.focus();
});

function guardarEnSupabase(tipo, datos) {
  parent.postMessage({ tipo, datos }, location.origin);
}

document.getElementById('adminDate').textContent = new Intl.DateTimeFormat('es-PE', { dateStyle: 'long' }).format(new Date());

function showView(name) {
  views.forEach((view) => view.classList.toggle('active', view.dataset.view === name));
  document.querySelectorAll('.admin-menu [data-admin-view]').forEach((button) => button.classList.toggle('active', button.dataset.adminView === name));
  sidebar.classList.remove('open');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

viewButtons.forEach((button) => button.addEventListener('click', (event) => {
  event.preventDefault();
  showView(button.dataset.adminView);
}));
menuToggle.addEventListener('click', () => sidebar.classList.toggle('open'));

const productStorageKey = 'skyblockStudioProducts';
const productTypeStorageKey = 'skyblockStudioProductTypes';
const defaultProductTypes = [];
const seedProducts = [];

function loadProducts() {
  return [];
}

let products = loadProducts();
let productMainImageData = '';
let productGalleryData = [];
const sizeOptions = [{ key:'XS',id:'XS' },{ key:'S',id:'S' },{ key:'M',id:'M' },{ key:'L',id:'L' },{ key:'XL',id:'XL' },{ key:'XXL',id:'XXL' },{ key:'Única',id:'One' }];
let productTypes;
productTypes = [];

function saveProductTypes() {
  return;
}

function renderProductTypes(selectedType = '') {
  const select = document.getElementById('productType');
  if (selectedType && !productTypes.includes(selectedType)) productTypes.push(selectedType);
  select.innerHTML = '<option value="">Selecciona un tipo</option>' + productTypes.map((type) => `<option value="${type}">${type}</option>`).join('');
  select.value = selectedType || productTypes[0];
  document.getElementById('productTypeList').innerHTML = productTypes.map((type) => `<span>${type}<button type="button" data-delete-product-type="${type}" aria-label="Eliminar ${type}">×</button></span>`).join('');
}

const productStock = (product) => Object.values(product.sizes || {}).reduce((total,value) => total + Number(value || 0),0);
const money = (value) => new Intl.NumberFormat('en-US',{ style:'currency',currency:'USD' }).format(value);

function saveProducts() {
  return;
}

function renderProducts() {
  const query = document.getElementById('adminProductSearch').value.toLowerCase();
  const filter = document.getElementById('adminProductFilter').value;
  const visible = products.filter((product) => {
    const stock = productStock(product);
    const matchesSearch = `${product.name} ${product.collection}`.toLowerCase().includes(query);
    const matchesFilter = filter === 'all' || (filter === 'stock' && stock > 0) || (filter === 'low' && stock <= 5) || (filter === 'limited' && product.limited);
    return matchesSearch && matchesFilter;
  });
  document.getElementById('adminProductList').innerHTML = visible.map((product) => {
    const stock = productStock(product);
    const availableSizes = Object.keys(product.sizes || {}).join(' · ') || 'Sin tallas definidas';
    return `<article class="${product.blocked ? 'is-blocked' : ''}"><img src="${product.blocked ? 'assets/image/skb-bloqueado.png' : product.image}" alt="${product.blocked ? `Producto ${product.name} bloqueado` : product.name}"><div><b>${product.name}</b><span>SKB — ${product.collection}</span><small>${product.type} · ${availableSizes}</small></div><strong>${money(product.price)}</strong><em class="${product.blocked ? 'blocked' : stock <= 5 ? 'low' : ''}">${product.blocked ? 'Bloqueado' : `${stock} en stock`}</em>${product.limited ? '<i>Limitada</i>' : '<i class="standard">Regular</i>'}<div class="admin-product-actions"><button type="button" class="admin-product-lock ${product.blocked ? 'unlock' : ''}" data-toggle-product="${product.id}">${product.blocked ? 'Desbloquear' : 'Bloquear'}</button><button type="button" data-edit-product="${product.id}" aria-label="Editar ${product.name}">Editar</button></div></article>`;
  }).join('') || '<p class="admin-empty-products">No hay productos que coincidan con la búsqueda.</p>';
  document.getElementById('adminProductCount').textContent = products.length;
  document.getElementById('adminPublishedProducts').textContent = String(products.length).padStart(2,'0');
}
renderProducts();
document.getElementById('adminProductSearch').addEventListener('input', renderProducts);
document.getElementById('adminProductFilter').addEventListener('change', renderProducts);

function updateTotalStock() {
  const total = sizeOptions.reduce((sum,size) => {
    const available = document.getElementById(`size${size.id}Available`).checked;
    return sum + (available ? Number(document.getElementById(`stock${size.id}`).value || 0) : 0);
  },0);
  document.getElementById('productTotalStock').value = total;
}

function syncSizeOption(size,resetWhenDisabled = true) {
  const checkbox = document.getElementById(`size${size.id}Available`);
  const stockInput = document.getElementById(`stock${size.id}`);
  stockInput.disabled = !checkbox.checked;
  if (!checkbox.checked && resetWhenDisabled) stockInput.value = 0;
  updateTotalStock();
}

function openProductEditor(product = null) {
  if (!product && collections.length === 0) {
    toast.textContent = 'Primero debes crear una colección.';
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2600);
    return;
  }
  document.getElementById('adminProductForm').reset();
  document.getElementById('productId').value = product?.id || '';
  document.getElementById('productModalTitle').textContent = product ? 'Editar producto' : 'Nuevo producto';
  document.getElementById('productName').value = product?.name || '';
  renderProductTypes(product?.type || '');
  const productCollectionSelect = document.getElementById('productCollection');
  const collectionNames = collections.map((collection) => collection.name);
  if (product?.collection && !collectionNames.includes(product.collection)) collectionNames.push(product.collection);
  productCollectionSelect.innerHTML = collectionNames.map((name) => `<option value="${name}">${name}</option>`).join('');
  productCollectionSelect.value = product?.collection || collectionNames[0] || '';
  document.getElementById('productPrice').value = product?.price ?? '';
  document.getElementById('productDescription').value = product?.description || '';
  document.getElementById('productLimited').checked = Boolean(product?.limited);
  const defaultSizes = product ? Object.keys(product.sizes || {}) : [];
  sizeOptions.forEach((size) => {
    const available = defaultSizes.includes(size.key);
    document.getElementById(`size${size.id}Available`).checked = available;
    document.getElementById(`stock${size.id}`).value = product?.sizes?.[size.key] || 0;
    syncSizeOption(size,false);
  });
  productMainImageData = product?.image || '';
  productGalleryData = [...(product?.gallery || [])];
  document.getElementById('productMainPreview').innerHTML = productMainImageData ? `<img src="${productMainImageData}" alt="Vista previa principal">` : '<span>Vista previa principal</span>';
  document.getElementById('productGalleryPreview').innerHTML = productGalleryData.map((image,index) => `<img src="${image}" alt="Imagen adicional ${index + 1}">`).join('');
  document.getElementById('adminFormStatus').textContent = '';
  updateTotalStock();
  modal.classList.add('open');
  modal.setAttribute('aria-hidden','false');
}

const productTypeModal = document.getElementById('productTypeModal');
document.getElementById('editProductTypes').addEventListener('click',() => {
  renderProductTypes(document.getElementById('productType').value);
  productTypeModal.classList.add('open');
  productTypeModal.setAttribute('aria-hidden','false');
  window.setTimeout(() => document.getElementById('newProductType').focus(),100);
});
document.getElementById('closeProductTypes').addEventListener('click',() => { productTypeModal.classList.remove('open');productTypeModal.setAttribute('aria-hidden','true'); });
productTypeModal.addEventListener('click',(event) => { if (event.target === productTypeModal) document.getElementById('closeProductTypes').click(); });
document.getElementById('addProductType').addEventListener('click',() => {
  const input = document.getElementById('newProductType');
  const type = input.value.trim();
  if (!type || productTypes.some((item) => item.toLowerCase() === type.toLowerCase())) return;
  productTypes.push(type);
  saveProductTypes();
  guardarEnSupabase('SKYBLOCK_ADMIN_GUARDAR_TIPO',{nombre:type});
  renderProductTypes(type);
  input.value = '';
});
document.getElementById('newProductType').addEventListener('keydown',(event) => {
  if (event.key === 'Enter') { event.preventDefault();document.getElementById('addProductType').click(); }
});
document.getElementById('productTypeList').addEventListener('click',(event) => {
  const button = event.target.closest('[data-delete-product-type]');
  if (!button || productTypes.length === 1) return;
  const currentType = document.getElementById('productType').value;
  productTypes = productTypes.filter((type) => type !== button.dataset.deleteProductType);
  saveProductTypes();
  guardarEnSupabase('SKYBLOCK_ADMIN_ELIMINAR_TIPO',{nombre:button.dataset.deleteProductType});
  renderProductTypes(currentType === button.dataset.deleteProductType ? productTypes[0] : currentType);
});

document.querySelectorAll('[data-open-product]').forEach((button) => button.addEventListener('click',() => openProductEditor()));
document.getElementById('adminProductList').addEventListener('click',(event) => {
  const editButton = event.target.closest('[data-edit-product]');
  const toggleButton = event.target.closest('[data-toggle-product]');
  if (toggleButton) {
    const product = products.find((item) => item.id === toggleButton.dataset.toggleProduct);
    if (!product) return;
    product.blocked = !product.blocked;
    saveProducts();
    guardarEnSupabase('SKYBLOCK_ADMIN_GUARDAR_PRODUCTO',product);
    renderProducts();
    toast.textContent = product.blocked ? 'Producto bloqueado en el catálogo.' : 'Producto habilitado en el catálogo.';
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'),2600);
    return;
  }
  if (editButton) openProductEditor(products.find((product) => product.id === editButton.dataset.editProduct));
});
sizeOptions.forEach((size) => {
  document.getElementById(`stock${size.id}`).addEventListener('input',updateTotalStock);
  document.getElementById(`size${size.id}Available`).addEventListener('change',() => syncSizeOption(size));
});

function closeProductEditor() {
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden','true');
}
document.getElementById('closeProductModal').addEventListener('click',closeProductEditor);
document.getElementById('cancelProductEdit').addEventListener('click',closeProductEditor);
modal.addEventListener('click', (event) => { if (event.target === modal) document.getElementById('closeProductModal').click(); });

const readImage = (file) => new Promise((resolve,reject) => {
  if (file.size > 2 * 1024 * 1024) { reject(new Error('Cada imagen debe pesar menos de 2 MB.')); return; }
  const reader = new FileReader();
  reader.addEventListener('load',() => resolve(reader.result));
  reader.addEventListener('error',() => reject(new Error('No se pudo leer la imagen.')));
  reader.readAsDataURL(file);
});

document.getElementById('productMainImage').addEventListener('change',async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  try {
    productMainImageData = await readImage(file);
    document.getElementById('productMainPreview').innerHTML = `<img src="${productMainImageData}" alt="Vista previa principal">`;
    document.getElementById('adminFormStatus').textContent = '';
  } catch (error) { document.getElementById('adminFormStatus').textContent = error.message;event.target.value = ''; }
});

document.getElementById('productGallery').addEventListener('change',async (event) => {
  const files = [...event.target.files].slice(0,4);
  try {
    productGalleryData = await Promise.all(files.map(readImage));
    document.getElementById('productGalleryPreview').innerHTML = productGalleryData.map((image,index) => `<img src="${image}" alt="Imagen adicional ${index + 1}">`).join('');
    document.getElementById('adminFormStatus').textContent = '';
  } catch (error) { document.getElementById('adminFormStatus').textContent = error.message;event.target.value = ''; }
});

document.getElementById('adminProductForm').addEventListener('submit', (event) => {
  event.preventDefault();
  const status = document.getElementById('adminFormStatus');
  const selectedCollection = document.getElementById('productCollection').value;
  if (!selectedCollection || !collections.some((collection) => collection.name === selectedCollection)) {
    status.textContent = 'Primero debes crear y seleccionar una colección válida.';
    return;
  }
  if (!productMainImageData) { status.textContent = 'Selecciona una imagen principal.';return; }
  const selectedSizes = sizeOptions.reduce((sizes,size) => {
    if (document.getElementById(`size${size.id}Available`).checked) sizes[size.key] = Number(document.getElementById(`stock${size.id}`).value || 0);
    return sizes;
  },{});
  if (!Object.keys(selectedSizes).length) { status.textContent = 'Selecciona al menos una talla disponible.';return; }
  const id = document.getElementById('productId').value || `product-${Date.now()}`;
  const product = {
    id,
    name:document.getElementById('productName').value.trim(),
    type:document.getElementById('productType').value,
    collection:document.getElementById('productCollection').value,
    price:Number(document.getElementById('productPrice').value),
    description:document.getElementById('productDescription').value.trim(),
    sizes:selectedSizes,
    limited:document.getElementById('productLimited').checked,
    blocked:products.find((item) => item.id === id)?.blocked || false,
    image:productMainImageData,
    gallery:productGalleryData
  };
  const existingIndex = products.findIndex((item) => item.id === id);
  if (existingIndex >= 0) products[existingIndex] = product; else products.unshift(product);
  try { saveProducts(); }
  catch { status.textContent = 'No hay espacio local suficiente para guardar estas imágenes.';return; }
  guardarEnSupabase('SKYBLOCK_ADMIN_GUARDAR_PRODUCTO',product);
  renderProducts();
  renderCollections();
  closeProductEditor();
  toast.textContent = existingIndex >= 0 ? 'Producto actualizado.' : 'Producto creado.';
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2600);
});
const collectionStorageKey = 'skyblockStudioCollections';
const seedCollections = [];
let collections = [];
let collectionCoverData = '';
let verificationCodes = [];

const collectionStatusLabel = { published:'Publicada',draft:'Borrador',upcoming:'Próximamente' };
function saveCollections() { return; }
function renderCollections() {
  document.getElementById('adminCollectionGrid').innerHTML = collections.map((collection) => {
    const productCount = products.filter((product) => product.collection === collection.name).length;
    const codeCount = verificationCodes.filter((code) => code.collection === collection.name).length;
    return `<article><img src="${collection.cover}" alt="${collection.name}"><div><span>${collection.edition} · ${collectionStatusLabel[collection.status] || collection.status}</span><h2>${collection.name}</h2><p>${productCount} productos · ${codeCount} códigos${collection.limited ? ' · Edición limitada' : ''}</p><div class="admin-collection-actions"><button type="button" data-edit-collection="${collection.id}">Editar colección →</button><button type="button" class="admin-collection-delete" data-delete-collection="${collection.id}">Eliminar</button></div></div></article>`;
  }).join('');
  document.querySelectorAll('[data-open-product]').forEach((button) => {
    button.disabled = collections.length === 0;
    button.title = collections.length === 0 ? 'Primero crea una colección' : '';
  });
  const verificationButton = document.getElementById('newVerificationCode');
  verificationButton.disabled = collections.length === 0;
  verificationButton.title = collections.length === 0 ? 'Primero crea una colección' : '';
}

const collectionModal = document.getElementById('collectionModal');
function openCollectionEditor(collection = null) {
  document.getElementById('adminCollectionForm').reset();
  document.getElementById('collectionId').value = collection?.id || '';
  document.getElementById('collectionModalTitle').textContent = collection ? 'Editar colección' : 'Nueva colección';
  document.getElementById('collectionName').value = collection?.name || '';
  document.getElementById('collectionSlug').value = collection?.slug || '';
  document.getElementById('collectionEdition').value = collection?.edition || String(collections.length + 1).padStart(3,'0');
  document.getElementById('collectionStatus').value = collection?.status || 'draft';
  document.getElementById('collectionLimited').checked = Boolean(collection?.limited);
  document.getElementById('collectionDescription').value = collection?.description || '';
  document.getElementById('collectionStory').value = collection?.story || '';
  collectionCoverData = collection?.cover || '';
  document.getElementById('collectionCoverPreview').innerHTML = collectionCoverData ? `<img src="${collectionCoverData}" alt="Vista previa de portada">` : '<span>Vista previa de portada</span>';
  document.getElementById('collectionFormStatus').textContent = '';
  collectionModal.classList.add('open');
  collectionModal.setAttribute('aria-hidden','false');
}
function closeCollectionEditor() { collectionModal.classList.remove('open');collectionModal.setAttribute('aria-hidden','true'); }
document.getElementById('newCollection').addEventListener('click',() => openCollectionEditor());
document.getElementById('closeCollectionModal').addEventListener('click',closeCollectionEditor);
document.getElementById('cancelCollectionEdit').addEventListener('click',closeCollectionEditor);
collectionModal.addEventListener('click',(event) => { if (event.target === collectionModal) closeCollectionEditor(); });
document.getElementById('adminCollectionGrid').addEventListener('click',async (event) => {
  const editButton = event.target.closest('[data-edit-collection]');
  if (editButton) { openCollectionEditor(collections.find((collection) => collection.id === editButton.dataset.editCollection));return; }
  const deleteButton = event.target.closest('[data-delete-collection]');
  if (!deleteButton) return;
  const collection = collections.find((item) => item.id === deleteButton.dataset.deleteCollection);
  if (!collection) return;
  const productCount = products.filter((product) => product.collection === collection.name).length;
  const codeCount = verificationCodes.filter((code) => code.collection === collection.name).length;
  if (productCount || codeCount) {
    toast.textContent = `No se puede eliminar: la colección tiene ${productCount} producto(s) y ${codeCount} código(s) asociados.`;
    toast.classList.add('show');setTimeout(() => toast.classList.remove('show'),4000);return;
  }
  if (!await window.skyblockConfirm({title:'Eliminar colección',message:`“${collection.name}” se eliminará definitivamente. Esta acción no se puede deshacer.`,confirmText:'Eliminar colección'})) return;
  deleteButton.disabled = true;
  guardarEnSupabase('SKYBLOCK_ADMIN_ELIMINAR_COLECCION',{id:collection.id});
});
document.getElementById('collectionName').addEventListener('input',(event) => {
  if (document.getElementById('collectionId').value) return;
  document.getElementById('collectionSlug').value = event.target.value.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
});
document.getElementById('collectionCoverImage').addEventListener('change',async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  try { collectionCoverData = await readImage(file);document.getElementById('collectionCoverPreview').innerHTML = `<img src="${collectionCoverData}" alt="Vista previa de portada">`;document.getElementById('collectionFormStatus').textContent = ''; }
  catch (error) { document.getElementById('collectionFormStatus').textContent = error.message;event.target.value = ''; }
});
document.getElementById('adminCollectionForm').addEventListener('submit',(event) => {
  event.preventDefault();
  const status = document.getElementById('collectionFormStatus');
  if (!collectionCoverData) { status.textContent = 'Selecciona una imagen de portada.';return; }
  const id = document.getElementById('collectionId').value || `collection-${Date.now()}`;
  const collection = { id,name:document.getElementById('collectionName').value.trim(),slug:document.getElementById('collectionSlug').value.trim(),edition:document.getElementById('collectionEdition').value.trim(),status:document.getElementById('collectionStatus').value,limited:document.getElementById('collectionLimited').checked,description:document.getElementById('collectionDescription').value.trim(),story:document.getElementById('collectionStory').value.trim(),cover:collectionCoverData };
  const existingIndex = collections.findIndex((item) => item.id === id);
  if (existingIndex >= 0) collections[existingIndex] = collection; else collections.unshift(collection);
  try { saveCollections(); }
  catch { status.textContent = 'No hay espacio local suficiente para guardar la portada.';return; }
  guardarEnSupabase('SKYBLOCK_ADMIN_GUARDAR_COLECCION',collection);
  renderCollections();closeCollectionEditor();
  toast.textContent = existingIndex >= 0 ? 'Colección actualizada.' : 'Colección creada.';toast.classList.add('show');setTimeout(() => toast.classList.remove('show'),2600);
});
renderCollections();

const verificationStorageKey = 'skyblockStudioVerificationCodes';
const seedVerificationCodes = [];

const verificationModal = document.getElementById('verificationModal');
const verificationCodeInput = document.getElementById('verificationCode');
const cleanText = (value) => String(value ?? '').replace(/[&<>'"]/g,(character) => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[character]));
const sha256 = async (text) => {
  const bytes = new TextEncoder().encode(text);
  const buffer = await crypto.subtle.digest('SHA-256',bytes);
  return [...new Uint8Array(buffer)].map((byte) => byte.toString(16).padStart(2,'0')).join('');
};
function saveVerificationCodes() { return; }
function renderVerificationCodes() {
  const query = document.getElementById('adminCodeSearch').value.trim().toLowerCase();
  const filter = document.getElementById('adminCodeFilter').value;
  const visible = verificationCodes.filter((item) => {
    const matchesQuery = `${item.series} ${item.collection} ${item.owner} ${item.codeHint}`.toLowerCase().includes(query);
    return matchesQuery && (filter === 'all' || item.status === filter);
  });
  document.getElementById('adminCodeList').innerHTML = visible.map((item) => `<article><div><b>${cleanText(item.series)}</b><span>${cleanText(item.codeHint || 'Código protegido')}</span></div><strong>${cleanText(item.collection || 'Sin colección')}</strong><span>${cleanText(item.owner || 'Sin registrar')}</span><em class="${item.status === 'blocked' ? 'blocked' : ''}">${item.status === 'blocked' ? 'Bloqueado' : 'Activo'}</em><div><button type="button" data-edit-verification="${item.id}">Editar</button><button type="button" data-delete-verification="${item.id}">Eliminar</button></div></article>`).join('') || '<p class="admin-empty-products">No hay códigos que coincidan con la búsqueda.</p>';
  document.getElementById('adminCodeCount').textContent = verificationCodes.length;
}
function openVerificationEditor(item = null) {
  if (!item && collections.length === 0) {
    toast.textContent = 'Primero debes crear una colección.';
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'),2600);
    return;
  }
  document.getElementById('verificationForm').reset();
  document.getElementById('verificationId').value = item?.id || '';
  document.getElementById('verificationModalTitle').textContent = item ? 'Editar código' : 'Nuevo código';
  verificationCodeInput.required = !item;
  verificationCodeInput.placeholder = item ? 'Déjalo vacío para conservar el código' : 'SKB-XXXX-XXXX';
  document.getElementById('verificationSeries').value = item?.series || '';
  const collectionSelect = document.getElementById('verificationCollection');
  const names = collections.map((collection) => collection.name);
  if (item?.collection && !names.includes(item.collection)) names.push(item.collection);
  collectionSelect.innerHTML = names.map((name) => `<option value="${cleanText(name)}">${cleanText(name)}</option>`).join('');
  collectionSelect.value = item?.collection || names[0] || '';
  document.getElementById('verificationOwner').value = item?.owner === 'Sin registrar' ? '' : (item?.owner || '');
  document.getElementById('verificationStatus').value = item?.status || 'active';
  document.getElementById('verificationFormStatus').textContent = '';
  verificationModal.classList.add('open');
  verificationModal.setAttribute('aria-hidden','false');
}
function closeVerificationEditor() { verificationModal.classList.remove('open');verificationModal.setAttribute('aria-hidden','true'); }
document.getElementById('newVerificationCode').addEventListener('click',() => openVerificationEditor());
document.getElementById('closeVerificationModal').addEventListener('click',closeVerificationEditor);
document.getElementById('cancelVerificationEdit').addEventListener('click',closeVerificationEditor);
verificationModal.addEventListener('click',(event) => { if (event.target === verificationModal) closeVerificationEditor(); });
document.getElementById('adminCodeSearch').addEventListener('input',renderVerificationCodes);
document.getElementById('adminCodeFilter').addEventListener('change',renderVerificationCodes);
document.getElementById('adminCodeList').addEventListener('click',async (event) => {
  const editButton = event.target.closest('[data-edit-verification]');
  const deleteButton = event.target.closest('[data-delete-verification]');
  if (editButton) openVerificationEditor(verificationCodes.find((item) => item.id === editButton.dataset.editVerification));
  if (deleteButton && await window.skyblockConfirm({title:'Eliminar código',message:'El código de autenticidad se eliminará definitivamente y dejará de ser válido.',confirmText:'Eliminar código'})) {
    verificationCodes = verificationCodes.filter((item) => item.id !== deleteButton.dataset.deleteVerification);
    guardarEnSupabase('SKYBLOCK_ADMIN_ELIMINAR_CODIGO',{id:deleteButton.dataset.deleteVerification});
    saveVerificationCodes();renderVerificationCodes();
  }
});
verificationCodeInput.addEventListener('input',() => { verificationCodeInput.value = verificationCodeInput.value.toUpperCase(); });
document.getElementById('verificationForm').addEventListener('submit',async (event) => {
  event.preventDefault();
  const status = document.getElementById('verificationFormStatus');
  const id = document.getElementById('verificationId').value;
  const existing = verificationCodes.find((item) => item.id === id);
  const rawCode = verificationCodeInput.value.trim().toUpperCase();
  if (!rawCode && !existing) { status.textContent = 'Escribe un código de autenticidad.';return; }
  const hash = rawCode ? await sha256(rawCode) : existing.hash;
  if (verificationCodes.some((item) => item.hash === hash && item.id !== id)) { status.textContent = 'Ese código ya existe.';return; }
  const selectedCollection = document.getElementById('verificationCollection').value;
  if (!selectedCollection || !collections.some((collection) => collection.name === selectedCollection)) { status.textContent = 'Primero debes crear y seleccionar una colección válida.';return; }
  const item = {
    id:id || `verification-${Date.now()}`,
    hash,
    codeHint:rawCode ? `•••• ${rawCode.slice(-4)}` : existing.codeHint,
    series:document.getElementById('verificationSeries').value.trim(),
    collection:selectedCollection,
    owner:document.getElementById('verificationOwner').value.trim() || 'Sin registrar',
    status:document.getElementById('verificationStatus').value
  };
  const index = verificationCodes.findIndex((entry) => entry.id === item.id);
  if (index >= 0) verificationCodes[index] = item; else verificationCodes.unshift(item);
  guardarEnSupabase('SKYBLOCK_ADMIN_GUARDAR_CODIGO',item);
  saveVerificationCodes();renderVerificationCodes();closeVerificationEditor();
  toast.textContent = index >= 0 ? 'Código actualizado.' : 'Código creado.';toast.classList.add('show');setTimeout(() => toast.classList.remove('show'),2600);
});
renderVerificationCodes();

window.addEventListener('message',(event) => {
  if (event.origin !== location.origin) return;
  if (event.data?.tipo === 'SKYBLOCK_ADMIN_DATOS') {
    products = event.data.productos || [];
    collections = event.data.colecciones || [];
    productTypes = event.data.tipos || [];
    verificationCodes = event.data.codigos || [];
    renderProductTypes();
    renderProducts();
    renderCollections();
    renderVerificationCodes();
    if (event.data.error) {
      toast.textContent = `No se pudieron cargar todos los datos: ${event.data.error}`;
      toast.classList.add('show');
    }
  }
  if (event.data?.tipo === 'SKYBLOCK_ADMIN_ACCION_RESULTADO') {
    toast.textContent = event.data.mensaje;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'),3000);
  }
});
parent.postMessage({tipo:'SKYBLOCK_SOLICITAR_DATOS'},location.origin);

document.getElementById('logoutDemo').addEventListener('click', () => {
  parent.postMessage({tipo:'SKYBLOCK_LOGOUT'},location.origin);
});

const postStorageKey = 'skyblockStudioPosts';
const postManagementVersionKey = 'skyblockStudioPostsManagedV2';
const defaultAdminPosts = [];
const postForm = document.getElementById('adminPostForm');
const postImageInput = document.getElementById('postImage');
const postPreview = document.getElementById('postImagePreview');
let postImageData = '';

function storedPosts() {
  try {
    const stored = localStorage.getItem(postStorageKey);
    if (stored === null) return defaultAdminPosts.map((post) => ({...post}));
    const parsed = JSON.parse(stored) || [];
    return localStorage.getItem(postManagementVersionKey) ? parsed : [...parsed,...defaultAdminPosts.filter((fallback) => !parsed.some((post) => post.id === fallback.id))];
  }
  catch { return defaultAdminPosts.map((post) => ({...post})); }
}

function savePosts(posts) { localStorage.setItem(postStorageKey,JSON.stringify(posts));localStorage.setItem(postManagementVersionKey,'1'); }
function renderAdminPosts() {
  const posts = storedPosts();
  document.getElementById('adminPostCount').textContent = posts.length;
  document.getElementById('adminPostList').innerHTML = posts.map((post) => `<article><img src="${post.image}" alt="${cleanText(post.alt)}"><div><b>${cleanText(post.title)}</b><span>${cleanText(post.date)}</span><p>${cleanText(post.description)}</p></div><div><button type="button" data-edit-post="${post.id}">Editar</button><button type="button" data-delete-post="${post.id}">Eliminar</button></div></article>`).join('') || '<p class="admin-empty-products">No hay posts publicados.</p>';
}
renderAdminPosts();

document.getElementById('postTitle').addEventListener('input', (event) => {
  document.getElementById('previewPostTitle').textContent = event.target.value || 'Título de la publicación';
});
document.getElementById('postDescription').addEventListener('input', (event) => {
  document.getElementById('previewPostDescription').textContent = event.target.value || 'La descripción del post aparecerá aquí mientras escribes.';
});

postImageInput.addEventListener('change', () => {
  const file = postImageInput.files[0];
  const status = document.getElementById('postStatus');
  if (!file) return;
  if (file.size > 2 * 1024 * 1024) {
    postImageInput.value = '';
    postImageData = '';
    status.textContent = 'La fotografía supera el límite de 2 MB.';
    return;
  }
  const reader = new FileReader();
  reader.addEventListener('load', () => {
    postImageData = reader.result;
    postPreview.innerHTML = `<img src="${postImageData}" alt="Vista previa del post">`;
    document.getElementById('postUploadText').textContent = file.name;
    status.textContent = '';
  });
  reader.readAsDataURL(file);
});

function resetPostEditor(message = '') {
  postForm.reset();
  document.getElementById('postEditId').value = '';
  postImageData = '';
  postPreview.innerHTML = '<span>Vista previa de la fotografía</span>';
  document.getElementById('postUploadText').textContent = 'Seleccionar fotografía';
  document.getElementById('previewPostTitle').textContent = 'Título de la publicación';
  document.getElementById('previewPostDescription').textContent = 'La descripción del post aparecerá aquí mientras escribes.';
  document.getElementById('savePostButton').textContent = 'Publicar post';
  document.getElementById('cancelPostEdit').hidden = true;
  document.getElementById('postStatus').innerHTML = message;
}

function editPost(post) {
  document.getElementById('postEditId').value = post.id;
  document.getElementById('postTitle').value = post.title;
  document.getElementById('postDescription').value = post.description;
  document.getElementById('postAlt').value = post.alt;
  postImageData = post.image;
  postPreview.innerHTML = `<img src="${post.image}" alt="${cleanText(post.alt)}">`;
  document.getElementById('previewPostTitle').textContent = post.title;
  document.getElementById('previewPostDescription').textContent = post.description;
  document.getElementById('postUploadText').textContent = 'Cambiar fotografía (opcional)';
  document.getElementById('savePostButton').textContent = 'Guardar cambios';
  document.getElementById('cancelPostEdit').hidden = false;
  document.getElementById('postStatus').textContent = 'Editando publicación.';
  postForm.scrollIntoView({behavior:'smooth',block:'start'});
}

document.getElementById('cancelPostEdit').addEventListener('click',() => resetPostEditor());
document.getElementById('adminPostList').addEventListener('click',async (event) => {
  const editButton = event.target.closest('[data-edit-post]');
  const deleteButton = event.target.closest('[data-delete-post]');
  const posts = storedPosts();
  if (editButton) editPost(posts.find((post) => post.id === editButton.dataset.editPost));
  if (deleteButton && await window.skyblockConfirm({title:'Eliminar publicación',message:'La publicación y su contenido dejarán de mostrarse. Esta acción no se puede deshacer.',confirmText:'Eliminar publicación'})) {
    try { savePosts(posts.filter((post) => post.id !== deleteButton.dataset.deletePost)); }
    catch { document.getElementById('postStatus').textContent = 'No se pudo actualizar el almacenamiento.';return; }
    if (document.getElementById('postEditId').value === deleteButton.dataset.deletePost) resetPostEditor();
    renderAdminPosts();
  }
});

postForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const status = document.getElementById('postStatus');
  if (!postImageData) { status.textContent = 'Selecciona una fotografía para publicar.'; return; }
  const editId = document.getElementById('postEditId').value;
  const posts = storedPosts();
  const existingIndex = posts.findIndex((post) => post.id === editId);
  const post = {
    id: editId || `post-${Date.now()}`,
    title: document.getElementById('postTitle').value.trim(),
    description: document.getElementById('postDescription').value.trim(),
    alt: document.getElementById('postAlt').value.trim(),
    image: postImageData,
    date: existingIndex >= 0 ? posts[existingIndex].date : new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date()).toUpperCase()
  };
  if (existingIndex >= 0) posts[existingIndex] = post; else posts.unshift(post);
  try { savePosts(posts); }
  catch { status.textContent = 'No hay espacio suficiente. Prueba con una imagen más pequeña.'; return; }
  resetPostEditor(`${existingIndex >= 0 ? 'Post actualizado' : 'Post publicado'}. <a href="posts.html">Ver en la página pública →</a>`);
  renderAdminPosts();
});

// Resend: configuración y plantillas. La API key vive únicamente en el servidor.
const emailSettingsKey = 'skyblockStudioEmailSettings';
const emailTemplatesKey = 'skyblockStudioEmailTemplates';
const emptyEmailTemplate = { subject:'', preheader:'', body:'' };
const defaultEmailTemplates = {
  verification: {...emptyEmailTemplate}, welcome: {...emptyEmailTemplate},
  reset: {...emptyEmailTemplate}, authenticity: {...emptyEmailTemplate}
};

function readEmailData(key, fallback) {
  try { return {...fallback, ...JSON.parse(localStorage.getItem(key) || '{}')}; }
  catch { return {...fallback}; }
}
let emailSettings = readEmailData(emailSettingsKey, {domain:'',senderName:'',senderAddress:'',replyTo:''});
let emailTemplates = readEmailData(emailTemplatesKey, defaultEmailTemplates);

const emailTemplateType = document.getElementById('emailTemplateType');
const emailSubject = document.getElementById('emailTemplateSubject');
const emailPreheader = document.getElementById('emailTemplatePreheader');
const emailBody = document.getElementById('emailTemplateBody');
function sampleEmailText(value) {
  return String(value || '').replaceAll('{{nombre}}','Josías').replaceAll('{{codigo}}','SKB-2026-001').replaceAll('{{enlace}}','skyblock.pe/verificar');
}
function renderEmailPreview() {
  document.getElementById('emailPreviewSubject').textContent = sampleEmailText(emailSubject.value) || 'Asunto del correo';
  document.getElementById('emailPreviewPreheader').textContent = sampleEmailText(emailPreheader.value) || 'SKYBLOCK STUDIO';
  document.getElementById('emailPreviewBody').textContent = sampleEmailText(emailBody.value) || 'El contenido aparecerá aquí.';
}
function loadEmailTemplate() {
  const template = emailTemplates[emailTemplateType.value] || defaultEmailTemplates.verification;
  emailSubject.value = template.subject;
  emailPreheader.value = template.preheader;
  emailBody.value = template.body;
  document.getElementById('emailTemplateStatus').textContent = '';
  renderEmailPreview();
}
function renderEmailSettings() {
  document.getElementById('emailDomain').value = emailSettings.domain;
  document.getElementById('emailSenderName').value = emailSettings.senderName;
  document.getElementById('emailSenderAddress').value = emailSettings.senderAddress;
  document.getElementById('emailReplyTo').value = emailSettings.replyTo;
  const ready = Boolean(emailSettings.domain && emailSettings.senderAddress);
  const badge = document.getElementById('emailConnectionBadge');
  badge.textContent = ready ? 'Configuración lista' : 'Pendiente';
  badge.classList.toggle('ready', ready);
}
renderEmailSettings();
loadEmailTemplate();
emailTemplateType.addEventListener('change', loadEmailTemplate);
[emailSubject,emailPreheader,emailBody].forEach((field) => field.addEventListener('input',renderEmailPreview));

document.getElementById('emailSettingsForm').addEventListener('submit',(event) => {
  event.preventDefault();
  emailSettings = {domain:document.getElementById('emailDomain').value.trim(),senderName:document.getElementById('emailSenderName').value.trim(),senderAddress:document.getElementById('emailSenderAddress').value.trim(),replyTo:document.getElementById('emailReplyTo').value.trim()};
  localStorage.setItem(emailSettingsKey,JSON.stringify(emailSettings));
  renderEmailSettings();
  document.getElementById('emailSettingsStatus').textContent = 'Configuración guardada.';
});

document.getElementById('emailTemplateForm').addEventListener('submit',(event) => {
  event.preventDefault();
  emailTemplates[emailTemplateType.value] = {subject:emailSubject.value.trim(),preheader:emailPreheader.value.trim(),body:emailBody.value.trim()};
  localStorage.setItem(emailTemplatesKey,JSON.stringify(emailTemplates));
  document.getElementById('emailTemplateStatus').textContent = 'Plantilla guardada.';
});

document.getElementById('emailTestForm').addEventListener('submit',async (event) => {
  event.preventDefault();
  const status = document.getElementById('emailTestStatus');
  const button = document.getElementById('emailTestButton');
  if (!emailSettings.senderAddress) { status.textContent = 'Primero configura el correo del remitente.'; return; }
  button.disabled = true; button.textContent = 'Enviando…'; status.textContent = '';
  try {
    const response = await fetch('/api/send-email',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({to:document.getElementById('emailTestRecipient').value.trim(),template:emailTemplateType.value,variables:{nombre:'Prueba SKYBLOCK',codigo:'SKB-TEST-001',enlace:location.origin},settings:emailSettings,content:emailTemplates[emailTemplateType.value]})});
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || 'El endpoint todavía no está conectado.');
    status.textContent = `Correo enviado correctamente${result.id ? ` · ID ${result.id}` : ''}.`;
  } catch (error) {
    status.textContent = `${error.message} Debes conectar /api/send-email en un backend seguro con RESEND_API_KEY.`;
  } finally { button.disabled = false; button.textContent = 'Enviar prueba'; }
});
