import OpenAI from 'openai';
import { config } from '../config.js';

export type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export type ChatCompletionOptions = {
  model?: string;
  maxTokens?: number;
  temperature?: number;
};

export type ChatCompletionResult = {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
};

/** Structured output when processing a note (title, summary, tags, action items, optional area). */
export type NoteInsight = {
  title: string;
  summary: string;
  tags: string[];
  actionItems: string[];
  areaId?: string | null;
};

const NOTES_SYSTEM_PROMPT_BASE = `You are a notepad assistant. The user will send you a note (free-form text).
Respond with a single JSON object only, no other text, with exactly these keys:
- "title": string — a short title to identify the note: exactly 3 or 4 words (e.g. "YouTube course ideas", "Transcription app plan"). Base it on the whole note and its main topic. This title will be shown in the app to identify the note.
- "summary": string — one or two short sentences summarizing the note.
- "tags": string[] — short labels (e.g. work, idea, reminder). Lowercase, no spaces in a tag. Use as many as needed; no fixed limit.
- "actionItems": string[] — concrete next steps or to-dos extracted from the note. Include every actionable item so the full note is covered; do not limit to a small number. A long note can have many items; a short note few. Each item one short sentence.`;

const NOTES_SYSTEM_PROMPT_AREAS = `
The user has these areas (categories). Choose the single area that best fits the note and return its id as "areaId". If the note spans more than one area, pick the dominant one. Use the exact id string from the list below.
- "areaId": string — must be exactly one of the ids from this list (copy the id value as-is):`;

const NOTES_SYSTEM_PROMPT_END = `
If the note is empty or meaningless, return: {"title":"","summary":"","tags":[],"actionItems":[]} (omit areaId or set to null).
Be thorough: convert the whole note into action items so nothing important is missed.`;

/** Enforce title to be at most 4 words (and 50 chars) so notes are identifiable. */
function shortTitle(s: string): string {
  const trimmed = s.trim();
  if (!trimmed) return '';
  const words = trimmed.split(/\s+/).filter(Boolean).slice(0, 4);
  return words.join(' ').slice(0, 50);
}

/**
 * Service that wraps the OpenAI API. All methods use the API key from config.
 */
export class OpenAIService {
  private readonly client: OpenAI;

  constructor(apiKey: string = config.openai.apiKey) {
    this.client = new OpenAI({ apiKey });
  }

  /**
   * Send a chat completion request. Supports system + user/assistant messages.
   */
  async chat(
    messages: ChatMessage[],
    options: ChatCompletionOptions = {}
  ): Promise<ChatCompletionResult> {
    const {
      model = 'gpt-4o-mini',
      maxTokens = 1024,
      temperature = 0.7,
    } = options;

    const response = await this.client.chat.completions.create({
      model,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      max_tokens: maxTokens,
      temperature,
    });

    const choice = response.choices[0];
    if (!choice?.message?.content) {
      throw new Error('OpenAI returned no content');
    }

    return {
      content: choice.message.content,
      usage: response.usage
        ? {
            promptTokens: response.usage.prompt_tokens,
            completionTokens: response.usage.completion_tokens,
            totalTokens: response.usage.total_tokens ?? 0,
          }
        : undefined,
    };
  }

  /**
   * Simple completion: single user message, optional system prompt.
   */
  async complete(
    userMessage: string,
    systemPrompt?: string,
    options: ChatCompletionOptions = {}
  ): Promise<ChatCompletionResult> {
    const messages: ChatMessage[] = [];
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push({ role: 'user', content: userMessage });
    return this.chat(messages, options);
  }

  /**
   * Process note text with a fixed prompt; returns structured summary, tags, action items, and optional areaId when user areas are provided.
   */
  async processNote(
    noteContent: string,
    userAreas?: { id: string; name: string }[]
  ): Promise<NoteInsight> {
    let systemPrompt = NOTES_SYSTEM_PROMPT_BASE;
    if (userAreas && userAreas.length > 0) {
      systemPrompt += NOTES_SYSTEM_PROMPT_AREAS;
      for (const a of userAreas) {
        systemPrompt += `\n- ${a.id}: ${a.name}`;
      }
      systemPrompt += '\nReturn "areaId" with the chosen id (or the id for "Personal stuff" / first area if unclear).';
    }
    systemPrompt += NOTES_SYSTEM_PROMPT_END;

    const result = await this.client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: noteContent.trim() || '(empty note)' },
      ],
      max_tokens: 2048,
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const content = result.choices[0]?.message?.content;
    if (!content) throw new Error('OpenAI returned no content');

    const parsed = JSON.parse(content) as unknown;
    if (typeof parsed !== 'object' || parsed === null) {
      throw new Error('OpenAI response was not a JSON object');
    }

    const obj = parsed as Record<string, unknown>;
    const rawTitle = typeof obj.title === 'string' ? obj.title : '';
    const areaId =
      userAreas && userAreas.length > 0 && typeof obj.areaId === 'string' && obj.areaId.trim()
        ? (userAreas.some((a) => a.id === obj.areaId) ? obj.areaId : userAreas[0].id)
        : undefined;
    return {
      title: shortTitle(rawTitle),
      summary: typeof obj.summary === 'string' ? obj.summary : '',
      tags: Array.isArray(obj.tags)
        ? obj.tags.filter((t): t is string => typeof t === 'string')
        : [],
      actionItems: Array.isArray(obj.actionItems)
        ? obj.actionItems.filter((t): t is string => typeof t === 'string')
        : [],
      areaId: areaId ?? null,
    };
  }

  /**
   * Check that the API key is valid by calling a minimal endpoint.
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.client.models.list();
      return true;
    } catch {
      return false;
    }
  }
}

export const openAIService = new OpenAIService();
