import cors from 'cors';
import express from 'express';
import { config } from './config.js';
import { apiKeyAuth } from './middleware/apiKeyAuth.js';
import { notesRouter } from './routes/notes.routes.js';
import { openaiRouter } from './routes/openai.routes.js';
import { todosRouter } from './routes/todos.routes.js';
import { whiteboardRouter } from './routes/whiteboard.routes.js';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'my-notepad-backend' });
});

app.use('/api/openai', openaiRouter);
app.use('/api/notes', apiKeyAuth, notesRouter);
app.use('/api/todos', apiKeyAuth, todosRouter);
app.use('/api/whiteboard', apiKeyAuth, whiteboardRouter);

app.listen(config.server.port, () => {
  console.log(`Backend running at http://localhost:${config.server.port}`);
});
