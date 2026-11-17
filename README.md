# De Driekleur Business Suite

Interactief Nederlandstalig ERP-prototype voor een groothandel in oliën, vetten en smeermiddelen. De demonstratie omvat verkoop, voorraad, inkoop, magazijn, CRM, documenten, factuurconcepten en een websitepreview met zeven productnamen uit het officiële assortiment van De Driekleur Ede.

## Starten

Vereist Node.js 22.12 of hoger.

```sh
npm ci
npm run dev
```

Open de URL uit de terminal. Kies **Open productdemo** op het dashboard voor een ingevulde offerte en een aanvulscenario. De [demonstratiehandleiding](docs/DEMO.md) bevat de stappen en controlegetallen. Gebruik **Demo herstellen** om lokale wijzigingen te wissen. Gebruik uitsluitend fictieve gegevens.

In **Productdemo** staan directe acties voor verkoop, inkoop, artikelen en voorraad. **Modules & mogelijkheden** toont de beschikbare functies en het vervolgwerk. Zie [alle testbare mogelijkheden](docs/MODULES.md).

## Verifiëren

```sh
npm test
npx playwright install chromium
npm run e2e
npm run build
npm run preview
```

De statische build staat in `dist/`. Serveer die via HTTP. De websitepreview gebruikt dezelfde lokale opslag wanneer zij vanaf dezelfde origin wordt geopend. Er is geen externe service vereist voor de tekstworkflow.

[Documentatie-index](docs/README.md) · [Testresultaten](docs/TESTRESULTATEN.md) · [Beperkingen en productieroadmap](docs/ROADMAP.md)
