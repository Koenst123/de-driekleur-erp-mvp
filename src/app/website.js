import '../ui/styles.css';
import { defaultWebsite } from '../data/seed.js';
import { createStore } from './store.js';
import { officialCatalog } from '../data/official-catalog.js';
import { catalogImage } from '../ui/catalog-image.js';
import { esc } from '../ui/components.js';
import warehouse from '../assets/warehouse.webp';

const headings = document.querySelector('#hero-title');
const intro = document.querySelector('#hero-copy');
const inquiry = document.querySelector('#contact-copy');
document.querySelector('#warehouse-image').src = warehouse;
document.querySelector('#website-catalog').innerHTML = officialCatalog.map(item =>
  '<article class="public-product">' + catalogImage(item.image) + '<div><small>' + esc(item.brand + ' · ' + item.category) +
  '</small><h3>' + esc(item.name) + '</h3><a href="' + esc(item.url) +
  '" target="_blank" rel="noopener noreferrer" aria-label="' + esc('Productpagina voor ' + item.name) +
  '">Productpagina ↗</a></div></article>').join('');

function show({ heading, introduction, inquiry: text }) {
  headings.textContent = heading;
  intro.textContent = introduction;
  inquiry.textContent = text;
}

const store = createStore();
show(defaultWebsite);
store.onChange(() => show(store.state.website));
store.refresh().catch(() => {});
