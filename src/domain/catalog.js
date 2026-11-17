import { get, movement, quantity, requireRule } from './stock.js';

const text = (value, max = 180) => String(value ?? '').trim().slice(0, max);

function cents(value) {
  requireRule(Number.isInteger(value) && value >= 0 && value <= 10000000, 'Voer een geldige prijs in.');
  return value;
}

export function saveProduct(state, data) {
  const sku = text(data.sku, 40).toUpperCase();
  const barcode = text(data.barcode, 64);
  requireRule(sku && text(data.name) && text(data.category) && text(data.packaging) && barcode, 'Vul alle verplichte artikelvelden in.');
  requireRule(!state.products.some(item => item.id !== data.id && (item.sku === sku || item.barcode === barcode)), 'SKU en barcode moeten uniek zijn.');
  get(state.suppliers, data.supplierId, 'Leverancier');
  get(state.locations, data.locationId, 'Locatie');
  requireRule(Number.isFinite(data.content) && data.content > 0 && data.content <= 10000 && ['L', 'kg', 'st'].includes(data.unit), 'Voer een geldige verpakkingsinhoud in.');
  requireRule([0, 900, 2100].includes(data.taxRate), 'Kies een geldige demo-btw-code.');
  const fields = {
    sku, barcode, name: text(data.name), brand: text(data.brand), category: text(data.category),
    description: text(data.description, 1200), grade: text(data.grade), unit: data.unit,
    packaging: text(data.packaging), content: data.content, purchasePrice: cents(data.purchasePrice),
    salePrice: cents(data.salePrice), taxRate: data.taxRate, supplierId: data.supplierId,
    locationId: data.locationId, minimum: quantity(data.minimum, true), source: '', verifiedPack: false,
  };
  if (data.id) {
    const existing = get(state.products, data.id, 'Artikel');
    if (['name', 'brand', 'grade'].every(key => existing[key] === fields[key])) fields.source = existing.source;
    if (fields.source && ['packaging', 'content', 'unit'].every(key => existing[key] === fields[key])) fields.verifiedPack = existing.verifiedPack;
    Object.assign(existing, fields);
    return existing.id;
  }
  const id = 'ART-' + ++state.counters.product;
  state.products.push({ id, ...fields });
  return id;
}

export function savePartner(state, { kind, ...data }) {
  requireRule(kind === 'customers' || kind === 'suppliers', 'Onbekend relatietype.');
  const name = text(data.name);
  requireRule(name, 'Vul een bedrijfsnaam in.');
  const details = {
    name, city: text(data.city), contact: text(data.contact), email: text(data.email), notes: text(data.notes, 1200),
  };
  if (kind === 'suppliers') details.leadDays = quantity(data.leadDays, true);
  const existing = data.id && get(state[kind], data.id, 'Relatie');
  if (existing) {
    Object.assign(existing, details);
    return existing.id;
  }
  const id = (kind === 'customers' ? 'K-' : 'L-') + ++state.counters[kind];
  state[kind].push({ id, ...details, ...(kind === 'customers' && { prices: {}, opportunities: [] }) });
  return id;
}

export function setCustomerPrice(state, { id, productId, price }) {
  const customer = get(state.customers, id, 'Klant');
  get(state.products, productId, 'Artikel');
  if (price === null) delete customer.prices[productId];
  else customer.prices[productId] = cents(price);
  return id;
}

export function saveOpportunity(state, { id, title, stage, opportunityId }) {
  const customer = get(state.customers, id, 'Klant');
  requireRule(text(title) && ['Open', 'Offerte', 'Gewonnen', 'Verloren'].includes(stage), 'Vul een naam en geldige fase in.');
  if (opportunityId) Object.assign(get(customer.opportunities, opportunityId, 'Verkoopkans'), { title: text(title), stage });
  else customer.opportunities.push({ id: 'VK-' + ++state.counters.opportunity, title: text(title), stage });
  return id;
}

export function adjustStock(state, { productId, locationId, delta, reason }, date) {
  get(state.products, productId, 'Artikel');
  get(state.locations, locationId, 'Locatie');
  quantity(Math.abs(delta));
  requireRule(text(reason), 'Vul de reden voor de correctie in.');
  movement(state, { productId, locationId, delta, reason: text(reason), type: 'Correctie', reference: 'VC-' + (state.counters.movement + 1), date });
  return productId;
}

export function saveDocument(state, { title, category, targetKind, targetId, sample }, date) {
  requireRule(text(title) && ['Technisch', 'Klant', 'Order', 'Algemeen'].includes(category), 'Vul een titel en categorie in.');
  requireRule(['products', 'customers', 'sales'].includes(targetKind), 'Kies een geldig koppelingstype.');
  get(state[targetKind], targetId, 'Gekoppeld record');
  requireRule(['artikel', 'relatie', 'order'].includes(sample), 'Selecteer een voorbeeldbestand.');
  const id = 'D-' + ++state.counters.document;
  state.documents.push({ id, title: text(title), category, targetKind, targetId, sample, date });
  return id;
}

export function saveWebsite(state, { heading, introduction, inquiry }) {
  requireRule(text(heading) && text(introduction) && text(inquiry), 'Vul de drie websiteteksten in.');
  state.website = { heading: text(heading, 90), introduction: text(introduction, 450), inquiry: text(inquiry, 450) };
}
