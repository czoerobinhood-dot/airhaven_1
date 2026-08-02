/*
 * Storefront behaviour for every AirHaven page.
 *
 * Each page declares what it renders on <body>:
 *   data-page="home"                          -> hero + curated strips
 *   data-page="collection" data-collection=".."-> one primary collection
 *   data-page="collection" data-category=".."  -> one category
 *
 * Everything below is a projection of data/catalog.js through the selected
 * channel. Cart and channel are persisted to localStorage so they survive
 * navigation between pages.
 */
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const CATALOG = window.SALEOR_CATALOG;
const PAGE = document.body.dataset;

let channelSlug = CATALOG.defaultChannel;
let categoryFilter = 'all';
let currentProduct = null;
let currentVariant = null;
let mediaIndex = 0;
let quantity = 1;
let announcementIndex = 0;

/** Cart lines reference a variant, never a product — as in Saleor's CheckoutLine. */
const cart = [];

const announcements = [
  'Free shipping across Canada on orders over $99',
  'New season: the Tropical Slide & Splash Park has landed',
  'Every inflatable ships with a pump, stakes and a patch kit'
];

/* ------------------------------------------------------------------ *
 * Catalog lookups
 * ------------------------------------------------------------------ */

const bySlug = list => new Map(list.map(item => [item.slug, item]));
const productBySlug = bySlug(CATALOG.products);
const attributeBySlug = bySlug(CATALOG.attributes);
const productTypeBySlug = bySlug(CATALOG.productTypes);
const categoryBySlug = bySlug(CATALOG.categories);
const collectionBySlug = bySlug(CATALOG.collections);
const warehouseBySlug = bySlug(CATALOG.warehouses);

const variantIndex = new Map();
CATALOG.products.forEach(product =>
  product.variants.forEach(variant => variantIndex.set(variant.id, { product, variant }))
);

const channel = () => CATALOG.channels.find(item => item.slug === channelSlug);
const productListing = (product, ch = channelSlug) => product.channelListings.find(l => l.channel === ch);
const variantListing = (variant, ch = channelSlug) => variant.channelListings.find(l => l.channel === ch);
const variantsInChannel = (product, ch = channelSlug) => product.variants.filter(v => variantListing(v, ch));
const variantStock = variant => variant.stocks.reduce((sum, stock) => sum + stock.quantity, 0);
const productStock = (product, ch = channelSlug) =>
  variantsInChannel(product, ch).reduce((sum, variant) => sum + variantStock(variant), 0);

function priceRange(product, ch = channelSlug) {
  const amounts = variantsInChannel(product, ch).map(variant => variantListing(variant, ch).price.amount);
  return amounts.length ? { start: Math.min(...amounts), stop: Math.max(...amounts) } : null;
}

/** Purchasable in this channel — Saleor's ProductChannelListing gates. */
function inChannel(product, ch = channelSlug) {
  const listing = productListing(product, ch);
  return Boolean(listing?.isPublished && listing.visibleInListings && variantsInChannel(product, ch).length);
}

/** Everything the current page is scoped to, before UI filters. */
function pageProducts(ch = channelSlug) {
  return CATALOG.products.filter(product => {
    if (!inChannel(product, ch)) return false;
    if (PAGE.collection && !product.collections.includes(PAGE.collection)) return false;
    if (PAGE.category && product.category !== PAGE.category) return false;
    return true;
  });
}

/** Page scope narrowed further by the category chips. */
function listedProducts(ch = channelSlug, category = categoryFilter) {
  return pageProducts(ch).filter(product => category === 'all' || product.category === category);
}

/** Categories actually represented on this page, in catalog order. */
function pageCategories() {
  const present = new Set(pageProducts().map(product => product.category));
  return CATALOG.categories.filter(category => present.has(category.slug));
}

/** Position inside a collection == CollectionProduct.sortOrder; drives "Featured". */
function featuredOrder() {
  const source = collectionBySlug.get(PAGE.collection)?.products ?? CATALOG.products.map(p => p.slug);
  return new Map(source.map((slug, index) => [slug, index]));
}

