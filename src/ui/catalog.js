import { stockByProduct, stockOf } from '../domain/stock.js';
import { catalogListing } from '../data/official-catalog.js';
import { catalogImage } from './catalog-image.js';
import { defaultTarget } from '../domain/replenishment.js';
import { recentFirst } from '../domain/selectors.js';
import { movementsTable } from './dashboard.js';
import { esc, num, money, badge, button, table, panel, pageHead, link, definition, field, input, option, options, select, textarea } from './components.js';

const productName = product => product.sku + ' · ' + product.name;
export const locationOptions = (state, active, warehouse) => options(state.locations.filter(location => !warehouse || location.warehouseId === warehouse), active, row => row.code);
const number = 'type="number" min="0" step="1" max="100000" required';
export const currencyInput = 'type="number" min="0" step="0.01" max="100000" required';

function filterForm(items) {
  return '<form class="filters" data-filter>' + items.join('') + '</form>';
}

export function productsPage(state, id, filters) {
  const product = state.products.find(row => row.id === id);
  if (product) {
    const listing = catalogListing(product);
    const stock = stockOf(state, product.id);
    const supplier = state.suppliers.find(row => row.id === product.supplierId);
    const rows = state.balances.filter(row => row.productId === id).map(row => [
      esc(row.locationId), num(row.physical), num(row.reserved), num(row.physical - row.reserved),
    ]);
    return pageHead(product.name, product.sku + ' · ' + product.category,
      button('transfer-product', 'Voorraad verplaatsen') + button('edit-product', 'Artikel wijzigen', 'primary'), link('artikelen', '', '‹ Artikelen', 'back')) +
      '<div class="detail-grid">' + panel('Artikelgegevens', definition([
        ['Merk', esc(product.brand || '—')], ['Klasse', esc(product.grade || '—')],
        ['Verpakking', esc(product.packaging + ' · ' + product.content + ' ' + product.unit) + (product.verifiedPack ? '' : ' <small class="inline-note">Demo</small>')],
        ['Verkoopprijs', money(product.salePrice)], ['Inkoopprijs', money(product.purchasePrice)],
        ['Btw-code', num(product.taxRate / 100) + '%'], ['Minimumvoorraad', num(product.minimum)],
        ['Aanvullen tot', num(product.targetStock ?? defaultTarget(product.minimum))],
        ['Leverancier', link('leveranciers', supplier.id, supplier.name)], ['Voorkeurslocatie', esc(product.locationId)], ['Demobarcode', '<code>' + esc(product.barcode) + '</code>'],
      ]) + (product.description ? '<p class="description">' + esc(product.description) + '</p>' : '') +
      (listing ? '<p class="description"><a class="text-link" target="_blank" rel="noopener noreferrer" href="' + esc(listing.url) + '">Productpagina De Driekleur Ede ↗</a></p>' : '') +
      (product.source ? '<p class="description"><a class="text-link" target="_blank" rel="noopener noreferrer" href="' + esc(product.source) + '">Fabrikantinformatie ↗</a></p>' : '')) +
      '<figure class="product-image">' + catalogImage(listing?.image, 'detail-photo') + '<figcaption>Illustratieve demoverpakking</figcaption></figure></div>' +
      panel('Voorraad per locatie · ' + num(stock.available) + ' beschikbaar', table(['Locatie', 'Fysiek', 'Gereserveerd', 'Beschikbaar'], rows), button('adjust-stock', 'Voorraad corrigeren')) +
      panel('Voorraadgeschiedenis', movementsTable(state, state.movements.filter(row => row.productId === id).sort(recentFirst), false));
  }
  const categories = [...new Set(state.products.map(row => row.category))].sort();
  return pageHead('Artikelen', 'Beheer assortiment, prijzen en verpakkingen.',
    button('export-csv', 'Export alles (CSV)') + button('new-product', 'Nieuw artikel', 'primary')) +
    filterForm([
      field('search', 'Zoeken', input('search', filters.search, 'type="search" placeholder="SKU, naam of merk"')),
      field('category', 'Categorie', select('category', option('', 'Alle categorieën', filters.category) + categories.map(item => option(item, item, filters.category)).join(''))),
      field('source', 'Herkomst', select('source', option('', 'Alle artikelen', filters.source) + option('official', 'Op website De Driekleur', filters.source))),
      field('sort', 'Sorteren op', select('sort', [['sku', 'SKU'], ['name', 'Artikelnaam'], ['price', 'Verkoopprijs'], ['stock', 'Beschikbaarheid']].map(([id, label]) => option(id, label, filters.sort)).join(''))),
    ]) + '<div id="filter-results">' + productResults(state, filters) + '</div>';
}

