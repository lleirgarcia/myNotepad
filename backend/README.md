# Noted — Backend

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

## Tests

Unit tests use [Vitest](https://vitest.dev/) and [Supertest](https://github.com/ladjs/supertest). Supabase and OpenAI are mocked so tests run without real APIs.

```bash
cd backend
npm run test          # run once
npm run test:watch    # watch mode
npm run test:coverage # coverage report
```

Tests run automatically before each commit (via [Husky](https://typicode.github.io/husky/) in the repo root). To skip: `git commit --no-verify`.

### Real API tests (live backend)

Tests in `e2e-api/` call a **real** backend (e.g. production on Railway). No mocks.

**Sanity check (prod up):**

```bash
npm run test:sanity
```

Hits `GET /health` on the default prod URL and asserts 200 + `{ status: 'ok', service: 'my-notepad-backend' }`. Override URL with `E2E_API_BASE_URL`.

**Full API tests:**

```bash
# Default base URL: https://mynotepad-production.up.railway.app
npm run test:api
```

- **Without API key:** only health tests run (GET `/health`, GET `/api/openai/health`).
- **With API key:** all suites run (notes, todos, whiteboard, areas). Set `E2E_API_KEY` (or `BACKEND_API_KEY`) to the backend’s API key.

Optional env:

- `E2E_API_BASE_URL` — base URL (default: `https://mynotepad-production.up.railway.app`)
- `E2E_API_KEY` or `BACKEND_API_KEY` — API key for protected routes

Example:

```bash
E2E_API_KEY=your-production-api-key npm run test:api
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

- `src/config.ts` — Loads env (OpenAI, Supabase, `BACKEND_API_KEY`, `DEFAULT_USER_ID`).
- `src/app.ts` — Express app (used by `index.ts` and tests).
- `src/index.ts` — Starts the server.
- `src/services/openai.service.ts` — OpenAI client wrapper (`chat`, `complete`, `processNote`, `healthCheck`).
- `src/routes/*.routes.ts` — Notes, todos, openai, whiteboard.
- `src/**/*.test.ts` — Unit tests (Vitest + Supertest).

API key is never logged or exposed in responses.
