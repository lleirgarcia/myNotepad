const baseUrl = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:3000';

export type NoteInsight = {
  summary: string;
  tags: string[];
  actionItems: string[];
};

export async function processNote(content: string): Promise<NoteInsight> {
  const res = await fetch(`${baseUrl}/api/openai/notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { message?: string }).message ?? `Request failed: ${res.status}`);
  }
  return res.json() as Promise<NoteInsight>;
}
