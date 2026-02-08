import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { config } from '../config.js';

const mockChat = vi.fn();
const mockComplete = vi.fn();
const mockProcessNote = vi.fn();
const mockHealthCheck = vi.fn();

vi.mock('../services/openai.service.js', () => ({
  openAIService: {
    chat: (...args: unknown[]) => mockChat(...args),
    complete: (...args: unknown[]) => mockComplete(...args),
    processNote: (...args: unknown[]) => mockProcessNote(...args),
    healthCheck: () => mockHealthCheck(),
  },
}));

vi.mock('../lib/supabase.js', () => ({
  getSupabaseAdmin: () => ({
    from: (table: string) => {
      if (table === 'areas') {
        return {
          select: () => ({
            eq: () => ({
              order: () => Promise.resolve({ data: [], error: null }),
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

describe('openai routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('POST /api/openai/chat returns 400 when messages missing', async () => {
    const res = await request(app)
      .post('/api/openai/chat')
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.message).toContain('messages');
    expect(mockChat).not.toHaveBeenCalled();
  });

  it('POST /api/openai/chat returns 400 when messages empty array', async () => {
    const res = await request(app)
      .post('/api/openai/chat')
      .send({ messages: [] });
    expect(res.status).toBe(400);
    expect(mockChat).not.toHaveBeenCalled();
  });

  it('POST /api/openai/chat returns 200 and result when valid', async () => {
    mockChat.mockResolvedValue({
      content: 'Hi there',
      usage: { promptTokens: 5, completionTokens: 2, totalTokens: 7 },
    });
    const res = await request(app)
      .post('/api/openai/chat')
      .send({
        messages: [{ role: 'user', content: 'Hello' }],
      });
    expect(res.status).toBe(200);
    expect(res.body.content).toBe('Hi there');
    expect(res.body.usage.totalTokens).toBe(7);
    expect(mockChat).toHaveBeenCalledWith(
      [{ role: 'user', content: 'Hello' }],
      expect.any(Object)
    );
  });

  it('POST /api/openai/complete returns 400 when message missing', async () => {
    const res = await request(app).post('/api/openai/complete').send({});
    expect(res.status).toBe(400);
    expect(res.body.message).toContain('message');
    expect(mockComplete).not.toHaveBeenCalled();
  });

  it('POST /api/openai/complete returns 200 when valid', async () => {
    mockComplete.mockResolvedValue({ content: 'Done' });
    const res = await request(app)
      .post('/api/openai/complete')
      .send({ message: 'Do something' });
    expect(res.status).toBe(200);
    expect(res.body.content).toBe('Done');
    expect(mockComplete).toHaveBeenCalledWith(
      'Do something',
      undefined,
      expect.any(Object)
    );
  });

  it('POST /api/openai/notes returns 200 and insight (requires auth, passes user areas)', async () => {
    mockProcessNote.mockResolvedValue({
      title: 'My Note',
      summary: 'Summary',
      tags: ['work'],
      actionItems: ['Item 1'],
    });
    const res = await withAuth(request(app).post('/api/openai/notes')).send({ content: 'Note text' });
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('My Note');
    expect(res.body.summary).toBe('Summary');
    expect(res.body.tags).toEqual(['work']);
    expect(res.body.actionItems).toEqual(['Item 1']);
    expect(mockProcessNote).toHaveBeenCalledWith('Note text', []);
  });

  it('GET /api/openai/health returns 200 when OpenAI ok', async () => {
    mockHealthCheck.mockResolvedValue(true);
    const res = await request(app).get('/api/openai/health');
    expect(res.status).toBe(200);
    expect(res.body.openai).toBe('ok');
  });

  it('GET /api/openai/health returns 503 when OpenAI unavailable', async () => {
    mockHealthCheck.mockResolvedValue(false);
    const res = await request(app).get('/api/openai/health');
    expect(res.status).toBe(503);
    expect(res.body.openai).toBe('unavailable');
  });
});
