import { test, expect } from '@playwright/test';

async function navigate(page, label) {
  const toggle = page.getByRole('button', { name: 'Navigatie openen' });
  if (await toggle.isVisible()) await toggle.click();
  await page.getByRole('navigation').getByRole('link', { name: label, exact: true }).click();
}

const dialog = page => page.getByRole('dialog');
const modalButton = (page, name) => dialog(page).getByRole('button', { name, exact: true });
const labelAmount = (page, name) => dialog(page).getByLabel(name);
const ui = page => page.getByRole('main');

async function confirm(page, button, confirmation = 'Bevestigen') {
  await ui(page).getByRole('button', { name: button, exact: true }).click();
  await modalButton(page, confirmation).click();
}

async function chooseLine(page, index, article, amount) {
  const line = dialog(page).getByRole('group', { name: 'Artikelregel ' + index });
  await line.getByRole('combobox', { name: 'Artikel', exact: true }).selectOption(article);
  await line.getByLabel('Aantal', { exact: true }).fill(String(amount));
}

async function workspace(page) {
  return page.evaluate(async () => {
    const { repository } = await import('/src/data/repository.js');
    return repository.load();
  });
}

function stock(state, id) {
  const row = state.balances.find(item => item.productId === id && item.locationId.startsWith('A-'));
  return [row.physical, row.reserved, row.physical - row.reserved];
}

test.beforeEach(async ({ page }) => {
  const diagnostics = [];
  page.on('console', message => { if (message.type() === 'error') diagnostics.push(message.text()); });
  page.on('pageerror', error => diagnostics.push(error.message));
  await page.goto('/');
  try {
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  } catch (error) {
    throw new Error(diagnostics.join('\n') || 'Dashboard is niet geladen.', { cause: error });
  }
});

test('verkoop van 12 jerrycans en 6 emmers, assistent, verzending en factuur', async ({ page }, testInfo) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const before = await workspace(page);
  const revenue = await page.getByTestId('revenue').textContent();
  await page.screenshot({ path: testInfo.outputPath('dashboard.png'), animations: 'disabled' });
  await navigate(page, 'Klanten & CRM');
  await ui(page).getByLabel('Zoeken').fill('Rijnland');
  await ui(page).getByRole('link', { name: 'Rijnland Machinebouw' }).click();
  await ui(page).getByRole('button', { name: 'Nieuwe verkooporder' }).click();
  await chooseLine(page, 1, 'TEL-46-J20', 12);
  await modalButton(page, 'Artikelregel toevoegen').click();
  await chooseLine(page, 2, 'MOBIL-XHP222-E18', 6);
  await expect(dialog(page)).toContainText(/1\.524,60/);
  await modalButton(page, 'Concept opslaan').click();
  await expect(ui(page).getByRole('heading', { name: /^SO-/ })).toBeVisible();
  await confirm(page, 'Order bevestigen');
  await expect(ui(page).getByText('Bevestigd', { exact: true })).toBeVisible();
  expect(stock(await workspace(page), 'TEL-46-J20')).toEqual([24, 12, 12]);
  await page.reload();
  await expect(ui(page).getByText('Bevestigd', { exact: true })).toBeVisible();
  await ui(page).getByRole('link', { name: 'Open pickopdracht' }).click();
  await ui(page).getByRole('button', { name: 'Magazijnassistent' }).click();
  await page.screenshot({ path: testInfo.outputPath('magazijnassistent.png'), animations: 'disabled' });

  const command = async text => {
    await ui(page).getByLabel('Commando of barcode').fill(text);
    await ui(page).getByRole('button', { name: 'Verstuur' }).click();
    await expect(ui(page).getByRole('button', { name: 'Verstuur' })).toBeEnabled();
  };
  await command('Drie gepakt');
  await expect(ui(page).getByText('Bevestig de barcode', { exact: false })).toBeVisible();
  await command('DEMO-FOUT');
  await expect(ui(page).getByText('Onjuiste barcode', { exact: false })).toBeVisible();
  await expect(ui(page).getByText('0 van 18 verpakkingen')).toBeVisible();
  await command('DEMO-TEL-46-J20');
  await expect(ui(page).getByText('3 van 18 verpakkingen')).toBeVisible();
  await command('9 gepakt');
  await command('DEMO-TEL-46-J20');
  await ui(page).getByRole('button', { name: 'Barcode invoeren voor MOBIL-XHP222-E18' }).click();
  await labelAmount(page, 'Barcode').fill('DEMO-MOBIL-XHP222-E18');
  await modalButton(page, 'Scan registreren').click();
  await expect(ui(page).getByText('18 van 18 verpakkingen')).toBeVisible();
  expect(stock(await workspace(page), 'TEL-46-J20')).toEqual([24, 12, 12]);
  await confirm(page, 'Pickopdracht afronden', 'Pick afronden');
  await confirm(page, 'Verzending bevestigen', 'Verzending boeken');
  await expect(ui(page).getByText('Verzonden', { exact: true })).toBeVisible();
  const shipped = await workspace(page);
  expect(stock(shipped, 'TEL-46-J20')).toEqual([12, 0, 12]);
  expect(stock(shipped, 'MOBIL-XHP222-E18')).toEqual([6, 0, 6]);
  expect(shipped.movements.slice(before.movements.length).map(row => row.delta)).toEqual([-12, -6]);
  await confirm(page, 'Factuurconcept genereren', 'Factuurconcept maken');
  await expect(ui(page).getByRole('heading', { name: /^FC-/ })).toBeVisible();
  await expect(ui(page)).toContainText(/1\.524,60/);
  await expect(ui(page).getByText(/vervangt CASH/)).toBeVisible();
  await navigate(page, 'Dashboard');
  await expect(page.getByTestId('revenue')).not.toHaveText(revenue);
  await navigate(page, 'Voorraad');
  await ui(page).getByRole('link', { name: 'Mutaties', exact: true }).click();
  await expect(ui(page).getByRole('row').filter({ hasText: 'TEL-46-J20' }).first()).toContainText('Verzending');
  expect(errors).toEqual([]);
});

