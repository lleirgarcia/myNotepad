import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockCreate, mockList } = vi.hoisted(() => ({
  mockCreate: vi.fn(),
  mockList: vi.fn(),
}));

vi.mock('openai', () => ({
  default: vi.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: (...args: unknown[]) => mockCreate(...args),
      },
    },
    models: {
      list: (...args: unknown[]) => mockList(...args),
    },
  })),
}));

const { OpenAIService } = await import('./openai.service.js');

describe('OpenAIService', () => {
  let service: OpenAIService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new OpenAIService('test-key');
  });

  describe('chat', () => {
    it('returns content and usage from completion', async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: 'Hello' } }],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 5,
          total_tokens: 15,
        },
      });

      const result = await service.chat([{ role: 'user', content: 'Hi' }]);

      expect(result.content).toBe('Hello');
      expect(result.usage).toEqual({
        promptTokens: 10,
        completionTokens: 5,
        totalTokens: 15,
      });
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: 'Hi' }],
          max_tokens: 1024,
          temperature: 0.7,
        })
      );
    });

    it('uses custom options when provided', async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: 'x' } }],
      });

      await service.chat([{ role: 'user', content: 'y' }], {
        model: 'gpt-4',
        maxTokens: 512,
        temperature: 0,
      });

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-4',
          max_tokens: 512,
          temperature: 0,
        })
      );
    });

    it('throws when OpenAI returns no content', async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: {} }],
      });

      await expect(
        service.chat([{ role: 'user', content: 'Hi' }])
      ).rejects.toThrow('OpenAI returned no content');
    });

    it('throws when choices is empty', async () => {
      mockCreate.mockResolvedValue({ choices: [] });

      await expect(
        service.chat([{ role: 'user', content: 'Hi' }])
      ).rejects.toThrow('OpenAI returned no content');
    });
  });

  describe('complete', () => {
    it('sends single user message and optional system prompt', async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: 'Done' } }],
      });

      const result = await service.complete('Hello', 'You are helpful');

      expect(result.content).toBe('Done');
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: [
            { role: 'system', content: 'You are helpful' },
            { role: 'user', content: 'Hello' },
          ],
        })
      );
    });

    it('works without system prompt', async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: 'Ok' } }],
      });

      await service.complete('Hi');

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: [{ role: 'user', content: 'Hi' }],
        })
      );
    });
  });

  describe('processNote', () => {
    it('parses JSON and returns NoteInsight with short title', async () => {
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                title: 'One Two Three Four Five',
                summary: 'A summary',
                tags: ['work', 'idea'],
                actionItems: ['Do A', 'Do B'],
              }),
            },
          },
        ],
      });

      const result = await service.processNote('Some note content');

      expect(result.title).toBe('One Two Three Four'); // shortTitle caps at 4 words / 50 chars
      expect(result.summary).toBe('A summary');
      expect(result.tags).toEqual(['work', 'idea']);
      expect(result.actionItems).toEqual(['Do A', 'Do B']);
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-4o-mini',
          max_tokens: 2048,
          temperature: 0.3,
          response_format: { type: 'json_object' },
        })
      );
    });

    it('filters non-string tags and actionItems', async () => {
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                title: 'Note',
                summary: '',
                tags: ['valid', 123, null, 'also'],
                actionItems: ['one', 2, 'three'],
              }),
            },
          },
        ],
      });

      const result = await service.processNote('x');

      expect(result.tags).toEqual(['valid', 'also']);
      expect(result.actionItems).toEqual(['one', 'three']);
    });

    it('throws when OpenAI returns no content', async () => {
      mockCreate.mockResolvedValue({ choices: [{ message: {} }] });

      await expect(service.processNote('x')).rejects.toThrow(
        'OpenAI returned no content'
      );
    });

    it('throws when response is not valid JSON', async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: 'not json' } }],
      });

      await expect(service.processNote('x')).rejects.toThrow();
    });

    it('sends empty note as "(empty note)"', async () => {
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                title: '',
                summary: '',
                tags: [],
                actionItems: [],
              }),
            },
          },
        ],
      });

      await service.processNote('   ');
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              content: '(empty note)',
            }),
          ]),
        })
      );
    });
  });

  describe('healthCheck', () => {
    it('returns true when models.list succeeds', async () => {
      mockList.mockResolvedValue(undefined);
      const result = await service.healthCheck();
      expect(result).toBe(true);
    });

    it('returns false when models.list throws', async () => {
      mockList.mockRejectedValue(new Error('API error'));
      const result = await service.healthCheck();
      expect(result).toBe(false);
    });
  });
});
