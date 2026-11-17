// The IndexedDB store stays the same. Only the stored workspace record gains fields.
export function upgradeWorkspace(state) {
  if (state.seedVersion === 1) {
    state.quotations = [];
    state.counters.quotation = 0;
    state.seedVersion = 2;
  }
  return state;
}