test('magazijnverplaatsing, klantretour, herhaalorder en CSV zijn uitvoerbaar', async ({ page }, testInfo) => {
  test.setTimeout(45000);
  await ui(page).getByRole('link', { name: 'Open productdemo' }).click();
  await ui(page).getByRole('button', { name: 'Voorraad verplaatsen', exact: true }).click();
  await dialog(page).getByRole('combobox', { name: 'Artikel', exact: true }).selectOption('TEL-46-J20');
  await dialog(page).getByLabel('Van locatie').selectOption('A-03-02');
  await dialog(page).getByLabel('Naar locatie').selectOption('B-03-02');
  await dialog(page).getByLabel('Aantal verpakkingen').fill('4');
  await dialog(page).getByLabel('Reden', { exact: true }).fill('Voorraad verdelen voor test');
  await modalButton(page, 'Verplaatsing boeken').click();
  await expect(ui(page).getByRole('heading', { name: 'Verplaatsingen', exact: true })).toBeVisible();
  await expect(ui(page).getByRole('row').filter({ hasText: 'Voorraad verdelen voor test' })).toContainText('MV-');
  let state = await workspace(page);
  expect(stock(state, 'TEL-46-J20')).toEqual([20, 0, 20]);
  expect(state.balances.find(row => row.productId === 'TEL-46-J20' && row.locationId === 'B-03-02').physical).toBe(22);
  await page.reload();
  await expect(ui(page).getByRole('row').filter({ hasText: 'Voorraad verdelen voor test' })).toBeVisible();

  state = await workspace(page);
  const shipped = state.sales.find(order => order.status === 'verzonden' && order.lines[0].quantity > 1);
  const product = state.products.find(row => row.id === shipped.lines[0].productId);
  const physical = state.balances.filter(row => row.productId === product.id).reduce((sum, row) => sum + row.physical, 0);
  await page.goto('/#verkoop/' + shipped.id);
  await ui(page).getByRole('button', { name: 'Retour ontvangen', exact: true }).click();
  await dialog(page).getByLabel('Retourreden').fill('Ongebruikte verpakking terug');
  await dialog(page).getByRole('group').first().getByLabel('Retouraantal').fill('1');
  await modalButton(page, 'Retour boeken').click();
  await expect(ui(page).getByRole('row').filter({ hasText: 'Ongebruikte verpakking terug' })).toContainText('RT-');
  state = await workspace(page);
  expect(state.balances.filter(row => row.productId === product.id).reduce((sum, row) => sum + row.physical, 0)).toBe(physical + 1);
  await confirm(page, 'Herhaalorder maken', 'Herhaalorder maken');
  await expect(ui(page).getByRole('heading', { name: /^SO-/ })).toBeVisible();
  await expect(ui(page).getByText('Herhaalorder van', { exact: false })).toBeVisible();
  const repeat = (await workspace(page)).sales.at(-1);
  expect(repeat.sourceOrderId).toBe(shipped.id);
  expect(repeat.status).toBe('concept');

  await navigate(page, 'Artikelen');
  const downloadPromise = page.waitForEvent('download');
  await ui(page).getByRole('button', { name: 'Export alles (CSV)', exact: true }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('driekleur-artikelen.csv');
  expect(await download.failure()).toBeNull();

  await navigate(page, 'Modules & mogelijkheden');
  await expect(ui(page).getByRole('heading', { name: 'Financieel', exact: true })).toBeVisible();
  await expect(ui(page)).toContainText('Grootboek');
  await page.screenshot({ path: testInfo.outputPath('modules.png'), animations: 'disabled' });
});

test('deelontvangsten vullen een voorraadtekort aan zonder deelreservering', async ({ page }) => {
  await ui(page).getByRole('button', { name: 'Nieuwe verkooporder' }).click();
  await labelAmount(page, 'Klant').selectOption('K-1');
  await chooseLine(page, 1, 'DTE-EX46-J20', 8);
  await expect(dialog(page)).toContainText('Onvoldoende voorraad');
  await modalButton(page, 'Concept opslaan').click();
  await expect(ui(page).getByRole('heading', { name: /^SO-/ })).toBeVisible();
  const saleUrl = page.url();
  const before = await workspace(page);
  await confirm(page, 'Order bevestigen');
  await expect(dialog(page).getByRole('alert')).toContainText('2 van 8 beschikbaar');
  expect(await workspace(page)).toEqual(before);
  await modalButton(page, 'Terug').click();
  await navigate(page, 'Inkoop');
  await ui(page).getByRole('button', { name: 'Nieuwe inkooporder' }).click();
  await labelAmount(page, 'Leverancier').selectOption('L-2');
  await chooseLine(page, 1, 'DTE-EX46-J20', 8);
  await modalButton(page, 'Concept opslaan').click();
  await expect(ui(page).getByRole('heading', { name: /^PO-/ })).toBeVisible();
  const purchaseUrl = page.url();
  await confirm(page, 'Bestelling bevestigen');
  const receive = async amount => {
    await ui(page).getByRole('button', { name: 'Ontvangst registreren' }).click();
    await labelAmount(page, /Ontvangstaantal/).fill(String(amount));
    await modalButton(page, 'Ontvangst boeken').click();
  };
  await receive(2);
  await expect(ui(page).getByText('Gedeeltelijk ontvangen', { exact: true })).toBeVisible();
  expect(stock(await workspace(page), 'DTE-EX46-J20')).toEqual([4, 0, 4]);
  await page.goto(saleUrl);
  await confirm(page, 'Order bevestigen');
  await expect(dialog(page).getByRole('alert')).toContainText('4 van 8 beschikbaar');
  await page.goto(purchaseUrl);
  await receive(6);
  await expect(ui(page).getByText('Ontvangen', { exact: true }).and(ui(page).locator('.badge'))).toBeVisible();
  expect(stock(await workspace(page), 'DTE-EX46-J20')).toEqual([10, 0, 10]);
  await page.goto(saleUrl);
  await confirm(page, 'Order bevestigen');
  await expect(ui(page).getByText('Bevestigd', { exact: true })).toBeVisible();
  expect(stock(await workspace(page), 'DTE-EX46-J20')).toEqual([10, 8, 2]);
  await confirm(page, 'Order annuleren', 'Order annuleren');
  await expect(ui(page).getByText('Geannuleerd', { exact: true })).toBeVisible();
  expect(stock(await workspace(page), 'DTE-EX46-J20')).toEqual([10, 0, 10]);
});

test('artikel en klant beheren, website bewaren, toetsenbord en demo herstellen', async ({ page }) => {
  await navigate(page, 'Artikelen');
  await ui(page).getByRole('button', { name: 'Nieuw artikel' }).click();
  await expect(dialog(page)).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog(page)).not.toBeVisible();
  await ui(page).getByRole('button', { name: 'Nieuw artikel' }).click();
  for (const [name, value] of [
    ['Artikelnaam', 'Werkplaatsdemolie'], ['SKU', 'TEST-OLIE'], ['Categorie', 'Hydrauliekolie'],
    ['Demobarcode', 'DEMO-TEST-OLIE'], ['Verpakkingstype', 'Jerrycan'], ['Verpakkingsinhoud', '20'],
    ['Inkoopprijs (€)', '40'], ['Verkoopprijs (€)', '50'],
  ]) await labelAmount(page, name).fill(value);
  await modalButton(page, 'Opslaan').click();
  await expect(ui(page).getByRole('heading', { name: 'Werkplaatsdemolie' })).toBeVisible();
  await ui(page).getByRole('button', { name: 'Artikel wijzigen' }).click();
  await labelAmount(page, 'Verkoopprijs (€)').fill('55');
  await modalButton(page, 'Opslaan').click();
  await expect(ui(page).getByText(/55,00/)).toBeVisible();
  await expect(ui(page).getByRole('img', { name: /Illustratieve/ })).toBeVisible();
  await navigate(page, 'Klanten & CRM');
  await ui(page).getByRole('button', { name: 'Nieuwe klant' }).click();
  await labelAmount(page, 'Bedrijfsnaam').fill('Voorbeeld Machinebedrijf');
  await modalButton(page, 'Opslaan').click();
  await expect(ui(page).getByRole('heading', { name: 'Voorbeeld Machinebedrijf' })).toBeVisible();
  await page.reload();
  await expect(ui(page).getByRole('heading', { name: 'Voorbeeld Machinebedrijf' })).toBeVisible();

  await navigate(page, 'Website');
  await ui(page).getByLabel('Hoofdtitel').fill('Een nieuwe demotitel');
  await ui(page).getByRole('button', { name: 'Websiteteksten opslaan' }).click();
  await expect(page.getByRole('status')).toContainText('Websiteteksten opgeslagen');
  const preview = await page.context().newPage();
  await preview.goto('/website.html');
  await expect(preview.getByRole('heading', { name: 'Een nieuwe demotitel' })).toBeVisible();
  await preview.close();

  await navigate(page, 'Dashboard');
  const toggle = page.getByRole('button', { name: 'Navigatie openen' });
  if (await toggle.isVisible()) await toggle.click();
  await page.getByRole('button', { name: 'Demo herstellen', exact: true }).click();
  await modalButton(page, 'Demo herstellen').click();
  await expect(ui(page).getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  await expect(page.getByRole('status')).toContainText('Demodata hersteld');
  const state = await workspace(page);
  expect(state.products).toHaveLength(66);
  expect(state.customers).toHaveLength(20);
  expect(state.website.heading).not.toBe('Een nieuwe demotitel');
});

test('productdemo maakt een printbare offerte en een aanvuladvies uit actuele voorraad', async ({ page }, testInfo) => {
  test.setTimeout(45000);
  await ui(page).getByRole('link', { name: 'Open productdemo' }).click();
  await expect(ui(page).getByRole('heading', { name: 'Productdemo' })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('productdemo.png'), animations: 'disabled' });
  await ui(page).getByRole('button', { name: 'Start met een ingevulde offerte' }).click();
  await expect(dialog(page)).toContainText(/1\.524,60/);
  await modalButton(page, 'Offerte opslaan').click();
  await expect(ui(page).getByRole('heading', { name: /^OF-/ })).toBeVisible();
  const quoteUrl = page.url();
  await confirm(page, 'Offerte uitbrengen', 'Uitbrengen');
  await expect(ui(page).getByText('Uitgebracht', { exact: true }).and(ui(page).locator('.badge'))).toBeVisible();
  await page.emulateMedia({ media: 'print' });
  await expect(ui(page).getByRole('heading', { name: /^Offerte OF-/ })).toBeVisible();
  await expect(page.getByRole('navigation')).not.toBeVisible();
  await page.emulateMedia({ media: 'screen' });
  await confirm(page, 'Klantakkoord registreren', 'Akkoord vastleggen');
  await expect(ui(page).getByRole('heading', { name: /^SO-/ })).toBeVisible();
  const orderUrl = page.url();
  await expect(ui(page).getByRole('link', { name: /^OF-/ })).toBeVisible();
  expect(stock(await workspace(page), 'TEL-46-J20')).toEqual([24, 0, 24]);
  await page.goto(quoteUrl);
  await expect(ui(page).getByRole('link', { name: 'Open verkooporder' })).toBeVisible();
  await page.goto(orderUrl);
  await confirm(page, 'Order bevestigen');
  await expect(ui(page).getByRole('link', { name: 'Open pickopdracht' })).toBeVisible();
  expect(stock(await workspace(page), 'TEL-46-J20')).toEqual([24, 12, 12]);

  await navigate(page, 'Voorraad aanvullen');
  const row = ui(page).getByRole('row').filter({ hasText: 'DTE-EX46-J20' });
  await expect(row).toContainText('20 bestellen');
  await row.getByRole('button', { name: 'Inkoopconcept maken' }).click();
  await modalButton(page, 'Concept maken').click();
  await expect(ui(page).getByRole('heading', { name: /^PO-/ })).toBeVisible();
  const purchaseUrl = page.url();
  await ui(page).getByRole('link', { name: 'Voorraad aanvullen', exact: true }).click();
  await expect(row.getByRole('link', { name: 'Open inkoopconcept' })).toBeVisible();
  await row.getByRole('link', { name: 'Open inkoopconcept' }).click();
  await confirm(page, 'Bestelling bevestigen');
  await ui(page).getByRole('button', { name: 'Ontvangst registreren' }).click();
  await labelAmount(page, /Ontvangstaantal/).fill('2');
  await modalButton(page, 'Ontvangst boeken').click();
  await expect(ui(page).getByText('Gedeeltelijk ontvangen', { exact: true })).toBeVisible();
  await ui(page).getByRole('link', { name: 'Voorraad aanvullen', exact: true }).click();
  await expect(row).toContainText('Op termijn op peil');
  for (const value of ['4', '18', '22']) await expect(row.getByRole('cell', { name: value, exact: true })).toBeVisible();
  const purchase = (await workspace(page)).purchases.find(item => purchaseUrl.endsWith(item.id));
  expect(purchase.lines[0]).toMatchObject({ quantity: 20, received: 2 });
});

