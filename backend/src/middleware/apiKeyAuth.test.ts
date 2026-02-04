import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { apiKeyAuth } from './apiKeyAuth.js';
import { config } from '../config.js';

describe('apiKeyAuth', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    mockReq = { headers: {} };
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    next = vi.fn();
  });

  it('calls next() when X-API-Key matches config', () => {
    mockReq.headers!['x-api-key'] = config.backendApiKey;
    apiKeyAuth(mockReq as Request, mockRes as Response, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(mockRes.status).not.toHaveBeenCalled();
    expect((mockReq as { userId?: string }).userId).toBe(config.defaultUserId);
  });

  it('calls next() when Authorization Bearer matches config', () => {
    mockReq.headers!['authorization'] = `Bearer ${config.backendApiKey}`;
    apiKeyAuth(mockReq as Request, mockRes as Response, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(mockRes.status).not.toHaveBeenCalled();
    expect((mockReq as { userId?: string }).userId).toBe(config.defaultUserId);
  });

  it('returns 401 when X-API-Key is missing', () => {
    apiKeyAuth(mockReq as Request, mockRes as Response, next);
    expect(next).not.toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'Invalid or missing API key. Send X-API-Key or Authorization: Bearer <key>.',
    });
  });

  it('returns 401 when X-API-Key is wrong', () => {
    mockReq.headers!['x-api-key'] = 'wrong-key';
    apiKeyAuth(mockReq as Request, mockRes as Response, next);
    expect(next).not.toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'Invalid or missing API key. Send X-API-Key or Authorization: Bearer <key>.',
    });
  });

  it('returns 401 when Authorization Bearer is wrong', () => {
    mockReq.headers!['authorization'] = 'Bearer wrong-key';
    apiKeyAuth(mockReq as Request, mockRes as Response, next);
    expect(next).not.toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(401);
  });

  it('accepts Bearer token with exact key', () => {
    mockReq.headers!['authorization'] = `Bearer ${config.backendApiKey}`;
    apiKeyAuth(mockReq as Request, mockRes as Response, next);
    expect(next).toHaveBeenCalledTimes(1);
  });
});
