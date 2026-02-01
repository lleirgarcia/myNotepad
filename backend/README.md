# My Notepad — Backend

Node.js backend that connects to the **OpenAI API** and exposes HTTP endpoints for chat and completions.

## Requirements

- Node.js 20+
- [OpenAI API key](https://platform.openai.com/api-keys)

## Setup

```bash
cd backend
cp .env.example .env
# Edit .env and set OPENAI_API_KEY
npm install
```

## Run

```bash
# Development (watch mode)
npm run dev

# Production
npm run build && npm start
```

Server runs at `http://localhost:3000` by default. Set `PORT` in `.env` to change.

## API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Service health |
| GET | `/api/openai/health` | OpenAI API key validity |
| POST | `/api/openai/chat` | Chat completion (messages array) |
| POST | `/api/openai/complete` | Single-message completion |
| POST | `/api/openai/notes` | Process note text → structured output (summary, tags, action items) |

### POST `/api/openai/chat`

Body:

```json
{
  "messages": [
    { "role": "system", "content": "You are helpful." },
    { "role": "user", "content": "Hello" }
  ],
  "model": "gpt-4o-mini",
  "maxTokens": 1024,
  "temperature": 0.7
}
```

Response: `{ "content": "...", "usage": { "promptTokens", "completionTokens", "totalTokens" } }`

### POST `/api/openai/complete`

Body:

```json
{
  "message": "Summarize this in one sentence.",
  "systemPrompt": "You are a summarizer.",
  "model": "gpt-4o-mini",
  "maxTokens": 512,
  "temperature": 0.5
}
```

Response: same as `/chat`.

### POST `/api/openai/notes`

Used when the user saves note text. Fixed system prompt returns JSON: `summary`, `tags`, `actionItems`.

Body: `{ "content": "note text here" }`

Response: `{ "summary": "...", "tags": ["tag1", ...], "actionItems": ["item1", ...] }`

## Structure

- `src/config.ts` — Loads `OPENAI_API_KEY` and `PORT` from env.
- `src/services/openai.service.ts` — OpenAI client wrapper (`chat`, `complete`, `healthCheck`).
- `src/routes/openai.routes.ts` — Express routes for the API.
- `src/index.ts` — Express app and server.

API key is never logged or exposed in responses.