/* ------------------------------------------------------------------ *
 * Presentation helpers
 * ------------------------------------------------------------------ */

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const esc = value => String(value).replace(/[&<>"']/g, char => ESCAPES[char]);

// narrowSymbol keeps every channel on a bare "$", so callers that also print the
// currency code ("$139.00 CAD") don't end up doubling it up as "US$... USD".
function money(amount, currency = channel().currencyCode) {
  return new Intl.NumberFormat('en-CA', { style: 'currency', currency, currencyDisplay: 'narrowSymbol' }).format(amount);
}

function priceLabel(product) {
  const range = priceRange(product);
  return range.start === range.stop ? money(range.start) : `From ${money(range.start)}`;
}

function initIcons() {
  if (window.lucide) window.lucide.createIcons({ attrs: { 'aria-hidden': 'true' } });
}

function showToast(message) {
  const toast = $('#toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove('show'), 2600);
}

function setOverlay(open) {
  $('#pageOverlay')?.classList.toggle('open', open);
  document.body.style.overflow = open ? 'hidden' : '';
}

function openDrawer(id) {
  const drawer = document.getElementById(id);
  if (!drawer) return;
  drawer.classList.add('open');
  drawer.setAttribute('aria-hidden', 'false');
  setOverlay(true);
}

function closeSearch() {
  const panel = $('#searchPanel');
  if (!panel) return;
  panel.classList.remove('open');
  panel.setAttribute('aria-hidden', 'true');
}

function closePanels() {
  $$('.mobile-drawer.open, .cart-drawer.open, .filters.open').forEach(panel => panel.classList.remove('open'));
  $$('.mobile-drawer, .cart-drawer').forEach(panel => panel.setAttribute('aria-hidden', 'true'));
  $('#menuButton')?.setAttribute('aria-expanded', 'false');
  closeSearch();
  setOverlay(false);
}

/* ------------------------------------------------------------------ *
 * Persistence — the cart has to survive page navigation
 * ------------------------------------------------------------------ */

const STORE_KEY = 'airhaven.demo.v1';

function loadState() {
  let saved;
  try {
    saved = JSON.parse(localStorage.getItem(STORE_KEY) ?? 'null');
  } catch {
    return; // unreadable or disabled storage — start clean
  }
  if (!saved) return;

  if (CATALOG.channels.some(item => item.slug === saved.channel)) channelSlug = saved.channel;
  // Validate against the live catalog: a stored variant may no longer exist.
  if (Array.isArray(saved.cart)) {
    saved.cart.forEach(line => {
      const quantity = Number(line?.quantity);
      if (variantIndex.has(line?.variantId) && Number.isInteger(quantity) && quantity > 0) {
        cart.push({ variantId: line.variantId, quantity: Math.min(20, quantity) });
      }
    });
  }
}

function saveState() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify({ channel: channelSlug, cart }));
  } catch {
    /* private mode or quota — the demo still works for this page view */
  }
}

/* ------------------------------------------------------------------ *
 * Product cards
 * ------------------------------------------------------------------ */

/*
 * Vector placeholders need padding and object-fit: contain; real product
 * photography wants to fill the frame edge-to-edge. Swapping an .svg for a
 * .jpg in the catalog is therefore all it takes to move a product onto the
 * photo treatment — no markup or CSS change required.
 */
const isPhoto = url => !/\.svg(\?|$)/i.test(url);
const hasUsablePhoto = product =>
  Array.isArray(product.media) && product.media.some(media => typeof media?.url === 'string' && isPhoto(media.url));
const merchandisingRank = product => (productStock(product) > 0 && hasUsablePhoto(product) ? 0 : 1);

function productCardHTML(product) {
  const media = product.media?.find(item => item?.url) ?? null;
  const soldOut = productStock(product) === 0;
  const mediaClass = media && isPhoto(media.url) ? ' is-photo' : '';
  const mediaContent = media
    ? `<img src="${esc(media.url)}" alt="${esc(media.alt)}" loading="lazy">`
    : '<span class="media-missing" aria-label="Image unavailable"><i data-lucide="image-off"></i></span>';

  let badge = '';
  if (soldOut) badge = '<span class="badge">Sold out</span>';
  else if (product.collections.includes('new-arrivals')) badge = '<span class="badge badge-new">New</span>';

  return `
    <article class="product-card" data-slug="${esc(product.slug)}">
      <div class="product-media${mediaClass}">${badge}<label class="compare"><input type="checkbox"> Compare</label>${mediaContent}<button class="quick-view" type="button">Quick view</button></div>
      <h2>${esc(product.name)}</h2><p class="price">${priceLabel(product)}</p>
    </article>`;
}

