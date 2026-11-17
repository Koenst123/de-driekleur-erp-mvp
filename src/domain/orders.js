import { balance, get, movement, mutableBalance, quantity, requireRule, stockOf } from './stock.js';

export function displayNumber(state, type, prefix, date) {
  return prefix + '-' + date.slice(0, 4) + '-' + String(++state.counters[type]).padStart(4, '0');
}

export function totals(lines) {
  return lines.reduce((summary, line) => {
    const net = line.quantity * line.price;
    const tax = Number((BigInt(net) * BigInt(line.taxRate) + 5000n) / 10000n);
    return { net: summary.net + net, tax: summary.tax + tax, gross: summary.gross + net + tax };
  }, { net: 0, tax: 0, gross: 0 });
}

function checkedLines(state, lines) {
  requireRule(Array.isArray(lines) && lines.length > 0 && lines.length <= 100, 'Voeg één tot honderd artikelregels toe.');
  requireRule(new Set(lines.map(line => line.productId)).size === lines.length, 'Voeg ieder artikel één keer toe.');
  return lines.map(line => ({
    product: get(state.products, line.productId, 'Artikel'),
    quantity: quantity(line.quantity),
  }));
}

export function priceSaleLines(state, customer, lines) {
  return checkedLines(state, lines).map(({ product, quantity }) => ({
    productId: product.id, sku: product.sku, name: product.name, packaging: product.packaging,
    quantity, price: customer.prices[product.id] ?? product.salePrice, taxRate: product.taxRate,
  }));
}

export function saveSale(state, input, date) {
  const customer = get(state.customers, input.customerId, 'Klant');
  get(state.warehouses, input.warehouseId, 'Magazijn');
  const lines = priceSaleLines(state, customer, input.lines);
  if (input.id) {
    const order = get(state.sales, input.id, 'Order');
    requireRule(order.status === 'concept', 'Alleen een conceptorder kan worden gewijzigd.');
    requireRule(!order.quotationId, 'Deze order bevat de afspraken uit een geaccepteerde offerte.');
    Object.assign(order, { customerId: customer.id, warehouseId: input.warehouseId, lines });
    return order.id;
  }
  const id = displayNumber(state, 'sale', 'SO', date);
  state.sales.push({ id, customerId: customer.id, warehouseId: input.warehouseId, date, status: 'concept', lines });
  return id;
}

export function confirmSale(state, { id }, date) {
  const order = get(state.sales, id, 'Order');
  if (order.status === 'bevestigd' || order.status === 'gepikt' || order.status === 'verzonden') return 'P-' + id;
  requireRule(order.status === 'concept', 'Alleen een conceptorder kan worden bevestigd.');
  const customer = get(state.customers, order.customerId, 'Klant');
  const lines = order.quotationId ? order.lines : priceSaleLines(state, customer, order.lines);
  const shortage = lines.filter(line => stockOf(state, line.productId, order.warehouseId).available < line.quantity);
  requireRule(shortage.length === 0, 'Onvoldoende voorraad voor ' + shortage.map(line => {
    const available = stockOf(state, line.productId, order.warehouseId).available;
    return line.sku + ' (' + available + ' van ' + line.quantity + ' beschikbaar)';
  }).join(', ') + '.');

  const allocations = [];
  for (const line of lines) {
    const product = get(state.products, line.productId, 'Artikel');
    const locations = state.locations.filter(location => location.warehouseId === order.warehouseId)
      .sort((a, b) => Number(b.id === product.locationId) - Number(a.id === product.locationId) || a.code.localeCompare(b.code));
    let remaining = line.quantity;
    for (const location of locations) {
      const row = balance(state, product.id, location.id);
      const amount = Math.min(remaining, row.physical - row.reserved);
      if (amount === 0) continue;
      row.reserved += amount;
      allocations.push({ id: product.id + '@' + location.id, productId: product.id, locationId: location.id, quantity: amount, picked: 0 });
      remaining -= amount;
      if (!remaining) break;
    }
  }
  const pickId = 'P-' + id;
  state.picks.push({ id: pickId, orderId: id, date, status: 'open', lines: allocations });
  Object.assign(order, { status: 'bevestigd', lines, confirmedAt: date });
  return pickId;
}

export function cancelSale(state, { id }, date) {
  const order = get(state.sales, id, 'Order');
  if (order.status === 'geannuleerd') return id;
  requireRule(order.status !== 'verzonden', 'Een verzonden order kan niet worden geannuleerd.');
  const pick = state.picks.find(item => item.orderId === id);
  if (pick) {
    for (const line of pick.lines) mutableBalance(state, line.productId, line.locationId).reserved -= line.quantity;
    pick.status = 'geannuleerd';
  }
  Object.assign(order, { status: 'geannuleerd', cancelledAt: date });
  return id;
}

