/**
 * Cloud sync: the shop's phone sends, the owner's phone views.
 *
 * The shop's phone (the "till") stays the one true record and works with no
 * internet exactly as before. Whenever something changes and there is a
 * connection, it uploads a copy of the whole shop to the owner's Supabase
 * project. A phone set up as a "viewer" downloads that copy and shows it,
 * read-only. One writer means nothing can ever conflict.
 *
 * Product photos travel separately, each one once, so that a sale does not
 * re-upload every picture.
 *
 * ponytail: the whole shop is re-sent on every change (gzipped, roughly a
 * tenth of its size). Fine for a small shop for years; switch to sending
 * only changed rows if uploads start to feel slow on mobile data.
 */
import db from '../database/DatabaseService';

const STORE_KEY = 'pos-sync';
const PUSH_DELAY_MS = 5000;
const RETRY_MS = 60000;
const PULL_MS = 30000;

const EMPTY = { mode: 'off', url: '', key: '', code: '', dirty: false };

const load = () => {
  try {
    return { ...EMPTY, ...JSON.parse(localStorage.getItem(STORE_KEY) || '{}') };
  } catch {
    return { ...EMPTY };
  }
};

let config = load();
let status = { busy: false, error: '', version: 0 };
let snapshot = { ...config, ...status };
const listeners = new Set();
let pushTimer = null;
let started = false;

const publish = () => {
  snapshot = { ...config, ...status };
  listeners.forEach((listener) => listener());
};

const store = (next) => {
  config = next;
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(config));
  } catch (error) {
    console.warn('[sync] could not save settings:', error?.message);
  }
  publish();
};

const save = (changes) => store({ ...config, ...changes });

const setStatus = (changes) => {
  status = { ...status, ...changes };
  publish();
};

const toBase64 = (bytes) => {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
};

const fromBase64 = (text) => Uint8Array.from(atob(text), (c) => c.charCodeAt(0));

const through = async (bytes, stream) => {
  const writer = stream.writable.getWriter();
  writer.write(bytes);
  writer.close();
  return new Uint8Array(await new Response(stream.readable).arrayBuffer());
};

/** JSON, gzipped where the device can: a shop's records shrink about tenfold. */
export const pack = async (value) => {
  const json = JSON.stringify(value);
  if (typeof CompressionStream === 'undefined') return json;
  return `gz:${toBase64(await through(new TextEncoder().encode(json), new CompressionStream('gzip')))}`;
};

export const unpack = async (text) => {
  if (!text.startsWith('gz:')) return JSON.parse(text);
  return JSON.parse(new TextDecoder().decode(await through(fromBase64(text.slice(3)), new DecompressionStream('gzip'))));
};

const rpc = async (name, args, { url, key } = config) => {
  let response;
  try {
    response = await fetch(`${url.replace(/\/+$/, '')}/rest/v1/rpc/${name}`, {
      method: 'POST',
      headers: { apikey: key, 'Content-Type': 'application/json' },
      body: JSON.stringify(args)
    });
  } catch {
    throw new Error('No connection to the cloud. Check the internet and the project address');
  }
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(body?.message || `The cloud refused the request (${response.status})`);
  }
  return body;
};

const online = () => typeof navigator === 'undefined' || navigator.onLine !== false;

