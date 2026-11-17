import { replenishment } from '../domain/replenishment.js';
import { esc, num, button, badge, table, panel, pageHead, link } from './components.js';

export function replenishmentPage(state, id) {
  const warehouse = state.warehouses.find(row => row.id === id) ?? state.warehouses[0];
  const rows = replenishment(state, warehouse.id)
    .filter(row => row.shortage || row.draftId || row.available < row.product.minimum)
    .sort((a, b) => Number(b.shortage) - Number(a.shortage) || b.recommendation - a.recommendation ||
      a.product.sku.localeCompare(b.product.sku));
  const warehouses = state.warehouses.map(row => link('aanvullen', row.id, row.name,
    'button ' + (row.id === warehouse.id ? 'primary' : 'secondary'))).join('');
  return pageHead('Voorraad aanvullen', 'Van verwachte voorraad onder minimum naar een inkoopconcept.',
    link('inkoop', '', 'Naar inkooporders', 'button secondary')) +
    '<div class="subnav">' + warehouses + '</div>' +
    panel('Aanvulwerkvoorraad', '<p class="panel-note">Verwachting = beschikbaar + nog te ontvangen bevestigde inkoop. De min/max-regel geldt in het voorkeursmagazijn van het artikel.</p>' +
      table(['Artikel', 'Beschikbaar', 'In bestelling', 'Verwacht', 'Min / max', 'Voorstel', 'Actie'], rows.map(row => [
        link('artikelen', row.product.id, row.product.name) + '<small class="cell-sub">' + esc(row.product.sku) + '</small>',
        num(row.available), num(row.incoming), '<strong>' + num(row.projected) + '</strong>',
        num(row.product.minimum) + ' / ' + num(row.target),
        row.shortage ? badge(num(row.recommendation) + ' bestellen', 'amber') : badge('Op termijn op peil', 'green'),
        row.draftId ? link('inkoop', row.draftId, 'Open inkoopconcept', 'button secondary') :
          row.shortage ? button('replenish-product', 'Inkoopconcept maken', 'primary',
            'data-id="' + esc(row.product.id) + '" data-warehouse="' + esc(warehouse.id) + '"') : '—',
      ]), 'Alle artikelen in dit voorkeursmagazijn zijn op peil.'));
}
