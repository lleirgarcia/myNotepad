export type TodoColor = 'red' | 'yellow' | 'cyan';

export interface TodoRow {
  id: string;
  user_id: string;
  text: string;
  completed: boolean;
  color: TodoColor;
  category: string;
  due_date: string | null;
  created_at: string;
}

export interface WhiteboardRow {
  user_id: string;
  content: string;
  updated_at: string;
}
