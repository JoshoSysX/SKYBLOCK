const views = [...document.querySelectorAll('.admin-view')];
const viewButtons = [...document.querySelectorAll('[data-admin-view]')];
const sidebar = document.getElementById('adminSidebar');
const menuToggle = document.getElementById('adminMenuToggle');
const modal = document.getElementById('productModal');
const toast = document.getElementById('adminToast');
const stockAdjustmentModal = document.getElementById('stockAdjustmentModal');
let pendingStockAdjustment = null;

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

function showView(name, { updateHistory = true, scroll = true } = {}) {
  if (!views.some((view) => view.dataset.view === name)) name = 'resumen';
  views.forEach((view) => view.classList.toggle('active', view.dataset.view === name));
  document.querySelectorAll('.admin-menu [data-admin-view]').forEach((button) => button.classList.toggle('active', button.dataset.adminView === name));
  sidebar.classList.remove('open');
  if (scroll) window.scrollTo({ top: 0, behavior: 'smooth' });
  if (updateHistory) {
    history.replaceState(null, '', `${location.pathname}${location.search}#${name}`);
    parent.postMessage({ tipo:'SKYBLOCK_ADMIN_CAMBIAR_VISTA', vista:name }, location.origin);
  }
}

viewButtons.forEach((button) => button.addEventListener('click', (event) => {
  event.preventDefault();
  showView(button.dataset.adminView);
}));
menuToggle.addEventListener('click', () => sidebar.classList.toggle('open'));
const initialAdminView = location.hash.slice(1);
showView(initialAdminView || 'resumen', { updateHistory:false, scroll:false });
addEventListener('hashchange', () => showView(location.hash.slice(1) || 'resumen', { updateHistory:false }));

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
const MAX_IMAGE_SIZE_MB = 150;
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;
const sizeOptions = [{ key:'XS',id:'XS' },{ key:'S',id:'S' },{ key:'M',id:'M' },{ key:'L',id:'L' },{ key:'XL',id:'XL' },{ key:'XXL',id:'XXL' },{ key:'Única',id:'One' }];
const orderedSizeKeys = (sizes = {}) => [...sizeOptions.map((size) => size.key).filter((size) => Object.prototype.hasOwnProperty.call(sizes, size)), ...Object.keys(sizes).filter((size) => !sizeOptions.some((option) => option.key === size)).sort()];
let productTypes;
productTypes = [];

function saveProductTypes() {
  return;
}

function renderProductTypes(selectedType = '') {
  const select = document.getElementById('productType');
  if (selectedType && !productTypes.includes(selectedType)) productTypes.push(selectedType);
  select.innerHTML = '<option value="">Selecciona un tipo</option>' + productTypes.map((type) => `<option value="${type}">${String(type).toUpperCase()}</option>`).join('');
  select.value = selectedType || productTypes[0];
  document.getElementById('productTypeList').innerHTML = productTypes.map((type) => `<span>${String(type).toUpperCase()}<button type="button" data-delete-product-type="${type}" aria-label="Eliminar ${String(type).toUpperCase()}">×</button></span>`).join('');
}

const usesStockBySize = (product) => product?.stockBySize === true || product?.stockBySize === 'true';
const productStock = (product) => !product.stockUnlimited && !usesStockBySize(product) && product.stockAvailable !== null && product.stockAvailable !== undefined && Number.isFinite(Number(product.stockAvailable))
  ? Number(product.stockAvailable)
  : Object.values(product.sizes || {}).reduce((total,value) => total + Number(value || 0),0);
