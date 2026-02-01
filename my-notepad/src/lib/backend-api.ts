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

// —— Todos ——
export async function fetchTodos(): Promise<Todo[]> {
  const res = await fetch(`${baseUrl}/api/todos`, { headers: getHeaders() });
  if (res.status === 401) return [];
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? 'Failed to fetch todos');
  return Array.isArray(data) ? data : [];
}

export async function createTodo(todo: {
  text: string;
  color: Todo['color'];
  category: string;
  dueDate: number | null;
}): Promise<Todo> {
  const res = await fetch(`${baseUrl}/api/todos`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      text: todo.text,
      color: todo.color,
      category: todo.category,
      dueDate: todo.dueDate,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? 'Failed to create todo');
  return data as Todo;
}

export async function updateTodo(
  id: string,
  updates: { completed?: boolean; text?: string }
): Promise<Todo> {
  const res = await fetch(`${baseUrl}/api/todos/${id}`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify(updates),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? 'Failed to update todo');
  return data as Todo;
}

export async function deleteTodo(id: string): Promise<void> {
  const res = await fetch(`${baseUrl}/api/todos/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { error?: string }).error ?? 'Failed to delete todo');
  }
}

// —— Whiteboard ——
export async function fetchWhiteboard(): Promise<string> {
  const res = await fetch(`${baseUrl}/api/whiteboard`, { headers: getHeaders() });
  if (res.status === 401) return '';
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return '';
  return (data as { content?: string }).content ?? '';
}

export async function saveWhiteboard(content: string): Promise<void> {
  const res = await fetch(`${baseUrl}/api/whiteboard`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({ content }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { error?: string }).error ?? 'Failed to save notes');
  }
}