export function productResults(state, filters) {
  const search = (filters.search ?? '').toLowerCase().trim();
  const matches = state.products.filter(row => (!filters.category || row.category === filters.category) &&
    (!filters.source || catalogListing(row)) &&
    [row.sku, row.name, row.brand].some(value => value.toLowerCase().includes(search)));
  const stock = stockByProduct(state);
  const available = id => stock.get(id)?.available ?? 0;
  const compare = {
    name: (a, b) => a.name.localeCompare(b.name, 'nl'),
    price: (a, b) => a.salePrice - b.salePrice,
    stock: (a, b) => available(a.id) - available(b.id),
    sku: (a, b) => a.sku.localeCompare(b.sku, 'nl'),
  };
  matches.sort(compare[filters.sort] ?? compare.sku);
  const rows = matches.map(product => [
    link('artikelen', product.id, product.name) + '<small class="cell-sub">' + esc(product.sku) + '</small>',
    esc(product.category), esc(product.packaging + ' · ' + product.content + ' ' + product.unit),
    money(product.salePrice), num(available(product.id)),
    available(product.id) < product.minimum ? badge('Onder minimum', 'amber') : badge('Op peil', 'green'),
  ]);
  return panel('Assortiment', table(['Artikel', 'Categorie', 'Verpakking', 'Verkoopprijs', 'Beschikbaar', 'Voorraadstatus'], rows),
    '<span class="count">' + matches.length + ' artikelen</span>');
}

export function stockPage(state, id, filters) {
  const controls = link('voorraad', '', 'Voorraadstanden', 'button ' + (!id ? 'primary' : 'secondary')) +
    link('voorraad', 'mutaties', 'Mutaties', 'button ' + (id ? 'primary' : 'secondary')) +
    link('aanvullen', '', 'Voorraad aanvullen', 'button secondary');
  const header = pageHead('Voorraad', 'Fysieke voorraad, reserveringen en voorraadmutaties per locatie.',
    button('export-csv', 'Export alles (CSV)') + link('verplaatsingen', '', 'Verplaatsingen', 'button secondary') +
    button('adjust-stock', 'Voorraad corrigeren', 'primary'));
  if (id === 'mutaties') return header + '<div class="subnav">' + controls + '</div>' +
    panel('Mutatieoverzicht', movementsTable(state, [...state.movements].sort(recentFirst)));
  return header + '<div class="subnav">' + controls + '</div>' +
    filterForm([
      field('search', 'Zoeken', input('search', filters.search, 'type="search" placeholder="Artikel of locatie"')),
      field('warehouse', 'Magazijn', select('warehouse', option('', 'Alle magazijnen', filters.warehouse) + options(state.warehouses, filters.warehouse))),
    ]) + '<div id="filter-results">' + stockResults(state, filters) + '</div>';
}