const money = (value) => new Intl.NumberFormat('es-PE',{ style:'currency',currency:'PEN' }).format(value);
const setDashboardText = (id, value) => { const element = document.getElementById(id); if (element) element.textContent = value; };
const escapeDashboard = (value) => String(value || '').replace(/[&<>'"]/g, (character) => ({ '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;' })[character]);

function renderDashboard() {
  const hour = new Date().getHours();
  setDashboardText('adminGreeting', hour < 12 ? 'Buenos días.' : hour < 19 ? 'Buenas tardes.' : 'Buenas noches.');
  const activeProducts = products.filter((product) => !product.blocked);
  const measuredProducts = activeProducts.filter((product) => !product.stockUnlimited);
  const unitsAvailable = measuredProducts.reduce((total, product) => total + productStock(product), 0);
  const lowStock = measuredProducts.filter((product) => productStock(product) > 0 && productStock(product) <= 5);
  const outOfStock = measuredProducts.filter((product) => productStock(product) === 0);
  const limitedProducts = activeProducts.filter((product) => product.limited);
  const unlimitedProducts = activeProducts.filter((product) => product.stockUnlimited);
  const stockRanking = measuredProducts.filter((product) => productStock(product) > 0).sort((a, b) => productStock(b) - productStock(a));
  const highestStock = stockRanking[0];
  const lowestStock = stockRanking[stockRanking.length - 1];
  const priorities = [...outOfStock.map((product) => ({ product, kind:'Agotado', detail:'Sin unidades disponibles', level:'critical' })), ...lowStock.map((product) => ({ product, kind:'Stock bajo', detail:`Quedan ${productStock(product)} unidad${productStock(product) === 1 ? '' : 'es'}`, level:'warning' }))].slice(0, 5);

  setDashboardText('dashboardProductTotal', String(activeProducts.length).padStart(2, '0'));
  setDashboardText('dashboardProductNote', activeProducts.length ? `${products.length - activeProducts.length} bloqueado(s) fuera del catálogo` : 'Crea productos para ver alertas');
  setDashboardText('dashboardUnitsAvailable', String(unitsAvailable).padStart(2, '0'));
  setDashboardText('dashboardUnitsNote', unlimitedProducts.length ? `${unlimitedProducts.length} producto(s) con stock ilimitado` : 'Solo productos con stock medible');
  setDashboardText('dashboardOutOfStock', String(outOfStock.length).padStart(2, '0'));
  setDashboardText('dashboardOutOfStockNote', outOfStock.length ? 'Reponer o pausar en catálogo' : 'No hay productos agotados');
  setDashboardText('dashboardLowStock', String(lowStock.length).padStart(2, '0'));
  setDashboardText('dashboardLowStockNote', lowStock.length ? '5 unidades o menos' : 'No hay alertas de reposición');
  setDashboardText('adminDashboardSubtitle', activeProducts.length ? 'Revisa primero los agotados y las piezas con pocas unidades.' : 'Crea productos y configura su stock para activar estas alertas.');

  const priorityList = document.getElementById('dashboardPriorityList');
  if (priorityList) priorityList.innerHTML = priorities.length
    ? priorities.map(({ product, kind, detail, level }) => `<article class="${level}"><img src="${escapeDashboard(product.image)}" alt="${escapeDashboard(product.name)}"><div><span>${kind}</span><b>${escapeDashboard(product.name)}</b><small>${detail}</small></div><button type="button" data-dashboard-edit-product="${escapeDashboard(product.id)}">Revisar →</button></article>`).join('')
    : '<div class="dashboard-empty"><b>Todo en orden.</b><span>No hay productos agotados ni con stock bajo.</span></div>';

  const readiness = document.getElementById('dashboardReadiness');
  if (readiness) {
    const checks = [
      { label:'Mayor stock', value:highestStock ? `${highestStock.name} · ${productStock(highestStock)}` : 'Sin datos', complete:Boolean(highestStock) },
      { label:'Menor stock disponible', value:lowestStock ? `${lowestStock.name} · ${productStock(lowestStock)}` : 'Sin datos', complete:Boolean(lowestStock) },
      { label:'Stock ilimitado', value:unlimitedProducts.length ? `${unlimitedProducts.length} producto(s)` : 'Ninguno', complete:unlimitedProducts.length > 0 },
      { label:'Ediciones limitadas', value:limitedProducts.length ? `${limitedProducts.length} producto(s)` : 'Ninguna', complete:limitedProducts.length > 0 },
    ];
    readiness.innerHTML = checks.map((check) => `<div><span class="${check.complete ? 'ready' : ''}">${check.complete ? '✓' : '!'}</span><b>${check.label}</b><strong>${check.value}</strong></div>`).join('');
  }
}

function saveProducts() {
  return;
}

function renderProducts(updateDashboard = true) {
  const query = document.getElementById('adminProductSearch').value.toLowerCase();
  const filter = document.getElementById('adminProductFilter').value;
  const visible = products.filter((product) => {
    const stock = productStock(product);
    const matchesSearch = `${product.name} ${product.collection}`.toLowerCase().includes(query);
    const matchesFilter = filter === 'all' || (filter === 'stock' && (product.stockUnlimited || stock > 0)) || (filter === 'low' && !product.stockUnlimited && stock <= 5) || (filter === 'limited' && product.limited);
    return matchesSearch && matchesFilter;
  });
  document.getElementById('adminProductList').innerHTML = visible.map((product) => {
    const stock = productStock(product);
    const availableSizes = orderedSizeKeys(product.sizes).join(' · ') || 'Sin tallas definidas';
    const stockBySize = orderedSizeKeys(product.sizes).filter((size) => Number(product.sizes[size]) > 0).map((size) => `${size}: ${product.sizes[size]}`).join(' · ');
    const limitedCounter = product.limited ? `Stock ${stock}/${Number(product.limitedUnits)}` : `${stock} en stock`;
    const stockLabel = product.blocked ? 'Bloqueado' : product.stockUnlimited ? '' : stock > 0 ? `${limitedCounter}${usesStockBySize(product) ? ` · ${stockBySize}` : ''}` : '';
    const stockActions = product.stockUnlimited ? '' : `<button type="button" class="admin-product-stock add" data-adjust-stock="add" data-product-id="${product.id}">+ Stock</button>${stock > 0 ? `<button type="button" class="admin-product-stock remove" data-adjust-stock="remove" data-product-id="${product.id}">− Stock</button>` : ''}`;
    const stockStatus = stockLabel ? `<em class="${product.blocked ? 'blocked' : stock <= 5 ? 'low' : ''}">${stockLabel}</em>` : '<span class="admin-stock-empty" aria-hidden="true"></span>';
    return `<article class="${product.blocked ? 'is-blocked' : ''}"><img src="${product.blocked ? 'assets/image/skb-bloqueado.png' : product.image}" alt="${product.blocked ? `Producto ${product.name} bloqueado` : product.name}"><div><b>${product.name}</b><span>SKB — ${product.collection}</span><small>${String(product.type).toUpperCase()} · ${availableSizes}</small></div><strong>${money(product.price)}</strong>${stockStatus}${product.limited ? '<i>Limitada</i>' : '<i class="standard">Regular</i>'}<div class="admin-product-actions">${stockActions}<button type="button" class="admin-product-lock ${product.blocked ? 'unlock' : ''}" data-toggle-product="${product.id}">${product.blocked ? 'Desbloquear' : 'Bloquear'}</button><button type="button" data-edit-product="${product.id}" aria-label="Editar ${product.name}">Editar</button><button type="button" class="admin-product-delete" data-delete-product="${product.id}" aria-label="Eliminar ${product.name}">Eliminar</button></div></article>`;
  }).join('') || '<p class="admin-empty-products">No hay productos que coincidan con la búsqueda.</p>';
  document.getElementById('adminProductCount').textContent = products.length;
  const publishedProducts = document.getElementById('adminPublishedProducts');
  if (publishedProducts) publishedProducts.textContent = String(products.length).padStart(2,'0');
  if (updateDashboard) renderDashboard();
}
renderProducts(false);
document.getElementById('adminProductSearch').addEventListener('input', renderProducts);
document.getElementById('adminProductFilter').addEventListener('change', renderProducts);
document.addEventListener('click', (event) => {
  const action = event.target.closest('[data-dashboard-action]')?.dataset.dashboardAction;
  const productId = event.target.closest('[data-dashboard-edit-product]')?.dataset.dashboardEditProduct;
  if (productId) { showView('productos'); openProductEditor(products.find((product) => product.id === productId)); return; }
  if (!action) return;
  showView(action);
  if (action === 'verificacion') document.getElementById('newVerificationCode')?.click();
});

function syncLimitedStockFields() {
  const isLimited = document.getElementById('productLimited').checked;
  const stockBySize = document.getElementById('productStockBySize').checked;
  let stockUnlimited = document.getElementById('productStockUnlimited').checked;
  document.getElementById('productLimitedUnitsField').hidden = !isLimited;
  document.getElementById('productStockUnlimitedOption').hidden = isLimited;
  if (isLimited && stockUnlimited) {
    document.getElementById('productStockSingle').checked = true;
    stockUnlimited = false;
  }
  document.getElementById('productAvailableStockField').hidden = stockUnlimited || stockBySize;
  document.getElementById('productLimitedUnits').required = isLimited;
  document.getElementById('productAvailableStock').required = !stockUnlimited && !stockBySize;
  sizeOptions.forEach((size) => {
    const selected = document.getElementById(`size${size.id}Available`).checked;
    const input = document.getElementById(`stock${size.id}`);
    input.hidden = !stockBySize;
    input.disabled = !stockBySize || !selected;
  });
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
  document.getElementById('productMaterials').value = product?.materials || '';
  document.getElementById('productLimited').checked = Boolean(product?.limited);
  document.getElementById('productStockBySize').checked = usesStockBySize(product);
  document.getElementById('productStockUnlimited').checked = product ? Boolean(product.stockUnlimited) : true;
  document.getElementById('productStockSingle').checked = product ? !usesStockBySize(product) && !product.stockUnlimited : false;
  document.getElementById('productLimitedUnits').value = product?.limitedUnits || '';
  document.getElementById('productAvailableStock').value = product?.stockAvailable ?? productStock(product || {});
  syncLimitedStockFields();
  const defaultSizes = product ? orderedSizeKeys(product.sizes) : [];
  sizeOptions.forEach((size) => {
    const available = defaultSizes.includes(size.key);
    document.getElementById(`size${size.id}Available`).checked = available;
    document.getElementById(`stock${size.id}`).value = product?.sizes?.[size.key] || 0;
  });
  syncLimitedStockFields();
  productMainImageData = product?.image || '';
  productGalleryData = [...(product?.gallery || [])].slice(0,2);
  document.getElementById('productMainPreview').innerHTML = productMainImageData ? `<img src="${productMainImageData}" alt="Vista previa principal">` : '<span>Vista previa principal</span>';
  document.getElementById('productGalleryPreview').innerHTML = productGalleryData.map((image,index) => `<img src="${image}" alt="Imagen adicional ${index + 1}">`).join('');
  document.getElementById('adminFormStatus').textContent = '';
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
  const type = input.value.trim().toUpperCase();
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
document.getElementById('adminProductList').addEventListener('click',async (event) => {
  const editButton = event.target.closest('[data-edit-product]');
  const toggleButton = event.target.closest('[data-toggle-product]');
  const deleteButton = event.target.closest('[data-delete-product]');
  const stockButton = event.target.closest('[data-adjust-stock]');
  if (stockButton) {
    const product = products.find((item) => item.id === stockButton.dataset.productId);
    if (product) openStockAdjustment(product, stockButton.dataset.adjustStock);
    return;
  }
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
  if (deleteButton) {
    const product = products.find((item) => item.id === deleteButton.dataset.deleteProduct);
    if (!product) return;
    const confirmed = await window.skyblockConfirm({
      title:'Eliminar producto',
      message:`“${product.name}” y todas sus imágenes se eliminarán definitivamente. Esta acción no se puede deshacer.`,
      confirmText:'Eliminar producto'
    });
    if (!confirmed) return;
    deleteButton.disabled = true;
    guardarEnSupabase('SKYBLOCK_ADMIN_ELIMINAR_PRODUCTO',{id:product.id});
    return;
  }
  if (editButton) openProductEditor(products.find((product) => product.id === editButton.dataset.editProduct));
});

function closeStockAdjustment() {
  pendingStockAdjustment = null;
  stockAdjustmentModal.classList.remove('open');
  stockAdjustmentModal.setAttribute('aria-hidden','true');
}

function openStockAdjustment(product, direction) {
  if (product.stockUnlimited) return;
  const bySize = usesStockBySize(product);
  pendingStockAdjustment = { product, direction, bySize };
  document.getElementById('stockAdjustmentTitle').textContent = direction === 'add' ? 'Agregar stock' : 'Quitar stock';
  document.getElementById('stockAdjustmentProduct').textContent = product.name;
  stockAdjustmentModal.dataset.stockMode = bySize ? 'sizes' : 'single';
  const sizeField = document.getElementById('stockAdjustmentSizeField');
  sizeField.hidden = !bySize;
  const sizeSelect = document.getElementById('stockAdjustmentSize');
  sizeSelect.innerHTML = orderedSizeKeys(product.sizes).map((size) => `<option value="${size}">${size}${bySize ? ` · ${product.sizes[size]} disponibles` : ''}</option>`).join('');
  document.getElementById('stockAdjustmentAmount').value = '';
  document.getElementById('stockAdjustmentStatus').textContent = '';
  stockAdjustmentModal.classList.add('open');
  stockAdjustmentModal.setAttribute('aria-hidden','false');
  setTimeout(() => document.getElementById('stockAdjustmentAmount').focus(), 0);
}

document.getElementById('closeStockAdjustment').addEventListener('click', closeStockAdjustment);
document.getElementById('cancelStockAdjustment').addEventListener('click', closeStockAdjustment);
stockAdjustmentModal.addEventListener('click', (event) => { if (event.target === stockAdjustmentModal) closeStockAdjustment(); });
document.getElementById('stockAdjustmentForm').addEventListener('submit', (event) => {
  event.preventDefault();
  if (!pendingStockAdjustment) return;
  const { product, direction, bySize } = pendingStockAdjustment;
  const amount = Number(document.getElementById('stockAdjustmentAmount').value);
  const status = document.getElementById('stockAdjustmentStatus');
  if (!Number.isInteger(amount) || amount < 1) { status.textContent = 'Indica una cantidad válida.'; return; }
  const multiplier = direction === 'add' ? 1 : -1;
  if (bySize) {
    const size = document.getElementById('stockAdjustmentSize').value;
    const next = Number(product.sizes?.[size] || 0) + multiplier * amount;
    if (next < 0) { status.textContent = 'No puedes retirar más unidades de las disponibles en esta talla.'; return; }
    const total = Object.values(product.sizes || {}).reduce((sum, value) => sum + Number(value || 0), 0) + multiplier * amount;
    if (product.limited && total > Number(product.limitedUnits)) { status.textContent = 'El stock no puede superar el límite de la edición.'; return; }
    product.sizes[size] = next;
  } else {
    const next = Number(product.stockAvailable || 0) + multiplier * amount;
    if (next < 0) { status.textContent = 'No puedes retirar más unidades de las disponibles.'; return; }
    if (product.limited && next > Number(product.limitedUnits)) { status.textContent = 'El stock no puede superar el límite de la edición.'; return; }
    product.stockAvailable = next;
  }
  guardarEnSupabase('SKYBLOCK_ADMIN_GUARDAR_PRODUCTO', product);
  renderProducts();
  toast.textContent = direction === 'add' ? 'Stock agregado.' : 'Stock actualizado.';
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2600);
  closeStockAdjustment();
});
document.getElementById('productLimited').addEventListener('change',(event) => {
  syncLimitedStockFields();
});
document.querySelectorAll('input[name="productStockMode"]').forEach((input) => input.addEventListener('change', syncLimitedStockFields));
sizeOptions.forEach((size) => document.getElementById(`size${size.id}Available`).addEventListener('change', syncLimitedStockFields));

function closeProductEditor() {
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden','true');
}
document.getElementById('closeProductModal').addEventListener('click',closeProductEditor);
document.getElementById('cancelProductEdit').addEventListener('click',closeProductEditor);
modal.addEventListener('click', (event) => { if (event.target === modal) document.getElementById('closeProductModal').click(); });

const readImage = (file) => new Promise((resolve,reject) => {
  if (file.size > MAX_IMAGE_SIZE_BYTES) { reject(new Error(`Cada imagen debe pesar como máximo ${MAX_IMAGE_SIZE_MB} MB.`)); return; }
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
  const selectedFiles = [...event.target.files];
  const files = selectedFiles.slice(0,2);
  if (selectedFiles.length > 2) document.getElementById('adminFormStatus').textContent = 'Solo puedes seleccionar 2 imágenes secundarias.';
  try {
    productGalleryData = await Promise.all(files.map(readImage));
    document.getElementById('productGalleryPreview').innerHTML = productGalleryData.map((image,index) => `<img src="${image}" alt="Imagen adicional ${index + 1}">`).join('');
    if (selectedFiles.length <= 2) document.getElementById('adminFormStatus').textContent = '';
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
  const isLimited = document.getElementById('productLimited').checked;
  const stockBySize = document.getElementById('productStockBySize').checked;
  const stockUnlimited = document.getElementById('productStockUnlimited').checked;
  const selectedSizes = sizeOptions.reduce((sizes,size) => {
    if (document.getElementById(`size${size.id}Available`).checked) sizes[size.key] = stockBySize ? Number(document.getElementById(`stock${size.id}`).value || 0) : 0;
    return sizes;
  },{});
  if (!Object.keys(selectedSizes).length) { status.textContent = 'Selecciona al menos una talla disponible.';return; }
  const limitedUnits = Number(document.getElementById('productLimitedUnits').value);
  const stockAvailable = Number(document.getElementById('productAvailableStock').value);
  if (isLimited && (!Number.isInteger(limitedUnits) || limitedUnits < 1)) {
    status.textContent = 'Indica el total de prendas limitadas.';
    return;
  }
  const totalBySize = Object.values(selectedSizes).reduce((total, value) => total + Number(value || 0), 0);
  if (isLimited && stockBySize && totalBySize > limitedUnits) {
    status.textContent = 'El stock por tallas no puede superar el total de prendas limitadas.';
    return;
  }
  if (!stockUnlimited && !stockBySize && (!Number.isInteger(stockAvailable) || stockAvailable < 0 || (isLimited && stockAvailable > limitedUnits))) {
    status.textContent = 'El stock disponible debe estar entre 0 y el total de prendas limitadas.';
    return;
  }
  const id = document.getElementById('productId').value || `product-${Date.now()}`;
  const product = {
    id,
    name:document.getElementById('productName').value.trim(),
    type:document.getElementById('productType').value,
    collection:document.getElementById('productCollection').value,
    price:Number(document.getElementById('productPrice').value),
    description:document.getElementById('productDescription').value.trim(),
    materials:document.getElementById('productMaterials').value.trim(),
    sizes:selectedSizes,
    limited:isLimited,
    limitedUnits:isLimited ? limitedUnits : null,
    stockAvailable:!stockUnlimited && !stockBySize ? stockAvailable : null,
    stockBySize:!stockUnlimited && stockBySize,
    stockUnlimited:!isLimited && stockUnlimited,
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
let verificationSavePending = false;
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
    const matchesQuery = `${item.series} ${item.collection} ${item.product} ${item.owner} ${item.codeHint}`.toLowerCase().includes(query);
    return matchesQuery && (filter === 'all' || item.status === filter);
  });
  document.getElementById('adminCodeList').innerHTML = visible.map((item) => `<article><div><b>${cleanText(item.series)}</b><span>${cleanText(item.codeHint || 'Código protegido')}</span></div><strong>${cleanText(item.collection || 'Sin colección')} · ${cleanText(item.product || 'Diseño pendiente')}</strong><span>${cleanText(item.owner || 'Sin registrar')}</span><em class="${item.status === 'blocked' ? 'blocked' : ''}">${item.status === 'blocked' ? 'Bloqueado' : 'Activo'}</em><div><button type="button" data-edit-verification="${item.id}">Editar</button><button type="button" data-delete-verification="${item.id}">Eliminar</button></div></article>`).join('') || '<p class="admin-empty-products">No hay códigos que coincidan con la búsqueda.</p>';
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
  verificationCodeInput.value = item?.code || '';
  verificationCodeInput.placeholder = item ? (item?.code ? 'SKB-XXXX-XXXX' : 'Código anterior protegido: escribe uno nuevo') : 'SKB-XXXX-XXXX';
  document.getElementById('verificationSeries').value = item?.series || '';
  const collectionSelect = document.getElementById('verificationCollection');
  const names = collections.map((collection) => collection.name);
  if (item?.collection && !names.includes(item.collection)) names.push(item.collection);
  collectionSelect.innerHTML = names.map((name) => `<option value="${cleanText(name)}">${cleanText(name)}</option>`).join('');
  collectionSelect.value = item?.collection || names[0] || '';
  renderVerificationProducts(item?.product || '');
  document.getElementById('verificationOwner').value = item?.owner === 'Sin registrar' ? '' : (item?.owner || '');
  document.getElementById('verificationStatus').value = item?.status || 'active';
  document.getElementById('verificationFormStatus').textContent = '';
  verificationModal.classList.add('open');
  verificationModal.setAttribute('aria-hidden','false');
}
function renderVerificationProducts(selectedProduct = '') {
  const collection = document.getElementById('verificationCollection').value;
  const available = products.filter((product) => product.collection === collection);
  const select = document.getElementById('verificationProduct');
  select.innerHTML = available.map((product) => `<option value="${cleanText(product.name)}">${cleanText(product.name)}${product.limitedUnits ? ` · ${product.limitedUnits} unidades` : ''}</option>`).join('');
  if (selectedProduct && available.some((product) => product.name === selectedProduct)) select.value = selectedProduct;
  const product = available.find((entry) => entry.name === select.value);
  document.getElementById('verificationSeries').placeholder = product?.limitedUnits ? `Ej. 01/${product.limitedUnits}` : 'Configura primero el límite del diseño';
}
document.getElementById('verificationCollection').addEventListener('change',() => renderVerificationProducts());
document.getElementById('verificationProduct').addEventListener('change',() => renderVerificationProducts(document.getElementById('verificationProduct').value));
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
  const selectedProduct = document.getElementById('verificationProduct').value;
  const product = products.find((entry) => entry.name === selectedProduct && entry.collection === selectedCollection);
  if (!product) { status.textContent = 'Selecciona un diseño válido de la colección.';return; }
  if (!product.limited || !product.limitedUnits) { status.textContent = 'Configura cuántas prendas limitadas tendrá este diseño.';return; }
  const series = document.getElementById('verificationSeries').value.trim();
  const match = series.match(/^(\d+)\/(\d+)$/);
  if (!match || Number(match[2]) !== Number(product.limitedUnits) || Number(match[1]) < 1 || Number(match[1]) > Number(product.limitedUnits)) { status.textContent = `La serie debe usar el formato 01/${product.limitedUnits} y no superar el límite.`;return; }
  const item = {
    id:id || `verification-${Date.now()}`,
    hash,
    code:rawCode || existing?.code || '',
    codeHint:rawCode ? `•••• ${rawCode.slice(-4)}` : existing.codeHint,
    series,
    collection:selectedCollection,
    product:selectedProduct,
    owner:document.getElementById('verificationOwner').value.trim() || 'Sin registrar',
    status:document.getElementById('verificationStatus').value
  };
  const saveButton = event.currentTarget.querySelector('button[type="submit"]');
  verificationSavePending = true;
  saveButton.disabled = true;
  status.textContent = 'Guardando código...';
  guardarEnSupabase('SKYBLOCK_ADMIN_GUARDAR_CODIGO',item);
});
renderVerificationCodes();

let inboxMessages = [];
let selectedInboxMessageId = '';
const inboxList = document.getElementById('adminMessageList');
const inboxDetail = document.getElementById('adminMessageDetail');
const initials = (name = '') => String(name).trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'SK';
const messageDate = (value) => value ? new Intl.DateTimeFormat('es-PE', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' }).format(new Date(value)) : '';

function renderInboxMessages() {
  const counter = document.getElementById('adminMessageCount');
  if (counter) counter.textContent = String(inboxMessages.length);
  if (!inboxMessages.length) {
    inboxList.innerHTML = '<p class="admin-empty-products">No hay mensajes recibidos.</p>';
    inboxDetail.innerHTML = '<span>Bandeja de entrada</span><h2>Sin mensajes</h2><p>Las consultas enviadas desde el formulario de contacto aparecerán aquí.</p>';
    return;
  }
  if (!inboxMessages.some((message) => message.id === selectedInboxMessageId)) selectedInboxMessageId = inboxMessages[0].id;
  const selected = inboxMessages.find((message) => message.id === selectedInboxMessageId) || inboxMessages[0];
  inboxList.innerHTML = inboxMessages.map((message) => `<button type="button" class="${message.id === selected.id ? 'active' : ''}" data-inbox-message="${cleanText(message.id)}"><b>${cleanText(initials(message.nombre))}</b><span><strong>${cleanText(message.nombre || 'Sin nombre')}</strong><small>${cleanText(message.asunto || 'Consulta')}</small></span><time>${cleanText(messageDate(message.creado_en))}</time></button>`).join('');
  inboxDetail.innerHTML = `<span>Contacto / ${cleanText(selected.estado || 'Nuevo')}</span><h2>${cleanText(selected.asunto || 'Consulta')}</h2><div><b>${cleanText(selected.nombre || 'Sin nombre')}</b><small>${cleanText(selected.correo || '')} · ${cleanText(messageDate(selected.creado_en))}</small></div><p>${cleanText(selected.mensaje || '')}</p>`;
}

inboxList.addEventListener('click', (event) => {
  const button = event.target.closest('[data-inbox-message]');
  if (!button) return;
  selectedInboxMessageId = button.dataset.inboxMessage;
  renderInboxMessages();
});
renderInboxMessages();

const formatBytes = (bytes = 0) => {
  const value = Number(bytes || 0);
  return `${(value / (1024 ** 3)).toFixed(2)} GB`;
};
const setSystemText = (id, value) => { const element = document.getElementById(id); if (element) element.textContent = value; };
const setSystemMeter = (id, percentage, unknown = false) => {
  const meter = document.getElementById(id);
  if (!meter) return;
  meter.style.setProperty('--meter-value', String(Math.max(unknown ? 18 : 0, Math.min(100, Number(percentage) || 0))));
  meter.classList.toggle('system-progress-unknown', unknown);
};
function renderSystemStatus(sistema = {}) {
  const detail = sistema.detalle || {};
  const cloudinary = sistema.cloudinary || {};
  const healthy = Boolean(sistema.supabase);
  setSystemText('systemSupabaseStatus', healthy ? 'Operativo' : 'Requiere revisión');
  setSystemText('systemSupabaseNote', healthy ? 'La base de datos respondió correctamente.' : (sistema.error || 'No se pudo comprobar la conexión.'));
  setSystemText('systemCloudinaryStatus', cloudinary.disponible ? 'Operativo' : 'Sin lectura de cuota');
  setSystemText('systemCloudinaryNote', cloudinary.disponible ? (cloudinary.planLimite ? 'El medidor combina almacenamiento, entregas y optimizaciones.' : 'Cloudinary reporta el uso real, pero este plan no informa un límite de espacio.') : (cloudinary.error || 'Las imágenes registradas siguen visibles abajo.'));
  setSystemText('systemUpdatedAt', sistema.actualizadoEn ? new Intl.DateTimeFormat('es-PE', { hour:'2-digit', minute:'2-digit', day:'2-digit', month:'short' }).format(new Date(sistema.actualizadoEn)) : '—');
  setSystemText('systemImageCount', String(sistema.imagenes || 0).padStart(2, '0'));
  setSystemText('systemImageStorage', `${formatBytes(sistema.bytesImagenes)} en archivos registrados`);
  setSystemText('systemDatabaseRecords', String(sistema.registros || 0).padStart(2, '0'));
  const database = sistema.almacenamientoBaseDatos || {};
  const usedDatabase = Number(database.usado || 0), limitDatabase = Number(database.limite || 0), availableDatabase = Math.max(limitDatabase - usedDatabase, 0);
  const databasePercentage = limitDatabase ? Math.min(100, (usedDatabase / limitDatabase) * 100) : 0;
  setSystemText('systemDatabaseAvailable', limitDatabase ? formatBytes(availableDatabase) : '—');
  setSystemText('systemDatabaseUsage', limitDatabase ? `${formatBytes(usedDatabase)} usados de ${formatBytes(limitDatabase)}` : 'No se pudo leer el límite del plan');
  setSystemText('systemDatabasePercent', limitDatabase ? `${databasePercentage.toFixed(1)}% usado` : '—');
  setSystemMeter('systemDatabaseProgress', databasePercentage);
  const cloudinaryUsed = Number(cloudinary.almacenamientoUsado || 0);
  const cloudinaryLimit = Number(cloudinary.almacenamientoLimite || 0);
  const cloudinaryHasLimit = cloudinary.disponible && cloudinaryLimit > 0;
  const cloudinaryPercentage = cloudinaryHasLimit ? Math.min(100, (cloudinaryUsed / cloudinaryLimit) * 100) : 0;
  const planUsed = Number(cloudinary.planUsado || 0);
  const planLimit = Number(cloudinary.planLimite || 0);
  const planPercentage = planLimit ? Math.min(100, (planUsed / planLimit) * 100) : 0;
  setSystemText('systemCloudinaryUsed', cloudinary.disponible ? formatBytes(cloudinaryUsed) : '—');
  setSystemText('systemCloudinaryLimit', cloudinary.disponible ? (planLimit ? `${planUsed.toFixed(2)} de ${planLimit.toLocaleString('es-PE')} créditos del plan` : (cloudinaryHasLimit ? `${formatBytes(cloudinaryUsed)} usados de ${formatBytes(cloudinaryLimit)}` : 'Uso total del plan no informado')) : 'No se pudo leer Cloudinary');
  setSystemText('systemCloudinaryPercent', planLimit ? `${planPercentage.toFixed(2)}% del plan` : 'Uso real');
  setSystemText('systemCloudinaryImageCount', String(cloudinary.imagenesSubidas ?? sistema.imagenes ?? 0).padStart(2, '0'));
  setSystemMeter('systemCloudinaryProgress', planLimit ? planPercentage : cloudinaryPercentage, !planLimit && !cloudinaryHasLimit);
  setSystemText('systemLikeCount', String(sistema.likes || 0).padStart(2, '0'));
  setSystemText('systemNewMessages', String(sistema.mensajesNuevos || 0).padStart(2, '0'));
  document.getElementById('systemDatabaseList').innerHTML = [
    ['Productos',detail.productos], ['Colecciones',detail.colecciones], ['Publicaciones',detail.publicaciones], ['Códigos de autenticidad',detail.codigos], ['Mensajes recibidos',detail.mensajes],
  ].map(([label,value]) => `<div><dt>${label}</dt><dd>${String(value || 0).padStart(2,'0')}</dd></div>`).join('');
}
document.getElementById('refreshSystemStatus').addEventListener('click', () => {
  setSystemText('systemUpdatedAt','Actualizando…');
  parent.postMessage({ tipo:'SKYBLOCK_ADMIN_SOLICITAR_SISTEMA' }, location.origin);
});

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
    if (verificationSavePending) {
      verificationSavePending = false;
      const saveButton = document.querySelector('#verificationForm button[type="submit"]');
      if (saveButton) saveButton.disabled = false;
      if (event.data.ok) closeVerificationEditor();
      else document.getElementById('verificationFormStatus').textContent = event.data.mensaje;
    }
  }
  if (event.data?.tipo === 'SKYBLOCK_ADMIN_MENSAJES') {
    inboxMessages = event.data.mensajes || [];
    renderInboxMessages();
  }
  if (event.data?.tipo === 'SKYBLOCK_ADMIN_SISTEMA') renderSystemStatus(event.data.sistema || {});
});
parent.postMessage({tipo:'SKYBLOCK_SOLICITAR_DATOS'},location.origin);

