import { addOfficialProducts } from './official-catalog.js';

export function upgradeWorkspace(state) {
  if (state.seedVersion === 1) {
    state.quotations = [];
    state.counters.quotation = 0;
    state.seedVersion = 2;
  }
  if (state.seedVersion === 2) {
    addOfficialProducts(state);
    state.seedVersion = 3;
  }
  return state;
}
