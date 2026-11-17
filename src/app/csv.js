import { requireRule } from '../domain/stock.js';

export function csvText(rows) {
  return '\uFEFF' + rows.map(row => row.map(value => {
    let text = String(value ?? '');
    if (/^[\s]*[=+@-]/.test(text)) text = "'" + text;
    return '"' + text.replaceAll('"', '""') + '"';
  }).join(';')).join('\r\n') + '\r\n';
}

const exports = {
  artikelen: ['products', ['SKU', 'Artikel', 'Merk', 'Categorie', 'Verpakking', 'Inhoud', 'Eenheid', 'Inkoopprijs EUR', 'Verkoopprijs EUR'],
    row => [row.sku, row.name, row.brand, row.category, row.packaging, row.content, row.unit, amount(row.purchasePrice), amount(row.salePrice)]],
  klanten: ['customers', ['Klantnummer', 'Bedrijf', 'Plaats', 'Contactpersoon', 'E-mail'], row => [row.id, row.name, row.city, row.contact, row.email]],
  leveranciers: ['suppliers', ['Leveranciersnummer', 'Bedrijf', 'Plaats', 'Contactpersoon', 'E-mail'], row => [row.id, row.name, row.city, row.contact, row.email]],
  verkoop: ['sales', ['Order', 'Klantnummer', 'Datum', 'Status', 'Magazijn'], row => [row.id, row.customerId, row.date, row.status, row.warehouseId]],
  inkoop: ['purchases', ['Order', 'Leveranciersnummer', 'Datum', 'Status', 'Magazijn'], row => [row.id, row.supplierId, row.date, row.status, row.warehouseId]],
  voorraad: ['balances', ['Artikel-ID', 'Locatie', 'Fysiek', 'Gereserveerd', 'Beschikbaar'],
    row => [row.productId, row.locationId, row.physical, row.reserved, row.physical - row.reserved]],
};
function amount(cents) { return (cents / 100).toFixed(2).replace('.', ','); }

export function exportRows(state, page) {
  requireRule(Object.hasOwn(exports, page), 'Dit overzicht heeft geen CSV-export.');
  const [collection, headers, row] = exports[page];
  return [headers, ...state[collection].map(row)];
}

export function downloadCsv(state, page) {
  const url = URL.createObjectURL(new Blob([csvText(exportRows(state, page))], { type: 'text/csv;charset=utf-8' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'driekleur-' + page + '.csv';
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