document.getElementById('logoutDemo').addEventListener('click', () => {
  parent.postMessage({tipo:'SKYBLOCK_LOGOUT'},location.origin);
});

const postForm = document.getElementById('adminPostForm');
const postImageInput = document.getElementById('postImage');
const postPreview = document.getElementById('postImagePreview');
const postModal = document.getElementById('postModal');
let postImageData = [];
let adminPosts = [];
const adminFeedProfile = { nombre:'SKYBLOCK STUDIO', biografia:'', avatar_url:'', portada_url:'' };

function renderAdminFeedProfile() {
  const name=document.getElementById('adminPostsProfileName'),bio=document.getElementById('adminPostsProfileBio'),avatar=document.getElementById('adminPostsProfileAvatar'),cover=document.getElementById('adminPostsProfileCover'),count=document.getElementById('adminPostsProfileCount');
  name.textContent=adminFeedProfile.nombre || 'SKYBLOCK STUDIO'; bio.textContent=adminFeedProfile.biografia || ''; count.textContent=String(adminPosts.length).padStart(2,'0');
  avatar.style.backgroundImage=adminFeedProfile.avatar_url?`url("${adminFeedProfile.avatar_url}")`:''; avatar.textContent=adminFeedProfile.avatar_url?'':'SB'; avatar.classList.toggle('has-image',Boolean(adminFeedProfile.avatar_url));
  cover.style.backgroundImage=adminFeedProfile.portada_url?`linear-gradient(90deg,rgba(7,8,9,.28),rgba(7,8,9,.06)),url("${adminFeedProfile.portada_url}")`:'';
}