test('huisstijl, catalogus en alle hoofdschermen blijven bruikbaar', async ({ page }, testInfo) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  for (const [label, title] of [
    ['Offertes', 'Offertes'], ['Verkoop', 'Verkoop'], ['Inkoop', 'Inkoop'], ['Artikelen', 'Artikelen'],
    ['Voorraad', 'Voorraad'], ['Voorraad aanvullen', 'Voorraad aanvullen'], ['Magazijn', 'Magazijn'],
    ['Klanten & CRM', 'Klanten'], ['Leveranciers', 'Leveranciers'], ['Financieel', 'Financieel'],
    ['Documenten', 'Documenten'], ['Website', 'Website'],
  ]) {
    await navigate(page, label);
    await expect(ui(page).getByRole('heading', { name: title, exact: true })).toBeVisible();
  }

  await navigate(page, 'Artikelen');
  await ui(page).getByRole('combobox', { name: 'Herkomst' }).selectOption('official');
  await expect(ui(page).getByText('7 artikelen', { exact: true })).toBeVisible();
  await ui(page).getByRole('link', { name: 'Shell Omala S4 GXV 220' }).click();
  await expect(ui(page).getByRole('link', { name: 'Productpagina De Driekleur Ede', exact: false }))
    .toHaveAttribute('href', 'https://www.dedriekleurede.nl/shell-omala-s4-gxv-220.html');

  await page.goto('/website.html');
  await expect(ui(page).getByRole('heading', { level: 1 })).toContainText('Oliën, vetten en smeermiddelen');
  const hero = ui(page).getByRole('img', { name: /Illustratieve magazijnfoto/ });
  await expect.poll(() => hero.evaluate(image => image.naturalWidth)).toBeGreaterThan(0);
  const product = ui(page).getByRole('article').filter({ hasText: 'MOBIL-GREASE XHP 222' });
  await product.scrollIntoViewIfNeeded();
  await expect.poll(() => product.getByRole('img').evaluate(image => image.naturalWidth)).toBeGreaterThan(0);
  await expect(product.getByRole('link')).toHaveAttribute('href', 'https://www.dedriekleurede.nl/mobil-grease-xhp-222.html');
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: testInfo.outputPath('websitepreview.png'), animations: 'disabled' });

  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.getByRole('link', { name: 'Open productdemo' }).click();
  await expect(ui(page).getByRole('heading', { name: 'Productdemo', exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  expect(errors).toEqual([]);
});
