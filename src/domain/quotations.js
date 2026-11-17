import { displayNumber, priceSaleLines, saveSale } from './orders.js';
import { get, requireRule } from './stock.js';

const localDate = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Amsterdam', year: 'numeric', month: '2-digit', day: '2-digit' });
export const quotationDay = date => localDate.format(new Date(date));

export function saveQuotation(state, input, date) {
  const customer = get(state.customers, input.customerId, 'Klant');
  get(state.warehouses, input.warehouseId, 'Magazijn');
  requireRule(/^\d{4}-\d{2}-\d{2}$/.test(input.validUntil) &&
    new Date(input.validUntil).toJSON()?.slice(0, 10) === input.validUntil &&
    input.validUntil >= quotationDay(date), 'Kies een geldige datum vanaf vandaag.');
  const fields = {
    customerId: customer.id, warehouseId: input.warehouseId, validUntil: input.validUntil,
    reference: String(input.reference ?? '').trim().slice(0, 100),
    lines: priceSaleLines(state, customer, input.lines),
  };
  if (input.id) {
    const quote = get(state.quotations, input.id, 'Offerte');
    requireRule(quote.status === 'concept', 'Alleen een conceptofferte kan worden gewijzigd.');
    Object.assign(quote, fields);
    return quote.id;
  }
  const id = displayNumber(state, 'quotation', 'OF', date);
  state.quotations.push({ ...fields, id, date, status: 'concept' });
  return id;
}

export function issueQuotation(state, { id }, date) {
  const quote = get(state.quotations, id, 'Offerte');
  if (quote.status === 'uitgebracht') return id;
  requireRule(quote.status === 'concept', 'Alleen een conceptofferte kan worden uitgebracht.');
  requireRule(quote.validUntil >= quotationDay(date), 'De geldigheid is verlopen. Pas de datum aan.');
  Object.assign(quote, { status: 'uitgebracht', issuedAt: date });
  return id;
}

export function acceptQuotation(state, { id }, date) {
  const quote = get(state.quotations, id, 'Offerte');
  if (quote.status === 'omgezet') return quote.orderId;
  requireRule(quote.status === 'uitgebracht', 'Breng de offerte eerst uit.');
  requireRule(quote.validUntil >= quotationDay(date), 'De geldigheid is verlopen. Maak een nieuwe offerte.');
  const orderId = saveSale(state, quoteForSale(quote), date);
  const order = get(state.sales, orderId, 'Verkooporder');
  Object.assign(order, { lines: structuredClone(quote.lines), quotationId: id });
  Object.assign(quote, { status: 'omgezet', orderId, acceptedAt: date });
  return orderId;
}

function quoteForSale({ customerId, warehouseId, lines }) {
  return { customerId, warehouseId, lines };
}

export function declineQuotation(state, { id }, date) {
  const quote = get(state.quotations, id, 'Offerte');
  if (quote.status === 'afgewezen') return id;
  requireRule(quote.status === 'uitgebracht', 'Alleen een uitgebrachte offerte kan worden afgewezen.');
  Object.assign(quote, { status: 'afgewezen', declinedAt: date });
  return id;
}
