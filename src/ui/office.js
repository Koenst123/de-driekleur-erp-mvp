import { dashboard, recentFirst } from '../domain/selectors.js';
import { totals } from '../domain/orders.js';
import { salesLines, saleTotals } from './orders.js';
import { esc, money, day, badge, button, table, panel, pageHead, link, definition, field, input, option, options, select, textarea } from './components.js';

const accountingNote = '<p class="inline-warning">Deze demonstratiemodule vervangt CASH of een volledig boekhoudpakket niet.</p>';

export function financePage(state, id) {
  const invoice = state.invoices.find(row => row.id === id);
  if (invoice) {
    const customer = state.customers.find(row => row.id === invoice.customerId);
    return pageHead(invoice.id, 'Factuurconcept · ' + customer.name, '', link('financieel', '', '‹ Financieel', 'back')) + accountingNote +
      panel('Factuurgegevens', definition([['Klant', link('klanten', customer.id, customer.name)],
        ['Verkooporder', link('verkoop', invoice.orderId, invoice.orderId)], ['Datum', day(invoice.date)], ['Status', badge('Concept')]])) +
      panel('Factuurregels', salesLines(state, invoice) + saleTotals(invoice.lines));
  }
  const invoices = [...state.invoices].sort(recentFirst);
  return pageHead('Financieel', 'Factuurconcepten en omzet uit verzonden verkooporders.') + accountingNote +
    panel('Omzetoverzicht', definition([
      ['Verzonden omzet excl. btw', money(dashboard(state).revenue)],
      ['Factuurconcepten incl. btw', money(invoices.reduce((sum, row) => sum + totals(row.lines).gross, 0))],
    ])) +
    panel('Factuurconcepten', table(['Factuurconcept', 'Klant', 'Verkooporder', 'Totaal incl. btw'], invoices.map(row => [
      link('financieel', row.id, row.id) + '<small class="cell-sub">' + day(row.date) + '</small>',
      esc(state.customers.find(customer => customer.id === row.customerId).name),
      link('verkoop', row.orderId, row.orderId), money(totals(row.lines).gross),
    ])));
}

const targets = {
  products: { page: 'artikelen', label: 'Artikel', labelFor: row => row.sku + ' · ' + row.name },
  customers: { page: 'klanten', label: 'Klant', labelFor: row => row.name },
  sales: { page: 'verkoop', label: 'Verkooporder', labelFor: row => row.id },
};

const files = { artikel: 'artikelblad.txt', relatie: 'leverafspraak.txt', order: 'verzendbon.txt' };
const samplePath = key => import.meta.env.BASE_URL + 'voorbeelden/' + files[key];

export function documentsPage(state, filters) {
  return pageHead('Documenten', 'Voorbeeldbestanden gekoppeld aan artikelen, klanten en orders.', button('new-document', 'Document koppelen', 'primary')) +
    '<form class="filters" data-filter>' +
    field('category', 'Categorie', select('category', option('', 'Alle categorieën', filters.category) +
      ['Technisch', 'Klant', 'Order', 'Algemeen'].map(item => option(item, item, filters.category)).join(''))) +
    '</form><div id="filter-results">' + documentsResults(state, filters) + '</div>';
}

export function documentsResults(state, filters) {
  const rows = state.documents.filter(row => !filters.category || row.category === filters.category).sort(recentFirst);
  return panel('Documentoverzicht', table(['Document', 'Categorie', 'Gekoppeld aan', 'Datum', 'Bestand'], rows.map(row => {
    const target = targets[row.targetKind];
    const record = state[row.targetKind].find(item => item.id === row.targetId);
    return [esc(row.title), badge(row.category), link(target.page, record.id, target.labelFor(record)), day(row.date),
      '<a class="text-link" href="' + esc(samplePath(row.sample)) + '" download>Download voorbeeld</a>'];
  })));
}

export function documentOptions(state, kind) {
  return options(state[kind], '', targets[kind].labelFor);
}

export function documentForm(state) {
  return '<div class="form-grid">' +
    field('title', 'Documenttitel', input('title', '', 'required maxlength="180"')) +
    field('category', 'Categorie', select('category', ['Technisch', 'Klant', 'Order', 'Algemeen'].map(item => option(item, item)).join(''))) +
    field('targetKind', 'Koppelingstype', select('targetKind', Object.entries(targets).map(([key, item]) => option(key, item.label)).join(''))) +
    field('targetId', 'Gekoppeld record', select('targetId', documentOptions(state, 'products'))) +
    field('sample', 'Voorbeeldbestand', select('sample', Object.entries(files).map(([key, name]) => option(key, name)).join(''))) +
    '</div>';
}

export function websitePage(state) {
  return pageHead('Website', 'Werk de teksten van de lokale bedrijfswebsite bij.',
    '<a class="button secondary" href="./website.html" target="_blank" rel="noopener">Open websitepreview ↗</a>') +
    panel('Websiteteksten', '<form class="website-form" data-website>' +
      field('heading', 'Hoofdtitel', input('heading', state.website.heading, 'required maxlength="90"')) +
      field('introduction', 'Introductie', textarea('introduction', state.website.introduction, 'required rows="3" maxlength="450"')) +
      field('inquiry', 'Contacttekst', textarea('inquiry', state.website.inquiry, 'required rows="3" maxlength="450"')) +
      '<div><button class="button primary" type="submit">Websiteteksten opslaan</button></div></form>');
}
