import { create } from 'zustand';

export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  color: 'red' | 'yellow' | 'cyan';
  category: string;
  dueDate?: number | null;
  noteId?: string | null;
  noteTitle?: string | null;
  createdAt: number;
}

interface Store {
  todos: Todo[];
  whiteboard: string;

  // Hydration (from Supabase)
  setTodos: (todos: Todo[]) => void;
  setWhiteboard: (content: string) => void;

  // Mutations (called after Supabase success)
  addTodo: (todo: Todo) => void;
  updateTodo: (todo: Todo) => void;
  removeTodo: (id: string) => void;
  removeTodosByNoteId: (noteId: string) => void;
  setWhiteboardContent: (content: string) => void;
}

export const useStore = create<Store>()((set) => ({
  todos: [],
  whiteboard: '',

  setTodos: (todos) => set({ todos }),
  setWhiteboard: (content) => set({ whiteboard: content }),

  addTodo: (todo) =>
    set((state) => ({
      todos: [todo, ...state.todos],
    })),

  updateTodo: (todo) =>
    set((state) => ({
      todos: state.todos.map((t) => (t.id === todo.id ? todo : t)),
    })),

  removeTodo: (id) =>
    set((state) => ({
      todos: state.todos.filter((t) => t.id !== id),
    })),

  removeTodosByNoteId: (noteId) =>
    set((state) => ({
      todos: state.todos.filter((t) => t.noteId !== noteId),
    })),

  setWhiteboardContent: (content) => set({ whiteboard: content }),
}));
