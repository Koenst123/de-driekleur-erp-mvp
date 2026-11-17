import { totals } from '../domain/orders.js';
import { stockOf } from '../domain/stock.js';
import { recentFirst } from '../domain/selectors.js';
import { locationOptions } from './catalog.js';
import { esc, num, money, day, badge, button, table, panel, pageHead, link, definition, field, input, option, options, select } from './components.js';

const articleLabel = row => row.sku + ' · ' + row.name + ' · ' + row.content + ' ' + row.unit;
const whole = 'type="number" min="1" max="100000" step="1" required';

export function saleTotals(lines) {
  const sum = totals(lines);
  return '<dl class="totals"><div><dt>Subtotaal excl. btw</dt><dd>' + money(sum.net) +
    '</dd></div><div><dt>Btw</dt><dd>' + money(sum.tax) +
    '</dd></div><div><dt>Totaal incl. btw</dt><dd>' + money(sum.gross) + '</dd></div></dl>';
}

export function salesLines(state, order, availability = false) {
  return table(['Artikel', 'Aantal', 'Prijs per verpakking', 'Btw', 'Subtotaal', ...(availability ? ['Beschikbaar'] : [])], order.lines.map(line => [
    link('artikelen', line.productId, line.name) + '<small class="cell-sub">' + esc(line.sku + ' · ' + line.packaging) + '</small>',
    num(line.quantity), money(line.price), num(line.taxRate / 100) + '%', money(line.quantity * line.price),
    ...(availability ? [num(stockOf(state, line.productId, order.warehouseId).available)] : []),
  ]));
}

export function salesPage(state, id, filters) {
  const order = state.sales.find(row => row.id === id);
  if (!order) return pageHead('Verkoop', 'Verkooporders van concept tot verzending.', button('new-sale', 'Nieuwe verkooporder', 'primary')) +
    orderFilters(filters, ['concept', 'bevestigd', 'gepikt', 'verzonden', 'geannuleerd']) +
    '<div id="filter-results">' + orderResults(state, filters, 'sales') + '</div>';
  const customer = state.customers.find(row => row.id === order.customerId);
  const warehouse = state.warehouses.find(row => row.id === order.warehouseId);
  const pick = state.picks.find(row => row.orderId === id);
  const invoice = state.invoices.find(row => row.orderId === id);
  let actions = '';
  if (order.status === 'concept') actions = (order.quotationId ? '' : button('edit-sale', 'Concept wijzigen')) + button('confirm-sale', 'Order bevestigen', 'primary');
  if (order.status === 'bevestigd') actions = link('magazijn', pick.id, 'Open pickopdracht', 'button primary');
  if (order.status === 'gepikt') actions = link('magazijn', pick.id, 'Open pickopdracht', 'button secondary') + button('ship-sale', 'Verzending bevestigen', 'primary');
  if (order.status === 'verzonden') actions = invoice ? link('financieel', invoice.id, 'Bekijk factuurconcept', 'button primary') :
    button('invoice-sale', 'Factuurconcept genereren', 'primary');
  if (['concept', 'bevestigd', 'gepikt'].includes(order.status)) actions += button('cancel-sale', 'Order annuleren', 'danger');
  return pageHead(id, customer.name + ' · Verkooporder', actions, link('verkoop', '', '‹ Verkoop', 'back')) +
    panel('Ordergegevens', definition([['Klant', link('klanten', customer.id, customer.name)],
      ['Magazijn', esc(warehouse.name)], ['Aangemaakt', day(order.date)], ['Status', badge(order.status)],
      ...(order.quotationId ? [['Offerte', link('offertes', order.quotationId, order.quotationId)]] : [])])) +
    panel('Orderregels', salesLines(state, order, order.status === 'concept') + saleTotals(order.lines));
}

