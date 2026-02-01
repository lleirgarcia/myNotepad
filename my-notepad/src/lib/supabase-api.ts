import { supabase } from './supabase';
import type { TodoRow } from './db-types';
import type { Todo } from '../store/useStore';

function mapRowToTodo(row: TodoRow): Todo {
  return {
    id: row.id,
    text: row.text,
    completed: row.completed,
    color: row.color as Todo['color'],
    category: row.category,
    dueDate: row.due_date ? new Date(row.due_date).getTime() : null,
    createdAt: new Date(row.created_at).getTime(),
  };
}

export async function fetchTodos(userId: string): Promise<Todo[]> {
  if (!supabase) throw new Error('Supabase not configured');
  const { data, error } = await supabase
    .from('todos')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapRowToTodo);
}

export async function fetchWhiteboard(userId: string): Promise<string> {
  if (!supabase) throw new Error('Supabase not configured');
  const { data, error } = await supabase
    .from('whiteboard')
    .select('content')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data?.content ?? '';
}

export async function createTodo(
  userId: string,
  todo: { text: string; color: Todo['color']; category: string; dueDate: number | null }
): Promise<Todo> {
  if (!supabase) throw new Error('Supabase not configured');
  const row: Omit<TodoRow, 'id' | 'created_at'> = {
    user_id: userId,
    text: todo.text,
    completed: false,
    color: todo.color,
    category: todo.category,
    due_date: todo.dueDate ? new Date(todo.dueDate).toISOString() : null,
  };
  const { data, error } = await supabase.from('todos').insert(row).select().single();
  if (error) throw error;
  return mapRowToTodo(data as TodoRow);
}

export async function updateTodo(
  userId: string,
  id: string,
  updates: { completed?: boolean; text?: string }
): Promise<Todo> {
  if (!supabase) throw new Error('Supabase not configured');
  const body: Partial<TodoRow> = {};
  if (updates.completed !== undefined) body.completed = updates.completed;
  if (updates.text !== undefined) body.text = updates.text;
  const { data, error } = await supabase
    .from('todos')
    .update(body)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();
  if (error) throw error;
  return mapRowToTodo(data as TodoRow);
}

export async function deleteTodo(userId: string, id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');
  const { error } = await supabase.from('todos').delete().eq('id', id).eq('user_id', userId);
  if (error) throw error;
}

export async function upsertWhiteboard(userId: string, content: string): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');
  const { error } = await supabase.from('whiteboard').upsert(
    { user_id: userId, content, updated_at: new Date().toISOString() },
    { onConflict: 'user_id' }
  );
  if (error) throw error;
}
