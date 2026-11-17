import { describe, expect, it } from 'vitest';
import { createSeed } from '../src/data/seed.js';
import { officialCatalog } from '../src/data/official-catalog.js';
import { upgradeWorkspace } from '../src/data/workspace-version.js';
import { acceptQuotation, declineQuotation, issueQuotation, saveQuotation } from '../src/domain/quotations.js';
import { createReplenishmentDraft, replenishment } from '../src/domain/replenishment.js';
import { confirmPurchase, confirmSale, receivePurchase, saveSale } from '../src/domain/orders.js';
import { stockOf } from '../src/domain/stock.js';

const date = '2026-11-17T10:00:00Z';
const oil = 'TEL-46-J20';
const shortage = 'DTE-EX46-J20';
const quoteInput = {
  customerId: 'K-1', warehouseId: 'A', validUntil: '2026-11-17',
  reference: 'Onderhoud', lines: [{ productId: oil, quantity: 12 }],
};

describe('Offertes', () => {
  it('zet akkoord één keer om en reserveert pas na orderbevestiging tegen de offerteprijs', () => {
    const state = createSeed();
    const id = saveQuotation(state, quoteInput, date);
    expect(() => acceptQuotation(state, { id }, date)).toThrow(/eerst uit/);
    issueQuotation(state, { id }, date);
    state.customers[0].prices[oil] = 9900;
    const orderId = acceptQuotation(state, { id }, date);
    expect(acceptQuotation(state, { id }, date)).toBe(orderId);
    const order = state.sales.find(item => item.id === orderId);
    expect(order).toMatchObject({ status: 'concept', quotationId: id, lines: [{ quantity: 12, price: 8000 }] });
    expect(() => saveSale(state, { ...quoteInput, id: orderId }, date)).toThrow(/geaccepteerde offerte/);
    expect(stockOf(state, oil, 'A')).toEqual({ physical: 24, reserved: 0, available: 24 });
    confirmSale(state, { id: orderId }, date);
    expect(order.lines[0].price).toBe(8000);
    expect(stockOf(state, oil, 'A')).toEqual({ physical: 24, reserved: 12, available: 12 });
  });

  it('weigert ongeldige of verlopen datums en omzetting van een afgewezen offerte', () => {
    const state = createSeed();
    expect(() => saveQuotation(state, { ...quoteInput, validUntil: '2026-11-31' }, date)).toThrow(/geldige datum/);
    const id = saveQuotation(state, quoteInput, date);
    issueQuotation(state, { id }, date);
    expect(() => acceptQuotation(state, { id }, '2026-11-17T23:05:00Z')).toThrow(/geldigheid is verlopen/);
    declineQuotation(state, { id }, date);
    expect(() => acceptQuotation(state, { id }, date)).toThrow(/eerst uit/);
  });

  it('behoudt bestaande werkruimtes en voegt nieuwe catalogusartikelen één keer toe', () => {
    const state = createSeed();
    const additions = new Set(officialCatalog.filter(item => item.opening).map(item => item.id));
    state.seedVersion = 1;
    delete state.quotations;
    delete state.counters.quotation;
    state.products = state.products.filter(item => !additions.has(item.id));
    state.balances = state.balances.filter(item => !additions.has(item.productId));
    state.movements = state.movements.filter(item => !additions.has(item.productId));
    state.counters.movement = state.movements.length;
    state.website.heading = 'Eigen werkruimte';
    const sales = structuredClone(state.sales);
    const upgraded = upgradeWorkspace(state);
    expect(upgraded).toMatchObject({ seedVersion: 4, quotations: [], sales, website: { heading: 'Eigen werkruimte' }, transfers: [], returns: [] });
    expect(upgraded.products).toHaveLength(66);
    expect(stockOf(upgraded, shortage, 'A').available).toBe(2);
    expect(stockOf(upgraded, 'MOBIL-XHP222-E18', 'A').available).toBe(12);
    const id = saveQuotation(upgraded, quoteInput, date);
    expect(upgradeWorkspace(upgraded).quotations[0].id).toBe(id);
    expect(upgraded.products).toHaveLength(66);
    expect(stockOf(upgraded, shortage, 'A').available).toBe(2);
  });
});

describe('Voorraad aanvullen', () => {
  it('hergebruikt het concept en telt na bevestiging enkel de resterende ontvangst mee', () => {
    const state = createSeed();
    const input = { warehouseId: 'A', productId: shortage };
    const find = () => replenishment(state, 'A').find(row => row.product.id === shortage);
    expect(find()).toMatchObject({ available: 2, incoming: 0, projected: 2, target: 22, recommendation: 20 });
    const id = createReplenishmentDraft(state, input, date);
    expect(createReplenishmentDraft(state, input, date)).toBe(id);
    expect(find()).toMatchObject({ draftId: id, incoming: 0, recommendation: 20 });
    confirmPurchase(state, { id });
    expect(find()).toMatchObject({ available: 2, incoming: 20, projected: 22, recommendation: 0 });
    const locationId = find().product.locationId;
    receivePurchase(state, { id, lines: [{ lineId: shortage, locationId, amount: 2, expectedReceived: 0 }] }, date);
    expect(find()).toMatchObject({ available: 4, incoming: 18, projected: 22, recommendation: 0 });
    expect(() => createReplenishmentDraft(state, input, date)).toThrow(/op of boven minimum/);
    expect(replenishment(state, 'B').some(row => row.product.id === shortage)).toBe(false);
  });

  it('rekent gereserveerde aantallen één keer af van de voorspelling', () => {
    const state = createSeed();
    const id = saveSale(state, { ...quoteInput, lines: [{ productId: shortage, quantity: 1 }] }, date);
    confirmSale(state, { id }, date);
    expect(replenishment(state, 'A').find(row => row.product.id === shortage))
      .toMatchObject({ physical: 2, reserved: 1, available: 1, projected: 1, recommendation: 21 });
  });
});
