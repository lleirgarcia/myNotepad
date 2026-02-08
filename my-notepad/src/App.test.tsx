import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { useStore } from './store/useStore';

vi.mock('./hooks/useKeyboardDebug', () => ({
  useKeyboardDebug: () => {},
}));

describe('App', () => {
  beforeEach(() => {
    useStore.getState().setTodos([]);
    useStore.getState().setWhiteboard('');
  });

  it('renders header with app name', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Noted' })).toBeInTheDocument();
    expect(screen.getByText(/never was so easy to do tasks/i)).toBeInTheDocument();
  });

  it('renders Tasks and Notes tabs', () => {
    render(<App />);
    expect(screen.getByRole('tab', { name: /tasks/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /notes/i })).toBeInTheDocument();
  });

  it('Tasks tab is selected by default', () => {
    render(<App />);
    const tasksTab = screen.getByRole('tab', { name: /tasks/i });
    expect(tasksTab).toHaveAttribute('aria-selected', 'true');
  });

  it('switches to Notes tab on click', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('tab', { name: /notes/i }));
    expect(screen.getByRole('tab', { name: /notes/i })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByPlaceholderText(/start writing/i)).toBeInTheDocument();
  });

  it('shows Tasks panel content when Tasks tab selected', () => {
    render(<App />);
    expect(screen.getByPlaceholderText('Add a task…')).toBeInTheDocument();
  });

  it('renders footer', () => {
    render(<App />);
    const footerLink = screen.getByRole('link', { name: 'Lleïr' });
    expect(footerLink).toBeInTheDocument();
  });
});
