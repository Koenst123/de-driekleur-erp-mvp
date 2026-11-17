export class BusinessError extends Error {}

export function requireRule(condition, message) {
  if (!condition) throw new BusinessError(message);
}

export function get(records, id, label) {
  const record = records.find(item => item.id === id);
  requireRule(record, label + ' bestaat niet meer.');
  return record;
}

export function quantity(value, allowZero = false) {
  requireRule(Number.isInteger(value) && value >= (allowZero ? 0 : 1) && value <= 100000,
    'Voer een geldig geheel aantal verpakkingen in.');
  return value;
}

export function balance(state, productId, locationId) {
  return state.balances.find(row => row.productId === productId && row.locationId === locationId)
    ?? { productId, locationId, physical: 0, reserved: 0 };
}

export function stockOf(state, productId, warehouseId) {
  const locations = new Set(state.locations.filter(location => !warehouseId || location.warehouseId === warehouseId).map(location => location.id));
  return state.balances.reduce((total, row) => {
    if (row.productId === productId && locations.has(row.locationId)) {
      total.physical += row.physical;
      total.reserved += row.reserved;
      total.available += row.physical - row.reserved;
    }
    return total;
  }, { physical: 0, reserved: 0, available: 0 });
}

export function mutableBalance(state, productId, locationId) {
  const row = balance(state, productId, locationId);
  if (!state.balances.includes(row)) state.balances.push(row);
  return row;
}

export function movement(state, { productId, locationId, delta, type, reference, date, reason = '' }) {
  const row = mutableBalance(state, productId, locationId);
  requireRule(row.physical + delta >= row.reserved, 'De wijziging zou gereserveerde voorraad aantasten.');
  requireRule(Number.isSafeInteger(row.physical + delta), 'De voorraad overschrijdt het ondersteunde bereik.');
  row.physical += delta;
  state.movements.push({ id: 'M-' + ++state.counters.movement, productId, locationId, delta, type, reference, date, reason });
}