function storedPosts() {
  return adminPosts;
}

function renderAdminPosts() {
  const posts = storedPosts();
  document.getElementById('adminPostCount').textContent = posts.length;
  renderAdminFeedProfile();
  document.getElementById('adminPostList').innerHTML = posts.map((post) => `<article class="admin-feed-post"><header><div class="admin-feed-avatar">SB</div><div><b>SKYBLOCK STUDIO</b><span>${cleanText(post.date)}</span></div><button class="admin-post-more" type="button" data-post-menu="${post.id}" aria-label="Opciones de ${cleanText(post.title)}" aria-expanded="false">•••</button><div class="admin-post-menu" id="post-menu-${post.id}" hidden><button type="button" data-edit-post="${post.id}">Editar</button><button type="button" data-delete-post="${post.id}">Eliminar</button></div></header><div class="admin-feed-copy"><h3>${cleanText(post.title)}</h3>${post.description ? `<p>${cleanText(post.description)}</p>` : ''}</div>${post.images.length ? `<div class="admin-feed-media ${post.images.length === 1 ? 'is-single' : ''}">${post.images.slice(0,3).map((item) => `<img src="${item.url}" alt="${cleanText(item.alt || post.title)}">`).join('')}${post.images.length > 3 ? `<b>+${post.images.length - 3}</b>` : ''}</div>` : ''}</article>`).join('') || '<p class="admin-empty-products">Aún no hay posts. Crea la primera publicación.</p>';
}
renderAdminPosts();

