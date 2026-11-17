# Demonstratiehandleiding

Gebruik dezelfde browser en URL gedurende de presentatie. Open de [startinstructies](../README.md) en kies in de navigatie **Demo herstellen** voordat je een scenario opnieuw doorloopt. Alle bedragen, relaties en voorraadstanden in de demo zijn fictief.

## Presentatie in twee processen

Open **Productdemo**. De twee kaarten leiden naar acties in de werkruimte.

1. **Van klantvraag naar levering.** Kies **Start met een ingevulde offerte**. Controleer de klantprijs, 12 jerrycans, 6 emmers en € 1.524,60 inclusief btw. Sla op, breng uit en toon **Afdrukken / pdf**. Kies **Klantakkoord registreren**. Het verkoopconcept linkt terug naar de offerte en houdt de vastgelegde prijs. Bevestig de order en vervolg met stap 4 hieronder. Leg bij akkoord en bij verzending telkens de voorraadstanden naast elkaar.
2. **Van voorraadtekort naar aanvulling.** Kies **Bekijk het aanvulvoorstel**, zoek `AWS-46-J20` en toon 2 beschikbaar, minimum 11, aanvuldoel 22 en het voorstel om 20 te bestellen. Maak het inkoopconcept. In de werkvoorraad kun je hetzelfde concept heropenen. Bevestig de bestelling en ontvang 2. Toon onder **Voorraad aanvullen** 4 beschikbaar, nog 18 in bestelling en een verwachte stand van 22. Alleen de 4 beschikbare verpakkingen kunnen nu voor verkoop worden gereserveerd.

De offerte is een lokaal demonstratiedocument. De verkoper registreert het akkoord in de demo. De voorraadverwachting gebruikt het resterende aantal van bevestigde inkopen, zonder leverdata te voorspellen.

## 1. Een klant bestelt olie en vet

1. Open **Dashboard** en noteer de omzet. Ga naar **Klanten & CRM** en zoek **Rijnland Machinebouw**.
2. Open de klant en kies **Nieuwe verkooporder** in magazijn A. Voeg **12 × TEL-46-J20** en **6 × SKF-LGMT2-E18** toe.
3. Controleer € 1.260,00 excl. btw, € 264,60 btw en € 1.524,60 incl. btw. Sla het concept op en bevestig de order. In magazijn A staat hydrauliekolie nu op 24 fysiek, 12 gereserveerd en 12 beschikbaar. Voor lagervet is dit 12, 6 en 6.
4. Open de pickopdracht en de **Magazijnassistent**. Typ `locatie`, daarna `drie gepakt`. Probeer `DEMO-FOUT` om de barcodeafwijzing te tonen. Typ vervolgens `DEMO-TEL-46-J20`. De voortgang staat op 3 van 18.
5. Typ `9 gepakt` gevolgd door `DEMO-TEL-46-J20`. Registreer de 6 emmers met `6 gepakt` en `DEMO-SKF-LGMT2-E18`, of gebruik **Barcode invoeren** bij die regel.
6. Rond de pick af en bevestig verzending. De twee artikelen staan nu op 12 en 6 fysiek, met nul gereserveerd in magazijn A. Toon de mutatieregels −12 en −6 met het ordernummer als herkomst.
7. Open de verkooporder en kies **Factuurconcept genereren**. Toon het concept en het totaal. Dashboardomzet stijgt met € 1.260,00 door de verzending. De voorraadwaarde daalt met € 900,00 op basis van de demo-inkoopprijzen.

## 2. Een verkooporder wacht op aanvulling

1. Begin vanuit de herstelde beginstand. Maak een verkooporder voor Rijnland Machinebouw met **8 × AWS-46-J20** in magazijn A. Sla het concept op en probeer te bevestigen. Er zijn 2 beschikbaar.
2. Maak onder **Inkoop** een order bij **Demo Smeerstoffen Distributie** voor 8 van hetzelfde artikel in magazijn A. Sla op en bevestig de bestelling.
3. Registreer 2 stuks op de aangeboden voorkeurslocatie. De bestelling is gedeeltelijk ontvangen en er zijn 4 beschikbaar. De verkooporder blijft bij een tweede bevestigingspoging in concept.
4. Ontvang de resterende 6 op dezelfde locatie. De inkooporder sluit en er zijn 10 beschikbaar.
5. Bevestig de verkooporder opnieuw. Er zijn nu 10 fysiek, 8 gereserveerd en 2 beschikbaar. Annuleer desgewenst vóór verzending om de vrijgave van de 8 gereserveerde verpakkingen te tonen.

## Browserbediening

De tekstassistent begrijpt ook `volgende` en `open SO-…`. De knop voor spraakinvoer verschijnt als de browser spraakherkenning aanbiedt. Toestemming, netwerk en beschikbare stemmen hangen af van de browser. Gebruik de tekstinvoer voor een reproduceerbare presentatie.
