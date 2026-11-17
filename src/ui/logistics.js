import { balance } from '../domain/stock.js';
import { returnedQuantity } from '../domain/logistics.js';
import { recentFirst } from '../domain/selectors.js';
import { locationOptions } from './catalog.js';
import { esc, num, day, link, button, input, field, select, options, table, panel, pageHead } from './components.js';

export function transfersPage(state) {
  return pageHead('Verplaatsingen', 'Verplaats vrije voorraad binnen of tussen de magazijnen.',
    button('new-transfer', 'Voorraad verplaatsen', 'primary')) +
    panel('Magazijnverplaatsingen', table(['Verplaatsing', 'Artikel', 'Van', 'Naar', 'Aantal', 'Reden'], [...state.transfers].sort(recentFirst).map(row => {
      const product = state.products.find(item => item.id === row.productId);
      return [esc(row.id) + '<small class="cell-sub">' + day(row.date) + '</small>',
        link('artikelen', product.id, product.name), esc(row.sourceId), esc(row.destinationId), num(row.amount), esc(row.reason)];
    }), 'Er zijn nog geen verplaatsingen. Kies Voorraad verplaatsen om een boeking te testen.'));
}

export function transferForm(state, productId) {
  const products = state.products.filter(product => !productId || product.id === productId);
  const active = products.find(item => item.id === productId) ?? products[0];
  return '<div class="form-grid">' +
    field('productId', 'Artikel', select('productId', options(products, active.id, item => item.sku + ' · ' + item.name))) +
    field('sourceId', 'Van locatie', select('sourceId', locationOptions(state, active.locationId))) +
    field('destinationId', 'Naar locatie', select('destinationId', locationOptions(state, 'B' + active.locationId.slice(1)))) +
    field('amount', 'Aantal verpakkingen', input('amount', 1, 'type="number" min="1" max="100000" step="1" required')) +
    field('reason', 'Reden', input('reason', '', 'required maxlength="180"')) + '</div><p class="dialog-copy" data-transfer-stock aria-live="polite"></p>';
}

export function updateTransferForm(state, form) {
  const productId = form.elements.productId.value;
  const source = balance(state, productId, form.elements.sourceId.value);
  form.querySelector('[data-transfer-stock]').textContent =
    'Bronvoorraad · ' + num(source.physical) + ' fysiek, ' + num(source.reserved) + ' gereserveerd, ' +
    num(source.physical - source.reserved) + ' beschikbaar.';
  return source.physical;
}

export function returnsPanel(state, order) {
  const rows = state.returns.filter(row => row.orderId === order.id).sort(recentFirst);
  return panel('Retourhistorie', table(['Retour', 'Datum', 'Artikelen en aantallen', 'Reden'], rows.map(row => [
    esc(row.id), day(row.date),
    row.lines.map(line => esc(state.products.find(item => item.id === line.productId).sku) + ' × ' + num(line.amount) +
      ' · ' + esc(line.locationId)).join('<br>'), esc(row.reason),
  ]), 'Voor deze levering zijn nog geen retouren geregistreerd.'));
}

export function returnForm(state, order) {
  return '<p class="dialog-copy">Ontvang verkoopbare verpakkingen terug in voorraad. Financiële afhandeling en een eventuele creditnota volgen afzonderlijk.</p>' +
    field('reason', 'Retourreden', input('reason', '', 'required maxlength="180"')) +
    order.lines.map(line => {
      const returned = returnedQuantity(state, order.id, line.productId);
      const remaining = line.quantity - returned;
      if (!remaining) return '';
      return '<fieldset class="order-line"><legend>' + esc(line.sku) + ' · ' + num(remaining) + ' retour mogelijk</legend>' +
        field('amount', 'Retouraantal', input('amount', 0, 'type="number" min="0" max="' + remaining + '" step="1" required')) +
        field('locationId', 'Retourlocatie', select('locationId', locationOptions(state, '', order.warehouseId))) +
        input('productId', line.productId, 'type="hidden"') + input('expectedReturned', returned, 'type="hidden"') + '</fieldset>';
    }).join('');
}

export function readReturn(form) {
  const data = new FormData(form);
  return { reason: data.get('reason'), lines: data.getAll('productId').map((productId, index) => ({
    productId, amount: Number(data.getAll('amount')[index]), locationId: data.getAll('locationId')[index],
    expectedReturned: Number(data.getAll('expectedReturned')[index]),
  })).filter(line => line.amount > 0) };
}