function setPostModal(open) { postModal.classList.toggle('open', open); postModal.setAttribute('aria-hidden', String(!open)); }
document.getElementById('newPost').addEventListener('click', () => { resetPostEditor(); setPostModal(true); });
document.getElementById('closePostModal').addEventListener('click', () => { resetPostEditor(); setPostModal(false); });

document.getElementById('postTitle').addEventListener('input', (event) => {
  document.getElementById('previewPostTitle').textContent = event.target.value || 'Título de la publicación';
});
document.getElementById('postDescription').addEventListener('input', (event) => {
  document.getElementById('previewPostDescription').textContent = event.target.value || 'La descripción del post aparecerá aquí mientras escribes.';
});

postImageInput.addEventListener('change', () => {
  const files = [...postImageInput.files];
  const status = document.getElementById('postStatus');
  if (!files.length) return;
  if (files.length > 10 || files.some((file) => file.size > MAX_IMAGE_SIZE_BYTES)) {
    postImageInput.value = '';
    postImageData = [];
    status.textContent = files.length > 10 ? 'Puedes seleccionar como máximo 10 fotografías.' : `Cada fotografía debe pesar como máximo ${MAX_IMAGE_SIZE_MB} MB.`;
    return;
  }
  Promise.all(files.map((file) => new Promise((resolve) => { const reader = new FileReader(); reader.addEventListener('load', () => resolve(reader.result)); reader.readAsDataURL(file); }))).then((images) => { postImageData = images; postPreview.innerHTML = images.map((image) => `<img src="${image}" alt="Vista previa del post">`).join(''); document.getElementById('postUploadText').textContent = `${files.length} fotografía${files.length === 1 ? '' : 's'} seleccionada${files.length === 1 ? '' : 's'}`; status.textContent = ''; });
});