export function purchasesPage(state, id, filters) {
  const order = state.purchases.find(row => row.id === id);
  if (!order) return pageHead('Inkoop', 'Inkooporders en goederenontvangsten.',
    link('aanvullen', '', 'Voorraad aanvullen', 'button secondary') + button('new-purchase', 'Nieuwe inkooporder', 'primary')) +
    orderFilters(filters, ['concept', 'besteld', 'gedeeltelijk ontvangen', 'ontvangen']) +
    '<div id="filter-results">' + orderResults(state, filters, 'purchases') + '</div>';
  const supplier = state.suppliers.find(row => row.id === order.supplierId);
  const warehouse = state.warehouses.find(row => row.id === order.warehouseId);
  let actions = link('aanvullen', order.warehouseId, 'Voorraad aanvullen', 'button secondary');
  if (order.status === 'concept') actions += button('edit-purchase', 'Concept wijzigen') + button('confirm-purchase', 'Bestelling bevestigen', 'primary');
  if (['besteld', 'gedeeltelijk ontvangen'].includes(order.status)) actions += button('receive-purchase', 'Ontvangst registreren', 'primary');
  const receipts = state.receipts.filter(row => row.orderId === id);
  return pageHead(id, supplier.name + ' · Inkooporder', actions, link('inkoop', '', '‹ Inkoop', 'back')) +
    panel('Bestelgegevens', definition([['Leverancier', link('leveranciers', supplier.id, supplier.name)],
      ['Magazijn', esc(warehouse.name)], ['Aangemaakt', day(order.date)], ['Status', badge(order.status)]])) +
    panel('Inkoopregels', table(['Artikel', 'Besteld', 'Ontvangen', 'Openstaand', 'Inkoopprijs'], order.lines.map(line => [
      link('artikelen', line.productId, line.name) + '<small class="cell-sub">' + esc(state.products.find(row => row.id === line.productId).sku) + '</small>',
      num(line.quantity), num(line.received), num(line.quantity - line.received), money(line.price),
    ]))) +
    panel('Ontvangsthistorie', table(['Ontvangst', 'Datum', 'Verpakkingen'], receipts.map(receipt => [
      esc(receipt.id), day(receipt.date), num(receipt.lines.reduce((sum, row) => sum + row.amount, 0)),
    ]), 'Er zijn nog geen ontvangsten.'));
}

function orderFilters(filters, statuses) {
  return '<form class="filters" data-filter>' +
    field('search', 'Zoeken', input('search', filters.search, 'type="search" placeholder="Ordernummer of relatie"')) +
    field('status', 'Status', select('status', option('', 'Alle statussen', filters.status) + statuses.map(item =>
      option(item, item[0].toUpperCase() + item.slice(1), filters.status)).join(''))) + '</form>';
}

export function orderResults(state, filters, kind) {
  const sale = kind === 'sales';
  const records = sale ? state.customers : state.suppliers;
  const page = sale ? 'verkoop' : 'inkoop';
  const q = (filters.search ?? '').toLowerCase().trim();
  const rows = state[kind].filter(order => {
    const partner = records.find(row => row.id === (sale ? order.customerId : order.supplierId));
    return (!filters.status || order.status === filters.status) && [order.id, partner.name].some(value => value.toLowerCase().includes(q));
  }).sort(recentFirst);
  return panel(sale ? 'Verkooporders' : 'Inkooporders', table(['Order', sale ? 'Klant' : 'Leverancier', 'Magazijn', 'Status', 'Totaal excl. btw'], rows.map(order => [
    link(page, order.id, order.id) + '<small class="cell-sub">' + day(order.date) + '</small>',
    esc(records.find(row => row.id === (sale ? order.customerId : order.supplierId)).name),
    esc(order.warehouseId), badge(order.status), money(order.lines.reduce((sum, line) => sum + line.quantity * line.price, 0)),
  ])), '<span class="count">' + rows.length + ' orders</span>');
}

function editorLines(state, sale, partnerId, rows) {
  const products = state.products.filter(row => sale || row.supplierId === partnerId);
  return rows.map((row, index) =>
    '<fieldset class="order-line"><legend>Artikelregel ' + (index + 1) + '</legend>' +
    field('productId', 'Artikel', select('productId', option('', 'Kies een artikel', row.productId) +
      options(products, row.productId, articleLabel), 'required')) +
    field('quantity', 'Aantal', input('quantity', row.quantity, whole)) +
    button('remove-line', 'Verwijder', 'quiet', 'data-index="' + index + '" aria-label="Verwijder artikelregel ' + (index + 1) + '"') +
    '</fieldset>').join('');
}

