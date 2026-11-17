# Testresultaten

Uitgevoerd op 17 november 2026 op Windows met Node.js 22.23.5 en Chromium 145.0.7632.6.

| Controle | Resultaat |
| --- | --- |
| `npm test` | 15 geslaagde domeintests. Ook offertestatus, behoud van offerteprijzen, werkruimte-upgrade en aanvuladvies na deelontvangst. |
| `npm run e2e -- --workers=2` | 10 geslaagde browsertests. Vijf scenario’s elk op 1440 × 1000 en op 834 × 1112 met touch-emulatie. De websitepreview en ingang van de productdemo zijn ook op 390 × 844 getest. |
| `npm run build` | Statische productiebuild met beide pagina’s en voorbeeldbestanden. |
| `npm audit --omit=dev` | Geen kwetsbaarheden in npm-runtimeafhankelijkheden. |

De browsertests controleren voorraad na reservering, picking, verzending en deelontvangst. Ze toetsen ook een afgewezen orderbevestiging zonder opgeslagen wijzigingen, barcodeafwijzing, annulering, toevoegen en wijzigen van artikelen, klant aanmaken, behoud na herladen, toetsenbordbediening, reset en de websitepreview. Beide schermformaten zijn visueel beoordeeld aan de hand van [desktopdashboard](screenshots/dashboard-desktop.png) en [tabletweergave van de assistent](screenshots/magazijnassistent-tablet.png).

De browsertests voor **Productdemo** controleren de printweergave, omzetting na klantakkoord, reservering bij orderbevestiging en het openen van hetzelfde inkoopconcept vanuit de werkvoorraad. Na een deelontvangst wordt de verwachting in beide schermformaten gecontroleerd.

Alle hoofdnavigatieschermen, de herkomstfilter en het laden van de beelden zijn doorlopen. De zeven officiële productlinks gaven bij een afzonderlijke controle HTTP 200 met de verwachte productnamen. De vernieuwde websitepreview is visueel beoordeeld op desktop en tablet.

Voor dezelfde Chromium-installatie kan het uitvoerbare bestand worden gekozen met `DRIEKLEUR_CHROMIUM`. Zonder die variabele gebruikt Playwright zijn standaardbrowser. Zie de [startinstructies](../README.md).

De interactieve browsersessie kreeg geen toegang tot de lokale preview-URL. Een afzonderlijke handmatige browserdoorloop en live spraakinvoer zijn daardoor niet geverifieerd. De tekstassistent is in beide schermformaten doorlopen.

De volledige npm-audit meldde vijf hoge signalen in de ontwikkelboom via één transitieve oorzaak in picomatch. De ontwikkelserver en testtooling zijn uitsluitend lokaal gebruikt. De statische build levert picomatch niet mee. De advisering meldt op de testdatum nog geen gepatchte versie. [GitHub-beveiligingsadvies](https://github.com/advisories/GHSA-fc5q-39xc-vjpf)
