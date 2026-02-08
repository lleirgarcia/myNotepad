import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { config } from '../config.js';

const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockOrder = vi.fn();
const mockMaybeSingle = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();

vi.mock('../lib/supabase.js', () => ({
  getSupabaseAdmin: () => ({
    from: (table: string) => {
      if (table === 'notes') {
        return {
          select: (cols: string) => {
            mockSelect(cols);
            const chain = {
              eq: (key: string, val: string) => {
                mockEq(key, val);
                return {
                  order: (column: string, opts: unknown) => {
                    mockOrder(column, opts);
                    return {
                      order: (col2: string, opts2: unknown) => {
                        mockOrder(col2, opts2);
                        return Promise.resolve({ data: [], error: null });
                      },
                      limit: (n: number) => ({
                        maybeSingle: () =>
                          Promise.resolve({ data: cols === 'position' ? { position: 0 } : null, error: null }),
                      }),
                    };
                  },
                  eq: (_k2: string, _v2: string) => ({
                    maybeSingle: () => mockMaybeSingle(),
                  }),
                  maybeSingle: () => mockMaybeSingle(),
                };
              },
            };
            return chain;
          },
          insert: (row: unknown) => {
            mockInsert(row);
            return {
              select: () => ({
                single: () =>
                  Promise.resolve({
                    data: {
                      id: 'note-1',
                      title: (row as { title: string }).title,
                      content: (row as { content: string }).content ?? '',
                      created_at: new Date().toISOString(),
                    },
                    error: null,
                  }),
              }),
            };
          },
          update: (upd: unknown) => {
            mockUpdate(upd);
            return {
              eq: (key: string, val: string) => ({
                eq: (_k: string, _v: string) => ({
                  select: () => ({
                    single: () =>
                      Promise.resolve({
                        data: {
                          id: 'note-1',
                          title: (upd as { title?: string }).title ?? 'Title',
                          content: (upd as { content?: string }).content ?? '',
                          created_at: new Date().toISOString(),
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
      if (table === 'todos') {
        return {
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

describe('notes routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });
  });

  it('GET /api/notes returns 200 and empty list when no notes', async () => {
    const res = await withAuth(request(app).get('/api/notes'));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(0);
    expect(mockSelect).toHaveBeenCalledWith('*');
    expect(mockOrder).toHaveBeenNthCalledWith(1, 'position', { ascending: true });
    expect(mockOrder).toHaveBeenNthCalledWith(2, 'created_at', { ascending: true });
  });

  it('GET /api/notes/:id returns 404 when note not found', async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null });
    const res = await withAuth(request(app).get('/api/notes/any-id'));
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Note not found');
  });

  it('GET /api/notes/:id returns 200 and note when found', async () => {
    const note = {
      id: 'n1',
      title: 'My Note',
      content: 'Content',
      created_at: new Date().toISOString(),
    };
    mockMaybeSingle.mockResolvedValueOnce({ data: note, error: null });
    const res = await withAuth(request(app).get('/api/notes/n1'));
    expect(res.status).toBe(200);
    expect(res.body.id).toBe('n1');
    expect(res.body.title).toBe('My Note');
    expect(res.body.content).toBe('Content');
    expect(res.body.createdAt).toBeDefined();
  });

  it('POST /api/notes returns 400 when title missing', async () => {
    const res = await withAuth(request(app).post('/api/notes').send({ content: 'only content' }));
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('title required');
  });

  it('POST /api/notes returns 201 and created note', async () => {
    const res = await withAuth(
      request(app).post('/api/notes').send({ title: 'New Note', content: 'Body' })
    );
    expect(res.status).toBe(201);
    expect(res.body.title).toBe('New Note');
    expect(res.body.content).toBe('Body');
    expect(res.body.id).toBe('note-1');
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'New Note',
        content: 'Body',
      })
    );
  });

  it('PATCH /api/notes/:id returns 400 when no updates', async () => {
    const res = await withAuth(request(app).patch('/api/notes/n1').send({}));
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('No updates provided');
  });

  it('PATCH /api/notes/:id returns 200 and updated note', async () => {
    const res = await withAuth(
      request(app).patch('/api/notes/n1').send({ title: 'Updated' })
    );
    expect(res.status).toBe(200);
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Updated' })
    );
  });

  it('DELETE /api/notes/:id returns 204', async () => {
    const res = await withAuth(request(app).delete('/api/notes/n1'));
    expect(res.status).toBe(204);
  });

  it('GET /api/notes without API key returns 401', async () => {
    const res = await request(app).get('/api/notes');
    expect(res.status).toBe(401);
  });
});
