/**
 * Password hashing for the offline till.
 *
 * bcrypt is a native module and cannot run inside the Capacitor WebView, so
 * this uses PBKDF2-SHA256 from the Web Crypto API, which is available on
 * every platform the app runs on (Android WebView, iOS, desktop browsers and
 * Node). Stored form:
 *
 *   pbkdf2$<iterations>$<salt base64>$<derived key base64>
 *
 * The iteration count travels with the hash, so it can be raised later
 * without locking anyone out of a till that is already trading.
 */

const ITERATIONS = 150000;
const KEY_BITS = 256;
const SALT_BYTES = 16;

const subtle = () => {
  const webcrypto = globalThis.crypto;
  if (!webcrypto?.subtle) {
    throw new Error('Secure storage is unavailable on this device, so passwords cannot be set');
  }
  return webcrypto.subtle;
};

const toBase64 = (bytes) => {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
};

const fromBase64 = (value) => {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
};

const derive = async (password, salt, iterations) => {
  const key = await subtle().importKey(
    'raw',
    new TextEncoder().encode(String(password)),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const bits = await subtle().deriveBits(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
    key,
    KEY_BITS
  );

  return new Uint8Array(bits);
};

/**
 * Compare without leaking how much of the hash matched through timing.
 */
const equal = (a, b) => {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a[i] ^ b[i];
  return diff === 0;
};

export const hashPassword = async (password) => {
  if (!password) {
    throw new Error('Password cannot be empty');
  }
  const salt = globalThis.crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const derived = await derive(password, salt, ITERATIONS);
  return `pbkdf2$${ITERATIONS}$${toBase64(salt)}$${toBase64(derived)}`;
};

export const verifyPassword = async (password, stored) => {
  if (!stored || !password) return false;

  const parts = String(stored).split('$');
  if (parts[0] !== 'pbkdf2' || parts.length !== 4) {
    // Anything else is a legacy or placeholder hash from before this module
    // existed. Those were not real password hashes, so nothing authenticates
    // against them, the account has to be given a new password.
    return false;
  }

  const [, iterations, salt, expected] = parts;
  const derived = await derive(password, fromBase64(salt), Number(iterations));
  return equal(derived, fromBase64(expected));
};

/**
 * True for a stored value this module cannot verify, so callers can tell the
 * difference between "wrong password" and "this account needs a reset".
 */
export const isUnusableHash = (stored) =>
  !stored || String(stored).split('$')[0] !== 'pbkdf2';
