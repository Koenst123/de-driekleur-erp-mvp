import '../ui/styles.css';
import { createStore } from './store.js';
import { createAssistant } from './assistant.js';
import { BusinessError } from '../domain/stock.js';
import * as sales from '../domain/orders.js';
import * as catalog from '../domain/catalog.js';
import { esc, button } from '../ui/components.js';
import { icon } from '../ui/icons.js';
import { renderDashboard } from '../ui/dashboard.js';
import { productsPage, productResults, stockPage, stockResults, productForm, adjustForm } from '../ui/catalog.js';
import { salesPage, purchasesPage, orderResults, orderEditor, updateEditor, readOrder, receiptForm, readReceipt } from '../ui/orders.js';
import { warehousePage, scanForm } from '../ui/warehouse.js';
import { partnersPage, partnerResults, partnerForm, priceForm, opportunityForm } from '../ui/relations.js';
import { financePage, documentsPage, documentsResults, documentForm, documentOptions, websitePage } from '../ui/office.js';

const navigation = [
  { caption: 'Werkruimte', entries: [['dashboard', 'Dashboard', 'dashboard']] },
  { caption: 'Operatie', entries: [['verkoop', 'Verkoop', 'sales'], ['inkoop', 'Inkoop', 'purchase'], ['artikelen', 'Artikelen', 'articles'],
    ['voorraad', 'Voorraad', 'stock'], ['magazijn', 'Magazijn', 'warehouse']] },
  { caption: 'Bedrijf', entries: [['klanten', 'Klanten & CRM', 'customers'], ['leveranciers', 'Leveranciers', 'suppliers'],
    ['financieel', 'Financieel', 'invoices'], ['documenten', 'Documenten', 'documents'], ['website', 'Website', 'globe']] },
];

const store = createStore();
const assistant = createAssistant(store);
const root = document.querySelector('#main');
const nav = document.querySelector('#nav');
const dialog = document.querySelector('#dialog');
const modalForm = dialog.querySelector('form');
const toast = document.querySelector('#notice');
const forms = new Map();
const headers = new Map(navigation.flatMap(group => group.entries.map(([page, label]) => [page, label])));
const ui = { assistant: false, assistantBusy: false, messages: [], speak: false, modal: null };
let toastTimeout;
let previousRoute;
let previousGeneration;
let recognition;

const views = {
  dashboard: renderDashboard,
  artikelen: productsPage,
  voorraad: stockPage,
  verkoop: salesPage,
  inkoop: purchasesPage,
  magazijn: (state, id) => warehousePage(state, id, ui),
  klanten: (state, id, filters) => partnersPage(state, id, 'customers', filters),
  leveranciers: (state, id, filters) => partnersPage(state, id, 'suppliers', filters),
  financieel: financePage,
  documenten: (state, id, filters) => documentsPage(state, filters),
  website: websitePage,
};

const filterViews = {
  artikelen: productResults,
  voorraad: stockResults,
  verkoop: (state, filters) => orderResults(state, filters, 'sales'),
  inkoop: (state, filters) => orderResults(state, filters, 'purchases'),
  klanten: (state, filters) => partnerResults(state, filters, 'customers'),
  leveranciers: (state, filters) => partnerResults(state, filters, 'suppliers'),
  documenten: documentsResults,
};

function route() {
  const [page, id = ''] = location.hash.slice(1).split('/');
  try {
    return [Object.hasOwn(views, page) ? page : 'dashboard', decodeURIComponent(id)];
  } catch {
    return ['dashboard', ''];
  }
}

function go(page, id = '') {
  location.hash = page + (id ? '/' + encodeURIComponent(id) : '');
}

