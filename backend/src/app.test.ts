import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from './app.js';

describe('app', () => {
  it('GET /health returns 200 and status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok', service: 'my-notepad-backend' });
  });

  it('GET /api/notes without auth returns 401', async () => {
    const res = await request(app).get('/api/notes');
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/auth|API-Key|Bearer/i);
  });

  it('GET /api/notes with valid X-API-Key reaches route (mock returns 200)', async () => {
    const { config } = await import('./config.js');
    const res = await request(app)
      .get('/api/notes')
      .set('X-API-Key', config.backendApiKey);
    expect([200, 503]).toContain(res.status);
  });
});
