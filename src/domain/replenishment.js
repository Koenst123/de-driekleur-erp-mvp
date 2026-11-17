import { savePurchase } from './orders.js';
import { get, requireRule, stockByProduct } from './stock.js';

export const defaultTarget = minimum => Math.min(minimum * 2, 100000);

export function replenishment(state, warehouseId) {
  const locations = new Set(state.locations.filter(row => row.warehouseId === warehouseId).map(row => row.id));
  const inbound = new Map();
  const drafts = new Map();
  for (const order of state.purchases) {
    if (order.warehouseId !== warehouseId || order.status === 'ontvangen') continue;
    for (const line of order.lines) {
      if (order.status === 'concept') {
        if (!drafts.has(line.productId)) drafts.set(line.productId, order.id);
        continue;
      }
      inbound.set(line.productId, (inbound.get(line.productId) ?? 0) + line.quantity - line.received);
    }
  }
  const totals = stockByProduct(state, warehouseId);
  return state.products.filter(product => locations.has(product.locationId)).map(product => {
    const { physical = 0, reserved = 0, available = 0 } = totals.get(product.id) ?? {};
    const incoming = inbound.get(product.id) ?? 0;
    const projected = available + incoming;
    const target = product.targetStock ?? defaultTarget(product.minimum);
    return { product, warehouseId, physical, reserved, available, incoming, projected, target,
      shortage: projected < product.minimum,
      recommendation: projected < product.minimum ? target - projected : 0,
      draftId: drafts.get(product.id),
    };
  });
}

export function createReplenishmentDraft(state, { productId, warehouseId }, date) {
  get(state.warehouses, warehouseId, 'Magazijn');
  const row = replenishment(state, warehouseId).find(item => item.product.id === productId);
  requireRule(row, 'Dit is niet het voorkeursmagazijn voor het artikel.');
  if (row.draftId) return row.draftId;
  requireRule(row.shortage, 'De verwachte voorraad ligt inmiddels op of boven minimum.');
  return savePurchase(state, {
    supplierId: row.product.supplierId, warehouseId, lines: [{ productId, quantity: row.recommendation }],
  }, date);
}