export function orderEditor(state, sale, order = {}) {
  const partners = sale ? state.customers : state.suppliers;
  const partnerId = (sale ? order.customerId : order.supplierId) ?? '';
  const rows = order.lines ?? [{ productId: '', quantity: 1 }];
  return '<div class="form-grid">' +
    field('partnerId', sale ? 'Klant' : 'Leverancier', select('partnerId', option('', 'Maak een keuze', partnerId) + options(partners, partnerId), 'required')) +
    field('warehouseId', 'Magazijn', select('warehouseId', options(state.warehouses, order.warehouseId ?? 'A'), 'required')) + '</div>' +
    '<div data-order-lines>' + editorLines(state, sale, partnerId, rows) + '</div>' +
    button('add-line', 'Artikelregel toevoegen') + '<div data-order-summary aria-live="polite"></div>';
}

export function readOrder(form) {
  const data = new FormData(form);
  return {
    partnerId: data.get('partnerId'), warehouseId: data.get('warehouseId'),
    lines: data.getAll('productId').map((productId, index) => ({ productId, quantity: Number(data.getAll('quantity')[index]) })),
  };
}

export function updateEditor(state, form, mode, action, index) {
  const sale = mode !== 'purchase';
  const input = readOrder(form);
  const result = form.querySelector('[data-order-summary]');
  if (action === 'add-line' || action === 'remove-line' || action === 'partner' && !sale) {
    if (action === 'add-line') input.lines.push({ productId: '', quantity: 1 });
    if (action === 'remove-line') input.lines.splice(index, 1);
    if (action === 'partner') input.lines = input.lines.map(row =>
      state.products.some(item => item.id === row.productId && item.supplierId === input.partnerId) ? row : { ...row, productId: '' });
    if (!input.lines.length) input.lines.push({ productId: '', quantity: 1 });
    form.querySelector('[data-order-lines]').innerHTML = editorLines(state, sale, input.partnerId, input.lines);
    if (action === 'add-line') [...form.querySelectorAll('[name="productId"]')].at(-1)?.focus();
    if (action === 'remove-line') (form.querySelectorAll('[name="productId"]')[index] ?? form.querySelector('[data-action="add-line"]')).focus();
  }
  if (!sale) return;
  const customer = state.customers.find(row => row.id === input.partnerId);
  const lines = readOrder(form).lines.flatMap(line => {
    const item = state.products.find(row => row.id === line.productId);
    return item && Number.isInteger(line.quantity) && line.quantity > 0 && line.quantity <= 100000 ?
      [{ ...line, sku: item.sku, price: customer?.prices[item.id] ?? item.salePrice, taxRate: item.taxRate }] : [];
  });
  const shortages = mode === 'sale' ? lines.filter(line => stockOf(state, line.productId, input.warehouseId).available < line.quantity) : [];
  result.innerHTML = (shortages.length ? '<p class="inline-warning">Onvoldoende voorraad voor ' +
    esc(shortages.map(line => line.sku).join(', ')) + '.</p>' : '') + saleTotals(lines);
}

export function receiptForm(state, order) {
  return order.lines.filter(line => line.received < line.quantity).map(line => {
    const product = state.products.find(row => row.id === line.productId);
    const pending = line.quantity - line.received;
    return '<fieldset class="order-line"><legend>' + esc(product.sku + ' · ' + product.name) + '</legend>' +
      field('amount', 'Ontvangstaantal · ' + pending + ' open', input('amount', 0, 'type="number" min="0" max="' + pending + '" step="1" required')) +
      field('location', 'Ontvangstlocatie', select('location', locationOptions(state, product.locationId, order.warehouseId))) +
      input('lineId', line.id, 'type="hidden"') + input('expected', line.received, 'type="hidden"') + '</fieldset>';
  }).join('');
}

export function readReceipt(form) {
  const data = new FormData(form);
  return data.getAll('lineId').map((lineId, index) => ({
    lineId, locationId: data.getAll('location')[index], amount: Number(data.getAll('amount')[index]),
    expectedReceived: Number(data.getAll('expected')[index]),
  })).filter(line => line.amount > 0);
}
