import { scryptSync, randomBytes, timingSafeEqual } from 'crypto';

const SALT_LEN = 16;
const KEY_LEN = 64;

export function hashPassword(password: string): string {
  const salt = randomBytes(SALT_LEN).toString('hex');
  const hash = scryptSync(password, salt, KEY_LEN).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const i = stored.indexOf(':');
  if (i <= 0 || i >= stored.length - 1) return false;
  const salt = stored.slice(0, i);
  const hash = stored.slice(i + 1);
  const computed = scryptSync(password, salt, KEY_LEN);
  const hashBuf = Buffer.from(hash, 'hex');
  return hashBuf.length === computed.length && timingSafeEqual(computed, hashBuf);
}
