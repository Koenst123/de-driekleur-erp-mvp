import { repository } from '../data/repository.js';

export function createStore(storage = repository) {
  const events = new EventTarget();
  const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('driekleur-demo-updates') : null;
  let state;

  function publish(next) {
    if (state && next.revision <= state.revision) return;
    state = next;
    events.dispatchEvent(new Event('change'));
  }

  async function refresh() {
    publish(await storage.load());
  }

  channel?.addEventListener('message', () => refresh().catch(() => {
    events.dispatchEvent(new Event('storageerror'));
  }));

  return {
    get state() { return state; },
    refresh,
    onChange(listener) { events.addEventListener('change', listener); },
    onError(listener) { events.addEventListener('storageerror', listener); },
    async dispatch(command, payload, { generation = state.generation, actionId = crypto.randomUUID() } = {}) {
      try {
        const response = await storage.execute({ command, payload, generation, actionId, date: new Date().toISOString() });
        publish(response.state);
        channel?.postMessage(response.state.revision);
        return response.result;
      } catch (error) {
        await refresh().catch(() => {});
        throw error;
      }
    },
    async reset() {
      const { state } = await storage.reset();
      publish(state);
      channel?.postMessage(state.revision);
    },
  };
}
