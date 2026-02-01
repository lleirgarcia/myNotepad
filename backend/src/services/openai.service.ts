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

/** Structured output when processing a note (title, summary, tags, action items). */
export type NoteInsight = {
  title: string;
  summary: string;
  tags: string[];
  actionItems: string[];
};

const NOTES_SYSTEM_PROMPT = `You are a notepad assistant. The user will send you a note (free-form text).
Respond with a single JSON object only, no other text, with exactly these keys:
- "title": string — a short title for the note, 3 to 4 words maximum (e.g. "YouTube course ideas").
- "summary": string — one or two short sentences summarizing the note.
- "tags": string[] — 0 to 5 short labels (e.g. work, idea, reminder). Lowercase, no spaces in a tag.
- "actionItems": string[] — 0 to 5 concrete next steps or to-dos extracted from the note. Each item one short sentence.

If the note is empty or meaningless, return: {"title":"","summary":"","tags":[],"actionItems":[]}.
Keep everything concise.`;

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
   * Process note text with a fixed prompt; returns structured summary, tags, and action items.
   */
  async processNote(noteContent: string): Promise<NoteInsight> {
    const result = await this.client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: NOTES_SYSTEM_PROMPT },
        { role: 'user', content: noteContent.trim() || '(empty note)' },
      ],
      max_tokens: 512,
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
    return {
      title: typeof obj.title === 'string' ? obj.title.trim().slice(0, 80) : '',
      summary: typeof obj.summary === 'string' ? obj.summary : '',
      tags: Array.isArray(obj.tags)
        ? obj.tags.filter((t): t is string => typeof t === 'string').slice(0, 5)
        : [],
      actionItems: Array.isArray(obj.actionItems)
        ? obj.actionItems.filter((t): t is string => typeof t === 'string').slice(0, 5)
        : [],
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