function render(focus = false) {
  if (!store.state) return;
  const [page, id] = route();
  const { state } = store;
  document.title = headers.get(page) + ' | De Driekleur Business Suite';
  nav.querySelectorAll('[data-page]').forEach(link => {
    if (link.dataset.page === page) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
  document.querySelector('#breadcrumb').textContent = headers.get(page);
  root.innerHTML = views[page](state, id, forms.get(page) ?? {});
  if (focus) root.querySelector('h1')?.focus({ preventScroll: true });
}

function notify(message, failure = false) {
  clearTimeout(toastTimeout);
  toast.querySelector('[role="status"]').textContent = failure ? '' : message;
  toast.querySelector('[role="alert"]').textContent = failure ? message : '';
  toast.dataset.tone = failure ? 'error' : 'success';
  toast.hidden = false;
  if (!failure) toastTimeout = setTimeout(() => { toast.hidden = true; }, 4500);
}

function readable(error) {
  return error instanceof BusinessError ? error.message : 'De lokale opslagbewerking is mislukt. Probeer het opnieuw.';
}

function openModal(title, content, submit, config = {}) {
  ui.modal = { submit, generation: store.state.generation, actionId: crypto.randomUUID(), busy: false, config };
  dialog.querySelector('h2').textContent = title;
  dialog.querySelector('[data-body]').innerHTML = content;
  modalForm.querySelector('[data-form-error]').textContent = '';
  modalForm.querySelector('[type="submit"]').textContent = config.label ?? 'Opslaan';
  modalForm.querySelector('[type="submit"]').className = 'button ' + (config.danger ? 'danger-solid' : 'primary');
  modalForm.querySelector('[type="submit"]').disabled = false;
  dialog.showModal();
  if (config.editor !== undefined) updateEditor(store.state, modalForm, config.editor);
}

function commandModal(title, copy, label, command, payload, done, danger = false) {
  openModal(title, '<p class="dialog-copy">' + esc(copy) + '</p>', (_, action) =>
    store.dispatch(command, payload, action).then(done), { label, danger });
}

const values = form => Object.fromEntries(new FormData(form));
const toCents = value => Math.round(Number(value) * 100);

function editOrder(sale, order = {}) {
  const label = sale ? 'verkooporder' : 'inkooporder';
  const page = sale ? 'verkoop' : 'inkoop';
  openModal((order.id ? 'Wijzig ' : 'Nieuwe ') + label, orderEditor(store.state, sale, order), async (form, action) => {
    const { partnerId, ...input } = readOrder(form);
    const id = await store.dispatch(sale ? sales.saveSale : sales.savePurchase, {
      ...input, id: order.id, [sale ? 'customerId' : 'supplierId']: partnerId,
    }, action);
    go(page, id);
    notify('Concept opgeslagen.');
  }, { editor: sale, label: 'Concept opslaan' });
}

function editProduct(product = {}) {
  openModal(product.id ? 'Artikel wijzigen' : 'Nieuw artikel', productForm(store.state, product), async (form, action) => {
    const data = values(form);
    const id = await store.dispatch(catalog.saveProduct, {
      ...data, id: product.id, content: Number(data.content), minimum: Number(data.minimum),
      taxRate: Number(data.taxRate), salePrice: toCents(data.salePrice), purchasePrice: toCents(data.purchasePrice),
    }, action);
    go('artikelen', id);
    notify('Artikel opgeslagen.');
  });
}

function editPartner(kind, partner = {}) {
  const customer = kind === 'customers';
  openModal(partner.id ? 'Relatie wijzigen' : customer ? 'Nieuwe klant' : 'Nieuwe leverancier', partnerForm(kind, partner), async (form, action) => {
    const data = values(form);
    const id = await store.dispatch(catalog.savePartner, { ...data, id: partner.id, kind, leadDays: Number(data.leadDays) }, action);
    go(customer ? 'klanten' : 'leveranciers', id);
    notify('Relatie opgeslagen.');
  });
}

function editOpportunity(id, item = {}) {
  openModal(item.id ? 'Verkoopkans wijzigen' : 'Nieuwe verkoopkans', opportunityForm(item), async (form, action) => {
    await store.dispatch(catalog.saveOpportunity, { ...values(form), id, opportunityId: item.id }, action);
    notify('Verkoopkans opgeslagen.');
  });
}

function submitAssistant(raw) {
  if (!raw.trim() || ui.assistantBusy) return;
  ui.assistantBusy = true;
  ui.messages.push({ role: 'user', message: raw });
  const [, id] = route();
  render();
  assistant.command(id, raw).then(response => {
    if (response.pickId) go('magazijn', response.pickId);
    ui.messages.push({ role: 'assistant', message: response.message });
    if (ui.speak && window.speechSynthesis && window.SpeechSynthesisUtterance) {
      const speech = new SpeechSynthesisUtterance(response.message);
      speech.lang = 'nl-NL';
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(speech);
    }
  }).catch(error => {
    ui.messages.push({ role: 'assistant', message: readable(error) });
  }).finally(() => {
    ui.assistantBusy = false;
    render();
    root.querySelector('[name="command"]')?.focus({ preventScroll: true });
  });
}

function startSpeech() {
  const BrowserSpeech = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!BrowserSpeech || recognition) return;
  recognition = new BrowserSpeech();
  recognition.lang = 'nl-NL';
  recognition.onresult = event => submitAssistant(event.results[0][0].transcript);
  recognition.onerror = () => notify('Spraakinvoer is niet beschikbaar. Typ het commando of de barcode.', true);
  recognition.onend = () => { recognition = undefined; };
  try {
    recognition.start();
  } catch {
    recognition = undefined;
    notify('Spraakinvoer kon niet starten. Gebruik tekst.', true);
  }
}

function routeChange() {
  const [page] = route();
  if (dialog.open && !ui.modal?.busy) dialog.close();
  if (page !== 'magazijn' && previousRoute === 'magazijn') {
    ui.assistant = false;
    ui.messages = [];
    assistant.reset();
    recognition?.abort();
  }
  previousRoute = page;
  closeNav();
  window.scrollTo(0, 0);
  render(true);
}

function closeNav() {
  document.body.classList.remove('nav-open');
  document.querySelector('#nav-toggle').setAttribute('aria-expanded', 'false');
  document.querySelector('.shell-content').inert = false;
}

const actions = {
  'new-sale': ({ page, id }) => editOrder(true, page === 'klanten' ? { customerId: id } : {}),
  'new-purchase': ({ page, id }) => editOrder(false, page === 'leveranciers' ? { supplierId: id } : {}),
  'edit-sale': ({ state, id }) => editOrder(true, state.sales.find(row => row.id === id)),
  'edit-purchase': ({ state, id }) => editOrder(false, state.purchases.find(row => row.id === id)),
  'confirm-sale': ({ id }) => commandModal('Order bevestigen', 'Reserveer alle orderregels en maak één pickopdracht aan.', 'Bevestigen',
    sales.confirmSale, { id }, () => notify('Order bevestigd en voorraad gereserveerd.')),
  'cancel-sale': ({ id }) => commandModal('Order annuleren', 'Annuleer de order en geef eventuele reserveringen vrij.', 'Order annuleren',
    sales.cancelSale, { id }, () => notify('Order geannuleerd.'), true),
  'confirm-purchase': ({ id }) => commandModal('Bestelling bevestigen', 'Zet de inkooporder open voor goederenontvangsten.', 'Bevestigen',
    sales.confirmPurchase, { id }, () => notify('Bestelling bevestigd.')),
  'receive-purchase': ({ state, id }) => {
    const order = state.purchases.find(row => row.id === id);
    openModal('Ontvangst registreren', receiptForm(state, order), async (form, action) => {
      await store.dispatch(sales.receivePurchase, { id, lines: readReceipt(form) }, action);
      notify('Ontvangst geboekt en voorraad bijgewerkt.');
    }, { label: 'Ontvangst boeken' });
  },
  'show-assistant': () => {
    ui.assistant = !ui.assistant;
    render();
    root.querySelector(ui.assistant ? '[name="command"]' : '[data-action="show-assistant"]')?.focus();
  },
  'speak-input': startSpeech,
  'scan-line': ({ state, id, selected }) => {
    const line = state.picks.find(row => row.id === id).lines.find(row => row.id === selected);
    openModal('Barcode en aantal registreren', scanForm(state, line), async (form, action) => {
      const data = values(form);
      await store.dispatch(sales.recordPick, { id, lineId: line.id, amount: Number(data.amount), barcode: data.barcode, expectedPicked: line.picked }, action);
      notify('Pick geregistreerd.');
    }, { label: 'Scan registreren' });
  },
  'finish-pick': ({ id }) => commandModal('Pickopdracht afronden', 'Zet deze pickopdracht klaar voor verzending.', 'Pick afronden',
    sales.finishPick, { id }, () => notify('Pickopdracht afgerond.')),
  'ship-pick': ({ state, id }) => ship(state.picks.find(row => row.id === id).orderId),
  'ship-sale': ({ id }) => ship(id),
  'invoice-sale': ({ id }) => commandModal('Factuurconcept genereren', 'Maak een lokaal factuurconcept met de vastgelegde prijzen en btw.', 'Factuurconcept maken',
    sales.invoiceSale, { id }, invoiceId => { go('financieel', invoiceId); notify('Factuurconcept gemaakt.'); }),
  'new-product': () => editProduct(),
  'edit-product': ({ state, id }) => editProduct(state.products.find(row => row.id === id)),
  'adjust-stock': ({ state, page, id }) => openModal('Voorraad corrigeren', adjustForm(state, page === 'artikelen' ? id : undefined), async (form, action) => {
    const data = values(form);
    await store.dispatch(catalog.adjustStock, { ...data, delta: Number(data.delta) }, action);
    notify('Correctie geboekt in de voorraadmutaties.');
  }, { label: 'Correctie boeken' }),
  'new-partner': ({ kind }) => editPartner(kind),
  'edit-partner': ({ state, id, kind }) => editPartner(kind, state[kind].find(row => row.id === id)),
  'set-price': ({ state, id }) => openModal('Prijsafspraak toevoegen', priceForm(state), async (form, action) => {
    const data = values(form);
    await store.dispatch(catalog.setCustomerPrice, { id, productId: data.productId, price: toCents(data.price) }, action);
    notify('Prijsafspraak opgeslagen.');
  }),
  'remove-price': ({ id, selected }) => commandModal('Prijsafspraak verwijderen', 'Nieuwe orders gebruiken daarna de catalogusprijs.', 'Afspraak verwijderen',
    catalog.setCustomerPrice, { id, productId: selected, price: null }, () => notify('Prijsafspraak verwijderd.'), true),
  'new-opportunity': ({ id }) => editOpportunity(id),
  'edit-opportunity': ({ state, id, selected }) => editOpportunity(id, state.customers.find(row => row.id === id).opportunities.find(row => row.id === selected)),
  'new-document': ({ state }) => openModal('Document koppelen', documentForm(state), async (form, action) => {
    await store.dispatch(catalog.saveDocument, values(form), action);
    notify('Voorbeeldbestand gekoppeld.');
  }, { document: true }),
  'reset': () => openModal('Demodata herstellen?', '<p class="dialog-copy">Dit wist wijzigingen in deze browser en laadt de oorspronkelijke scenario’s opnieuw.</p>', async () => {
    await store.reset();
    forms.clear();
    assistant.reset();
    ui.assistant = false;
    ui.messages = [];
    closeNav();
    go('dashboard');
    render();
    notify('Demodata hersteld.');
  }, { label: 'Demo herstellen', danger: true }),
  'close-modal': () => { if (!ui.modal?.busy) dialog.close(); },
  'dismiss-notice': () => { toast.hidden = true; },
  'retry': () => initialize(),
};

function ship(id) {
  commandModal('Verzending bevestigen', 'Boek de verzamelde verpakkingen af en verwerk de bijbehorende reservering.',
    'Verzending boeken', sales.shipSale, { id }, () => { go('verkoop', id); notify('Verzending en voorraadmutaties geboekt.'); });
}

document.addEventListener('click', event => {
  const trigger = event.target.closest('[data-action]');
  if (!trigger || trigger.disabled) return;
  const action = trigger.dataset.action;
  if (!store.state && action !== 'retry' && action !== 'dismiss-notice') return;
  if (action === 'add-line' || action === 'remove-line') {
    updateEditor(store.state, modalForm, ui.modal.config.editor, action, Number(trigger.dataset.index));
    return;
  }
  const [page, id] = route();
  actions[action]?.({ state: store.state, page, id, kind: page === 'klanten' ? 'customers' : 'suppliers', selected: trigger.dataset.id });
});

modalForm.addEventListener('submit', async event => {
  event.preventDefault();
  const modal = ui.modal;
  if (!modal || modal.busy) return;
  const submitButton = modalForm.querySelector('[type="submit"]');
  const error = modalForm.querySelector('[data-form-error]');
  modal.busy = true;
  submitButton.disabled = true;
  error.textContent = '';
  try {
    await modal.submit(modalForm, { generation: modal.generation, actionId: modal.actionId });
    dialog.close();
    root.querySelector('h1')?.focus({ preventScroll: true });
  } catch (cause) {
    error.textContent = readable(cause);
    error.focus();
  } finally {
    modal.busy = false;
    submitButton.disabled = false;
  }
});

modalForm.addEventListener('input', event => {
  if (ui.modal?.config.editor !== undefined && event.target.name !== 'partnerId') {
    updateEditor(store.state, modalForm, ui.modal.config.editor);
  }
});

modalForm.addEventListener('change', event => {
  if (event.target.name === 'partnerId' && ui.modal?.config.editor !== undefined) {
    updateEditor(store.state, modalForm, ui.modal.config.editor, 'partner');
  }
  if (event.target.name === 'targetKind' && ui.modal?.config.document) {
    modalForm.elements.targetId.innerHTML = documentOptions(store.state, event.target.value);
  }
});

dialog.addEventListener('cancel', event => { if (ui.modal?.busy) event.preventDefault(); });
dialog.addEventListener('close', () => { if (!dialog.open) ui.modal = null; });

function updateFilters(event) {
  const form = event.target.closest('[data-filter]');
  if (!form) return;
  const [page] = route();
  const filters = values(form);
  forms.set(page, filters);
  document.querySelector('#filter-results').innerHTML = filterViews[page](store.state, filters);
}
root.addEventListener('input', updateFilters);
root.addEventListener('change', event => {
  if (event.target.name === 'speak') ui.speak = event.target.checked;
});
root.addEventListener('submit', async event => {
  event.preventDefault();
  const form = event.target;
  if (form.matches('[data-assistant]')) submitAssistant(values(form).command);
  if (form.matches('[data-website]')) {
    const submit = form.querySelector('[type="submit"]');
    submit.disabled = true;
    try {
      await store.dispatch(catalog.saveWebsite, values(form));
      notify('Websiteteksten opgeslagen.');
    } catch (error) {
      notify(readable(error), true);
    } finally {
      submit.disabled = false;
    }
  }
});

nav.innerHTML = navigation.map(group => '<div class="nav-group"><span>' + esc(group.caption) + '</span>' +
  group.entries.map(([page, label, symbol]) => '<a data-page="' + page + '" href="#' + page + '">' + icon(symbol, 18) + '<span>' + esc(label) + '</span></a>').join('') + '</div>').join('');
document.querySelector('#nav-toggle').addEventListener('click', () => {
  const open = document.body.classList.toggle('nav-open');
  document.querySelector('#nav-toggle').setAttribute('aria-expanded', String(open));
  document.querySelector('.shell-content').inert = open;
  if (open) nav.querySelector('[aria-current]')?.focus();
});
document.querySelector('#nav-overlay').addEventListener('click', closeNav);
matchMedia('(max-width: 950px)').addEventListener('change', event => { if (!event.matches) closeNav(); });
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && document.body.classList.contains('nav-open')) {
    closeNav();
    document.querySelector('#nav-toggle').focus();
  }
});
document.querySelector('#nav-toggle').innerHTML = icon('menu');
document.querySelector('#reset-control').innerHTML = icon('reset', 17) + '<span>Demo herstellen</span>';
window.addEventListener('hashchange', routeChange);
document.querySelector('.skip-link').addEventListener('click', event => {
  event.preventDefault();
  (root.querySelector('h1') ?? document.querySelector('#main-content')).focus();
});
store.onChange(() => {
  const generation = store.state.generation;
  if (previousGeneration !== undefined && generation !== previousGeneration) {
    forms.clear();
    assistant.reset();
    ui.messages = [];
  }
  previousGeneration = generation;
  render();
});
store.onError(() => notify('Kon de laatste wijzigingen uit de lokale opslag niet laden.', true));

async function initialize() {
  root.innerHTML = '<div class="loading" role="status">Demogegevens laden…</div>';
  try {
    await store.refresh();
    [previousRoute] = route();
    render();
  } catch (error) {
    console.error('De Business Suite kon niet starten.', error);
    root.innerHTML = '<div class="load-error" role="alert"><h1>De demo kon niet laden</h1><p>Sta lokale browseropslag toe en probeer opnieuw.</p>' +
      button('retry', 'Opnieuw proberen', 'primary') + '</div>';
  }
}
initialize();
