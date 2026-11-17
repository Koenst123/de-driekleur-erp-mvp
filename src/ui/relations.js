import { recentFirst } from '../domain/selectors.js';
import { totals } from '../domain/orders.js';
import { currencyInput } from './catalog.js';
import { esc, num, money, day, badge, button, table, sub, panel, pageHead, link, definition, field, input, option, options, select, textarea } from './components.js';

export function partnersPage(state, id, kind, filters) {
  const customer = kind === 'customers';
  const page = customer ? 'klanten' : 'leveranciers';
  const title = customer ? 'Klanten' : 'Leveranciers';
  const partner = state[kind].find(row => row.id === id);
  if (!partner) return pageHead(title, customer ? 'Klantgegevens, prijsafspraken en verkoopkansen.' : 'Leveranciersgegevens, artikelen en inkoophistorie.',
    button('new-partner', customer ? 'Nieuwe klant' : 'Nieuwe leverancier', 'primary')) +
    '<form class="filters" data-filter>' + field('search', 'Zoeken', input('search', filters.search, 'type="search" placeholder="Bedrijf, contact of plaats"')) +
    '</form><div id="filter-results">' + partnerResults(state, filters, kind) + '</div>';

  const orders = (customer ? state.sales : state.purchases).filter(row => (customer ? row.customerId : row.supplierId) === id).sort(recentFirst);
  const details = panel('Contactgegevens', definition([
    ['Plaats', esc(partner.city || '—')], ['Contactpersoon', esc(partner.contact || '—')], ['E-mail', esc(partner.email || '—')],
    ...(customer ? [] : [['Gemiddelde levertijd', num(partner.leadDays) + ' dagen · demo']]),
  ]) + '<p class="description">' + esc(partner.notes || 'Geen notities.') + '</p>');
  const actions = button('edit-partner', 'Gegevens wijzigen', 'secondary') + (customer ? button('new-sale', 'Nieuwe verkooporder', 'primary') : button('new-purchase', 'Nieuwe inkooporder', 'primary'));
  const history = panel(customer ? 'Verkoopgeschiedenis' : 'Inkoophistorie', table(['Order', 'Datum', 'Status'], orders.map(order => [
    link(customer ? 'verkoop' : 'inkoop', order.id, order.id), day(order.date), badge(order.status),
  ])));
  return pageHead(partner.name, partner.city, actions, link(page, '', '‹ ' + title, 'back')) + details +
    (customer ? customerPanels(state, partner) : panel('Leveranciersartikelen', table(['Artikel', 'SKU', 'Inkoopprijs'],
      state.products.filter(row => row.supplierId === id).map(item => [
        link('artikelen', item.id, item.name), esc(item.sku), money(item.purchasePrice),
      ])))) + history;
}

function customerPanels(state, partner) {
  const prices = Object.entries(partner.prices).map(([id, price]) => {
    const product = state.products.find(row => row.id === id);
    return [link('artikelen', id, product.name) + '<small class="cell-sub">' + esc(product.sku) + '</small>', money(price),
      button('remove-price', 'Verwijder afspraak', 'quiet', 'data-id="' + esc(id) + '"')];
  });
  return '<div class="detail-grid">' +
    panel('Prijsafspraken', table(['Artikel', 'Afgesproken prijs', 'Actie'], prices), button('set-price', 'Prijsafspraak toevoegen')) +
    panel('CRM-verkoopkansen', table(['Verkoopkans', 'Fase', 'Actie'], partner.opportunities.map(item => [
      esc(item.title), badge(item.stage, item.stage === 'Gewonnen' ? 'green' : 'blue'),
      button('edit-opportunity', 'Wijzigen', 'quiet', 'data-id="' + esc(item.id) + '"'),
    ])), button('new-opportunity', 'Nieuwe verkoopkans')) + '</div>' +
    panel('Factuurhistorie', table(['Factuurconcept', 'Datum', 'Totaal incl. btw'], state.invoices.filter(row => row.customerId === partner.id)
      .sort(recentFirst).map(row => [link('financieel', row.id, row.id), day(row.date), money(totals(row.lines).gross)])));
}

export function partnerResults(state, filters, kind) {
  const customer = kind === 'customers';
  const q = (filters.search ?? '').toLowerCase().trim();
  const rows = state[kind].filter(row => [row.name, row.contact, row.city].some(value => value.toLowerCase().includes(q)))
    .sort((a, b) => a.name.localeCompare(b.name, 'nl'));
  return panel(customer ? 'Klantoverzicht' : 'Leveranciersoverzicht', table(['Bedrijf', 'Plaats', 'Contactpersoon', customer ? 'Verkooporders' : 'Levertijd'],
    rows.map(row => [
      link(customer ? 'klanten' : 'leveranciers', row.id, row.name) + '<small class="cell-sub">' + esc(row.id) + '</small>',
      esc(row.city), sub(row.contact, row.email),
      customer ? num(state.sales.filter(order => order.customerId === row.id).length) : num(row.leadDays) + ' dagen · demo',
    ])), '<span class="count">' + rows.length + ' relaties</span>');
}

export function partnerForm(kind, partner = {}) {
  return '<div class="form-grid">' +
    field('name', 'Bedrijfsnaam', input('name', partner.name, 'required maxlength="180"')) +
    field('city', 'Plaats', input('city', partner.city, 'maxlength="180"')) +
    field('contact', 'Contactpersoon', input('contact', partner.contact, 'maxlength="180"')) +
    field('email', 'E-mailadres', input('email', partner.email, 'type="email" maxlength="180"')) +
    (kind === 'suppliers' ? field('leadDays', 'Levertijd in dagen · demo', input('leadDays', partner.leadDays ?? 2, 'type="number" min="0" max="100000" required')) : '') +
    field('notes', 'Notities', textarea('notes', partner.notes, 'maxlength="1200" rows="3"')) + '</div>';
}

export function priceForm(state) {
  return '<div class="form-grid">' +
    field('productId', 'Artikel', select('productId', options(state.products, '', row => row.sku + ' · ' + row.name))) +
    field('price', 'Afgesproken prijs per verpakking (€)', input('price', '', currencyInput)) + '</div>';
}

export function opportunityForm(item = {}) {
  return '<div class="form-grid">' +
    field('title', 'Naam verkoopkans', input('title', item.title, 'required maxlength="180"')) +
    field('stage', 'Fase', select('stage', ['Open', 'Offerte', 'Gewonnen', 'Verloren'].map(stage => option(stage, stage, item.stage)).join(''))) + '</div>';
}
