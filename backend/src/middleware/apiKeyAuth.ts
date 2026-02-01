import type { Request, Response, NextFunction } from 'express';
import { config } from '../config.js';

export type RequestWithUserId = Request & { userId: string };

export function apiKeyAuth(req: Request, res: Response, next: NextFunction): void {
  const raw = req.headers['x-api-key'] ?? req.headers.authorization;
  const key =
    typeof raw === 'string' && raw.startsWith('Bearer ')
      ? raw.slice(7).trim()
      : typeof raw === 'string'
        ? raw.trim()
        : null;
  if (!key || key !== config.backendApiKey) {
    res.status(401).json({ error: 'Invalid or missing API key. Send X-API-Key or Authorization: Bearer <key>.' });
    return;
  }
  (req as RequestWithUserId).userId = config.defaultUserId;
  next();
}
