import packaging from '../assets/packaging.webp';
import atlas from '../assets/catalog-packshots.webp';
import { esc } from './components.js';

export function catalogImage(kind, size = '') {
  if (!kind) return '<img class="generic-packaging" src="' + esc(packaging) +
    '" alt="Illustratieve verpakkingen voor olie en smeermiddelen" width="864" height="576">';
  const labels = { oil: 'Illustratieve jerrycan', grease: 'Illustratieve emmer voor smeervet', drum: 'Illustratief olievat' };
  return '<span class="catalog-image ' + esc(size) + '" data-packaging="' + esc(kind) + '">' +
    '<img src="' + esc(atlas) + '" alt="' + esc(labels[kind]) + '" width="1440" height="481" loading="lazy"></span>';
}