export function stockResults(state, filters) {
  const q = (filters.search ?? '').toLowerCase().trim();
  const productMap = new Map(state.products.map(row => [row.id, row]));
  const rows = state.balances.filter(row => {
    const product = productMap.get(row.productId);
    return (!filters.warehouse || row.locationId.startsWith(filters.warehouse + '-')) &&
      [product.name, product.sku, row.locationId].some(value => value.toLowerCase().includes(q));
  }).sort((a, b) => a.locationId.localeCompare(b.locationId));
  return panel('Voorraadstanden', table(['Artikel', 'Locatie', 'Fysiek', 'Gereserveerd', 'Beschikbaar'], rows.map(row => {
    const product = productMap.get(row.productId);
    return [link('artikelen', product.id, product.name) + '<small class="cell-sub">' + esc(product.sku) + '</small>',
      esc(row.locationId), num(row.physical), num(row.reserved), '<strong>' + num(row.physical - row.reserved) + '</strong>'];
  })), '<span class="count">' + rows.length + ' standen</span>');
}

export function productForm(state, product = {}) {
  return '<div class="form-grid">' +
    field('name', 'Artikelnaam', input('name', product.name, 'required maxlength="180"')) +
    field('sku', 'SKU', input('sku', product.sku, 'required maxlength="40"')) +
    field('brand', 'Merk', input('brand', product.brand, 'maxlength="180"')) +
    field('category', 'Categorie', input('category', product.category, 'required maxlength="180" list="category-suggestions"')) +
    '<datalist id="category-suggestions">' + [...new Set(state.products.map(row => row.category))].map(item => option(item, item)).join('') + '</datalist>' +
    field('grade', 'Viscositeit of NLGI-klasse', input('grade', product.grade, 'maxlength="180"')) +
    field('barcode', 'Demobarcode', input('barcode', product.barcode, 'required maxlength="64"')) +
    field('packaging', 'Verpakkingstype', input('packaging', product.packaging, 'required maxlength="180" list="package-suggestions"')) +
    '<datalist id="package-suggestions">' + ['Jerrycan', 'Emmer', 'Vat', 'Fles', 'Blik', 'Tube', 'Stuk'].map(item => option(item, item)).join('') + '</datalist>' +
    field('content', 'Verpakkingsinhoud', input('content', product.content, 'type="number" min="0.001" max="10000" step="0.001" required')) +
    field('unit', 'Eenheid', select('unit', [['L', 'Liter'], ['kg', 'Kilogram'], ['st', 'Stuks']].map(([key, label]) => option(key, label, product.unit)).join(''))) +
    field('purchasePrice', 'Inkoopprijs (€)', input('purchasePrice', product.purchasePrice === undefined ? '' : product.purchasePrice / 100, currencyInput)) +
    field('salePrice', 'Verkoopprijs (€)', input('salePrice', product.salePrice === undefined ? '' : product.salePrice / 100, currencyInput)) +
    field('taxRate', 'Demo-btw', select('taxRate', [['2100', '21%'], ['900', '9%'], ['0', '0%']].map(([key, label]) => option(key, label, String(product.taxRate ?? 2100))).join(''))) +
    field('supplierId', 'Leverancier', select('supplierId', options(state.suppliers, product.supplierId))) +
    field('locationId', 'Voorkeurslocatie', select('locationId', locationOptions(state, product.locationId))) +
    field('minimum', 'Minimumvoorraad', input('minimum', product.minimum ?? 0, number)) +
    field('targetStock', 'Aanvullen tot (optioneel)', input('targetStock', product.targetStock ?? '', 'type="number" min="0" step="1" max="100000"')) +
    field('description', 'Omschrijving', textarea('description', product.description, 'rows="2" maxlength="1200"')) + '</div>';
}

export function adjustForm(state, productId) {
  return '<div class="form-grid">' +
    field('productId', 'Artikel', select('productId', options(state.products, productId, productName))) +
    field('locationId', 'Locatie', select('locationId', locationOptions(state, state.products.find(row => row.id === productId)?.locationId))) +
    field('delta', 'Wijziging in verpakkingen (+ of −)', input('delta', '', 'type="number" min="-100000" max="100000" step="1" required')) +
    field('reason', 'Reden', input('reason', '', 'required maxlength="180"')) + '</div>';
}
