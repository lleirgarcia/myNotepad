import { describe, test, expect } from 'vitest';
import { BASE_URL, authHeaders, hasApiKey } from './setup.js';

describe('Whiteboard API (real)', { skip: !hasApiKey() }, () => {
  test('GET /api/whiteboard without key returns 401', async () => {
    const res = await fetch(`${BASE_URL}/api/whiteboard`);
    expect(res.status).toBe(401);
  });

  test('GET /api/whiteboard with key returns 200 and content', async () => {
    const res = await fetch(`${BASE_URL}/api/whiteboard`, { headers: authHeaders() });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('content');
    expect(typeof body.content).toBe('string');
  });

  test('PUT /api/whiteboard updates content', async () => {
    const content = `E2E API whiteboard at ${Date.now()}`;
    const res = await fetch(`${BASE_URL}/api/whiteboard`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ content }),
    });
    expect(res.status).toBe(204);
  });

  test('GET /api/whiteboard returns updated content', async () => {
    const content = `E2E verify at ${Date.now()}`;
    await fetch(`${BASE_URL}/api/whiteboard`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ content }),
    });
    const res = await fetch(`${BASE_URL}/api/whiteboard`, { headers: authHeaders() });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.content).toBe(content);
  });
});
