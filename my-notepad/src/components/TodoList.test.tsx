import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TodoList from './TodoList';
import { useStore } from '../store/useStore';

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: () => false,
  },
}));

describe('TodoList', () => {
  beforeEach(() => {
    useStore.getState().setTodos([]);
    useStore.getState().setWhiteboard('');
  });

  it('renders add form and filter pills', () => {
    render(<TodoList />);
    expect(screen.getByPlaceholderText('Add a task…')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add task/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /show all active tasks/i })).toBeInTheDocument();
    expect(screen.getByText('Tasks')).toBeInTheDocument();
  });

  it('shows empty state when no todos', () => {
    render(<TodoList />);
    expect(screen.getByText('Your list is clear')).toBeInTheDocument();
    expect(screen.getByText('Add a task above to get started')).toBeInTheDocument();
  });

  it('adds a todo locally and shows it in the list', async () => {
    const user = userEvent.setup();
    render(<TodoList />);
    const input = screen.getByPlaceholderText('Add a task…');
    await user.type(input, 'Buy milk');
    await user.click(screen.getByRole('button', { name: /add task/i }));
    await waitFor(() => {
      expect(screen.getByText('Buy milk')).toBeInTheDocument();
    });
    expect(input).toHaveValue('');
  });

  it('does not add empty todo on submit', async () => {
    const user = userEvent.setup();
    render(<TodoList />);
    await user.click(screen.getByRole('button', { name: /add task/i }));
    expect(screen.getByText('Your list is clear')).toBeInTheDocument();
  });

  it('toggles todo complete', async () => {
    const user = userEvent.setup();
    useStore.getState().addTodo({
      id: 't1',
      text: 'Task to complete',
      completed: false,
      color: 'cyan',
      category: 'work',
      dueDate: null,
      noteId: null,
      noteTitle: null,
      createdAt: Date.now(),
    });
    render(<TodoList />);
    expect(screen.getByText('Task to complete')).toBeInTheDocument();
    const markComplete = screen.getByRole('button', { name: /mark complete/i });
    await user.click(markComplete);
    await waitFor(() => {
      expect(screen.queryByText('Task to complete')).not.toBeInTheDocument();
    });
    await user.click(screen.getByRole('button', { name: /show completed tasks/i }));
    await waitFor(() => {
      expect(screen.getByText('Task to complete')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /mark incomplete/i })).toBeInTheDocument();
    });
  });

  it('filter Done shows completed tasks', async () => {
    useStore.getState().addTodo({
      id: 't1',
      text: 'Done task',
      completed: true,
      color: 'cyan',
      category: 'work',
      dueDate: null,
      noteId: null,
      noteTitle: null,
      createdAt: Date.now(),
    });
    render(<TodoList />);
    await userEvent.click(screen.getByRole('button', { name: /show completed tasks/i }));
    expect(screen.getByText('Done task')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });

  it('filter Done shows empty state when no completed tasks', async () => {
    render(<TodoList />);
    await userEvent.click(screen.getByRole('button', { name: /show completed tasks/i }));
    expect(screen.getByText('No completed tasks yet')).toBeInTheDocument();
  });

  it('delete button removes todo', async () => {
    const user = userEvent.setup();
    useStore.getState().addTodo({
      id: 't1',
      text: 'To delete',
      completed: false,
      color: 'cyan',
      category: 'work',
      dueDate: null,
      noteId: null,
      noteTitle: null,
      createdAt: Date.now(),
    });
    render(<TodoList />);
    expect(screen.getByText('To delete')).toBeInTheDocument();
    const deleteBtn = screen.getByRole('button', { name: /delete task/i });
    await user.click(deleteBtn);
    await waitFor(() => {
      expect(screen.queryByText('To delete')).not.toBeInTheDocument();
    });
  });

  it('priority color buttons are present', () => {
    render(<TodoList />);
    expect(screen.getByLabelText(/red priority/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/yellow priority/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/cyan priority/i)).toBeInTheDocument();
  });
});
