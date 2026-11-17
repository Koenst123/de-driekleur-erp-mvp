# Assets en dependencies

De typografie gebruikt Inter indien lokaal aanwezig, met Segoe UI en systeemsans als fallback. Het beeldmerk en de lijniconen zijn voor deze demo gemaakt. De rood-wit-blauwe accenten en donkerblauwe vlakken zijn geïnspireerd op de [officiële website van De Driekleur Ede](https://www.dedriekleurede.nl/).

De magazijnfoto, de contactstrook met drie verpakkingsfoto’s en de algemene studiofoto zijn voor dit project gegenereerd en als WebP gebundeld. Ze tonen illustratieve locaties en verpakkingen. Voorbeeldbestanden zijn fictieve, project-eigen tekstbestanden.

| Ontwikkelafhankelijkheid | Licentie | Gebruik |
| --- | --- | --- |
| [Vite](https://github.com/vitejs/vite) | MIT | Ontwikkelserver en statische productiebuild |
| [Vitest](https://github.com/vitest-dev/vitest) | MIT | Domeintests |
| [Playwright](https://github.com/microsoft/playwright) | Apache-2.0 | Browsertests en screenshots |

De app gebruikt geen runtimepakket uit npm. Exacte ontwikkelversies staan in de lockfile.

Zeven titels komen uit het [officiële assortiment van De Driekleur Ede](https://www.dedriekleurede.nl/collection/). De kaarten op de websitepreview en het betreffende ERP-artikel linken naar de eigen productpagina. Voor de oorspronkelijke demoartikelen is waar beschikbaar een link naar fabrikantinformatie toegevoegd. Demo-SKU’s, verpakkingen, prijzen, voorraden en leveranciersrelaties in het ERP zijn scenario-invoer. Gecontroleerde verpakkingsinformatie blijft waar van toepassing gemarkeerd, bijvoorbeeld bij het [SKF-productblad](https://cdn.skfmediahub.skf.com/api/public/0901d19680063637/pdf_preview_medium/0901d19680063637_pdf_preview_medium.pdf).
