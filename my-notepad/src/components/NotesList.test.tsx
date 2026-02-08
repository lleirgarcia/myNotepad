import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NotesList from './NotesList';
import { useStore } from '../store/useStore';

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: () => false,
  },
}));

vi.mock('@capacitor-community/speech-recognition', () => ({
  SpeechRecognition: {
    available: () => Promise.resolve({ available: false }),
    start: () => Promise.resolve(),
    stop: () => Promise.resolve(),
    removeAllListeners: () => Promise.resolve(),
    addListener: () => Promise.resolve({ remove: () => Promise.resolve() }),
    requestPermissions: () => Promise.resolve(),
  },
}));

describe('NotesList', () => {
  beforeEach(() => {
    useStore.getState().setTodos([]);
    useStore.getState().setWhiteboard('');
  });

  it('renders notes section with textarea and Process with AI button', () => {
    render(<NotesList />);
    expect(screen.getByText('Notes')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/start writing/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /process full text and get ai insights/i })).toBeInTheDocument();
  });

  it('textarea is controlled by store whiteboard', async () => {
    const user = userEvent.setup();
    useStore.getState().setWhiteboardContent('existing note');
    render(<NotesList />);
    const textarea = screen.getByLabelText(/notes - auto-saved/i);
    expect(textarea).toHaveValue('existing note');
    await user.clear(textarea);
    await user.type(textarea, 'new text');
    expect(useStore.getState().whiteboard).toBe('new text');
  });

  it('Process with AI button is disabled when whiteboard is empty', () => {
    render(<NotesList />);
    const btn = screen.getByRole('button', { name: /process full text and get ai insights/i });
    expect(btn).toBeDisabled();
  });

  it('Process with AI button is enabled when whiteboard has content', async () => {
    const user = userEvent.setup();
    render(<NotesList />);
    const textarea = screen.getByPlaceholderText(/start writing/i);
    await user.type(textarea, 'some note');
    expect(screen.getByRole('button', { name: /process full text and get ai insights/i })).not.toBeDisabled();
  });

  it('shows AI insights section', () => {
    render(<NotesList />);
    expect(screen.getByText('AI insights')).toBeInTheDocument();
  });

  it('shows stats (lines, words, chars) when content is present', async () => {
    const user = userEvent.setup();
    render(<NotesList />);
    await user.type(screen.getByPlaceholderText(/start writing/i), 'one two');
    expect(screen.getByText(/lines/)).toBeInTheDocument();
    expect(screen.getByText(/words/)).toBeInTheDocument();
    expect(screen.getByText(/chars/)).toBeInTheDocument();
  });
});
