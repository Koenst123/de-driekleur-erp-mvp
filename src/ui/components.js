export const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const moneyFormat = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' });
const numberFormat = new Intl.NumberFormat('nl-NL');
const dateFormat = new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' });
export const money = cents => moneyFormat.format(cents / 100);
export const num = value => numberFormat.format(value);
export const day = value => dateFormat.format(new Date(value));
export const option = (value, label, active) => '<option value="' + esc(value) + '"' + (value === active ? ' selected' : '') + '>' + esc(label) + '</option>';
export const options = (records, value, label = row => row.name) => records.map(row => option(row.id, label(row), value)).join('');
export const href = (page, id = '') => '#' + page + (id ? '/' + encodeURIComponent(id) : '');
export const link = (page, id, name, className = 'text-link') => '<a class="' + className + '" href="' + href(page, id) + '">' + esc(name) + '</a>';
export const button = (action, label, style = 'secondary', attrs = '') => '<button type="button" class="button ' + style + '" data-action="' + action + '" ' + attrs + '>' + esc(label) + '</button>';
export const field = (name, labelText, content) => '<label class="field"><span>' + esc(labelText) + '</span>' + content + '</label>';
export const input = (name, value = '', attrs = '') => '<input name="' + name + '" value="' + esc(value) + '" ' + attrs + '>';
export const select = (name, content, attrs = '') => '<select name="' + name + '" ' + attrs + '>' + content + '</select>';
export const textarea = (name, value, attrs = '') => '<textarea name="' + name + '" ' + attrs + '>' + esc(value) + '</textarea>';
export const badge = (status, color = '') => '<span class="badge ' + esc(color || ({
  verzonden: 'green', ontvangen: 'green', gepikt: 'green', gepakt: 'green', bevestigd: 'blue',
  besteld: 'blue', open: 'blue', 'gedeeltelijk ontvangen': 'amber', geannuleerd: 'red',
}[status] ?? 'neutral')) + '"><i></i>' + esc(status[0].toUpperCase() + status.slice(1)) + '</span>';
export const sub = (primary, secondary) => '<strong class="cell-main">' + esc(primary) + '</strong><small class="cell-sub">' + esc(secondary) + '</small>';
export const empty = (message = 'Geen resultaten gevonden.') => '<div class="empty">' + esc(message) + '</div>';
export const panel = (title, content, right = '', extra = '') =>
  '<section class="panel ' + extra + '"><div class="panel-head"><h2>' + esc(title) + '</h2>' + right + '</div>' + content + '</section>';
export const pageHead = (title, body, actions = '', back = '') =>
  '<header class="page-head"><div>' + back + '<h1 tabindex="-1">' + esc(title) + '</h1>' +
  (body ? '<p>' + esc(body) + '</p>' : '') + '</div><div class="actions">' + actions + '</div></header>';
export const definition = fields => '<dl class="definitions">' + fields.map(([name, value]) =>
  '<div><dt>' + esc(name) + '</dt><dd>' + value + '</dd></div>').join('') + '</dl>';
export const table = (headers, rows, message) => rows.length ?
  '<div class="table-scroll" tabindex="0" role="region" aria-label="Resultaten"><table><thead><tr>' + headers.map(header =>
    '<th scope="col">' + esc(header) + '</th>').join('') + '</tr></thead><tbody>' + rows.map(row =>
    '<tr>' + row.map(cell => '<td>' + cell + '</td>').join('') + '</tr>').join('') + '</tbody></table></div>' : empty(message);
export const packagingImage = new URL('../assets/packaging.webp', import.meta.url).href;
