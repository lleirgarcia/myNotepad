/**
 * Real API tests: run against a live backend (e.g. Railway).
 * Set E2E_API_BASE_URL and E2E_API_KEY in env, or use defaults.
 */

const BASE_URL =
  process.env.E2E_API_BASE_URL?.replace(/\/$/, '') ||
  'https://mynotepad-production.up.railway.app';
const API_KEY = process.env.E2E_API_KEY ?? process.env.BACKEND_API_KEY ?? '';

export { BASE_URL, API_KEY };

export function authHeaders(): Record<string, string> {
  if (!API_KEY) return {};
  return {
    'X-API-Key': API_KEY,
    'Content-Type': 'application/json',
  };
}

export function hasApiKey(): boolean {
  return Boolean(API_KEY?.trim());
}
