import { describe, test, expect } from 'vitest';
import { BASE_URL, authHeaders, hasApiKey } from './setup.js';

describe('Areas API (real)', { skip: !hasApiKey() }, () => {
  let createdAreaId: string;

  test('GET /api/areas without key returns 401', async () => {
    const res = await fetch(`${BASE_URL}/api/areas`);
    expect(res.status).toBe(401);
  });

  test('GET /api/areas with key returns 200 and array', async () => {
    const res = await fetch(`${BASE_URL}/api/areas`, { headers: authHeaders() });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test('POST /api/areas creates an area', async () => {
    const name = `E2E area ${Date.now()}`;
    const res = await fetch(`${BASE_URL}/api/areas`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ name, icon: 'home' }),
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body).toHaveProperty('id');
    expect(body.name).toBe(name);
    createdAreaId = body.id;
  });

  test('DELETE /api/areas/:id returns 204', async () => {
    const res = await fetch(`${BASE_URL}/api/areas/${createdAreaId}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    expect(res.status).toBe(204);
  });
});
