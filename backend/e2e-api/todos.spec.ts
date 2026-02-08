import { describe, test, expect } from 'vitest';
import { BASE_URL, authHeaders, hasApiKey } from './setup.js';

describe('Todos API (real)', { skip: !hasApiKey() }, () => {
  let createdTodoId: string;

  test('GET /api/todos without key returns 401', async () => {
    const res = await fetch(`${BASE_URL}/api/todos`);
    expect(res.status).toBe(401);
  });

  test('GET /api/todos with key returns 200 and array', async () => {
    const res = await fetch(`${BASE_URL}/api/todos`, { headers: authHeaders() });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test('POST /api/todos without text returns 400', async () => {
    const res = await fetch(`${BASE_URL}/api/todos`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ color: 'cyan' }),
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('text');
  });

  test('POST /api/todos creates a todo', async () => {
    const res = await fetch(`${BASE_URL}/api/todos`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        text: 'E2E API test task',
        color: 'cyan',
        category: 'work',
        dueDate: null,
        noteId: null,
      }),
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body).toHaveProperty('id');
    expect(body.text).toBe('E2E API test task');
    expect(body.completed).toBe(false);
    createdTodoId = body.id;
  });

  test('PATCH /api/todos/:id updates completed', async () => {
    const res = await fetch(`${BASE_URL}/api/todos/${createdTodoId}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ completed: true }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.completed).toBe(true);
  });

  test('DELETE /api/todos/:id returns 204', async () => {
    const res = await fetch(`${BASE_URL}/api/todos/${createdTodoId}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    expect(res.status).toBe(204);
  });
});
