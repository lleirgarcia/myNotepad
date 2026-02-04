import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { config } from '../config.js';

const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockMaybeSingle = vi.fn();
const mockUpsert = vi.fn();

vi.mock('../lib/supabase.js', () => ({
  getSupabaseAdmin: () => ({
    from: (table: string) => {
      if (table === 'whiteboard') {
        return {
          select: (cols: string) => {
            mockSelect(cols);
            return {
              eq: (key: string, val: string) => {
                mockEq(key, val);
                return {
                  maybeSingle: () => mockMaybeSingle(),
                };
              },
            };
          },
          upsert: (row: unknown, opts: unknown) => {
            mockUpsert(row, opts);
            return Promise.resolve({ error: null });
          },
        };
      }
      return {};
    },
  }),
}));

const withAuth = (req: { set: (k: string, v: string) => unknown }) =>
  req.set('X-API-Key', config.backendApiKey);

describe('whiteboard routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });
  });

  it('GET /api/whiteboard returns 200 and empty content when none', async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null });
    const res = await withAuth(request(app).get('/api/whiteboard'));
    expect(res.status).toBe(200);
    expect(res.body.content).toBe('');
    expect(mockSelect).toHaveBeenCalledWith('content');
  });

  it('GET /api/whiteboard returns 200 and content when present', async () => {
    mockMaybeSingle.mockResolvedValueOnce({
      data: { content: 'drawing data' },
      error: null,
    });
    const res = await withAuth(request(app).get('/api/whiteboard'));
    expect(res.status).toBe(200);
    expect(res.body.content).toBe('drawing data');
  });

  it('PUT /api/whiteboard returns 204 and upserts content', async () => {
    const res = await withAuth(
      request(app).put('/api/whiteboard').send({ content: 'new whiteboard content' })
    );
    expect(res.status).toBe(204);
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        content: 'new whiteboard content',
      }),
      expect.objectContaining({ onConflict: 'user_id' })
    );
  });

  it('GET /api/whiteboard without API key returns 401', async () => {
    const res = await request(app).get('/api/whiteboard');
    expect(res.status).toBe(401);
  });
});