export function recordPick(state, { id, lineId, amount, barcode, expectedPicked }) {
  const pick = get(state.picks, id, 'Pickopdracht');
  requireRule(pick.status === 'open', 'Deze pickopdracht is gesloten.');
  const line = get(pick.lines, lineId, 'Pickregel');
  const product = get(state.products, line.productId, 'Artikel');
  requireRule(String(barcode).trim() === product.barcode, 'Onjuiste barcode voor ' + product.sku + '.');
  requireRule(line.picked === expectedPicked, 'De pickregel is gewijzigd. Controleer het actuele aantal.');
  quantity(amount);
  requireRule(line.picked + amount <= line.quantity, 'Dit aantal overschrijdt de openstaande pickhoeveelheid.');
  line.picked += amount;
  return id;
}

export function finishPick(state, { id }, date) {
  const pick = get(state.picks, id, 'Pickopdracht');
  if (pick.status === 'gepakt' || pick.status === 'verzonden') return id;
  requireRule(pick.status === 'open' && pick.lines.every(line => line.picked === line.quantity), 'Verzamel eerst alle verpakkingen.');
  Object.assign(pick, { status: 'gepakt', pickedAt: date });
  get(state.sales, pick.orderId, 'Order').status = 'gepikt';
  return id;
}

export function shipSale(state, { id }, date) {
  const order = get(state.sales, id, 'Order');
  if (order.status === 'verzonden') return id;
  requireRule(order.status === 'gepikt', 'Rond eerst de pickopdracht af.');
  const pick = get(state.picks, 'P-' + id, 'Pickopdracht');
  for (const line of pick.lines) {
    const row = mutableBalance(state, line.productId, line.locationId);
    requireRule(row.reserved >= line.quantity, 'De reservering is niet beschikbaar.');
    row.reserved -= line.quantity;
    movement(state, { ...line, delta: -line.quantity, type: 'Verzending', reference: id, date });
  }
  Object.assign(order, { status: 'verzonden', shippedAt: date });
  pick.status = 'verzonden';
  return id;
}

export function invoiceSale(state, { id }, date) {
  const order = get(state.sales, id, 'Order');
  requireRule(order.status === 'verzonden', 'Verzend de order vóór het maken van een factuurconcept.');
  const existing = state.invoices.find(invoice => invoice.orderId === id);
  if (existing) return existing.id;
  const invoiceId = displayNumber(state, 'invoice', 'FC', date);
  state.invoices.push({ id: invoiceId, orderId: id, customerId: order.customerId, date, lines: structuredClone(order.lines) });
  return invoiceId;
}

export function savePurchase(state, input, date) {
  const supplier = get(state.suppliers, input.supplierId, 'Leverancier');
  get(state.warehouses, input.warehouseId, 'Magazijn');
  const lines = checkedLines(state, input.lines).map(({ product, quantity }) => {
    requireRule(product.supplierId === supplier.id, product.sku + ' hoort bij een andere leverancier.');
    return { id: product.id, productId: product.id, name: product.name, quantity, received: 0, price: product.purchasePrice };
  });
  if (input.id) {
    const order = get(state.purchases, input.id, 'Inkooporder');
    requireRule(order.status === 'concept', 'Alleen een inkoopconcept kan worden gewijzigd.');
    Object.assign(order, { supplierId: supplier.id, warehouseId: input.warehouseId, lines });
    return order.id;
  }
  const id = displayNumber(state, 'purchase', 'PO', date);
  state.purchases.push({ id, supplierId: supplier.id, warehouseId: input.warehouseId, date, status: 'concept', lines });
  return id;
}

export function confirmPurchase(state, { id }) {
  const order = get(state.purchases, id, 'Inkooporder');
  if (order.status === 'concept') order.status = 'besteld';
  return id;
}

export function receivePurchase(state, { id, lines }, date) {
  const order = get(state.purchases, id, 'Inkooporder');
  requireRule(['besteld', 'gedeeltelijk ontvangen'].includes(order.status), 'Deze inkooporder staat niet open voor ontvangst.');
  requireRule(lines.length > 0 && new Set(lines.map(line => line.lineId)).size === lines.length, 'Voer per regel één ontvangst in.');
  const delivery = lines.map(input => {
    const line = get(order.lines, input.lineId, 'Inkoopregel');
    const location = get(state.locations, input.locationId, 'Locatie');
    requireRule(location.warehouseId === order.warehouseId, 'Kies een locatie in het magazijn van deze inkooporder.');
    quantity(input.amount);
    requireRule(line.received === input.expectedReceived, 'De ontvangst is gewijzigd. Controleer het actuele aantal.');
    requireRule(line.received + input.amount <= line.quantity, 'De ontvangst overschrijdt het openstaande aantal.');
    return { line, locationId: location.id, amount: input.amount };
  });
  const receiptId = displayNumber(state, 'receipt', 'ON', date);
  for (const { line, locationId, amount } of delivery) {
    movement(state, { productId: line.productId, locationId, delta: amount, type: 'Ontvangst', reference: id + ' / ' + receiptId, date });
    line.received += amount;
  }
  state.receipts.push({ id: receiptId, orderId: id, date, lines: delivery.map(({ line, locationId, amount }) => ({ productId: line.productId, locationId, amount })) });
  order.status = order.lines.every(line => line.received === line.quantity) ? 'ontvangen' : 'gedeeltelijk ontvangen';
  return receiptId;
}
