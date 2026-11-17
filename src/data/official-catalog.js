import { movement } from '../domain/stock.js';

const base = 'https://www.dedriekleurede.nl/';

export const officialCatalog = [
  { id: 'TEL-46-J20', name: 'Shell Tellus S2 MX 46', brand: 'Shell', category: 'Hydrauliekolie', image: 'oil',
    url: base + 'shell-tellus-s2-mx-46.html' },
  { id: 'DTE-EX46-J20', name: 'MOBIL-DTE 10 EXCEL 46', brand: 'Mobil', category: 'Hydrauliekolie', image: 'oil',
    url: base + 'mobil-dte-10-excel-46.html', grade: 'ISO VG 46', packaging: 'Jerrycan', content: 20, unit: 'L',
    purchasePrice: 5400, salePrice: 7600, locationId: 'A-03-03', supplierId: 'L-2', minimum: 11, opening: [2, 0] },
  { id: 'MOBIL-XHP222-E18', name: 'MOBIL-GREASE XHP 222', brand: 'Mobil', category: 'Lagervet', image: 'grease',
    url: base + 'mobil-grease-xhp-222.html', grade: 'NLGI 2', packaging: 'Emmer', content: 18, unit: 'kg',
    purchasePrice: 3400, salePrice: 5000, locationId: 'A-04-03', supplierId: 'L-2', minimum: 8, opening: [12, 8] },
  { id: 'OMALA-GXV220-V208', name: 'Shell Omala S4 GXV 220', brand: 'Shell', category: 'Tandwielolie', image: 'drum',
    url: base + 'shell-omala-s4-gxv-220.html', grade: 'ISO VG 220', packaging: 'Vat', content: 208, unit: 'L',
    purchasePrice: 66000, salePrice: 91000, locationId: 'A-05-02', supplierId: 'L-1', minimum: 2, opening: [7, 3] },
  { id: 'QUARTZ-ECS-J05', name: 'Total Quartz Ineo ECS 5W/30', brand: 'Total', category: 'Motorolie', image: 'oil',
    url: base + 'total-quartz-ineo-ecs-5w-30.html', grade: '5W/30', packaging: 'Jerrycan', content: 5, unit: 'L',
    purchasePrice: 2700, salePrice: 4200, locationId: 'A-02-03', supplierId: 'L-4', minimum: 12, opening: [32, 16] },
  { id: 'RENOLIT-BFX-E18', name: 'FUCHS RENOLIT BFX', brand: 'Fuchs', category: 'Lagervet', image: 'grease',
    url: base + 'fuchs-renolit-bfx.html', grade: 'NLGI 2', packaging: 'Emmer', content: 18, unit: 'kg',
    purchasePrice: 8900, salePrice: 11700, locationId: 'A-04-04', supplierId: 'L-5', minimum: 6, opening: [17, 5] },
  { id: 'TEL-S2M32-J20', name: 'Shell Tellus S2 M 32', brand: 'Shell', category: 'Hydrauliekolie', image: 'oil',
    url: base + 'shell-tellus-s2-m-32.html', grade: 'ISO VG 32', packaging: 'Jerrycan', content: 20, unit: 'L',
    purchasePrice: 4600, salePrice: 6900, locationId: 'A-03-04', supplierId: 'L-1', minimum: 8, opening: [21, 10] },
];

const byId = new Map(officialCatalog.map(row => [row.id, row]));

export function catalogListing(product) {
  const listing = byId.get(product.id);
  return listing?.name === product.name ? listing : undefined;
}

export function addOfficialProducts(state) {
  for (const { url, image, opening, ...item } of officialCatalog) {
    if (!opening) continue;
    const barcode = 'DEMO-' + item.id;
    if (state.products.some(product => product.id === item.id || product.sku === item.id || product.barcode === barcode)) continue;
    state.products.push({ ...item, sku: item.id, barcode, description: 'Artikel uit het websiteassortiment met fictieve demoverpakking en handelsgegevens.',
      taxRate: 2100, verifiedPack: false, source: '' });
    opening.forEach((delta, index) => {
      if (!delta) return;
      movement(state, { productId: item.id, locationId: index ? 'B' + item.locationId.slice(1) : item.locationId,
        delta, type: 'Beginvoorraad', reference: 'DEMO-CATALOGUS', date: '2026-06-01T09:00:00.000Z' });
    });
  }
}
