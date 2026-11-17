import { createSeed } from './seed.js';
import { upgradeWorkspace } from './workspace-version.js';
import { requireRule } from '../domain/stock.js';

const DB_NAME = 'driekleur-business-suite';
const SCHEMA_VERSION = 1;
const STORE = 'workspace';
const KEY = 'demo';
let connection;

function open() {
  connection ??= new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, SCHEMA_VERSION);
    request.onupgradeneeded = event => {
      if (event.oldVersion === 0) request.result.createObjectStore(STORE);
    };
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('Sluit andere tabbladen van de Business Suite en probeer opnieuw.'));
    request.onsuccess = () => {
      request.result.onversionchange = () => {
        request.result.close();
        connection = undefined;
      };
      resolve(request.result);
    };
  }).catch(error => {
    connection = undefined;
    throw error;
  });
  return connection;
}

async function change(mutate) {
  const db = await open();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    const request = store.get(KEY);
    let response;
    let failure;
    request.onsuccess = () => {
      try {
        const previous = request.result;
        const { state, result, write } = mutate(previous ? upgradeWorkspace(previous) : createSeed());
        if (!previous || write) store.put(state, KEY);
        response = { state, result };
      } catch (error) {
        failure = error;
        tx.abort();
      }
    };
    tx.oncomplete = () => resolve(response);
    tx.onabort = () => reject(failure ?? tx.error ?? new Error('De opslagbewerking is afgebroken.'));
  });
}

export const repository = {
  async load() {
    const db = await open();
    const existing = await new Promise((resolve, reject) => {
      const request = db.transaction(STORE).objectStore(STORE).get(KEY);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    return existing ? upgradeWorkspace(existing) : (await change(state => ({ state }))).state;
  },
  execute({ actionId, generation, command, payload, date }) {
    return change(state => {
      requireRule(state.generation === generation, 'De demo is opnieuw ingesteld. Open de actie opnieuw.');
      if (Object.hasOwn(state.actions, actionId)) return { state, result: state.actions[actionId] };
      const result = command(state, payload, date) ?? null;
      state.actions[actionId] = result;
      state.revision += 1;
      return { state, result, write: true };
    });
  },
  reset() {
    return change(previous => {
      const state = createSeed();
      state.generation = previous.generation + 1;
      state.revision = previous.revision + 1;
      return { state, write: true };
    });
  },
};
