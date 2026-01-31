import { useState } from 'react';
import { CheckSquare, BookOpen } from 'lucide-react';
import TodoList from './components/TodoList';
import NotesList from './components/NotesList';
import { cn } from './lib/utils';

function App() {
  const [activeTab, setActiveTab] = useState<'todos' | 'notes'>('todos');

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Header */}
        <header className="mb-8 pt-2">
          <h1 className="text-3xl font-bold text-slate-50 mb-1 tracking-tight">
            My Notepad
          </h1>
          <p className="text-slate-400 text-sm">
            Keep your mind clean and organized
          </p>
        </header>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 bg-slate-900 rounded-lg p-1 border border-slate-800" role="tablist" aria-label="Main sections">
          <button
            role="tab"
            aria-selected={activeTab === 'todos'}
            aria-controls="todos-panel"
            id="todos-tab"
            onClick={() => setActiveTab('todos')}
            className={cn(
              'flex-1 py-3 px-4 rounded-md font-medium transition-all flex items-center justify-center gap-2',
              activeTab === 'todos'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            )}
          >
            <CheckSquare className="w-4 h-4" aria-hidden />
            <span>Todos</span>
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'notes'}
            aria-controls="notes-panel"
            id="notes-tab"
            onClick={() => setActiveTab('notes')}
            className={cn(
              'flex-1 py-3 px-4 rounded-md font-medium transition-all flex items-center justify-center gap-2',
              activeTab === 'notes'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            )}
          >
            <BookOpen className="w-4 h-4" aria-hidden />
            <span>Notes</span>
          </button>
        </div>

        {/* Content */}
        <div
          id={activeTab === 'todos' ? 'todos-panel' : 'notes-panel'}
          role="tabpanel"
          aria-labelledby={activeTab === 'todos' ? 'todos-tab' : 'notes-tab'}
          className="bg-slate-900 rounded-lg border border-slate-800 p-6 shadow-sm transition-opacity duration-150"
        >
          {activeTab === 'todos' ? <TodoList /> : <NotesList />}
        </div>
      </div>
    </div>
  );
}

export default App;
