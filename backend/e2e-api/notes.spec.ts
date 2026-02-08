import { describe, test, expect } from 'vitest';
import { BASE_URL, authHeaders, hasApiKey } from './setup.js';

describe('Notes API (real)', { skip: !hasApiKey() }, () => {
  let createdNoteId: string;

  test('GET /api/notes without key returns 401', async () => {
    const res = await fetch(`${BASE_URL}/api/notes`);
    expect(res.status).toBe(401);
  });

  test('GET /api/notes with key returns 200 and array', async () => {
    const res = await fetch(`${BASE_URL}/api/notes`, { headers: authHeaders() });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test('POST /api/notes creates a note', async () => {
    const res = await fetch(`${BASE_URL}/api/notes`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ title: 'E2E API test note', content: 'Content from API test' }),
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body).toHaveProperty('id');
    expect(body.title).toBe('E2E API test note');
    expect(body.content).toBe('Content from API test');
    createdNoteId = body.id;
  });

  test('GET /api/notes/:id returns the note', async () => {
    const res = await fetch(`${BASE_URL}/api/notes/${createdNoteId}`, {
      headers: authHeaders(),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe(createdNoteId);
    expect(body.title).toBe('E2E API test note');
  });

  test('PATCH /api/notes/:id updates the note', async () => {
    const res = await fetch(`${BASE_URL}/api/notes/${createdNoteId}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ title: 'E2E updated title' }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.title).toBe('E2E updated title');
  });

  test('DELETE /api/notes/:id returns 204', async () => {
    const res = await fetch(`${BASE_URL}/api/notes/${createdNoteId}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    expect(res.status).toBe(204);
  });

  test('GET /api/notes/:id after delete returns 404', async () => {
    const res = await fetch(`${BASE_URL}/api/notes/${createdNoteId}`, {
      headers: authHeaders(),
    });
    expect(res.status).toBe(404);
  });
});
