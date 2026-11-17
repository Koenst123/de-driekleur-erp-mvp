import { esc, button, pageHead, link } from './components.js';
import { icon } from './icons.js';
import { stockOf } from '../domain/stock.js';

function demoProduct(state, id, fallback) {
  return state.products.find(row => row.id === id) ?? state.products.find(row => row.id === fallback);
}

export function demoQuote(state) {
  const grease = demoProduct(state, 'MOBIL-XHP222-E18', 'SKF-LGMT2-E18');
  return {
    customerId: 'K-1', warehouseId: 'A', reference: 'Onderhoudsbestelling',
    lines: [{ productId: 'TEL-46-J20', quantity: 12 }, { productId: grease.id, quantity: 6 }],
  };
}

export function presentationPage(state) {
  const oil = demoProduct(state, 'DTE-EX46-J20', 'AWS-46-J20');
  const grease = demoProduct(state, 'MOBIL-XHP222-E18', 'SKF-LGMT2-E18');
  const available = stockOf(state, oil.id, 'A').available;
  const scenarios = [
    { symbol: 'sales', tone: 'blue', title: 'Van klantvraag naar levering',
      copy: '12 jerrycans Shell Tellus S2 MX 46 en 6 emmers ' + grease.name + ' voor Rijnland Machinebouw.',
      steps: ['Maak en druk de offerte af.', 'Registreer akkoord en bevestig de verkooporder.', 'Pick met de magazijnassistent, verzend en maak een factuurconcept.'],
      action: button('demo-quotation', 'Start met een ingevulde offerte', 'primary') },
    { symbol: 'purchase', tone: 'green', title: 'Van voorraadtekort naar aanvulling',
      copy: 'Voor ' + oil.name + ' zijn in Ede ' + available + ' jerrycans beschikbaar. Bekijk het voorstel en registreer een deelontvangst.',
      steps: ['Open de aanvulwerkvoorraad van magazijn A.', 'Maak het voorgestelde inkoopconcept en bevestig het.', 'Registreer een deelontvangst en controleer beschikbaar en verwacht.'],
      action: link('aanvullen', 'A', 'Bekijk het aanvulvoorstel', 'button primary') },
  ];
  return pageHead('Productdemo', 'Kies een proces en voer het uit met de opgeslagen demodata.',
    button('reset', 'Demo herstellen', 'secondary')) +
    '<div class="detail-grid">' + scenarios.map(row => '<section class="panel scenario-card">' +
      '<span class="metric-icon ' + esc(row.tone) + '">' + icon(row.symbol) + '</span><h2>' + esc(row.title) +
      '</h2><p>' + esc(row.copy) + '</p><ol>' + row.steps.map(step => '<li>' + esc(step) + '</li>').join('') +
      '</ol><div>' + row.action + '</div></section>').join('') + '</div>';
}
