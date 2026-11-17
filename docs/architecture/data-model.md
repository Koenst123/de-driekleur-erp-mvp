# Architectuur en gegevensmodel

De Vite-build heeft twee pagina’s. De werkruimte gebruikt hash-navigatie, semantische HTML en stateloze renderfuncties. De websitepreview leest alleen haar drie lokale contentvelden. Schermen roepen domeincommando’s aan via de centrale store. Dashboard en overzichten lezen afgeleide waarden uit dezelfde opgeslagen momentopname.

## Opslaginterface

De adapter biedt `load()`, `execute({ actionId, generation, command, payload, date })` en `reset()`. Eén IndexedDB-objectstore houdt een versieerbare momentopname bij, passend bij de beperkte omvang van de demo. Elke actie leest de actuele momentopname en schrijft alle gevolgen atomair terug in één schrijftransactie. Validatiefouten breken de transactie af. Een actie-ID maakt herhaling van dezelfde opdracht herkenbaar. Statuscontroles, documentkoppelingen en verwachte pick- of ontvangstaantallen voorkomen dubbel boeken bij verschillende verzoeken. De store publiceert nieuwe revisies na commit. Andere tabbladen kunnen dezelfde opslag herladen via BroadcastChannel. Reset begint een nieuwe generatie, zodat een oud dialoogvenster daarna niet kan schrijven.

Voor een toekomstige HTTP-adapter worden de benoemde domeincommando’s verzoeken met een payload en sleutel voor idempotentie. Actuele status, transactie en autorisatie verhuizen naar de server.

| Records | Relaties en regels |
| --- | --- |
| Artikel | Stabiel ID, unieke SKU en demobarcode, fabrikant, categorie, verpakkingstype, netto-inhoud, eenheid, prijscenten, demo-btw, leverancier en voorkeurslocatie. Eén verkoopregel telt hele verpakkingen. |
| Klant en leverancier | Contact en notities. Een klant heeft prijsafspraken per SKU en verkoopkansen. Een leverancier heeft demo-levertijd en gekoppelde artikelen. |
| Magazijn, locatie, voorraadstand | Een locatie hoort bij één magazijn. Een voorraadstand koppelt artikel en locatie aan fysieke en gereserveerde aantallen. Beschikbaar is het verschil. |
| Verkooporder en pick | Order hoort bij één klant en magazijn. Bevestigde regels bewaren prijzen en btw. Eén pick per order bewaart verdeling over locaties, vereist en gepickt aantal. |
| Offerte | Klant, magazijn, geldigheid volgens Nederlandse datum, referentie, gelijktijdig vastgelegde prijsregels en akkoordmoment. Een uitgebrachte offerte kan via klantakkoord maximaal één verkoopconcept opleveren. Het verkoopconcept behoudt de offerteregels. |
| Inkooporder en ontvangst | Order hoort bij één leverancier en magazijn. Open aantal per regel is besteld minus ontvangen. Iedere ontvangst heeft een eigen ID met aantallen en locaties. |
| Voorraadmutatie | Fysieke delta per SKU en locatie met datum, type, herkomst en eventueel reden. Beginstanden ontstaan eveneens uit mutaties. |
| Verplaatsing en klantretour | Verplaatsing heeft een bron, bestemming, hoeveelheid en reden met twee gekoppelde mutaties. Alleen vrije voorraad kan verplaatst worden. Retour koppelt een verzonden order aan aantallen en locaties. Reeds ontvangen retouren beperken de resterende hoeveelheid. De fysieke ontvangst is gescheiden van financiële afhandeling. |
| Factuurconcept | Eén concept per verzonden verkooporder. Bedragen volgen uit gekopieerde regels en afgeronde btw per regel. |
| Document en website | Documentmetadata koppelt een lokaal voorbeeldbestand aan een artikel, klant of order. De website heeft drie bewerkbare tekstvelden. |

Het IndexedDB-schema blijft versie 1. Werkruimteversie 2 initialiseert het offerteoverzicht en de teller. Versie 3 voegt zes artikelen met demo-openingsstanden toe en linkt een bestaand artikel naar de officiële catalogus. Versie 4 voegt lege overzichten en tellers voor verplaatsingen en retouren toe. Voorbeeld-offertes worden aangemaakt bij de eerste start en een bevestigde reset. Bestaande SKU’s, orderregels, voorraadstanden en instellingen blijven behouden. Het optionele aanvuldoel valt terug op tweemaal het minimum, met een bovengrens van 100.000. Voor dashboard, catalogus en aanvuladviezen worden de relevante standen in één doorgang per scherm geaggregeerd. IndexedDB en BroadcastChannel behoren tot de lokale browseromgeving. Server-side autorisatie, multi-user transactiebeheer en productieve beveiliging vereisen een backend.
