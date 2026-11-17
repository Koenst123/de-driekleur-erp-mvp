import { movement } from '../domain/stock.js';
import { saveSale, confirmSale, cancelSale, recordPick, finishPick, shipSale, invoiceSale, savePurchase, confirmPurchase, receivePurchase } from '../domain/orders.js';

export const SEED_VERSION = 1;
export const defaultWebsite = {
  heading: 'Oliën, vetten en smeermiddelen voor dagelijks vakwerk.',
  introduction: 'Bekijk een selectie hydrauliekoliën, lagervetten en tandwieloliën voor werkplaatsen en industriële toepassingen.',
  inquiry: 'Wilt u een artikel of verpakking bespreken? Stel uw vraag via uw gebruikelijke contactpersoon.',
};

const shell = 'https://www.shell-livedocs.com/data/published/en/38b9e152-7ef1-4eca-9ce2-a4bd8b9f0888.pdf';
const skf = 'https://cdn.skfmediahub.skf.com/api/public/0901d19680063637/pdf_preview_medium/0901d19680063637_pdf_preview_medium.pdf';
const castrol = 'https://msdspds.castrol.com/bpglis/FusionPDS.nsf/Files/BACB5AB1035ABA6380257796002FD1D1/%24File/456617_GB_en.pdf';
const fuchs = 'https://www.fuchs.com/fileadmin/us/extranet/files/industrial_division/pds/product_information/PI_RENOLIN_B_HVI.pdf';
const mobil = 'https://www.mobil.com/en/lubricants/for-businesses/industrial/lubricants/equipment-builders/tbm';
const total = 'https://lubricants.catalog.totalenergies.com/catalogue-uk/en_UK/161_azolla-zs-46';

const oils = [
  ['TEL-46', 'Shell Tellus S2 MX 46', 'Shell', 'Hydrauliekolie', 'ISO VG 46', shell],
  ['AWS-46', 'Castrol Hyspin AWS 46', 'Castrol', 'Hydrauliekolie', 'ISO VG 46', castrol],
  ['AWS-32', 'Castrol Hyspin AWS 32', 'Castrol', 'Hydrauliekolie', 'ISO VG 32', castrol],
  ['AWS-68', 'Castrol Hyspin AWS 68', 'Castrol', 'Hydrauliekolie', 'ISO VG 68', castrol],
  ['REN-46', 'FUCHS RENOLIN B 46 HVI', 'FUCHS', 'Hydrauliekolie', 'ISO VG 46', fuchs],
  ['REN-32', 'FUCHS RENOLIN B 32 HVI', 'FUCHS', 'Hydrauliekolie', 'ISO VG 32', fuchs],
  ['REN-22', 'FUCHS RENOLIN B 22 HVI', 'FUCHS', 'Hydrauliekolie', 'ISO VG 22', fuchs],
  ['DTE-25', 'Mobil DTE 25 Ultra', 'Mobil', 'Hydrauliekolie', 'ISO VG 46', mobil],
  ['MOB-220', 'Mobilgear 600 XP 220', 'Mobil', 'Tandwielolie', 'ISO VG 220', mobil],
  ['AZO-46', 'TotalEnergies AZOLLA ZS 46', 'TotalEnergies', 'Hydrauliekolie', 'ISO VG 46', total],
  ['AWS-22', 'Castrol Hyspin AWS 22', 'Castrol', 'Hydrauliekolie', 'ISO VG 22', castrol],
];

const customerNames = ['Rijnland Machinebouw', 'Werkplaats De Kade', 'Veluwe Techniekgroep', 'Noordlijn Transport',
  'Kranenservice Meerzicht', 'Delta Hydrauliekservice', 'Werkbus Onderhoud', 'Kanaalstaal Werkplaats',
  'Havenmontage Binnenland', 'Polderwerktuig Service', 'Atlas Lagertechniek', 'IJssel Fleetservice',
  'Westpoort Machineonderhoud', 'Groenveld Technische Dienst', 'Merwede Constructies', 'Oostrand Werkmaterieel',
  'Zilveras Revisie', 'Houtwerf Onderhoud', 'Bergse Transporttechniek', 'Uiterwaard Industrie'];

