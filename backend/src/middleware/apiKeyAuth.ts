import type { Request, Response, NextFunction } from 'express';
import { jwtVerify } from 'jose';
import { config } from '../config.js';

export type RequestWithUserId = Request & { userId: string };

export async function apiKeyOrJwtAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const apiKeyRaw = req.headers['x-api-key'];
  const bearerRaw = req.headers.authorization;
  const key =
    typeof bearerRaw === 'string' && bearerRaw.startsWith('Bearer ')
      ? bearerRaw.slice(7).trim()
      : typeof apiKeyRaw === 'string'
        ? apiKeyRaw.trim()
        : null;

  if (!key) {
    res.status(401).json({
      error: 'Missing auth. Send X-API-Key or Authorization: Bearer <token>.',
    });
    return;
  }

  if (key === config.backendApiKey) {
    (req as RequestWithUserId).userId = config.defaultUserId;
    next();
    return;
  }

  if (config.jwt.enabled) {
    try {
      const { payload } = await jwtVerify(
        key,
        new TextEncoder().encode(config.jwt.secret)
      );
      const userId = payload.userId as string | undefined;
      if (userId && typeof userId === 'string') {
        (req as RequestWithUserId).userId = userId;
        next();
        return;
      }
    } catch {
      // not a valid JWT or expired
    }
  }

  res.status(401).json({
    error: 'Invalid or expired token. Sign in again or use a valid API key.',
  });
}

/** Middleware: accepts X-API-Key (then userId = DEFAULT_USER_ID) or Authorization: Bearer <JWT> (then userId from token). */
export function apiKeyAuth(req: Request, res: Response, next: NextFunction): void {
  apiKeyOrJwtAuth(req, res, next).catch(next);
}
