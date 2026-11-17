import { totals } from '../domain/orders.js';
import { recentFirst } from '../domain/selectors.js';
import { quotationDay } from '../domain/quotations.js';
import { salesLines, saleTotals, orderEditor } from './orders.js';
import { esc, money, day, badge, button, table, panel, pageHead, link, definition, field, input } from './components.js';

const dateLabel = value => day(value + 'T12:00:00Z');

export function quotationsTable(state, quotations) {
  return table(['Offerte', 'Klant', 'Geldig t/m', 'Status', 'Excl. btw'], [...quotations].sort(recentFirst).map(quote => [
    link('offertes', quote.id, quote.id) + '<small class="cell-sub">' + esc(quote.reference) + '</small>',
    esc(state.customers.find(row => row.id === quote.customerId).name),
    dateLabel(quote.validUntil), badge(quote.status), money(totals(quote.lines).net),
  ]), 'Maak een offerte om prijzen en voorwaarden vast te leggen.');
}

export function quotationsPage(state, id) {
  const quote = state.quotations.find(item => item.id === id);
  if (!quote) return pageHead('Offertes', 'Leg klantafspraken vast en zet een geaccepteerde offerte om naar verkoop.',
    button('new-quotation', 'Nieuwe offerte', 'primary')) +
    panel('Offerteoverzicht', quotationsTable(state, state.quotations));
  const customer = state.customers.find(item => item.id === quote.customerId);
  const warehouse = state.warehouses.find(item => item.id === quote.warehouseId);
  const expired = quote.validUntil < quotationDay(new Date());
  let actions = button('print-quotation', 'Afdrukken / pdf');
  if (quote.status === 'concept') actions += button('edit-quotation', 'Concept wijzigen') + button('issue-quotation', 'Offerte uitbrengen', 'primary');
  if (quote.status === 'uitgebracht') actions += button('decline-quotation', 'Afwijzen', 'danger') +
    (expired ? '' : button('accept-quotation', 'Klantakkoord registreren', 'primary'));
  if (quote.orderId) actions += link('verkoop', quote.orderId, 'Open verkooporder', 'button primary');
  const docStatus = expired && quote.status === 'uitgebracht' ? 'verlopen' : quote.status;
  const info = definition([
    ['Klant', link('klanten', customer.id, customer.name)], ['Contactpersoon', esc(customer.contact || '—')],
    ['Geldig t/m', dateLabel(quote.validUntil)], ['Status', badge(docStatus)],
    ['Klantreferentie', esc(quote.reference || '—')], ['Magazijn', esc(warehouse.name)],
    ...(quote.issuedAt ? [['Uitgebracht', day(quote.issuedAt)]] : []),
    ...(quote.acceptedAt ? [['Klantakkoord vastgelegd', day(quote.acceptedAt)]] : []),
    ...(quote.orderId ? [['Verkooporder', link('verkoop', quote.orderId, quote.orderId)]] : []),
  ]);
  return pageHead(quote.id, customer.name + ' · Offerte', actions, link('offertes', '', '‹ Offertes', 'back')) +
    '<article class="print-document"><header class="print-heading"><strong>De Driekleur Business Suite</strong><h1>Offerte ' + esc(quote.id) +
    '</h1><p>Demonstratiedocument</p></header>' + panel('Gegevens', info) +
    panel('Artikelen en prijzen', salesLines(state, quote) + saleTotals(quote.lines)) +
    '<p class="quote-note">Demonstratie · Klantakkoord wordt lokaal geregistreerd.</p></article>';
}

export function quotationEditor(state, quote) {
  const defaultDate = quotationDay(new Date(Date.now() + 14 * 86400000));
  return '<div class="form-grid">' +
    field('validUntil', 'Geldig t/m', input('validUntil', quote.validUntil ?? defaultDate, 'type="date" required')) +
    field('reference', 'Klantreferentie', input('reference', quote.reference, 'maxlength="100"')) + '</div>' +
    orderEditor(state, true, quote);
}