function comparator(sort) {
  let secondary;
  if (sort === 'title-asc') secondary = (a, b) => a.name.localeCompare(b.name);
  else if (sort === 'title-desc') secondary = (a, b) => b.name.localeCompare(a.name);
  // Saleor's ProductOrderField.PRICE sorts on the product's cheapest variant.
  else if (sort === 'price-asc') secondary = (a, b) => priceRange(a).start - priceRange(b).start;
  else if (sort === 'price-desc') secondary = (a, b) => priceRange(b).start - priceRange(a).start;
  else {
    const order = featuredOrder();
    secondary = (a, b) => (order.get(a.slug) ?? Infinity) - (order.get(b.slug) ?? Infinity);
  }

  return (a, b) => merchandisingRank(a) - merchandisingRank(b) || secondary(a, b) || a.name.localeCompare(b.name);
}

function filterAndSort() {
  const grid = $('#productGrid');
  if (!grid) return;

  const inStockOnly = $('#inStockFilter')?.checked;
  const min = Number($('#minPrice')?.value || 0);
  const maxValue = $('#maxPrice')?.value;
  const max = !maxValue ? Infinity : Number(maxValue);

  const results = listedProducts()
    .filter(product => {
      if (inStockOnly && productStock(product) === 0) return false;
      // A product matches when any of its variants is priced inside the range.
      return variantsInChannel(product).some(variant => {
        const amount = variantListing(variant).price.amount;
        return amount >= min && amount <= max;
      });
    })
    .sort(comparator($('#sortSelect').value));

  // A flat grid preserves the in-stock-with-photo priority across categories.
  grid.classList.remove('grouped');
  grid.innerHTML = results.map(productCardHTML).join('');
  $('#resultCount').textContent = `${results.length} product${results.length === 1 ? '' : 's'}`;
  $('#emptyState').hidden = results.length !== 0;
  initIcons();
}

function renderCategoryChips() {
  const container = $('#categoryChips');
  if (!container) return;

  const categories = pageCategories();
  if (categories.length < 2) {
    container.hidden = true;
    return;
  }
  container.hidden = false;

  const chips = [{ slug: 'all', name: 'All' }, ...categories];
  container.innerHTML = chips
    .map(category => {
      const active = category.slug === categoryFilter;
      const total = listedProducts(channelSlug, category.slug).length;
      return `<button type="button" class="chip${active ? ' active' : ''}" data-category="${esc(category.slug)}" aria-pressed="${active}">${esc(category.name)} <span>${total}</span></button>`;
    })
    .join('');
}

function renderPriceBounds() {
  const note = $('#priceNote');
  if (!note) return;
  const amounts = pageProducts().flatMap(product =>
    variantsInChannel(product).map(variant => variantListing(variant).price.amount)
  );
  const highest = amounts.length ? Math.max(...amounts) : 0;
  note.textContent = `The highest price is ${money(highest)}`;
  $('#maxPrice').placeholder = new Intl.NumberFormat('en-CA').format(highest);
}

/** Curated rows on the home page: <div data-strip="best-sellers"></div> */
function renderStrips() {
  $$('[data-strip]').forEach(container => {
    const collection = collectionBySlug.get(container.dataset.strip);
    if (!collection) return;
    const products = collection.products
      .map(slug => productBySlug.get(slug))
      .filter(product => product && inChannel(product))
      .sort(comparator('featured'));
    container.innerHTML = products.map(productCardHTML).join('');
  });
  initIcons();
}

/* ------------------------------------------------------------------ *
 * Channel switching
 * ------------------------------------------------------------------ */

function renderChannelButton() {
  const active = channel();
  if (!$('#channelFlag')) return;
  $('#channelFlag').textContent = active.defaultCountry.code;
  $('#channelLabel').textContent = `${active.name} (${active.currencyCode} $)`;
}

