import { describe, expect, it, beforeEach } from 'vitest';
import { createSeed } from '../src/data/seed.js';
import { stockOf } from '../src/domain/stock.js';
import { totals, saveSale, confirmSale, cancelSale, recordPick, finishPick, shipSale, invoiceSale, savePurchase, confirmPurchase, receivePurchase } from '../src/domain/orders.js';
import { adjustStock, savePartner, saveProduct } from '../src/domain/catalog.js';
import { dashboard } from '../src/domain/selectors.js';

const date = '2026-11-17T09:00:00.000Z';
const oil = 'TEL-46-J20';
const grease = 'SKF-LGMT2-E18';
const shortage = 'AWS-46-J20';
const customerId = 'K-1';
const warehouseId = 'A';
let state;
beforeEach(() => { state = createSeed(); });

const line = (productId, quantity) => ({ productId, quantity });
const sale = (lines = [line(oil, 12), line(grease, 6)]) => saveSale(state, { customerId, warehouseId, lines }, date);
const stock = productId => stockOf(state, productId, 'A');
const scan = (pickId, row, amount, barcode = 'DEMO-' + row.productId, expectedPicked = row.picked) =>
  recordPick(state, { id: pickId, lineId: row.id, amount, barcode, expectedPicked });

describe('Verkoop en magazijn', () => {
  it('berekent de afgesproken prijs en btw per regel in eurocenten', () => {
    const id = sale();
    const order = state.sales.find(row => row.id === id);
    expect(order.lines[0].price).toBe(8000);
    expect(totals(order.lines)).toEqual({ net: 126000, tax: 26460, gross: 152460 });
    expect(totals([{ quantity: 1, price: 5, taxRate: 2100 }, { quantity: 1, price: 5, taxRate: 2100 }]).tax).toBe(2);
  });

  it('reserveert eenmaal per bevestiging, zonder fysieke voorraad te wijzigen', () => {
    const id = sale();
    const pickId = confirmSale(state, { id }, date);
    expect(confirmSale(state, { id }, date)).toBe(pickId);
    expect(state.picks.filter(row => row.orderId === id)).toHaveLength(1);
    expect(stock(oil)).toEqual({ physical: 24, reserved: 12, available: 12 });
    expect(stock(grease)).toEqual({ physical: 12, reserved: 6, available: 6 });
  });

  it('geeft een onvolledige reservering nooit vrij als gedeeltelijk bevestigde order', () => {
    const id = sale([line(oil, 12), line(shortage, 8)]);
    const before = structuredClone(state);
    expect(() => confirmSale(state, { id }, date)).toThrow(/Onvoldoende voorraad/);
    expect(state).toEqual(before);
  });

  it('geeft reserveringen ook na deelpicken één keer vrij bij annulering', () => {
    const id = sale();
    const pickId = confirmSale(state, { id }, date);
    const pick = state.picks.find(row => row.id === pickId);
    scan(pickId, pick.lines[0], 3);
    cancelSale(state, { id }, date);
    cancelSale(state, { id }, date);
    expect(stock(oil)).toEqual({ physical: 24, reserved: 0, available: 24 });
    expect(stock(grease)).toEqual({ physical: 12, reserved: 0, available: 12 });
    expect(pick.status).toBe('geannuleerd');
    expect(() => confirmSale(state, { id }, date)).toThrow();
  });

  it('valideert de exacte barcode, deelpicks en de openstaande hoeveelheid', () => {
    const id = sale();
    const pickId = confirmSale(state, { id }, date);
    const [first] = state.picks.find(row => row.id === pickId).lines;
    expect(() => scan(pickId, first, 3, 'DEMO-TEL-46')).toThrow(/Onjuiste barcode/);
    expect(first.picked).toBe(0);
    scan(pickId, first, 3);
    expect(first.picked).toBe(3);
    expect(() => scan(pickId, first, 3, undefined, 0)).toThrow(/gewijzigd/);
    expect(() => scan(pickId, first, 10)).toThrow(/overschrijdt/);
    expect(() => finishPick(state, { id: pickId }, date)).toThrow(/alle verpakkingen/);
    expect(stock(oil)).toEqual({ physical: 24, reserved: 12, available: 12 });
  });

  it('boekt één verzending af en maakt één factuurconcept uit vastgelegde prijzen', () => {
    const id = sale();
    expect(() => shipSale(state, { id }, date)).toThrow(/pickopdracht/);
    const pickId = confirmSale(state, { id }, date);
    const pick = state.picks.find(row => row.id === pickId);
    for (const row of pick.lines) scan(pickId, row, row.quantity);
    finishPick(state, { id: pickId }, date);
    expect(stock(oil)).toEqual({ physical: 24, reserved: 12, available: 12 });
    const oldRevenue = dashboard(state).revenue;
    shipSale(state, { id }, date);
    shipSale(state, { id }, date);
    expect(stock(oil)).toEqual({ physical: 12, reserved: 0, available: 12 });
    expect(stock(grease)).toEqual({ physical: 6, reserved: 0, available: 6 });
    expect(state.movements.filter(row => row.reference === id).map(row => row.delta)).toEqual([-12, -6]);
    expect(dashboard(state).revenue).toBe(oldRevenue + 126000);
    state.customers[0].prices[oil] = 9000;
    const invoiceId = invoiceSale(state, { id }, date);
    expect(invoiceSale(state, { id }, date)).toBe(invoiceId);
    expect(state.invoices.at(-1).lines[0].price).toBe(8000);
    expect(() => cancelSale(state, { id }, date)).toThrow(/verzonden/);
  });

  it('verdeelt de reservering eerst over voorkeurslocatie en sluit andere magazijnen uit', () => {
    adjustStock(state, { productId: oil, locationId: 'A-01-01', delta: 5, reason: 'Test' }, date);
    const id = sale([line(oil, 26)]);
    const pickId = confirmSale(state, { id }, date);
    expect(state.picks.find(row => row.id === pickId).lines.map(row => [row.locationId, row.quantity])).toEqual([['A-03-02', 24], ['A-01-01', 2]]);
    expect(stockOf(state, oil, 'B').reserved).toBe(0);
    expect(() => adjustStock(state, { productId: oil, locationId: 'A-03-02', delta: -1, reason: 'Test' }, date)).toThrow(/gereserveerde/);
  });
});

