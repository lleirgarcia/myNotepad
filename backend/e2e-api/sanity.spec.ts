/**
 * Sanity check: backend in production is up and responding.
 * Run with: npm run test:sanity
 * Uses E2E_API_BASE_URL or default https://mynotepad-production.up.railway.app
 */
import { describe, test, expect } from 'vitest';
import { BASE_URL } from './setup.js';

describe('Production sanity – backend is up', () => {
  test('GET /health returns 200 and service identifier', async () => {
    const res = await fetch(`${BASE_URL}/health`, {
      signal: AbortSignal.timeout(10_000),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { status?: string; service?: string };
    expect(body.status).toBe('ok');
    expect(body.service).toBe('my-notepad-backend');
  });
});