function switchChannel() {
  const index = CATALOG.channels.findIndex(item => item.slug === channelSlug);
  channelSlug = CATALOG.channels[(index + 1) % CATALOG.channels.length].slug;
  saveState();

  if ($('#quickModal')?.open) $('#quickModal').close();
  renderChannelButton();
  renderCategoryChips();
  renderPriceBounds();
  filterAndSort();
  renderStrips();
  updateCart();
  if ($('#searchInput')) searchProducts($('#searchInput').value);
  showToast(`Now browsing the ${channel().name} channel (${channel().currencyCode}).`);
}

/* ------------------------------------------------------------------ *
 * Quick view
 * ------------------------------------------------------------------ */

function openQuickView(slug) {
  const product = productBySlug.get(slug);
  const variants = product ? variantsInChannel(product) : [];
  if (!variants.length || !$('#quickModal')) return;

  currentProduct = product;
  currentVariant = variants.find(variant => variantStock(variant) > 0) ?? variants[0];
  mediaIndex = 0;
  quantity = 1;
  renderQuickView();
  $('#quickModal').showModal();
}

function renderQuickView() {
  const product = currentProduct;
  const variants = variantsInChannel(product);
  const productType = productTypeBySlug.get(product.productType);
  const category = categoryBySlug.get(product.category);
  const media = product.media[mediaIndex] ?? product.media[0];
  const stock = variantStock(currentVariant);

  $('#modalEyebrow').textContent = (category?.name ?? productType?.name ?? 'Catalogue').toUpperCase();
  $('#modalTitle').textContent = product.name;
  $('#modalDescription').textContent = product.description;
  $('#modalImage').src = media.url;
  $('#modalImage').alt = media.alt;
  $('.modal-image').classList.toggle('is-photo', isPhoto(media.url));

  // Gallery strip and arrows appear only when the product ships more than one image.
  const multi = product.media.length > 1;
  const thumbs = $('#mediaThumbs');
  thumbs.hidden = !multi;
  $('#mediaPrev').hidden = $('#mediaNext').hidden = !multi;
  thumbs.innerHTML = !multi
    ? ''
    : product.media
        .map((item, index) =>
          `<button type="button" class="media-thumb${index === mediaIndex ? ' selected' : ''}" data-media="${index}" aria-label="Image ${index + 1} of ${product.media.length}" aria-pressed="${index === mediaIndex}"><img src="${esc(item.url)}" alt=""></button>`)
        .join('');
  thumbs.querySelector('.selected')?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  $('#modalPrice').textContent = `${money(variantListing(currentVariant).price.amount)} ${channel().currencyCode}`;

  const picker = $('#variantPicker');
  picker.hidden = variants.length < 2;
  if (!picker.hidden) {
    const definition = attributeBySlug.get(productType?.variantAttributes?.[0]);
    $('#variantLabel').textContent = definition?.name ?? 'Option';
    $('#variantOptions').innerHTML = variants
      .map(variant => {
        const selected = variant.id === currentVariant.id;
        const out = variantStock(variant) === 0;
        return `<button type="button" class="variant-option${selected ? ' selected' : ''}${out ? ' out' : ''}" data-variant="${esc(variant.id)}" aria-pressed="${selected}">${esc(variant.name)}</button>`;
      })
      .join('');
  }

  const rows = product.attributes.map(assignment => {
    const definition = attributeBySlug.get(assignment.attribute);
    // A long multi-value attribute (play zones, what's in the box) reads far
    // better as a wrapped tag list than as one comma-separated run-on line.
    const value =
      assignment.values.length > 3
        ? `<ul class="attr-tags">${assignment.values.map(item => `<li>${esc(item.name)}</li>`).join('')}</ul>`
        : esc(assignment.values.map(item => item.name).join(', '));
    return `<dt>${esc(definition?.name ?? assignment.attribute)}</dt><dd>${value}</dd>`;
  });
  rows.push(`<dt>SKU</dt><dd>${esc(currentVariant.sku)}</dd>`);
  $('#attributeList').innerHTML = rows.join('');

  const stocked = currentVariant.stocks
    .filter(entry => entry.quantity > 0)
    .map(entry => warehouseBySlug.get(entry.warehouse)?.name ?? entry.warehouse);
  $('#stockLine').textContent = stock > 0 ? `${stock} in stock — ${stocked.join(', ')}` : 'Out of stock in all warehouses';
  $('#stockLine').classList.toggle('out', stock === 0);

  quantity = Math.min(quantity, Math.max(stock, 1));
  $('#quantityValue').textContent = quantity;
  $('#addToCart').disabled = stock === 0;
  $('#addToCart').textContent = stock === 0 ? 'Sold out' : 'Add to bag';
  initIcons();
}

