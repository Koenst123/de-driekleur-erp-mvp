# Modules en testbare mogelijkheden

De Business Suite demonstreert een selectie van de bedrijfsprocessen binnen de aangeboden Odoo-modules. Het scherm **Modules & mogelijkheden** geeft per module directe links naar werkende handelingen en benoemt het vervolgwerk.

| Module | Werkend in de demo | Verdere ontwikkeling |
| --- | --- | --- |
| Verkoop en CRM | Offerte, prijsafspraken, lokaal klantakkoord, verkooporder, herhaalorder, voorraadreservering, pick, verzending, klantretour en eenvoudige verkoopkansen | Online portaal, handtekeningen, e-mail, verzenddiensten, deelzendingen en forecasting |
| Voorraad | Twee magazijnen, locaties, barcodepicking, correcties, interne verplaatsingen, retourontvangst, min/max-advies en mutaties | Partijen, serienummers, houdbaarheid, geavanceerde routes en waarderingsmethoden |
| Inkoop | Leveranciersartikelen, inkoopconcepten, bestelbevestiging, gedeeltelijke ontvangsten en aanvuladvies | Meerdere leveranciersprijzen, goedkeuringsbeleid, leveranciersfacturen en automatische bestellingen |
| Contacten en artikelen | Toevoegen, wijzigen, contactgegevens, klantnotities, prijzen en CSV-export van alle opgeslagen records | Gevalideerde imports, meerdere adressen, samenvoegen en variantconfiguratie |
| Financieel | Factuurconcepten, btw per regel, klanthistorie en omzet uit verzonden orders | Grootboek, betalingen, bankafstemming, creditnota’s, aangiften en aansluiting op CASH |
| Documentbeheer | Metadata koppelen aan records, categorieën en downloadbare voorbeelden | Eigen uploads, versiebeheer, rechten en retentie |
| Website | Lokale websitepreview, aanpasbare teksten, productnamen met bronlinks en illustratieve beelden | Uitgebreid CMS, beheerrollen en publicatieworkflow |
| Dashboards | Herleidbare KPI’s, voorraadwaarde, omzet, actieve picks en mutaties | Configureerbare rapporten, spreadsheets, marges en gebruikersrapportages |

## Extra handelingen testen

- **Voorraad verplaatsen.** Open Productdemo → Voorraad verplaatsen. Kies `TEL-46-J20`, bron `A-03-02`, bestemming `B-03-02` en 4 verpakkingen. Na boeken staat A op 20 en B op 22. Beide mutaties hebben hetzelfde MV-nummer. De totale fysieke voorraad blijft 42.
- **Klantretour.** Open een verzonden verkooporder, kies Retour ontvangen, voer een reden en een aantal in. De retour krijgt een RT-nummer en verhoogt de voorraad op de gekozen locatie. De reeds ontvangen aantallen beperken volgende retouren. De historische order en het factuurconcept beschrijven de oorspronkelijke levering. Een eventuele creditnota vereist financiële afhandeling buiten deze demonstratie.
- **Herhaalorder.** Open een verkooporder en kies Herhaalorder maken. Het nieuwe concept gebruikt dezelfde klant, artikelen en aantallen met de actuele klantprijzen. Het concept krijgt een eigen ordernummer en een link naar de bronorder. Voorraad wordt gereserveerd bij bevestiging.
- **CSV-export.** In Artikelen, Klanten, Leveranciers, Verkoop, Inkoop en Voorraad kun je alle opgeslagen records van het overzicht downloaden. Filters bepalen de schermweergave. De export bevat alle records. Nederlandse prijsnotatie, puntkomma’s en correct gequote tekstvelden ondersteunen openen in een spreadsheet.

De oorspronkelijke moduleopsomming in de offerte specificeert geen volledige functiepariteit tussen deze demo en Odoo.
