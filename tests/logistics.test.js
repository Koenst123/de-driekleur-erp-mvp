import { describe, expect, it } from 'vitest';
import { createSeed } from '../src/data/seed.js';
import { balance, stockOf } from '../src/domain/stock.js';
import { duplicateSale, receiveReturn, returnedQuantity, transferStock } from '../src/domain/logistics.js';
import { csvText, exportRows } from '../src/app/csv.js';

const date = '2026-11-17T10:00:00Z';
const productId = 'TEL-46-J20';

describe('Magazijnhandelingen', () => {
  it('verplaatst vrije aantallen met twee mutaties en behoudt totale voorraad', () => {
    const state = createSeed();
    const original = stockOf(state, productId);
    const input = { productId, sourceId: 'A-03-02', destinationId: 'B-03-02', amount: 4, expectedPhysical: 24, reason: 'Balanceren' };
    const id = transferStock(state, input, date);
    expect(balance(state, productId, 'A-03-02')).toMatchObject({ physical: 20, reserved: 0 });
    expect(balance(state, productId, 'B-03-02')).toMatchObject({ physical: 22, reserved: 0 });
    expect(stockOf(state, productId)).toEqual(original);
    expect(state.movements.slice(-2).map(row => [row.reference, row.delta])).toEqual([[id, -4], [id, 4]]);
    const after = structuredClone(state);
    expect(() => transferStock(state, input, date)).toThrow(/gewijzigd/);
    expect(state).toEqual(after);
  });

  it('wijst verplaatsing van reserveringen, dezelfde locatie en onbekende locaties af', () => {
    const state = createSeed();
    const input = { productId, sourceId: 'A-03-02', destinationId: 'B-03-02', amount: 4, expectedPhysical: 24, reason: 'Test' };
    balance(state, productId, input.sourceId).reserved = 23;
    const before = structuredClone(state);
    expect(() => transferStock(state, input, date)).toThrow(/vrije voorraad/);
    expect(() => transferStock(state, { ...input, destinationId: input.sourceId }, date)).toThrow(/verschillende/);
    expect(() => transferStock(state, { ...input, destinationId: 'X' }, date)).toThrow(/bestemmingslocatie/i);
    expect(state).toEqual(before);
  });

  it('ontvangt een deelretour met orderkoppeling en beschermt geleverde aantallen', () => {
    const state = createSeed();
    const order = state.sales.find(row => row.status === 'verzonden' && row.lines[0].quantity > 1);
    const line = order.lines[0];
    const locationId = order.warehouseId + '-01-01';
    const before = stockOf(state, line.productId);
    const input = { id: order.id, reason: 'Ongebruikte verpakking', lines: [
      { productId: line.productId, locationId, amount: 1, expectedReturned: 0 },
    ] };
    const id = receiveReturn(state, input, date);
    expect(returnedQuantity(state, order.id, line.productId)).toBe(1);
    expect(stockOf(state, line.productId).physical).toBe(before.physical + 1);
    expect(state.movements.at(-1)).toMatchObject({ reference: id + ' / ' + order.id, type: 'Klantretour', delta: 1 });
    const after = structuredClone(state);
    expect(() => receiveReturn(state, input, date)).toThrow(/gewijzigd/);
    expect(() => receiveReturn(state, { ...input, lines: [{ ...input.lines[0], amount: line.quantity, expectedReturned: 1 }] }, date))
      .toThrow(/geleverde aantal/);
    expect(state).toEqual(after);
    expect(state.sales.find(row => row.id === order.id).status).toBe('verzonden');
  });

  it('valideert alle retourregels voordat voorraad of tellers veranderen', () => {
    const state = createSeed();
    const order = state.sales.find(row => row.status === 'verzonden');
    const input = { id: order.id, reason: 'Test', lines: [
      { productId: order.lines[0].productId, locationId: order.warehouseId + '-01-01', amount: 1, expectedReturned: 0 },
      { productId: order.lines[1].productId, locationId: 'ONBEKEND', amount: 1, expectedReturned: 0 },
    ] };
    const before = structuredClone(state);
    expect(() => receiveReturn(state, input, date)).toThrow(/Retourlocatie/);
    expect(state).toEqual(before);
    const concept = state.sales.find(row => row.status === 'concept');
    expect(() => receiveReturn(state, { ...input, id: concept.id }, date)).toThrow(/geleverde artikelen/);
  });

  it('maakt een herhaalorder met actuele klantprijzen en zonder reservering', () => {
    const state = createSeed();
    const source = state.sales.find(row => row.status === 'verzonden');
    const customer = state.customers.find(row => row.id === source.customerId);
    customer.prices[source.lines[0].productId] = 12345;
    const balances = structuredClone(state.balances);
    const count = state.picks.length;
    const id = duplicateSale(state, { id: source.id }, date);
    const order = state.sales.find(row => row.id === id);
    expect(order).toMatchObject({ status: 'concept', sourceOrderId: source.id, customerId: source.customerId });
    expect(order.lines[0]).toMatchObject({ quantity: source.lines[0].quantity, price: 12345 });
    expect(state.balances).toEqual(balances);
    expect(state.picks).toHaveLength(count);
  });
});

describe('CSV-export', () => {
  it('escapeert scheidingstekens, aanhalingstekens, nieuwe regels en formule-invoer', () => {
    const text = csvText([['Bedrijf', 'Notitie'], ['A;B', '"test"\nregel'], ['=1+2', ' @SUM(A1)']]);
    expect(text).toBe('\uFEFF"Bedrijf";"Notitie"\r\n"A;B";"""test""\nregel"\r\n"\'=1+2";"\' @SUM(A1)"\r\n');
  });

  it('levert de opgeslagen overzichten met kolomkoppen', () => {
    const state = createSeed();
    expect(exportRows(state, 'artikelen')).toHaveLength(state.products.length + 1);
    expect(exportRows(state, 'voorraad')).toHaveLength(state.balances.length + 1);
    expect(() => exportRows(state, '__proto__')).toThrow(/geen CSV-export/);
  });
});