function stepMedia(step) {
  const count = currentProduct?.media.length ?? 0;
  if (count < 2) return;
  mediaIndex = (mediaIndex + step + count) % count;
  renderQuickView();
}

function setQuantity(next) {
  const ceiling = Math.min(20, Math.max(variantStock(currentVariant), 1));
  quantity = Math.min(ceiling, Math.max(1, next));
  $('#quantityValue').textContent = quantity;
}

/* ------------------------------------------------------------------ *
 * Cart
 * ------------------------------------------------------------------ */

function cartLineHTML(line, index) {
  const { product, variant } = variantIndex.get(line.variantId);
  const listing = variantListing(variant);
  const showVariant = product.variants.length > 1;
  const detail = listing
    ? `${line.quantity} x ${money(listing.price.amount)}`
    : `Not sold in the ${channel().name} channel`;

  return `
    <div class="cart-line${listing ? '' : ' unavailable'}">
      <img src="${esc(product.media[0].url)}" alt="${esc(product.name)}">
      <div>
        <h3>${esc(product.name)}</h3>
        ${showVariant ? `<p class="cart-variant">${esc(variant.name)}</p>` : ''}
        <p>${esc(detail)}</p>
      </div>
      <button class="cart-remove" data-index="${index}" aria-label="Remove ${esc(product.name)}"><i data-lucide="x"></i></button>
    </div>`;
}

function updateCart() {
  const count = cart.reduce((sum, line) => sum + line.quantity, 0);
  const subtotal = cart.reduce((sum, line) => {
    const listing = variantListing(variantIndex.get(line.variantId).variant);
    return listing ? sum + listing.price.amount * line.quantity : sum;
  }, 0);

  $$('#cartCount').forEach(node => (node.textContent = count));
  if ($('#cartSubtotal')) $('#cartSubtotal').textContent = `${money(subtotal)} ${channel().currencyCode}`;
  if ($('#cartItems')) {
    $('#cartItems').innerHTML = cart.length
      ? cart.map(cartLineHTML).join('')
      : '<div class="cart-empty"><i data-lucide="shopping-bag"></i><p>Your bag is empty</p></div>';
  }
  initIcons();
}

/* ------------------------------------------------------------------ *
 * Search — always spans the whole catalogue, not just this page
 * ------------------------------------------------------------------ */

function searchProducts(query) {
  const results = $('#searchResults');
  if (!results) return;

  const term = query.trim().toLowerCase();
  if (!term) {
    results.innerHTML = '<p>Start typing to search the catalogue.</p>';
    return;
  }

  const hits = CATALOG.products.filter(
    product =>
      inChannel(product) &&
      (product.name.toLowerCase().includes(term) ||
        variantsInChannel(product).some(variant => variant.sku.toLowerCase().includes(term)))
  ).sort(comparator('featured'));

  results.innerHTML = hits.length
    ? hits
        .map(
          product => `
            <button class="search-hit" data-slug="${esc(product.slug)}">
              <img src="${esc(product.media[0].url)}" alt="">
              <span>${esc(product.name)}</span>
              <span>${priceLabel(product)}</span>
            </button>`
        )
        .join('')
    : '<p>No matching products.</p>';
}

function rotateAnnouncement(step) {
  announcementIndex = (announcementIndex + step + announcements.length) % announcements.length;
  $('#announcementText').textContent = announcements[announcementIndex];
}

/* ------------------------------------------------------------------ *
 * Wiring
 * ------------------------------------------------------------------ */

const on = (selector, event, handler) => $(selector)?.addEventListener(event, handler);

