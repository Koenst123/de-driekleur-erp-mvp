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
  if (state.seedVersion === 3) {
    state.transfers = [];
    state.returns = [];
    state.counters.transfer = 0;
    state.counters.return = 0;
    state.seedVersion = 4;
  }
  return state;
}
