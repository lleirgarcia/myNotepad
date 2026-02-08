import cors from 'cors';
import express from 'express';
import { apiKeyAuth } from './middleware/apiKeyAuth.js';
import { areasRouter } from './routes/areas.routes.js';
import { authRouter } from './routes/auth.routes.js';
import { notesRouter } from './routes/notes.routes.js';
import { openaiRouter } from './routes/openai.routes.js';
import { todosRouter } from './routes/todos.routes.js';
import { whiteboardRouter } from './routes/whiteboard.routes.js';

export const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'my-notepad-backend' });
});

app.use('/api/auth', authRouter);
app.use('/api/openai', openaiRouter);
app.use('/api/areas', apiKeyAuth, areasRouter);
app.use('/api/notes', apiKeyAuth, notesRouter);
app.use('/api/todos', apiKeyAuth, todosRouter);
app.use('/api/whiteboard', apiKeyAuth, whiteboardRouter);
