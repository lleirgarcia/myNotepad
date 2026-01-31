import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  color: 'red' | 'yellow' | 'cyan';
  category: string;
  dueDate?: number | null;
  createdAt: number;
}

interface Store {
  todos: Todo[];
  whiteboard: string;
  
  // Todo actions
  addTodo: (text: string, color: 'red' | 'yellow' | 'cyan', category: string, dueDate?: number | null) => void;
  toggleTodo: (id: string) => void;
  deleteTodo: (id: string) => void;
  updateTodo: (id: string, text: string) => void;
  
  // Whiteboard actions
  updateWhiteboard: (content: string) => void;
}

export const useStore = create<Store>()(
  persist(
    (set) => ({
      todos: [],
      whiteboard: '',
      
      addTodo: (text, color, category, dueDate = null) =>
        set((state) => ({
          todos: [
            ...state.todos,
            {
              id: crypto.randomUUID(),
              text,
              completed: false,
              color,
              category,
              dueDate: dueDate ?? null,
              createdAt: Date.now(),
            },
          ],
        })),
      
      toggleTodo: (id) =>
        set((state) => ({
          todos: state.todos.map((todo) =>
            todo.id === id ? { ...todo, completed: !todo.completed } : todo
          ),
        })),
      
      deleteTodo: (id) =>
        set((state) => ({
          todos: state.todos.filter((todo) => todo.id !== id),
        })),
      
      updateTodo: (id, text) =>
        set((state) => ({
          todos: state.todos.map((todo) =>
            todo.id === id ? { ...todo, text } : todo
          ),
        })),
      
      updateWhiteboard: (content) =>
        set({ whiteboard: content }),
    }),
    {
      name: 'notepad-storage',
    }
  )
);