function resetPostEditor(message = '') {
  postForm.reset();
  document.getElementById('postEditId').value = '';
  postImageData = [];
  postPreview.innerHTML = '<span>Vista previa de la fotografía</span>';
  document.getElementById('postUploadText').textContent = 'Seleccionar fotografías';
  document.getElementById('previewPostTitle').textContent = 'Título de la publicación';
  document.getElementById('previewPostDescription').textContent = 'La descripción del post aparecerá aquí mientras escribes.';
  document.getElementById('savePostButton').textContent = 'Publicar post';
  document.getElementById('cancelPostEdit').textContent = 'Cancelar';
  document.getElementById('postStatus').innerHTML = message;
}

function editPost(post) {
  document.getElementById('postEditId').value = post.id;
  document.getElementById('postTitle').value = post.title;
  document.getElementById('postDescription').value = post.description;
  document.getElementById('postAlt').value = post.alt;
  postImageData = post.images.map((image) => image.url);
  postPreview.innerHTML = post.images.map((image) => `<img src="${image.url}" alt="${cleanText(image.alt || post.alt)}">`).join('');
  document.getElementById('previewPostTitle').textContent = post.title;
  document.getElementById('previewPostDescription').textContent = post.description;
  document.getElementById('postUploadText').textContent = 'Cambiar fotografías (opcional)';
  document.getElementById('savePostButton').textContent = 'Guardar cambios';
  document.getElementById('cancelPostEdit').textContent = 'Cancelar edición';
  document.getElementById('postStatus').textContent = 'Editando publicación.';
  setPostModal(true);
}

document.getElementById('cancelPostEdit').addEventListener('click',() => { resetPostEditor(); setPostModal(false); });
document.getElementById('adminPostList').addEventListener('click',async (event) => {
  const menuButton = event.target.closest('[data-post-menu]');
  const editButton = event.target.closest('[data-edit-post]');
  const deleteButton = event.target.closest('[data-delete-post]');
  const posts = storedPosts();
  if (menuButton) { const targetMenu = document.getElementById(`post-menu-${menuButton.dataset.postMenu}`); const opening = targetMenu?.hidden; document.querySelectorAll('.admin-post-menu').forEach((menu) => { menu.classList.remove('open'); menu.hidden = true; }); if (targetMenu && opening) { targetMenu.hidden = false; targetMenu.classList.add('open'); menuButton.setAttribute('aria-expanded','true'); } document.querySelectorAll('[data-post-menu]').forEach((button) => { if (button !== menuButton) button.setAttribute('aria-expanded','false'); }); if (!opening) menuButton.setAttribute('aria-expanded','false'); return; }
  if (editButton) editPost(posts.find((post) => post.id === editButton.dataset.editPost));
  if (deleteButton && await window.skyblockConfirm({title:'Eliminar publicación',message:'La publicación y su contenido dejarán de mostrarse. Esta acción no se puede deshacer.',confirmText:'Eliminar publicación'})) {
    document.getElementById('postStatus').textContent = 'Eliminando publicación...';
    parent.postMessage({tipo:'SKYBLOCK_ADMIN_ELIMINAR_POST',id:deleteButton.dataset.deletePost},location.origin);
  }
});
document.addEventListener('click',(event) => {
  if (event.target.closest('.admin-feed-post')) return;
  document.querySelectorAll('.admin-post-menu').forEach((menu) => { menu.classList.remove('open'); menu.hidden = true; });
  document.querySelectorAll('[data-post-menu]').forEach((button) => button.setAttribute('aria-expanded','false'));
});

postForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const status = document.getElementById('postStatus');
  if (!postImageData.length) { status.textContent = 'Selecciona al menos una fotografía para publicar.'; return; }
  const editId = document.getElementById('postEditId').value;
  const existingIndex = adminPosts.findIndex((post) => post.id === editId);
  const archivos = [...postImageInput.files];
  if (existingIndex < 0 && !archivos.length) { status.textContent = 'Selecciona al menos una fotografía para publicar.'; return; }
  const datos = {
    id: editId,
    titulo: document.getElementById('postTitle').value.trim(),
    descripcion: document.getElementById('postDescription').value.trim(),
    alt: document.getElementById('postAlt').value.trim(),
    archivos
  };
  document.getElementById('savePostButton').disabled = true;
  status.textContent = existingIndex >= 0 ? 'Guardando cambios...' : 'Publicando...';
  parent.postMessage({tipo:'SKYBLOCK_ADMIN_GUARDAR_POST',datos},location.origin);
});

window.addEventListener('message',(event) => {
  if (event.origin !== location.origin) return;
  if (event.data?.tipo === 'SKYBLOCK_ADMIN_POSTS') {
    adminPosts = (event.data.publicaciones || []).map((post) => {
      const imagen = [...(post.imagenes || [])].sort((a,b) => Number(a.posicion || 0) - Number(b.posicion || 0))[0];
      return {
        id:post.id,
        title:post.titulo,
        description:post.descripcion || post.contenido || '',
        alt:imagen?.texto_alternativo || post.titulo,
        image:imagen?.url_segura || '',
        images:[...(post.imagenes || [])].sort((a,b) => Number(a.posicion || 0) - Number(b.posicion || 0)).map((item) => ({ url:item.url_segura || '', alt:item.texto_alternativo || post.titulo })),
        date:new Intl.DateTimeFormat('es-PE',{day:'2-digit',month:'short',year:'numeric'}).format(new Date(post.publicado_en || post.creado_en)).toUpperCase()
      };
    });
    renderAdminPosts();
  }
  if (event.data?.tipo === 'SKYBLOCK_ADMIN_PERFIL') {
    Object.assign(adminFeedProfile,event.data.perfil || {});
    renderAdminFeedProfile();
  }
  if (event.data?.tipo === 'SKYBLOCK_ADMIN_POST_RESULTADO') {
    document.getElementById('savePostButton').disabled = false;
    if (event.data.ok) { resetPostEditor(); setPostModal(false); }
    else document.getElementById('postStatus').textContent = event.data.mensaje;
  }
});

