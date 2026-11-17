import { esc, link, panel, pageHead } from './components.js';

export const modules = [
  { title: 'Verkoop & CRM', page: 'offertes',
    works: 'Offertes maken, printen, klantakkoord, herhaalorder, prijsafspraken, reserveren, picken, verzenden en klantretour.',
    next: 'Klantportaal, online ondertekenen, verzenddiensten, deelzendingen en uitgebreid verkoopforecasting.',
    links: [['offertes', 'Offertes'], ['verkoop', 'Verkooporders'], ['klanten', 'Klanten & CRM']] },
  { title: 'Voorraad & magazijn', page: 'voorraad',
    works: 'Locatievoorraad, correcties, interne verplaatsingen, barcodes, deelpicks, mutaties en min/max-aanvulling.',
    next: 'Partijen, serienummers, houdbaarheid, routes, voorraadwaarderingsmethoden en geautomatiseerde aanvulling.',
    links: [['voorraad', 'Voorraad'], ['verplaatsingen', 'Verplaatsingen'], ['magazijn', 'Picken'], ['aanvullen', 'Aanvullen']] },
  { title: 'Inkoop', page: 'inkoop',
    works: 'Inkoopconcept, bevestiging, deelontvangsten, ontvangsthistorie en voorraad aanvullen.',
    next: 'Meerdere leveranciersprijzen, goedkeuringslimieten, leveranciersfacturen en automatische bestellingen.',
    links: [['inkoop', 'Inkooporders'], ['leveranciers', 'Leveranciers']] },
  { title: 'Contacten & artikelen', page: 'artikelen',
    works: 'Toevoegen en wijzigen, categorieën, verpakkingen, contactgegevens, notities, prijzen en export naar CSV.',
    next: 'Gevalideerde imports, dubbele relaties samenvoegen, meerdere adressen en uitgebreide productvarianten.',
    links: [['artikelen', 'Artikelen'], ['klanten', 'Klanten'], ['leveranciers', 'Leveranciers']] },
  { title: 'Financieel', page: 'financieel',
    works: 'Factuurconcepten, regel-btw, klanthistorie en omzet uit verzonden orders.',
    next: 'Grootboek, betalingen, bankafstemming, creditnota’s, btw-aangifte en aansluiting op CASH.',
    links: [['financieel', 'Factuurconcepten']] },
  { title: 'Documenten & website', page: 'documenten',
    works: 'Gekoppelde voorbeeldbestanden, categorieën en bewerkbare teksten voor de lokale websitepreview.',
    next: 'Eigen bestanden uploaden, versies, toegangsrechten, volledig CMS en online publicatieworkflow.',
    links: [['documenten', 'Documenten'], ['website', 'Websiteteksten']] },
  { title: 'Dashboard', page: 'dashboard',
    works: 'Omzet, open orders, voorraadwaarde, minimumvoorraad, actieve picks, mutaties en bestverkochte artikelen.',
    next: 'Vrij configureerbare rapporten, spreadsheets, historische marges en rapportages per medewerker.',
    links: [['dashboard', 'Dashboard']] },
];

export function modulesPage() {
  return pageHead('Modules & mogelijkheden', 'Bekijk wat je kunt uitvoeren en welke uitbreiding per module nog nodig is.') +
    '<div class="module-grid">' + modules.map(module => panel(module.title,
      '<div class="module-copy"><h3>Nu uitproberen</h3><p>' + esc(module.works) +
      '</p><div class="actions">' + module.links.map(([page, label]) => link(page, '', label, 'button secondary')).join('') +
      '</div><h3>Verdere ontwikkeling</h3><p>' + esc(module.next) + '</p></div>')).join('') + '</div>';
}
