import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { config } from '../config.js';

const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockOrder = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();

vi.mock('../lib/supabase.js', () => ({
  getSupabaseAdmin: () => ({
    from: (table: string) => {
      if (table === 'todos') {
        return {
          select: (cols: string) => {
            mockSelect(cols);
            return {
              eq: (key: string, val: string) => {
                mockEq(key, val);
                return {
                  order: (opts: unknown) => {
                    mockOrder(opts);
                    return Promise.resolve({ data: [], error: null });
                  },
                  eq: (_k2: string, _v2: string) => ({
                    select: (s: string) => ({
                      single: () =>
                        Promise.resolve({
                          data: {
                            id: 'todo-1',
                            text: 'Todo',
                            completed: false,
                            color: 'cyan',
                            category: 'work',
                            due_date: null,
                            note_id: null,
                            created_at: new Date().toISOString(),
                            notes: { title: 'Note' },
                          },
                          error: null,
                        }),
                    }),
                  }),
                };
              },
            };
          },
          insert: (row: unknown) => {
            mockInsert(row);
            return {
              select: () => ({
                single: () =>
                  Promise.resolve({
                    data: {
                      id: 'todo-1',
                      text: (row as { text: string }).text,
                      completed: false,
                      color: (row as { color?: string }).color ?? 'cyan',
                      category: (row as { category?: string }).category ?? 'work',
                      due_date: (row as { due_date?: string | null }).due_date ?? null,
                      note_id: (row as { note_id?: string | null }).note_id ?? null,
                      created_at: new Date().toISOString(),
                      notes: null,
                    },
                    error: null,
                  }),
              }),
            };
          },
          update: (upd: unknown) => {
            mockUpdate(upd);
            return {
              eq: () => ({
                eq: () => ({
                  select: () => ({
                    single: () =>
                      Promise.resolve({
                        data: {
                          id: 'todo-1',
                          text: (upd as { text?: string }).text ?? 'Todo',
                          completed: (upd as { completed?: boolean }).completed ?? false,
                          color: 'cyan',
                          category: 'work',
                          due_date: null,
                          note_id: null,
                          created_at: new Date().toISOString(),
                          notes: null,
                        },
                        error: null,
                      }),
                  }),
                }),
              }),
            };
          },
          delete: () => ({
            eq: () => ({
              eq: () => Promise.resolve({ error: null }),
            }),
          }),
        };
      }
      return {};
    },
  }),
}));

const withAuth = (req: { set: (k: string, v: string) => unknown }) =>
  req.set('X-API-Key', config.backendApiKey);

describe('todos routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('GET /api/todos returns 200 and empty list', async () => {
    const res = await withAuth(request(app).get('/api/todos'));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(mockSelect).toHaveBeenCalledWith('*, notes(title)');
  });

  it('POST /api/todos returns 400 when text missing', async () => {
    const res = await withAuth(request(app).post('/api/todos').send({ color: 'red' }));
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('text required');
  });

  it('POST /api/todos returns 201 and created todo', async () => {
    const res = await withAuth(
      request(app)
        .post('/api/todos')
        .send({ text: 'Buy milk', color: 'red', category: 'personal' })
    );
    expect(res.status).toBe(201);
    expect(res.body.text).toBe('Buy milk');
    expect(res.body.color).toBe('red');
    expect(res.body.category).toBe('personal');
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        text: 'Buy milk',
        color: 'red',
        category: 'personal',
        completed: false,
      })
    );
  });

  it('PATCH /api/todos/:id returns 400 when no updates', async () => {
    const res = await withAuth(request(app).patch('/api/todos/t1').send({}));
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('No updates provided');
  });

  it('PATCH /api/todos/:id returns 200 with valid color', async () => {
    const res = await withAuth(
      request(app).patch('/api/todos/t1').send({ completed: true, color: 'yellow' })
    );
    expect(res.status).toBe(200);
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ completed: true, color: 'yellow' })
    );
  });

  it('DELETE /api/todos/:id returns 204', async () => {
    const res = await withAuth(request(app).delete('/api/todos/t1'));
    expect(res.status).toBe(204);
  });

  it('GET /api/todos without API key returns 401', async () => {
    const res = await request(app).get('/api/todos');
    expect(res.status).toBe(401);
  });
});
