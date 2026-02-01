/**
 * Backend API for todos and whiteboard.
 * All data is persisted via the backend using an API key (no credentials).
 *
 * Set VITE_BACKEND_URL and VITE_BACKEND_API_KEY in .env (same value as backend BACKEND_API_KEY).
 */
import type { Todo } from '../store/useStore';

const baseUrl = (import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:3000').toString().trim();
const apiKey = (import.meta.env.VITE_BACKEND_API_KEY ?? '').toString().trim();

if (baseUrl && !apiKey && import.meta.env.DEV) {
  console.warn(
    '[My Notepad] VITE_BACKEND_URL is set but VITE_BACKEND_API_KEY is missing. Add VITE_BACKEND_API_KEY to .env (same value as backend BACKEND_API_KEY) and restart the dev server.'
  );
}

function getHeaders(): HeadersInit {
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (apiKey) {
    (headers as Record<string, string>)['X-API-Key'] = apiKey;
  }
  return headers;
}

/** If this looks like a network error, throw a clear message instead. */
function normalizeNetworkError(err: unknown): never {
  const msg = err instanceof Error ? err.message : String(err);
  const isNetwork =
    err instanceof TypeError ||
    /failed to fetch|network|load failed|connection refused|cors/i.test(msg);
  if (isNetwork) {
    throw new Error(
      `Cannot reach the server. Is the backend running? Check VITE_BACKEND_URL (e.g. ${baseUrl || 'http://localhost:3000'}).`
    );
  }
  throw err;
}

// —— Todos ——
export async function fetchTodos(): Promise<Todo[]> {
  try {
    const res = await fetch(`${baseUrl}/api/todos`, { headers: getHeaders() });
    if (res.status === 401) return [];
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error((data as { error?: string }).error ?? 'Failed to fetch todos');
    return Array.isArray(data) ? data : [];
  } catch (e) {
    normalizeNetworkError(e);
  }
}

export async function createTodo(todo: {
  text: string;
  color: Todo['color'];
  category: string;
  dueDate: number | null;
  noteId?: string | null;
}): Promise<Todo> {
  try {
    const res = await fetch(`${baseUrl}/api/todos`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        text: todo.text,
        color: todo.color,
        category: todo.category,
        dueDate: todo.dueDate,
        noteId: todo.noteId ?? undefined,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error((data as { error?: string }).error ?? 'Failed to create todo');
    return data as Todo;
  } catch (e) {
    normalizeNetworkError(e);
  }
}

export async function updateTodo(
  id: string,
  updates: { completed?: boolean; text?: string }
): Promise<Todo> {
  try {
    const res = await fetch(`${baseUrl}/api/todos/${id}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(updates),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error((data as { error?: string }).error ?? 'Failed to update todo');
    return data as Todo;
  } catch (e) {
    normalizeNetworkError(e);
  }
}

export async function deleteTodo(id: string): Promise<void> {
  try {
    const res = await fetch(`${baseUrl}/api/todos/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error((data as { error?: string }).error ?? 'Failed to delete todo');
    }
  } catch (e) {
    normalizeNetworkError(e);
  }
}

// —— Notes (for grouping todos by source note) ——
export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: number;
}

export async function fetchNotes(): Promise<Note[]> {
  try {
    const res = await fetch(`${baseUrl}/api/notes`, { headers: getHeaders() });
    if (res.status === 401) return [];
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error((data as { error?: string }).error ?? 'Failed to fetch notes');
    return Array.isArray(data) ? data : [];
  } catch (e) {
    normalizeNetworkError(e);
  }
}

export async function createNote(note: { title: string; content?: string }): Promise<Note> {
  try {
    const res = await fetch(`${baseUrl}/api/notes`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ title: note.title, content: note.content ?? '' }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error((data as { error?: string }).error ?? 'Failed to create note');
    return data as Note;
  } catch (e) {
    normalizeNetworkError(e);
  }
}

// —— Whiteboard ——
export async function fetchWhiteboard(): Promise<string> {
  try {
    const res = await fetch(`${baseUrl}/api/whiteboard`, { headers: getHeaders() });
    if (res.status === 401) return '';
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return '';
    return (data as { content?: string }).content ?? '';
  } catch (e) {
    normalizeNetworkError(e);
  }
}

export async function saveWhiteboard(content: string): Promise<void> {
  try {
    const res = await fetch(`${baseUrl}/api/whiteboard`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ content }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error((data as { error?: string }).error ?? 'Failed to save notes');
    }
  } catch (e) {
    normalizeNetworkError(e);
  }
}
