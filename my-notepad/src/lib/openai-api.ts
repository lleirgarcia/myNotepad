import { getHeaders } from './backend-api.js';

const baseUrl = (import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:3000').toString().trim();

export type NoteInsight = {
  title: string;
  summary: string;
  tags: string[];
  actionItems: string[];
  areaId?: string | null;
};

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

export async function processNote(content: string): Promise<NoteInsight> {
  try {
    const res = await fetch(`${baseUrl}/api/openai/notes`, {
      method: 'POST',
      headers: { ...getHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error((body as { message?: string }).message ?? `Request failed: ${res.status}`);
    }
    const data = (await res.json()) as NoteInsight;
    console.log('Process with AI – response JSON:', data);
    return data;
  } catch (e) {
    normalizeNetworkError(e);
  }
}
