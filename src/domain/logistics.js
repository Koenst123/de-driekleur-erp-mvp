import { balance, get, movement, quantity, requireRule } from './stock.js';
import { displayNumber, saveSale } from './orders.js';

export function transferStock(state, { productId, sourceId, destinationId, amount, reason, expectedPhysical }, date) {
  get(state.products, productId, 'Artikel');
  get(state.locations, sourceId, 'Bronlocatie');
  get(state.locations, destinationId, 'Bestemmingslocatie');
  requireRule(sourceId !== destinationId, 'Kies twee verschillende locaties.');
  quantity(amount);
  const explanation = String(reason ?? '').trim().slice(0, 180);
  requireRule(explanation, 'Vul de reden voor de verplaatsing in.');
  const source = balance(state, productId, sourceId);
  requireRule(source.physical === expectedPhysical, 'De bronvoorraad is gewijzigd. Controleer de actuele stand.');
  requireRule(source.physical - source.reserved >= amount, 'Er is onvoldoende vrije voorraad op de bronlocatie.');
  const destination = balance(state, productId, destinationId);
  requireRule(Number.isSafeInteger(destination.physical + amount), 'De bestemmingsvoorraad overschrijdt het ondersteunde bereik.');
  const id = displayNumber(state, 'transfer', 'MV', date);
  movement(state, { productId, locationId: sourceId, delta: -amount, type: 'Verplaatsing uit', reference: id, reason: explanation, date });
  movement(state, { productId, locationId: destinationId, delta: amount, type: 'Verplaatsing in', reference: id, reason: explanation, date });
  state.transfers.push({ id, productId, sourceId, destinationId, amount, reason: explanation, date });
  return id;
}

export function returnedQuantity(state, orderId, productId) {
  return state.returns.filter(row => row.orderId === orderId).flatMap(row => row.lines)
    .filter(line => line.productId === productId).reduce((sum, line) => sum + line.amount, 0);
}

export function receiveReturn(state, { id, lines, reason }, date) {
  const order = get(state.sales, id, 'Verkooporder');
  requireRule(order.status === 'verzonden', 'Alleen geleverde artikelen kunnen worden geretourneerd.');
  const explanation = String(reason ?? '').trim().slice(0, 180);
  requireRule(explanation, 'Vul een retourreden in.');
  requireRule(Array.isArray(lines) && lines.length > 0 &&
    new Set(lines.map(line => line.productId)).size === lines.length, 'Voer ieder retourartikel één keer in.');
  const checked = lines.map(input => {
    const line = order.lines.find(row => row.productId === input.productId);
    requireRule(line, 'Het artikel staat niet op deze verkooporder.');
    const location = get(state.locations, input.locationId, 'Retourlocatie');
    requireRule(location.warehouseId === order.warehouseId, 'Ontvang de retour in het magazijn van de verkooporder.');
    quantity(input.amount);
    const returned = returnedQuantity(state, id, line.productId);
    requireRule(returned === input.expectedReturned, 'Het retouraantal is gewijzigd. Controleer de actuele stand.');
    requireRule(returned + input.amount <= line.quantity, 'Het retouraantal overschrijdt het geleverde aantal.');
    const destination = balance(state, line.productId, location.id);
    requireRule(Number.isSafeInteger(destination.physical + input.amount), 'De voorraad overschrijdt het ondersteunde bereik.');
    return { productId: line.productId, locationId: location.id, amount: input.amount };
  });
  const returnId = displayNumber(state, 'return', 'RT', date);
  for (const line of checked) {
    movement(state, { ...line, delta: line.amount, type: 'Klantretour', reference: returnId + ' / ' + id, reason: explanation, date });
  }
  state.returns.push({ id: returnId, orderId: id, customerId: order.customerId, lines: checked, reason: explanation, date });
  return returnId;
}

export function duplicateSale(state, { id }, date) {
  const source = get(state.sales, id, 'Verkooporder');
  const orderId = saveSale(state, { customerId: source.customerId, warehouseId: source.warehouseId, lines: source.lines }, date);
  get(state.sales, orderId, 'Verkooporder').sourceOrderId = source.id;
  return orderId;
}
