/**
 * Backend API for todos and whiteboard.
 * Auth: API key (X-API-Key) or Google JWT (Authorization: Bearer <token>).
 *
 * Set VITE_BACKEND_URL and VITE_BACKEND_API_KEY in .env (same value as backend BACKEND_API_KEY).
 * After Google login, token is stored in localStorage and sent as Bearer.
 */
import type { Todo } from '../store/useStore';

export const AUTH_TOKEN_KEY = 'noted_auth_token';

const baseUrl = (import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:3000').toString().trim();
const apiKey = (import.meta.env.VITE_BACKEND_API_KEY ?? '').toString().trim();

if (baseUrl && !apiKey && typeof window !== 'undefined' && !localStorage.getItem(AUTH_TOKEN_KEY) && import.meta.env.DEV) {
  console.warn(
    '[Noted] VITE_BACKEND_URL is set but no auth. Add VITE_BACKEND_API_KEY or sign in with Google.'
  );
}

export function getHeaders(): HeadersInit {
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (token) {
      (headers as Record<string, string>)['Authorization'] = 'Bearer ' + token;
      return headers;
    }
  }
  if (apiKey) {
    (headers as Record<string, string>)['X-API-Key'] = apiKey;
  }
  return headers;
}

export function getGoogleLoginUrl(): string {
  const redirectUri = typeof window !== 'undefined' ? window.location.origin + '/auth/callback' : '';
  return `${baseUrl}/api/auth/google?redirect_uri=${encodeURIComponent(redirectUri)}`;
}

/** Exchange Google OAuth code for JWT (frontend is redirect_uri). */
export async function exchangeGoogleCode(code: string, redirectUri: string): Promise<{ token: string }> {
  const res = await fetch(`${baseUrl}/api/auth/google/exchange`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, redirect_uri: redirectUri }),
  });
  const data = (await res.json()) as { token?: string; error?: string };
  if (!res.ok) throw new Error(data.error ?? 'Exchange failed');
  if (!data.token) throw new Error('No token in response');
  return { token: data.token };
}

export function hasAuthToken(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(localStorage.getItem(AUTH_TOKEN_KEY));
}

export function clearAuthToken(): void {
  if (typeof window !== 'undefined') localStorage.removeItem(AUTH_TOKEN_KEY);
}

export function setAuthToken(token: string): void {
  if (typeof window !== 'undefined') localStorage.setItem(AUTH_TOKEN_KEY, token);
}

/** Register with email/password. Returns token; throws on error. */
export async function registerWithEmail(
  email: string,
  password: string,
  name?: string
): Promise<{ token: string }> {
  const url = `${baseUrl}/api/auth/register`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.trim(), password, name: name?.trim() || undefined }),
  });
  const data = (await res.json().catch(() => ({}))) as { token?: string; error?: string };
  if (!res.ok) throw new Error(data.error ?? 'Registration failed.');
  if (!data.token) throw new Error('No token received.');
  return { token: data.token };
}

/** Sign in with email/password. Returns token; throws on error. */
export async function loginWithEmail(email: string, password: string): Promise<{ token: string }> {
  const url = `${baseUrl}/api/auth/login`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.trim(), password }),
  });
  const data = (await res.json().catch(() => ({}))) as { token?: string; error?: string };
  if (!res.ok) throw new Error(data.error ?? 'Sign-in failed.');
  if (!data.token) throw new Error('No token received.');
  return { token: data.token };
}

export type CurrentUser = { name: string | null; email: string | null };

export async function getCurrentUser(): Promise<CurrentUser> {
  try {
    const res = await fetch(`${baseUrl}/api/auth/me`, { headers: getHeaders() });
    if (!res.ok) return { name: null, email: null };
    const data = (await res.json()) as { name?: string | null; email?: string | null };
    return {
      name: typeof data.name === 'string' ? data.name : null,
      email: typeof data.email === 'string' ? data.email : null,
    };
  } catch {
    return { name: null, email: null };
  }
}

const MIGRATE_DONE_KEY = 'noted_migrate_done';

/** Call after login: copy notes, todos, areas and whiteboard from the default account (API key) to the current Google/email account. Returns counts; 403 if already using API key. */
export async function migrateFromDefaultAccount(): Promise<{
  migrated: { areas: number; notes: number; todos: number; whiteboard: boolean };
}> {
  const res = await fetch(`${baseUrl}/api/auth/migrate-from-default`, {
    method: 'POST',
    headers: getHeaders(),
  });
  const data = (await res.json().catch(() => ({}))) as {
    error?: string;
    migrated?: { areas: number; notes: number; todos: number; whiteboard: boolean };
  };
  if (!res.ok) throw new Error(data.error ?? 'Migration failed');
  if (!data.migrated) throw new Error('No migration result');
  if (typeof window !== 'undefined') localStorage.setItem(MIGRATE_DONE_KEY, '1');
  return { migrated: data.migrated };
}

export function hasMigrateBeenDone(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(MIGRATE_DONE_KEY) === '1';
}

export function setMigrateDone(): void {
  if (typeof window !== 'undefined') localStorage.setItem(MIGRATE_DONE_KEY, '1');
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

// —— Areas (user-defined categories) ——
export interface Area {
  id: string;
  name: string;
  icon: string;
  isDefault?: boolean;
  createdAt: number;
}

export async function fetchAreas(): Promise<Area[]> {
  try {
    const res = await fetch(`${baseUrl}/api/areas`, { headers: getHeaders() });
    if (res.status === 401) return [];
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error((data as { error?: string }).error ?? 'Failed to fetch areas');
    return Array.isArray(data) ? data : [];
  } catch (e) {
    normalizeNetworkError(e);
  }
}

export async function createArea(area: { name: string; icon?: string }): Promise<Area> {
  try {
    const res = await fetch(`${baseUrl}/api/areas`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ name: area.name.trim(), icon: area.icon ?? 'lightbulb' }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error((data as { error?: string }).error ?? 'Failed to create area');
    return data as Area;
  } catch (e) {
    normalizeNetworkError(e);
  }
}

export async function deleteArea(id: string): Promise<void> {
  try {
    const res = await fetch(`${baseUrl}/api/areas/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error((data as { error?: string }).error ?? 'Failed to delete area');
    }
  } catch (e) {
    normalizeNetworkError(e);
  }
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
  category?: string;
  areaId?: string | null;
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
        category: todo.category ?? 'work',
        areaId: todo.areaId ?? undefined,
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
  updates: { completed?: boolean; text?: string; color?: Todo['color']; category?: string; areaId?: string | null }
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
  position?: number;
  createdAt: number;
  updatedAt?: number;
}

export async function reorderNotes(orderedIds: string[]): Promise<void> {
  try {
    const res = await fetch(`${baseUrl}/api/notes/reorder`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ orderedIds }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error((data as { error?: string }).error ?? 'Failed to reorder notes');
    }
  } catch (e) {
    normalizeNetworkError(e);
  }
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

export async function deleteNote(id: string): Promise<void> {
  try {
    const res = await fetch(`${baseUrl}/api/notes/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error((data as { error?: string }).error ?? 'Failed to delete note');
    }
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