const newCode = () => toBase64(crypto.getRandomValues(new Uint8Array(24))).replace(/\+/g, '-').replace(/\//g, '_');

/** Send the shop, then any photo that changed since the last one sent. */
const push = async (settings = config) => {
  const dump = await db.exportAllTables({ photos: false });
  await rpc('push_snapshot', { p_code: settings.code, p_data: await pack(dump) }, settings);

  const photos = await db.query(
    'SELECT product_id, photo, updated_at FROM product_photos WHERE updated_at > ? ORDER BY updated_at',
    [config.photosPushedAt || '']
  );
  for (const row of photos) {
    await rpc('push_photo', { p_code: settings.code, p_product_id: row.product_id, p_photo: row.photo }, settings);
    save({ photosPushedAt: row.updated_at });
  }
};

/** Fetch whatever is newer than what this phone already has. Returns true if anything changed. */
const pull = async (settings = config) => {
  let changed = false;

  const [latest] = await rpc('pull_snapshot', { p_code: settings.code, p_since: config.pulledAt || null }, settings);
  if (latest) {
    await db.restoreAllTables(await unpack(latest.data));
    save({ pulledAt: latest.updated_at });
    changed = true;
  }

  const photos = await rpc('pull_photos', { p_code: settings.code, p_since: config.photosPulledAt || null }, settings);
  for (const row of photos) {
    await db.run('INSERT OR REPLACE INTO product_photos (product_id, photo, updated_at) VALUES (?, ?, ?)', [
      row.product_id,
      row.photo,
      row.updated_at
    ]);
    save({ photosPulledAt: row.updated_at });
    changed = true;
  }

  return changed;
};

const SyncService = {
  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  getState: () => snapshot,

  isViewer: () => config.mode === 'viewer',

  /** Call once the database is open. */
  init() {
    if (started) return;
    started = true;
    db.onWrite = () => {
      if (config.mode !== 'till') return;
      if (!config.dirty) save({ dirty: true });
      clearTimeout(pushTimer);
      pushTimer = setTimeout(() => this.syncNow(), PUSH_DELAY_MS);
    };
    setInterval(() => {
      if (config.mode === 'till' && config.dirty) this.syncNow();
    }, RETRY_MS);
    setInterval(() => {
      if (config.mode === 'viewer') this.syncNow();
    }, PULL_MS);
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.syncNow());
      document.addEventListener('visibilitychange', () => !document.hidden && this.syncNow());
    }
    this.syncNow();
  },

  /** Push (till) or pull (viewer) now. Quietly does nothing when there is nothing to do. */
  async syncNow() {
    if (config.mode === 'off' || status.busy || !online()) return;
    // A copy taken half-way through a sale would be missing its other half.
    if (db.transactionDepth > 0) {
      db.onWrite?.();
      return;
    }
    setStatus({ busy: true });
    try {
      if (config.mode === 'till') {
        // Cleared first, so a sale rung up during the upload marks it again.
        save({ dirty: false });
        try {
          await push();
          save({ syncedAt: new Date().toISOString() });
        } catch (error) {
          save({ dirty: true });
          throw error;
        }
      } else if (await pull()) {
        setStatus({ version: status.version + 1 });
      }
      if (config.mode === 'viewer') save({ syncedAt: new Date().toISOString() });
      setStatus({ busy: false, error: '' });
    } catch (error) {
      console.warn('[sync]', error?.message);
      setStatus({ busy: false, error: error?.message || 'Sync failed' });
    }
  },

  /** Make this phone the shop's: it sends, and gets a code for the owner's phone. */
  async startAsTill({ url, key }) {
    const settings = { url: url.trim(), key: key.trim(), code: newCode() };
    if (!/^https:\/\/.+/.test(settings.url) || !settings.key) {
      throw new Error('Enter the project address (https://...) and its key');
    }
    // A new code is a new cloud copy, so every photo has to go up again.
    config = { ...config, photosPushedAt: undefined };
    await push(settings);
    store({ ...EMPTY, ...settings, mode: 'till', photosPushedAt: config.photosPushedAt, syncedAt: new Date().toISOString() });
  },

  /** What the owner pastes into their phone: where the cloud copy is and the code that opens it. */
  pairingCode() {
    return btoa(JSON.stringify({ u: config.url, k: config.key, c: config.code }));
  },

  /** Make this phone a viewer. Everything on it is replaced by the shop's records. */
  async startAsViewer(pairing) {
    let settings;
    try {
      const { u, k, c } = JSON.parse(atob(pairing.trim()));
      settings = { url: u, key: k, code: c };
    } catch {
      settings = null;
    }
    if (!settings?.url || !settings.key || !settings.code) {
      throw new Error('That is not a pairing code from the shop phone');
    }
    const before = { pulledAt: config.pulledAt, photosPulledAt: config.photosPulledAt };
    config = { ...config, pulledAt: undefined, photosPulledAt: undefined };
    try {
      if (!(await pull(settings))) throw new Error('Nothing has been sent from the shop phone yet');
    } catch (error) {
      config = { ...config, ...before };
      throw error;
    }
    store({
      ...EMPTY,
      ...settings,
      mode: 'viewer',
      pulledAt: config.pulledAt,
      photosPulledAt: config.photosPulledAt,
      syncedAt: new Date().toISOString()
    });
    setStatus({ version: status.version + 1, error: '' });
  },

  /** Stop syncing. What is on this phone stays as it is. */
  stop() {
    clearTimeout(pushTimer);
    store({ ...EMPTY });
    setStatus({ error: '' });
  },

  /** For tests: forget everything. */
  reset() {
    config = { ...EMPTY };
    status = { busy: false, error: '', version: 0 };
    publish();
  }
};

export default SyncService;