// Perfil editorial del feed público de Posts.
const editorialProfileForm = document.getElementById('editorialProfileForm');
if (editorialProfileForm) {
  const editorialProfileModal = document.getElementById('editorialProfileModal');
  const setEditorialProfileModal = (open) => { editorialProfileModal.classList.toggle('open', open); editorialProfileModal.setAttribute('aria-hidden', String(!open)); };
  document.getElementById('openEditorialProfile').addEventListener('click', () => setEditorialProfileModal(true));
  document.getElementById('closeEditorialProfile').addEventListener('click', () => setEditorialProfileModal(false));
  document.getElementById('cancelEditorialProfile').addEventListener('click', () => setEditorialProfileModal(false));
  const profileFields = {
    nombre: document.getElementById('editorialProfileName'),
    biografia: document.getElementById('editorialProfileBio'),
    avatar: document.getElementById('editorialProfileAvatar'),
    portada: document.getElementById('editorialProfileCover'),
    avatarText: document.getElementById('editorialProfileAvatarText'),
    portadaText: document.getElementById('editorialProfileCoverText'),
    status: document.getElementById('editorialProfileStatus'),
    save: document.getElementById('saveEditorialProfile'),
    previewName: document.getElementById('adminProfilePreviewName'),
    previewBio: document.getElementById('adminProfilePreviewBio'),
    previewAvatar: document.getElementById('adminProfilePreviewAvatar'),
    previewCover: document.getElementById('adminProfilePreviewCover')
  };
  const profileMaxBytes = MAX_IMAGE_SIZE_BYTES;
  const refreshProfilePreview = () => {
    profileFields.previewName.textContent = profileFields.nombre.value || 'SKYBLOCK STUDIO';
    profileFields.previewBio.textContent = profileFields.biografia.value;
  };
  const previewProfileImage = (input, preview, isCover) => {
    const file = input.files && input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.addEventListener('load', () => {
      preview.style.backgroundImage = isCover ? `linear-gradient(90deg,rgba(7,8,9,.3),rgba(7,8,9,.08)),url("${reader.result}")` : `url("${reader.result}")`;
      preview.classList.add('has-image');
      if (!isCover) preview.textContent = '';
    });
    reader.readAsDataURL(file);
  };
  const updateProfileFileName = (input, label, fallback) => {
    const file = input.files && input.files[0];
    if (!file) return;
    if (file.size > profileMaxBytes) {
      input.value = '';
      label.textContent = fallback;
      profileFields.status.textContent = `La imagen supera el límite de ${MAX_IMAGE_SIZE_MB} MB.`;
      return;
    }
    label.textContent = file.name;
    profileFields.status.textContent = '';
  };
  profileFields.avatar.addEventListener('change', () => { updateProfileFileName(profileFields.avatar, profileFields.avatarText, 'Cambiar foto de perfil'); previewProfileImage(profileFields.avatar, profileFields.previewAvatar, false); });
  profileFields.portada.addEventListener('change', () => { updateProfileFileName(profileFields.portada, profileFields.portadaText, 'Cambiar portada'); previewProfileImage(profileFields.portada, profileFields.previewCover, true); });
  [profileFields.nombre,profileFields.biografia].forEach((input) => input.addEventListener('input', refreshProfilePreview));
  editorialProfileForm.addEventListener('submit', (event) => {
    event.preventDefault();
    profileFields.save.disabled = true;
    profileFields.status.textContent = 'Guardando perfil editorial...';
    parent.postMessage({ tipo:'SKYBLOCK_ADMIN_GUARDAR_PERFIL', datos:{
      nombre:profileFields.nombre.value.trim(), biografia:profileFields.biografia.value.trim(),
      avatarArchivo:profileFields.avatar.files[0] || null, portadaArchivo:profileFields.portada.files[0] || null
    } },location.origin);
  });
  window.addEventListener('message', (event) => {
    if (event.origin !== location.origin) return;
    if (event.data?.tipo === 'SKYBLOCK_ADMIN_PERFIL') {
      const profile = event.data.perfil || {};
      profileFields.nombre.value = profile.nombre || 'SKYBLOCK STUDIO';
      profileFields.biografia.value = profile.biografia || '';
      refreshProfilePreview();
      if (profile.avatar_url) { profileFields.previewAvatar.style.backgroundImage = `url("${profile.avatar_url}")`; profileFields.previewAvatar.textContent = ''; profileFields.previewAvatar.classList.add('has-image'); }
      if (profile.portada_url) { profileFields.previewCover.style.backgroundImage = `linear-gradient(90deg,rgba(7,8,9,.3),rgba(7,8,9,.08)),url("${profile.portada_url}")`; profileFields.previewCover.classList.add('has-image'); }
      profileFields.avatarText.textContent = profile.avatar_url ? 'Foto actual · cambiar' : 'Cambiar foto de perfil';
      profileFields.portadaText.textContent = profile.portada_url ? 'Portada actual · cambiar' : 'Cambiar portada';
    }
    if (event.data?.tipo === 'SKYBLOCK_ADMIN_PERFIL_RESULTADO') {
      profileFields.save.disabled = false;
      profileFields.status.textContent = event.data.mensaje;
      if (event.data.ok) {
        profileFields.avatar.value = '';
        profileFields.portada.value = '';
        const profile = event.data.perfil || {};
        profileFields.avatarText.textContent = profile.avatar_url ? 'Foto actual · cambiar' : 'Cambiar foto de perfil';
        profileFields.portadaText.textContent = profile.portada_url ? 'Portada actual · cambiar' : 'Cambiar portada';
        Object.assign(adminFeedProfile, profile);
        renderAdminFeedProfile();
        setEditorialProfileModal(false);
      }
    }
  });
}

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

