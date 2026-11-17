import { activePick, recentFirst } from '../domain/selectors.js';
import { assistantInstruction } from '../app/assistant.js';
import { esc, num, badge, button, table, sub, panel, pageHead, link, definition, field, input } from './components.js';

export function warehousePage(state, id, ui) {
  const pick = state.picks.find(row => row.id === id);
  if (!pick) {
    const open = state.picks.filter(activePick).sort(recentFirst);
    const closed = state.picks.filter(row => !activePick(row)).sort(recentFirst);
    const rows = items => items.map(item => {
      const order = state.sales.find(row => row.id === item.orderId);
      const customer = state.customers.find(row => row.id === order.customerId);
      const picked = item.lines.reduce((sum, line) => sum + line.picked, 0);
      const total = item.lines.reduce((sum, line) => sum + line.quantity, 0);
      return [link('magazijn', item.id, item.orderId), esc(customer.name), esc(order.warehouseId), num(picked) + ' / ' + num(total), badge(item.status)];
    });
    return pageHead('Magazijn', 'Verzamel orders per locatie en maak ze klaar voor verzending.', button('show-assistant', 'Magazijnassistent', 'primary')) +
      (ui.assistant ? assistantPanel(state, null, ui) : '') +
      panel('Lopende pickopdrachten', table(['Order', 'Klant', 'Magazijn', 'Verzameld', 'Status'], rows(open), 'Er zijn geen lopende pickopdrachten.'),
        '<span class="count">' + open.length + ' opdrachten</span>') +
      panel('Afgeronde pickopdrachten', table(['Order', 'Klant', 'Magazijn', 'Verzameld', 'Status'], rows(closed)));
  }
  const order = state.sales.find(row => row.id === pick.orderId);
  const total = pick.lines.reduce((sum, line) => sum + line.quantity, 0);
  const picked = pick.lines.reduce((sum, line) => sum + line.picked, 0);
  let actions = button('show-assistant', 'Magazijnassistent');
  if (pick.status === 'open') actions += button('finish-pick', 'Pickopdracht afronden', 'primary', picked !== total ? 'disabled' : '');
  if (pick.status === 'gepakt') actions += button('ship-pick', 'Verzending bevestigen', 'primary');
  return pageHead('Pickopdracht ' + order.id, 'Controleer het artikel en de locatie per pickregel.', actions, link('magazijn', '', '‹ Magazijn', 'back')) +
    panel('Pickstatus', definition([['Order', link('verkoop', order.id, order.id)], ['Status', badge(pick.status)],
      ['Magazijn', esc(order.warehouseId)], ['Verzameld', num(picked) + ' van ' + num(total) + ' verpakkingen']]) +
      '<progress class="pick-progress" value="' + picked + '" max="' + total + '" aria-label="Pickvoortgang"></progress>') +
    (ui.assistant ? assistantPanel(state, pick, ui) : '') +
    panel('Verzamellijst', table(['Locatie', 'Artikel', 'Aantal', 'Gepikt', 'Actie'], pick.lines.map(line => {
      const product = state.products.find(row => row.id === line.productId);
      return [
        '<code>' + esc(line.locationId) + '</code>',
        sub(product.name, product.sku + ' · ' + product.packaging + ' ' + product.content + ' ' + product.unit),
        num(line.quantity), num(line.picked),
        pick.status === 'open' && line.picked < line.quantity ?
          button('scan-line', 'Barcode invoeren', 'secondary', 'data-id="' + esc(line.id) + '" aria-label="Barcode invoeren voor ' + esc(product.sku) + '"') :
          (line.picked === line.quantity ? badge('Gepickt', 'green') : '—'),
      ];
    })));
}

function assistantPanel(state, pick, ui) {
  const canRecord = Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
  const canSpeak = Boolean(window.speechSynthesis && window.SpeechSynthesisUtterance);
  const intro = pick?.status === 'open' ? assistantInstruction(state, pick) : 'Open een opdracht met ‘volgende’ of ‘open SO-…’.';
  const messages = ui.messages.slice(-8).map(row =>
    '<li class="' + (row.role === 'user' ? 'user' : 'assistant') + '">' +
    '<span class="sr-only">' + (row.role === 'user' ? 'U: ' : 'Assistent: ') + '</span>' + esc(row.message) + '</li>').join('');
  return panel('Magazijnassistent', '<div class="assistant-body"><p>' + esc(intro) + '</p>' +
    '<ol class="assistant-log" aria-label="Gesprek" aria-live="polite">' + messages + '</ol>' +
    '<form class="assistant-form" data-assistant>' +
    field('command', 'Commando of barcode', input('command', '', 'placeholder="Bijvoorbeeld: 3 gepakt" autocomplete="off" required maxlength="100"')) +
    '<button class="button primary" type="submit" ' + (ui.assistantBusy ? 'disabled' : '') + '>Verstuur</button>' +
    (canRecord ? button('speak-input', 'Spraak invoeren') : '') + '</form>' +
    '<div class="assistant-settings"><span>' + (canRecord ? 'Spraakinvoer beschikbaar via de browser' : 'Spraakinvoer ontbreekt in deze browser. Gebruik tekst.') + '</span>' +
    (canSpeak ? '<label><input type="checkbox" name="speak" ' + (ui.speak ? 'checked' : '') + '> Lees antwoorden voor</label>' :
      '<span>Spraakuitvoer niet beschikbaar</span>') + '</div></div>',
    button('show-assistant', 'Sluiten', 'quiet'), 'assistant-panel');
}

export function scanForm(state, line) {
  const item = state.products.find(row => row.id === line.productId);
  const remaining = line.quantity - line.picked;
  return '<p class="dialog-copy">' + esc(item.name) + ' · ' + esc(line.locationId) + ' · ' + num(remaining) + ' openstaand</p>' +
    '<p class="inline-note">Demo-etiket <code>' + esc(item.barcode) + '</code></p>' +
    '<div class="form-grid">' +
    field('amount', 'Aantal gepakt', input('amount', remaining, 'type="number" min="1" max="' + remaining + '" required')) +
    field('barcode', 'Barcode', input('barcode', '', 'autocomplete="off" maxlength="64" required')) + '</div>';
}
