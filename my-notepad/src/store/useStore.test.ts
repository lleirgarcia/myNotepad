import { describe, it, expect, beforeEach } from 'vitest';
import { useStore, type Todo } from './useStore';

const makeTodo = (overrides: Partial<Todo> = {}): Todo => ({
  id: 'id-1',
  text: 'Task one',
  completed: false,
  color: 'cyan',
  category: 'work',
  dueDate: null,
  noteId: null,
  noteTitle: null,
  createdAt: Date.now(),
  ...overrides,
});

describe('useStore', () => {
  beforeEach(() => {
    useStore.getState().setTodos([]);
    useStore.getState().setWhiteboard('');
  });

  it('starts with empty todos and whiteboard', () => {
    expect(useStore.getState().todos).toEqual([]);
    expect(useStore.getState().whiteboard).toBe('');
  });

  it('addTodo prepends a todo', () => {
    const todo = makeTodo({ id: 'a', text: 'First' });
    useStore.getState().addTodo(todo);
    expect(useStore.getState().todos).toHaveLength(1);
    expect(useStore.getState().todos[0].text).toBe('First');

    useStore.getState().addTodo(makeTodo({ id: 'b', text: 'Second' }));
    expect(useStore.getState().todos).toHaveLength(2);
    expect(useStore.getState().todos[0].text).toBe('Second');
  });

  it('updateTodo replaces todo by id', () => {
    const todo = makeTodo({ id: 'x', text: 'Original' });
    useStore.getState().addTodo(todo);
    useStore.getState().updateTodo({ ...todo, text: 'Updated' });
    expect(useStore.getState().todos[0].text).toBe('Updated');
  });

  it('removeTodo removes by id', () => {
    useStore.getState().addTodo(makeTodo({ id: '1' }));
    useStore.getState().addTodo(makeTodo({ id: '2' }));
    useStore.getState().removeTodo('1');
    expect(useStore.getState().todos).toHaveLength(1);
    expect(useStore.getState().todos[0].id).toBe('2');
  });

  it('removeTodosByNoteId removes all todos with that noteId', () => {
    useStore.getState().addTodo(makeTodo({ id: '1', noteId: 'n1' }));
    useStore.getState().addTodo(makeTodo({ id: '2', noteId: 'n1' }));
    useStore.getState().addTodo(makeTodo({ id: '3', noteId: 'n2' }));
    useStore.getState().removeTodosByNoteId('n1');
    expect(useStore.getState().todos).toHaveLength(1);
    expect(useStore.getState().todos[0].id).toBe('3');
  });

  it('setWhiteboardContent and setTodos update state', () => {
    useStore.getState().setWhiteboardContent('hello');
    expect(useStore.getState().whiteboard).toBe('hello');

    useStore.getState().setTodos([makeTodo({ id: '1' })]);
    expect(useStore.getState().todos).toHaveLength(1);
  });
});