const protectionForm = document.getElementById('protectionForm');
const protectionActive = document.getElementById('protectionActive');
const protectionTitle = document.getElementById('protectionTitle');
const protectionDescription = document.getElementById('protectionDescription');
const protectionCountdown = document.getElementById('protectionCountdown');
const protectionEndsAt = document.getElementById('protectionEndsAt');
const protectionPasswordEnabled = document.getElementById('protectionPasswordEnabled');
const protectionPassword = document.getElementById('protectionPassword');
const protectionPasswordField = document.getElementById('protectionPasswordField');
const protectionPasswordToggle = document.getElementById('protectionPasswordToggle');
const protectionPasswordMasked = document.getElementById('protectionPasswordMasked');
const protectionAccentColor = document.getElementById('protectionAccentColor');
const protectionColorValue = document.getElementById('protectionColorValue');
const protectionDateField = document.getElementById('protectionDateField');
const protectionBackground = document.getElementById('protectionBackground');
const protectionRemoveBackground = document.getElementById('protectionRemoveBackground');
const protectionStatus = document.getElementById('protectionStatus');
const protectionModeWarning = document.getElementById('protectionModeWarning');
const protectionPreviews = [...document.querySelectorAll('[data-protection-preview]')];
const protectionPreviewBackgrounds = [...document.querySelectorAll('[data-protection-preview-bg]')];
const protectionPreviewTitles = [...document.querySelectorAll('[data-protection-preview-title]')];
const protectionPreviewDescriptions = [...document.querySelectorAll('[data-protection-preview-description]')];
const protectionPreviewClocks = [...document.querySelectorAll('[data-protection-preview-clock]')];
const protectionPreviewPasswords = [...document.querySelectorAll('[data-protection-preview-password]')];
let protectionCurrent = { activo:false, titulo:'Volvemos pronto', descripcion:'', mostrar_cuenta_regresiva:false, finaliza_en:null, fondo_url:null, color_acento:'#ffffff', requiere_contrasena:false };
let protectionPreviewObjectUrl = '';
const dateTimeLocal = (value) => { if (!value) return ''; const date = new Date(value); const offset = date.getTimezoneOffset() * 60000; return new Date(date.getTime() - offset).toISOString().slice(0,16); };
const previewCountdown = () => { const end = new Date(protectionEndsAt.value || 0).getTime(), remaining = Math.max(0, end - Date.now()); const days=Math.floor(remaining/86400000),hours=Math.floor((remaining%86400000)/3600000),minutes=Math.floor((remaining%3600000)/60000),seconds=Math.floor((remaining%60000)/1000); return [days,hours,minutes,seconds].map((value)=>String(value).padStart(2,'0')).join(' : '); };
function syncProtectionModes() {
  const temporizadorActivo = protectionCountdown.checked;
  const contrasenaActiva = protectionPasswordEnabled.checked;
  protectionCountdown.disabled = contrasenaActiva;
  protectionPasswordEnabled.disabled = temporizadorActivo;
  protectionCountdown.closest('label')?.classList.toggle('is-unavailable', contrasenaActiva);
  protectionPasswordEnabled.closest('label')?.classList.toggle('is-unavailable', temporizadorActivo);
  protectionModeWarning.hidden = !temporizadorActivo && !contrasenaActiva;
  protectionModeWarning.textContent = temporizadorActivo ? 'La cuenta regresiva desactiva la protección automáticamente al terminar; por eso no se puede usar contraseña al mismo tiempo.' : 'La contraseña mantiene el acceso protegido hasta que la desactives manualmente; por eso no se puede usar cuenta regresiva al mismo tiempo.';
}
function renderProtectionPreview() {
  protectionPreviewTitles.forEach((preview) => { preview.textContent = protectionTitle.value.trim() || 'Volvemos pronto'; });
  protectionPreviewDescriptions.forEach((preview) => { preview.textContent = protectionDescription.value.trim() || 'Tu mensaje aparecerá aquí.'; });
  protectionDateField.hidden = !protectionCountdown.checked;
  protectionPasswordField.hidden = !protectionPasswordEnabled.checked;
  syncProtectionModes();
  protectionPreviewPasswords.forEach((preview) => preview.hidden = !protectionPasswordEnabled.checked);
  protectionPreviewClocks.forEach((preview) => { preview.classList.toggle('hidden', !protectionCountdown.checked); if (protectionCountdown.checked) preview.textContent = previewCountdown(); });
  protectionPreviews.forEach((preview) => preview.style.setProperty('--proteccion-texto', protectionAccentColor.value || '#ffffff'));
  protectionColorValue.textContent = (protectionAccentColor.value || '#ffffff').toUpperCase();
  protectionColorValue.style.background = protectionAccentColor.value || '#ffffff';
  const hex = (protectionAccentColor.value || '#ffffff').slice(1); const luminancia = (parseInt(hex.slice(0,2),16)*299 + parseInt(hex.slice(2,4),16)*587 + parseInt(hex.slice(4,6),16)*114) / 1000;
  protectionColorValue.style.color = luminancia > 160 ? '#111' : '#fff';
}
function populateProtection(data = {}) {
  protectionCurrent = { ...protectionCurrent, ...data };
  const bothModesEnabled = Boolean(protectionCurrent.mostrar_cuenta_regresiva && protectionCurrent.requiere_contrasena);
  if (bothModesEnabled) {
    protectionCurrent.requiere_contrasena = false;
    parent.postMessage({ tipo:'SKYBLOCK_ADMIN_NORMALIZAR_MODOS_PROTECCION' }, location.origin);
  }
  protectionActive.checked = Boolean(protectionCurrent.activo);
  protectionTitle.value = protectionCurrent.titulo || '';
  protectionDescription.value = protectionCurrent.descripcion || '';
  protectionCountdown.checked = Boolean(protectionCurrent.mostrar_cuenta_regresiva);
  protectionEndsAt.value = dateTimeLocal(protectionCurrent.finaliza_en);
  protectionPasswordEnabled.checked = Boolean(protectionCurrent.requiere_contrasena);
  protectionPassword.value = '';
  protectionPassword.type = 'password';
  protectionPasswordToggle.setAttribute('aria-label', 'Mostrar contraseña');
  protectionPasswordToggle.setAttribute('aria-pressed', 'false');
  protectionPasswordMasked.hidden = !protectionPasswordEnabled.checked;
  protectionAccentColor.value = /^#[0-9a-f]{6}$/i.test(protectionCurrent.color_acento || '') ? protectionCurrent.color_acento : '#ffffff';
  protectionRemoveBackground.checked = false;
  protectionPreviewBackgrounds.forEach((preview) => { preview.style.backgroundImage = protectionCurrent.fondo_url ? `url("${protectionCurrent.fondo_url}")` : ''; });
  document.getElementById('protectionBackgroundText').textContent = protectionCurrent.fondo_url ? 'Cambiar imagen de fondo' : 'Elegir imagen de fondo';
  renderProtectionPreview();
}
[protectionTitle,protectionDescription,protectionEndsAt,protectionAccentColor].forEach((field) => field.addEventListener('input',renderProtectionPreview));
protectionCountdown.addEventListener('change',() => { if (protectionCountdown.checked) { protectionPasswordEnabled.checked = false; protectionPassword.value = ''; } renderProtectionPreview(); });
protectionPasswordEnabled.addEventListener('change',() => { if (protectionPasswordEnabled.checked) { protectionCountdown.checked = false; } renderProtectionPreview(); });
protectionPasswordToggle.addEventListener('click',() => { const mostrar = protectionPassword.type === 'password'; protectionPassword.type = mostrar ? 'text' : 'password'; protectionPasswordToggle.setAttribute('aria-label', mostrar ? 'Ocultar contraseña' : 'Mostrar contraseña'); protectionPasswordToggle.setAttribute('aria-pressed', String(mostrar)); });
protectionActive.addEventListener('change',() => { const activo = protectionActive.checked; protectionStatus.textContent = activo ? 'Activando protección…' : 'Desactivando protección…'; parent.postMessage({ tipo:'SKYBLOCK_ADMIN_CAMBIAR_PROTECCION_ACTIVA', activo },location.origin); });
protectionBackground.addEventListener('change',() => { const file = protectionBackground.files?.[0]; if (!file) return; if (protectionPreviewObjectUrl) URL.revokeObjectURL(protectionPreviewObjectUrl); protectionPreviewObjectUrl = URL.createObjectURL(file); protectionPreviewBackgrounds.forEach((preview) => { preview.style.backgroundImage = `url("${protectionPreviewObjectUrl}")`; }); document.getElementById('protectionBackgroundText').textContent = file.name; protectionRemoveBackground.checked = false; });
protectionRemoveBackground.addEventListener('change',() => { if (protectionRemoveBackground.checked) { protectionBackground.value = ''; protectionPreviewBackgrounds.forEach((preview) => { preview.style.backgroundImage = ''; }); } else if (protectionCurrent.fondo_url) protectionPreviewBackgrounds.forEach((preview) => { preview.style.backgroundImage = `url("${protectionCurrent.fondo_url}")`; }); });
window.setInterval(() => { if (protectionCountdown.checked) renderProtectionPreview(); }, 1000);
protectionForm.addEventListener('submit',(event) => { event.preventDefault(); protectionStatus.textContent = 'Guardando información…'; parent.postMessage({ tipo:'SKYBLOCK_ADMIN_GUARDAR_PROTECCION', datos:{ titulo:protectionTitle.value, descripcion:protectionDescription.value, mostrarCuentaRegresiva:protectionCountdown.checked, finalizaEn:protectionEndsAt.value, requiereContrasena:protectionPasswordEnabled.checked, contrasena:protectionPassword.value, colorAcento:protectionAccentColor.value, fondoArchivo:protectionBackground.files?.[0] || null, eliminarFondo:protectionRemoveBackground.checked } },location.origin); });
window.addEventListener('message',(event) => { if (event.origin !== location.origin) return; if (event.data?.tipo === 'SKYBLOCK_ADMIN_PROTECCION') populateProtection(event.data.proteccion || {}); if (event.data?.tipo === 'SKYBLOCK_ADMIN_PROTECCION_RESULTADO') { protectionStatus.textContent = event.data.mensaje || ''; if (event.data.ok) populateProtection(event.data.proteccion || {}); } });
parent.postMessage({ tipo:'SKYBLOCK_ADMIN_SOLICITAR_PROTECCION' },location.origin);