export function createSeed() {
  const state = {
    seedVersion: SEED_VERSION, revision: 0, generation: 0, actions: {},
    counters: { product: 60, customers: 20, suppliers: 10, opportunity: 2, sale: 0, purchase: 0, receipt: 0, invoice: 0, movement: 0, document: 3 },
    products: [], customers: [], suppliers: [], locations: [], balances: [], sales: [], picks: [],
    purchases: [], receipts: [], invoices: [], movements: [], documents: [],
    warehouses: [{ id: 'A', name: 'Magazijn A · Ede' }, { id: 'B', name: 'Magazijn B · Reserve' }],
    website: { ...defaultWebsite },
  };
  for (const warehouse of state.warehouses) {
    for (let aisle = 1; aisle <= 5; aisle++) {
      for (let shelf = 1; shelf <= 4; shelf++) {
        const code = warehouse.id + '-0' + aisle + '-0' + shelf;
        state.locations.push({ id: code, code, warehouseId: warehouse.id });
      }
    }
  }
  const oilVariants = [['F01', 'Fles', 1], ['J05', 'Jerrycan', 5], ['J20', 'Jerrycan', 20], ['V60', 'Vat', 60], ['V208', 'Vat', 208]];
  const greaseVariants = [['T02', 'Tube', 0.2], ['B01', 'Blik', 1], ['B05', 'Blik', 5], ['E18', 'Emmer', 18], ['V50', 'Vat', 50]];
  const families = [...oils, ['SKF-LGMT2', 'SKF LGMT 2', 'SKF', 'Lagervet', 'NLGI 2', skf]];
  families.forEach(([prefix, name, brand, category, grade, source], family) => {
    const grease = brand === 'SKF';
    (grease ? greaseVariants : oilVariants).forEach(([suffix, packaging, content], variant) => {
      const index = state.products.length + 1;
      const sku = prefix + '-' + suffix;
      state.products.push({
        id: sku, sku, name, brand, category, grade, source, packaging, content, unit: grease ? 'kg' : 'L',
        description: category + ' voor de demonstratiecatalogus.',
        verifiedPack: grease, purchasePrice: Math.round((14 + family * 2 + content * 2) * 100),
        salePrice: Math.round((22 + family * 2 + content * 3) * 100),
        taxRate: 2100, supplierId: 'L-' + (1 + family % 10), barcode: 'DEMO-' + sku,
        locationId: 'A-0' + (1 + Math.floor((index - 1) % 20 / 4)) + '-0' + (1 + (index - 1) % 4),
        minimum: 8 + index % 5,
      });
    });
  });
  const hydraulic = state.products.find(item => item.id === 'TEL-46-J20');
  const grease = state.products.find(item => item.id === 'SKF-LGMT2-E18');
  Object.assign(hydraulic, { salePrice: 8500, purchasePrice: 5800, locationId: 'A-03-02' });
  Object.assign(grease, { salePrice: 5000, purchasePrice: 3400, locationId: 'A-04-02' });
  const shortage = state.products.find(item => item.id === 'AWS-46-J20');

  const cities = ['Ede', 'Veenendaal', 'Arnhem', 'Wageningen', 'Barneveld', 'Amersfoort'];
  state.customers = customerNames.map((name, index) => ({
    id: 'K-' + (index + 1), name, city: cities[index % cities.length], contact: 'Inkoopteam ' + (index + 1),
    email: 'klant' + (index + 1) + '@example.test', notes: index % 3 === 0 ? 'Levering op werkdagen · demonstratieafspraak.' : '',
    prices: index === 0 ? { [hydraulic.id]: 8000 } : {},
    opportunities: index < 2 ? [{ id: 'VK-' + (index + 1), title: 'Raamorder onderhoudsartikelen', stage: index ? 'Open' : 'Offerte' }] : [],
  }));
  state.suppliers = ['Oliepartners', 'Smeerstoffen Distributie', 'Bedrijfsstoffen Service', 'Technische Handel', 'Lager & Smering',
    'Industriële Olie', 'Werkplaats Distributie', 'Bulk & Vat', 'Machinevloeistoffen', 'Techniek Depot'].map((name, index) => ({
    id: 'L-' + (index + 1), name: 'Demo ' + name, city: cities[index % cities.length], contact: 'Orderdesk',
    email: 'leverancier' + (index + 1) + '@example.test', notes: '', leadDays: 2 + index % 6,
  }));

  const opening = '2026-06-01T08:00:00.000Z';
  state.products.forEach((product, index) => {
    const amounts = product === hydraulic ? [24, 18] : product === grease ? [12, 8] : product === shortage ? [2, 0] :
      index % 10 === 0 ? [4, 1] : [28 + index % 23, 11 + index % 7];
    amounts.forEach((delta, warehouse) => {
      if (delta) movement(state, { productId: product.id, locationId: warehouse ? 'B' + product.locationId.slice(1) : product.locationId,
        delta, type: 'Beginvoorraad', reference: 'DEMO-OPEN', date: opening });
    });
  });
  const history = state.products.filter(item => ![hydraulic, grease, shortage].includes(item));
  for (let index = 0; index < 30; index++) {
    const date = new Date(Date.UTC(2026, 5, 10 + index * 5, 9)).toISOString();
    const warehouseId = index % 6 === 0 ? 'B' : 'A';
    const lines = [history[(index * 3) % history.length], history[(index * 3 + 1) % history.length]].map((item, line) => ({
      productId: item.id, quantity: 1 + (index + line) % 3,
    }));
    const id = saveSale(state, { customerId: 'K-' + (index % 20 + 1), warehouseId, lines }, date);
    if (index === 27) cancelSale(state, { id }, date);
    if (index >= 25) continue;
    const pickId = confirmSale(state, { id }, date);
    const pick = state.picks.find(item => item.id === pickId);
    if (index >= 21) continue;
    for (const line of pick.lines) {
      const product = history.find(item => item.id === line.productId);
      recordPick(state, { id: pickId, lineId: line.id, amount: line.quantity, barcode: product.barcode, expectedPicked: 0 });
    }
    finishPick(state, { id: pickId }, date);
    if (index < 20) {
      shipSale(state, { id }, date);
      invoiceSale(state, { id }, date);
    }
  }
  for (let index = 0; index < 15; index++) {
    const product = history[index * 3];
    const date = new Date(Date.UTC(2026, 8, 10 + index * 3, 10)).toISOString();
    const id = savePurchase(state, { supplierId: product.supplierId, warehouseId: 'A', lines: [{ productId: product.id, quantity: 10 + index }] }, date);
    if (index >= 13) continue;
    confirmPurchase(state, { id });
    if (index >= 11) continue;
    receivePurchase(state, { id, lines: [{ lineId: product.id, locationId: product.locationId, amount: index < 8 ? 10 + index : 4, expectedReceived: 0 }] }, date);
  }
  state.documents = [
    { id: 'D-1', title: 'Voorbeeld artikelblad hydrauliekolie', category: 'Technisch', targetKind: 'products', targetId: hydraulic.id, sample: 'artikel', date: opening },
    { id: 'D-2', title: 'Voorbeeld leverafspraak', category: 'Klant', targetKind: 'customers', targetId: 'K-1', sample: 'relatie', date: opening },
    { id: 'D-3', title: 'Voorbeeld verzendbon', category: 'Order', targetKind: 'sales', targetId: state.sales[0].id, sample: 'order', date: opening },
  ];
  return state;
}
