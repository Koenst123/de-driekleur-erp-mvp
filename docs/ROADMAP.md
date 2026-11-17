# Roadmap en beperkingen

| Stap | Nodig voor productie |
| --- | --- |
| Proces- en datavalidatie | Leg assortiment, partijen, eenheden, btw-codes, reserveringsregels, deelzendingen en retouren vast. Valideer importformaten voor relaties, producten en voorraad met de verantwoordelijke teams. |
| Backend en PostgreSQL | Vervang de IndexedDB-adapter door een API. Gebruik transacties, databaseconstraints en idempotente opdrachten. Test gelijktijdig reserveren en ontvangen, herstel na een onderbroken aanvraag en terugwaarts compatibele migraties. |
| Gebruikers en audit | Richt authenticatie en autorisatie per bedrijfsrol in. Leg vast wie, wanneer en waarom een wijziging uitvoerde. Test toegang tot gegevens en documenten en stel bewaartermijnen vast. |
| Datamigratie uit CASH | Begin met goedgekeurde exports, inventarisatie van sleutels en een expliciete veldmapping. Voer proefmigraties uit en vergelijk open posten, aantallen, totalen en uitzonderingen met de bron. Ontwerp terugval en overdracht samen met de administratie. |
| Nederlandse boekhouding | Bepaal met de administratie of het ERP koppelt met een boekhoudpakket of zelf een grootboek voert. Werk facturatie, nummers, correcties, btw, bank, afsluiting, controles en rapportages uit met vakinhoudelijke acceptatie. |
| Hosting, beveiliging en beheer | Richt test/acceptatie en productie in met bewaakte hosting, versleuteling, sleutelbeheer, patching, privacy- en compliancebeleid, back-ups en beproefd herstel. Leg monitoring, incidentrespons, support en eigenaarschap vast. |

Het prototype bewaart één lokale werkruimte per browserprofiel en origin. Browseropslag kan worden gewist of geweigerd. Een open browser biedt geen server-side autorisatie. Er is geen synchronisatie tussen apparaten of ERP-integratie. De website is een lokale demonstratie zonder publicatie. Documentbeheer koppelt voorbeelden. De barcodefunctie valideert tekst of scannerinvoer die als toetsenbord werkt. Spraak hangt af van browserondersteuning. Financieel ondersteunt uitsluitend demo-overzichten en factuurconcepten en vervangt CASH of een boekhoudpakket niet.
