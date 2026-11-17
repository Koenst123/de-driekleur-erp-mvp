import { esc, button, pageHead, link } from './components.js';
import { icon } from './icons.js';
import { stockOf } from '../domain/stock.js';

export const demoQuote = {
  customerId: 'K-1', warehouseId: 'A', reference: 'Onderhoudsbestelling',
  lines: [{ productId: 'TEL-46-J20', quantity: 12 }, { productId: 'SKF-LGMT2-E18', quantity: 6 }],
};

export function presentationPage(state) {
  const available = stockOf(state, 'AWS-46-J20', 'A').available;
  const scenarios = [
    { symbol: 'sales', tone: 'blue', title: 'Van klantvraag naar levering',
      copy: 'Rijnland Machinebouw vraagt 12 jerrycans hydrauliekolie en 6 emmers lagervet. Toon de prijsafspraak en volg de order tot het factuurconcept.',
      steps: ['Maak en druk de offerte af.', 'Registreer akkoord en bevestig de verkooporder.', 'Pick met de magazijnassistent, verzend en maak een factuurconcept.'],
      action: button('demo-quotation', 'Start met een ingevulde offerte', 'primary') },
    { symbol: 'purchase', tone: 'green', title: 'Van voorraadtekort naar aanvulling',
      copy: 'Voor Castrol Hyspin AWS 46 zijn in Ede ' + available + ' jerrycans beschikbaar. Bekijk het voorstel en controleer wat na een deelontvangst nog openstaat.',
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
