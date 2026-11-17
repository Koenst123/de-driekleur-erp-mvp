import { dashboard } from '../domain/selectors.js';
import { esc, money, num, day, badge, button, panel, table, link, sub, pageHead, empty } from './components.js';
import { icon } from './icons.js';

export function movementsTable(state, movements, withArticle = true) {
  const headers = ['Datum', ...(withArticle ? ['Artikel'] : []), 'Locatie', 'Mutatie', 'Aantal', 'Herkomst'];
  return table(headers, movements.map(row => [
    day(row.date), ...(withArticle ? [link('artikelen', row.productId, state.products.find(item => item.id === row.productId).sku)] : []),
    esc(row.locationId), badge(row.type, row.delta < 0 ? 'neutral' : 'blue'),
    '<strong class="' + (row.delta < 0 ? 'negative' : 'positive') + '">' + (row.delta > 0 ? '+' : '−') + num(Math.abs(row.delta)) + '</strong>',
    sub(row.reference, row.reason),
  ]), 'Er zijn nog geen voorraadmutaties.');
}

function metric({ label, value, note, symbol, tone, page, testId }) {
  return '<a href="#' + page + '" class="metric"><span class="metric-top"><span class="metric-icon ' + tone + '">' + icon(symbol, 19) +
    '</span>' + icon('arrow', 15) + '</span><span class="metric-label">' + esc(label) +
    '</span><strong class="metric-value"' + (testId ? ' data-testid="' + testId + '"' : '') + '>' +
    esc(value) + '</strong><span class="metric-note">' + esc(note) + '</span></a>';
}

function chart(months) {
  if (!months.length) return empty('Omzet wordt zichtbaar na de eerste verzending.');
  const peak = Math.max(...months.map(([, value]) => value), 100);
  const limit = Math.ceil(peak / 100000) * 100000;
  const axis = [1, 0.75, 0.5, 0.25, 0].map(ratio => '<span>' + money(limit * ratio).replace(',00', '') + '</span>').join('');
  const monthLabel = new Intl.DateTimeFormat('nl-NL', { month: 'short', timeZone: 'UTC' });
  return '<div class="chart"><div aria-hidden="true" class="chart-axis">' + axis + '</div><div class="chart-body">' +
    '<div class="chart-columns">' + months.map(([month, value], index) => {
      const label = monthLabel.format(new Date(month + '-01T00:00:00Z'));
      return '<div class="chart-column"><div class="bar ' + (index === months.length - 1 ? 'current' : '') +
        '" style="--bar:' + (value / limit * 100) + '%" tabindex="0" role="img" aria-label="' + esc(label + ' ' + money(value)) +
        '"><span class="chart-tip">' + money(value) + '</span></div><span class="month">' + esc(label) + '</span></div>';
    }).join('') + '</div></div></div>';
}

export function renderDashboard(state) {
  const data = dashboard(state);
  const metrics = [
    { label: 'Omzet', value: money(data.revenue), note: 'Verzonden orders · excl. btw', symbol: 'trend', tone: 'blue', page: 'financieel', testId: 'revenue' },
    { label: 'Voorraadwaarde', value: money(data.inventoryValue), note: 'Op basis van inkoopprijzen', symbol: 'articles', tone: 'purple', page: 'voorraad' },
    { label: 'Open verkooporders', value: num(data.openSales), note: 'Van concept tot verzending', symbol: 'sales', tone: 'green', page: 'verkoop' },
    { label: 'Open inkooporders', value: num(data.openPurchases), note: 'Inclusief deelontvangsten', symbol: 'purchase', tone: 'amber', page: 'inkoop' },
  ];
  const alerts = data.low.slice(0, 4).map(({ product, available }) => {
    return '<li><span class="list-icon amber">' + icon('warning', 17) + '</span><div>' +
      link('artikelen', product.id, product.name) + '<small>' + esc(product.sku) + ' · min. ' + num(product.minimum) +
      '</small></div><strong>' + num(available) + ' vrij</strong></li>';
  }).join('');
  const best = data.best.map(row => {
    const product = state.products.find(item => item.id === row.id);
    return [link('artikelen', product.id, product.name) + '<small class="cell-sub">' + esc(product.sku) + '</small>', num(row.count), money(row.revenue)];
  });
  return pageHead('Dashboard', 'Verkoop, voorraad en magazijn in één overzicht.',
    link('modules', '', 'Modules & mogelijkheden', 'button secondary') +
    link('presentatie', '', 'Open productdemo', 'button secondary') + button('new-sale', 'Nieuwe verkooporder', 'primary')) +
    '<div class="metric-grid">' + metrics.map(metric).join('') + '</div>' +
    '<div class="dashboard-grid">' +
    panel('Omzetontwikkeling', '<p class="panel-note">Verzonden orders per maand, exclusief btw.</p>' + chart(data.months), '<span class="chart-legend"><i></i> Omzet</span>') +
    panel('Magazijn', '<div class="pick-summary"><span class="list-icon blue">' + icon('warehouse', 19) + '</span><div><strong>' + data.picks +
      ' lopende pickopdrachten</strong><small>Open of klaar voor verzending</small></div>' + link('magazijn', '', 'Openen') +
      '</div><h3 class="list-heading">Onder minimumvoorraad <span>' + data.low.length + '</span></h3>' +
      (alerts ? '<ul class="activity-list">' + alerts + '</ul>' : empty('Alle artikelen zijn op peil.')),
      link('voorraad', '', 'Voorraad bekijken')) +
    '</div><div class="dashboard-grid">' +
    panel('Recente voorraadmutaties', movementsTable(state, data.recent), link('voorraad', 'mutaties', 'Alle mutaties')) +
    panel('Bestverkopende artikelen', table(['Artikel', 'Verkocht', 'Omzet'], best, 'Er zijn nog geen verzonden artikelen.')) + '</div>';
}