describe('Inkoop en catalogus', () => {
  it('ontvangt in delen, wijst overboeking af en heft het tekort op', () => {
    const id = sale([line(shortage, 8)]);
    const item = state.products.find(row => row.id === shortage);
    expect(stock(shortage).available).toBe(2);
    expect(() => confirmSale(state, { id }, date)).toThrow();
    const purchaseId = savePurchase(state, { supplierId: item.supplierId, warehouseId, lines: [line(shortage, 8)] }, date);
    confirmPurchase(state, { id: purchaseId });
    const purchase = state.purchases.find(row => row.id === purchaseId);
    const receive = (amount, expectedReceived, locationId = item.locationId) =>
      receivePurchase(state, { id: purchaseId, lines: [{ lineId: shortage, locationId, amount, expectedReceived }] }, date);
    expect(() => receive(2, 0, 'B-01-01')).toThrow(/magazijn/);
    receive(2, 0);
    expect(purchase.status).toBe('gedeeltelijk ontvangen');
    expect(stock(shortage).available).toBe(4);
    expect(() => confirmSale(state, { id }, date)).toThrow();
    expect(() => receive(2, 0)).toThrow(/gewijzigd/);
    expect(() => receive(7, 2)).toThrow(/openstaande/);
    receive(6, 2);
    expect(purchase.status).toBe('ontvangen');
    expect(stock(shortage).physical).toBe(10);
    expect(() => receive(6, 2)).toThrow(/niet open/);
    confirmSale(state, { id }, date);
    expect(stock(shortage)).toEqual({ physical: 10, reserved: 8, available: 2 });
  });

  it('maakt een artikel en klant aan en bewaart een artikelwijziging', () => {
    const product = { ...state.products[0], id: undefined, sku: 'TEST', barcode: 'DEMO-TEST' };
    const id = saveProduct(state, product);
    saveProduct(state, { ...product, id, salePrice: 5000 });
    expect(state.products.at(-1)).toMatchObject({ id, sku: 'TEST', salePrice: 5000 });
    expect(() => saveProduct(state, product)).toThrow(/uniek/);
    const customerId = savePartner(state, { kind: 'customers', name: 'Nieuwe demoklant' });
    expect(state.customers.at(-1)).toMatchObject({ id: customerId, name: 'Nieuwe demoklant', prices: {} });
  });

  it('reconcilieert iedere beginstand met fysieke mutaties en actieve reserveringen', () => {
    for (const [key, count] of Object.entries({ products: 60, customers: 20, suppliers: 10, warehouses: 2, locations: 40,
      sales: 30, purchases: 15, picks: 20, movements: 100, invoices: 20 })) {
      expect(state[key].length).toBeGreaterThanOrEqual(count);
    }
    for (const balance of state.balances) {
      const matches = row => row.productId === balance.productId && row.locationId === balance.locationId;
      expect(balance.physical).toBe(state.movements.filter(matches).reduce((sum, row) => sum + row.delta, 0));
      expect(balance.reserved).toBe(state.picks.filter(row => ['open', 'gepakt'].includes(row.status))
        .flatMap(row => row.lines).filter(matches).reduce((sum, row) => sum + row.quantity, 0));
      expect(balance.physical).toBeGreaterThanOrEqual(balance.reserved);
    }
    expect(state.invoices.every(invoice => state.sales.some(order => order.id === invoice.orderId && order.status === 'verzonden'))).toBe(true);
  });
});
