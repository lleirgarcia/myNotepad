import { describe, test, expect } from 'vitest';
import { BASE_URL } from './setup.js';

describe('Health endpoints (no auth)', () => {
  test('GET /health returns 200 and status ok', async () => {
    const res = await fetch(`${BASE_URL}/health`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ status: 'ok', service: 'my-notepad-backend' });
  });

  test('GET /api/openai/health returns 200 or 503', async () => {
    const res = await fetch(`${BASE_URL}/api/openai/health`);
    expect([200, 503]).toContain(res.status);
    const body = await res.json();
    expect(body).toHaveProperty('openai');
    expect(['ok', 'unavailable']).toContain(body.openai);
  });
});
