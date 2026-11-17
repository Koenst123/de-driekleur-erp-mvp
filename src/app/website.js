import '../ui/styles.css';
import { defaultWebsite } from '../data/seed.js';
import { createStore } from './store.js';
import packaging from '../assets/packaging.webp';

const headings = document.querySelector('#hero-title');
const intro = document.querySelector('#hero-copy');
const inquiry = document.querySelector('#contact-copy');
document.querySelector('#packaging-image').src = packaging;

function show({ heading, introduction, inquiry: text }) {
  headings.textContent = heading;
  intro.textContent = introduction;
  inquiry.textContent = text;
}

const store = createStore();
show(defaultWebsite);
store.onChange(() => show(store.state.website));
store.refresh().catch(() => {});
