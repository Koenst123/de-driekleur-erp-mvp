import { get, requireRule } from '../domain/stock.js';
import { recordPick } from '../domain/orders.js';

const words = ['nul', 'een', 'twee', 'drie', 'vier', 'vijf', 'zes', 'zeven', 'acht', 'negen', 'tien', 'elf', 'twaalf'];
const nextLine = pick => pick.lines.find(line => line.picked < line.quantity);

export function assistantInstruction(state, pick) {
  if (!pick) return 'Er zijn geen open pickopdrachten.';
  const line = nextLine(pick);
  if (!line) return 'Alles is verzameld. Gebruik Pickopdracht afronden.';
  const product = get(state.products, line.productId, 'Artikel');
  return pick.orderId + '. Verzamel ' + (line.quantity - line.picked) + ' × ' + product.name + ', ' + product.content + ' ' + product.unit +
    ' per verpakking, magazijn ' + line.locationId[0] + ', locatie ' + line.locationId + '.';
}

export function createAssistant(store) {
  let pending;
  return {
    reset() { pending = undefined; },
    async command(pickId, raw) {
      const clean = raw.trim();
      const normalized = clean.toLowerCase().replace(/[.!?]+$/, '');
      const { state } = store;
      if (['volgende', 'volgende pickopdracht', 'open mijn volgende pickopdracht'].includes(normalized) || normalized.startsWith('open so-')) {
        const selected = normalized.startsWith('open so-');
        const open = state.picks.filter(row => row.status === 'open')
          .sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id, 'nl', { numeric: true }));
        const pick = selected ? open.find(row => row.orderId.toLowerCase() === normalized.slice(5)) :
          open.find(row => row.id !== pickId) ?? open[0];
        pending = undefined;
        return { pickId: pick?.id, message: assistantInstruction(state, pick) };
      }
      const pick = get(state.picks, pickId, 'Pickopdracht');
      requireRule(pick.status === 'open', 'Open een pickopdracht om artikelen te verzamelen.');
      if (['locatie', 'waar staat het artikel', 'huidige regel', 'hoeveel'].includes(normalized)) {
        return { message: assistantInstruction(state, pick) };
      }
      const match = /^(\d+|[a-zé]+) gepakt$/.exec(normalized);
      if (match) {
        const amount = /^\d+$/.test(match[1]) ? Number(match[1]) : words.indexOf(match[1].replace('éé', 'ee'));
        const line = nextLine(pick);
        requireRule(line && amount > 0 && amount <= line.quantity - line.picked, 'Noem een geldig aantal binnen de openstaande hoeveelheid.');
        pending = { id: pick.id, lineId: line.id, expectedPicked: line.picked, amount, generation: state.generation };
        return { message: 'Bevestig de barcode voor ' + amount + ' verpakking(en).' };
      }
      if (pending?.id === pick.id) {
        const barcode = clean.replace(/^barcode\s+/i, '');
        await store.dispatch(recordPick, { ...pending, barcode }, { generation: pending.generation });
        pending = undefined;
        return { message: 'Pick geregistreerd. ' + assistantInstruction(store.state, get(store.state.picks, pick.id, 'Pickopdracht')) };
      }
      return { message: 'Gebruik ‘locatie’, ‘3 gepakt’, ‘volgende’ of ‘open SO-…’.' };
    },
  };
}
