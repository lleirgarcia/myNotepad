import { Router, Request, Response } from 'express';
import { apiKeyAuth } from '../middleware/apiKeyAuth.js';
import type { RequestWithUserId } from '../middleware/apiKeyAuth.js';
import { getSupabaseAdmin } from '../lib/supabase.js';
import { openAIService } from '../services/openai.service.js';
import type { ChatMessage } from '../services/openai.service.js';

export const openaiRouter = Router();

function getUserId(req: Request): string {
  return (req as RequestWithUserId).userId;
}

type ChatRequestBody = {
  messages: ChatMessage[];
  model?: string;
  maxTokens?: number;
  temperature?: number;
};

type CompleteRequestBody = {
  message: string;
  systemPrompt?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
};

type NotesRequestBody = {
  content: string;
};

openaiRouter.post('/chat', async (req: Request, res: Response): Promise<void> => {
  try {
    const body = req.body as ChatRequestBody;
    const { messages, model, maxTokens, temperature } = body;

    if (!Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({
        error: 'Bad request',
        message: 'Body must include "messages" (non-empty array of { role, content })',
      });
      return;
    }

    const result = await openAIService.chat(messages, {
      model,
      maxTokens,
      temperature,
    });
    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const status = message.includes('rate limit') ? 429 : message.includes('API key') ? 401 : 500;
    res.status(status).json({ error: 'OpenAI request failed', message });
  }
});

openaiRouter.post('/complete', async (req: Request, res: Response): Promise<void> => {
  try {
    const body = req.body as CompleteRequestBody;
    const { message, systemPrompt, model, maxTokens, temperature } = body;

    if (typeof message !== 'string' || !message.trim()) {
      res.status(400).json({
        error: 'Bad request',
        message: 'Body must include "message" (non-empty string)',
      });
      return;
    }

    const result = await openAIService.complete(message.trim(), systemPrompt, {
      model,
      maxTokens,
      temperature,
    });
    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const status = message.includes('rate limit') ? 429 : message.includes('API key') ? 401 : 500;
    res.status(status).json({ error: 'OpenAI request failed', message });
  }
});

openaiRouter.post('/notes', apiKeyAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getUserId(req);
    const body = req.body as NotesRequestBody;
    const content = typeof body?.content === 'string' ? body.content : '';

    const supabase = getSupabaseAdmin();
    const { data: areasRows } = await supabase
      .from('areas')
      .select('id, name')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });
    const areas = (areasRows ?? []).map((r) => ({ id: r.id, name: r.name }));

    const result = await openAIService.processNote(content, areas);
    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const status = message.includes('rate limit') ? 429 : message.includes('API key') ? 401 : 500;
    res.status(status).json({ error: 'OpenAI request failed', message });
  }
});

openaiRouter.get('/health', async (_req: Request, res: Response): Promise<void> => {
  const ok = await openAIService.healthCheck();
  res.status(ok ? 200 : 503).json({ openai: ok ? 'ok' : 'unavailable' });
});