document.addEventListener('DOMContentLoaded', () => {
  loadState();
  initIcons();
  renderChannelButton();
  renderCategoryChips();
  renderPriceBounds();
  filterAndSort();
  renderStrips();
  updateCart();

  /* ---- shared chrome ---- */
  on('#menuButton', 'click', () => {
    openDrawer('mobileDrawer');
    $('#menuButton').setAttribute('aria-expanded', 'true');
  });
  on('#cartButton', 'click', () => openDrawer('cartDrawer'));
  on('#filterButton', 'click', () => { $('.filters').classList.add('open'); setOverlay(true); });
  on('#channelButton', 'click', switchChannel);
  on('#pageOverlay', 'click', closePanels);
  $$('[data-close]').forEach(button =>
    button.addEventListener('click', () => {
      const target = document.getElementById(button.dataset.close);
      if (target instanceof HTMLDialogElement) target.close();
      else closePanels();
    })
  );

  /* ---- collection page ---- */
  on('#sortSelect', 'change', filterAndSort);
  on('#inStockFilter', 'change', filterAndSort);
  on('#applyPrice', 'click', () => { filterAndSort(); if (window.innerWidth <= 900) closePanels(); });
  on('#clearFilters', 'click', () => {
    $('#inStockFilter').checked = false;
    $('#minPrice').value = '';
    $('#maxPrice').value = '';
    filterAndSort();
  });
  on('#categoryChips', 'click', event => {
    const chip = event.target.closest('.chip');
    if (!chip || chip.dataset.category === categoryFilter) return;
    categoryFilter = chip.dataset.category;
    renderCategoryChips();
    filterAndSort();
  });

  /* ---- quick view (present on every page) ---- */
  document.addEventListener('click', event => {
    const button = event.target.closest('.quick-view');
    if (button) openQuickView(button.closest('.product-card').dataset.slug);
  });
  on('#mediaThumbs', 'click', event => {
    const thumb = event.target.closest('.media-thumb');
    if (!thumb) return;
    mediaIndex = Number(thumb.dataset.media);
    renderQuickView();
  });
  on('#mediaPrev', 'click', () => stepMedia(-1));
  on('#mediaNext', 'click', () => stepMedia(1));
  on('#variantOptions', 'click', event => {
    const option = event.target.closest('.variant-option');
    if (!option) return;
    currentVariant = variantIndex.get(option.dataset.variant).variant;
    quantity = 1;
    renderQuickView();
  });
  on('#quantityMinus', 'click', () => setQuantity(quantity - 1));
  on('#quantityPlus', 'click', () => setQuantity(quantity + 1));
  on('#addToCart', 'click', () => {
    const existing = cart.find(line => line.variantId === currentVariant.id);
    if (existing) existing.quantity = Math.min(20, existing.quantity + quantity);
    else cart.push({ variantId: currentVariant.id, quantity });
    saveState();
    updateCart();
    $('#quickModal').close();
    openDrawer('cartDrawer');
    showToast(`${currentProduct.name} added to your demo bag.`);
  });
  on('#cartItems', 'click', event => {
    const button = event.target.closest('.cart-remove');
    if (!button) return;
    cart.splice(Number(button.dataset.index), 1);
    saveState();
    updateCart();
  });
  on('#checkoutButton', 'click', () => showToast('Demo only: checkout is intentionally disabled.'));

  /* ---- search ---- */
  on('#searchButton', 'click', () => {
    $('#searchPanel').classList.add('open');
    $('#searchPanel').setAttribute('aria-hidden', 'false');
    setOverlay(true);
    setTimeout(() => $('#searchInput').focus(), 100);
  });
  on('[data-close="searchPanel"]', 'click', () => { closeSearch(); setOverlay(false); });
  on('#searchInput', 'input', event => searchProducts(event.target.value));
  on('#searchResults', 'click', event => {
    const hit = event.target.closest('.search-hit');
    if (!hit) return;
    closeSearch();
    setOverlay(false);
    openQuickView(hit.dataset.slug);
  });

  /* ---- misc ---- */
  on('#announcementPrev', 'click', () => rotateAnnouncement(-1));
  on('#announcementNext', 'click', () => rotateAnnouncement(1));
  on('#newsletterForm', 'submit', event => {
    event.preventDefault();
    showToast('Thanks. Newsletter signup is simulated locally.');
    event.target.reset();
  });
  on('#quickModal', 'click', event => {
    if (event.target === $('#quickModal')) $('#quickModal').close();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closePanels();
    // Arrow keys page the gallery while the quick view is open.
    const inField = event.target instanceof Element && event.target.closest('input, select, textarea');
    if ($('#quickModal')?.open && !inField) {
      if (event.key === 'ArrowLeft') stepMedia(-1);
      if (event.key === 'ArrowRight') stepMedia(1);
    }
  });
});
