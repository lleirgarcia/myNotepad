import { useState, useRef, useEffect, useMemo } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Plus, Trash2, Circle, CheckCircle2, Briefcase, Heart, Users, Home, Dumbbell, Lightbulb, Calendar, X, ChevronDown, ChevronRight, ChevronUp, BookOpen } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { useStore, type Todo } from '../store/useStore';
import * as backendApi from '../lib/backend-api';
import { cn } from '../lib/utils';

function formatDueDate(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: d.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined });
}

const CATEGORIES = [
  { id: 'work', label: 'Work', icon: Briefcase },
  { id: 'health', label: 'Health', icon: Heart },
  { id: 'friends', label: 'Friends', icon: Users },
  { id: 'personal', label: 'Personal', icon: Home },
  { id: 'fitness', label: 'Fitness', icon: Dumbbell },
  { id: 'ideas', label: 'Ideas / Thoughts', icon: Lightbulb },
];

const COLORS = [
  { id: 'red' as const, label: 'Red priority', color: 'bg-red-500', ring: 'ring-red-500', hover: 'hover:bg-red-600' },
  { id: 'yellow' as const, label: 'Yellow priority', color: 'bg-yellow-500', ring: 'ring-yellow-500', hover: 'hover:bg-yellow-600' },
  { id: 'cyan' as const, label: 'Cyan priority', color: 'bg-cyan-500', ring: 'ring-cyan-500', hover: 'hover:bg-cyan-600' },
];

/** Priority order for sorting: red (highest) → yellow → cyan (lowest) */
const COLOR_PRIORITY_ORDER: Record<'red' | 'yellow' | 'cyan', number> = {
  red: 0,
  yellow: 1,
  cyan: 2,
};

const FILTER_DONE_ID = 'done';

const backendUrl = import.meta.env.VITE_BACKEND_URL?.trim() || '';

const TodoList = () => {
  const [newTodo, setNewTodo] = useState('');
  const [selectedColor, setSelectedColor] = useState<'red' | 'yellow' | 'cyan'>('cyan');
  const [selectedCategory, setSelectedCategory] = useState('work');
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [dueDate, setDueDate] = useState<number | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [addLoading, setAddLoading] = useState(false);
  const [justCompletedIds, setJustCompletedIds] = useState<Set<string>>(new Set());
  const [collapsedNoteIds, setCollapsedNoteIds] = useState<Set<string>>(new Set());
  const completedTimeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const calendarRef = useRef<HTMLDivElement>(null);
  const todoInputRef = useRef<HTMLTextAreaElement>(null);
  const { todos, addTodo, updateTodo, removeTodo, removeTodosByNoteId } = useStore();
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null);
  const [openPriorityTodoId, setOpenPriorityTodoId] = useState<string | null>(null);
  const priorityPopoverRef = useRef<HTMLDivElement>(null);
  const [toast, setToast] = useState<{ message: string } | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Only notes that have at least one active (incomplete) task
  const notesWithActiveTasks = useMemo(() => {
    const map = new Map<string, string>();
    for (const t of todos) {
      if (!t.completed && t.noteId) map.set(t.noteId, t.noteTitle ?? 'Note');
    }
    return Array.from(map.entries()).map(([id, title]) => ({ id, title }));
  }, [todos]);

  useEffect(() => {
    return () => {
      completedTimeoutsRef.current.forEach((t) => clearTimeout(t));
      completedTimeoutsRef.current.clear();
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, []);

  const showToast = (message: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ message });
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
      toastTimeoutRef.current = null;
    }, 2000);
  };

  // Clear selected note if it no longer has active tasks
  useEffect(() => {
    if (selectedNoteId && !notesWithActiveTasks.some((n) => n.id === selectedNoteId)) {
      setSelectedNoteId(null);
    }
  }, [selectedNoteId, notesWithActiveTasks]);

  // Grow todo input height as user types
  useEffect(() => {
    const el = todoInputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.max(el.scrollHeight, 48)}px`;
  }, [newTodo]);

  const handleTodoInputFocus = () => {
    console.log('[Keyboard Debug] Todo input focused');
    // On iOS, programmatic scrollIntoView can make the system resign first responder and hide the keyboard.
    // Only scroll on web so the keyboard stays visible on native.
    if (!Capacitor.isNativePlatform()) {
      setTimeout(() => {
        todoInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    }
  };

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (calendarRef.current && !calendarRef.current.contains(e.target as Node)) {
        setCalendarOpen(false);
      }
    }
    if (calendarOpen) document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [calendarOpen]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (priorityPopoverRef.current && !priorityPopoverRef.current.contains(e.target as Node)) {
        setOpenPriorityTodoId(null);
      }
    }
    if (openPriorityTodoId) document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [openPriorityTodoId]);

  const handleDateChange = (date: Date | null) => {
    setDueDate(date ? date.getTime() : null);
    if (date) setCalendarOpen(false);
  };

  const handleClearDate = () => {
    setDueDate(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodo.trim()) return;
    setSyncError(null);
    setAddLoading(true);
    try {
      if (!backendUrl) {
        const localTodo = {
          id: crypto.randomUUID(),
          text: newTodo.trim(),
          completed: false,
          color: selectedColor,
          category: selectedCategory,
          dueDate: dueDate ?? null,
          createdAt: Date.now(),
        };
        addTodo(localTodo);
      } else {
        const todo = await backendApi.createTodo({
          text: newTodo.trim(),
          color: selectedColor,
          category: selectedCategory,
          dueDate,
          noteId: selectedNoteId ?? null,
        });
        addTodo(todo);
      }
      setNewTodo('');
      setSelectedColor('cyan');
      setDueDate(null);
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : 'Failed to add task');
    } finally {
      setAddLoading(false);
    }
  };

  const filteredTodos =
    filterCategory === FILTER_DONE_ID
      ? todos.filter((t) => t.completed)
      : filterCategory
        ? todos.filter((t) => !t.completed && t.category === filterCategory)
        : todos.filter((t) => !t.completed);

  const sortedTodos =
    filterCategory === FILTER_DONE_ID
      ? [...filteredTodos].sort((a, b) => b.createdAt - a.createdAt)
      : [...filteredTodos].sort((a, b) => {
          const aJustCompleted = justCompletedIds.has(a.id);
          const bJustCompleted = justCompletedIds.has(b.id);
          const aDone = a.completed && !aJustCompleted;
          const bDone = b.completed && !bJustCompleted;
          if (aDone !== bDone) return aDone ? 1 : -1;
          return b.createdAt - a.createdAt;
        });

  const groupsByNote = (() => {
    const map = new Map<string, { title: string; todos: typeof sortedTodos }>();
    for (const todo of sortedTodos) {
      const key = todo.noteId ?? '_no_note';
      const title = todo.noteId ? (todo.noteTitle || 'Note') : 'Other tasks';
      if (!map.has(key)) map.set(key, { title, todos: [] });
      map.get(key)!.todos.push(todo);
    }
    for (const group of map.values()) {
      group.todos.sort((a, b) => {
        const pa = COLOR_PRIORITY_ORDER[a.color];
        const pb = COLOR_PRIORITY_ORDER[b.color];
        if (pa !== pb) return pa - pb;
        return b.createdAt - a.createdAt;
      });
    }
    const entries = Array.from(map.entries());
    const priorityCounts = (key: string) => {
      const todos = map.get(key)!.todos;
      return {
        red: todos.filter((t) => t.color === 'red').length,
        yellow: todos.filter((t) => t.color === 'yellow').length,
        cyan: todos.filter((t) => t.color === 'cyan').length,
      };
    };
    entries.sort(([a], [b]) => {
      if (a === '_no_note') return 1;
      if (b === '_no_note') return -1;
      const ca = priorityCounts(a);
      const cb = priorityCounts(b);
      if (ca.red !== cb.red) return cb.red - ca.red;
      if (ca.yellow !== cb.yellow) return cb.yellow - ca.yellow;
      return cb.cyan - ca.cyan;
    });
    return entries;
  })();

  const toggleNoteGroup = (key: string) => {
    setCollapsedNoteIds((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleDeleteNoteSection = async (noteId: string) => {
    if (!backendUrl || deletingNoteId) return;
    setSyncError(null);
    setDeletingNoteId(noteId);
    try {
      await backendApi.deleteNote(noteId);
      removeTodosByNoteId(noteId);
      showToast('Note and tasks removed');
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : 'Failed to delete note');
    } finally {
      setDeletingNoteId(null);
    }
  };

  const handlePriorityChange = async (todo: Todo, newColor: 'red' | 'yellow' | 'cyan') => {
    if (todo.color === newColor) {
      setOpenPriorityTodoId(null);
      return;
    }
    if (!backendUrl) {
      updateTodo({ ...todo, color: newColor });
      setOpenPriorityTodoId(null);
      return;
    }
    try {
      const updated = await backendApi.updateTodo(todo.id, { color: newColor });
      updateTodo(updated);
      setOpenPriorityTodoId(null);
    } catch {
      setSyncError('Failed to update priority');
    }
  };

  const colorConfig = {
    red: 'bg-red-500',
    yellow: 'bg-yellow-500',
    cyan: 'bg-cyan-500',
  };

  const activeTodos = todos.filter(t => !t.completed).length;

  const sectionTitle =
    filterCategory === FILTER_DONE_ID
      ? 'Completed'
      : filterCategory
        ? CATEGORIES.find((c) => c.id === filterCategory)?.label ?? 'Tasks'
        : 'Tasks';

  return (
    <div className="min-w-0 max-w-full overflow-hidden">
      {/* Quick-add bar (Todoist-style) */}
      <form
        onSubmit={handleSubmit}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && newTodo.trim()) {
            e.preventDefault();
            handleSubmit(e);
          }
        }}
        className="mb-5 min-w-0 max-w-full"
      >
        {syncError && (
          <p className="mb-3 text-sm text-red-400" role="alert">
            {syncError}
          </p>
        )}
        <div className="flex flex-col gap-3 w-full min-w-0 max-w-full">
          <p className="section-label mb-0" id="add-task-priority-label">Priority</p>
          <div className="quick-add-bar flex items-start min-h-[48px] min-w-0 w-full overflow-hidden" aria-labelledby="add-task-priority-label">
            <div className="shrink-0 flex items-stretch w-[calc(2.25rem*3)] md:w-[calc(2rem*3)] border-r border-zinc-700 self-stretch min-h-[48px]">
              {COLORS.map((color, i) => (
                <button
                  key={color.id}
                  type="button"
                  onClick={() => setSelectedColor(color.id)}
                  aria-label={color.label}
                  title={color.label}
                  className={cn(
                    'flex-1 min-w-0 self-stretch transition-all',
                    color.color,
                    color.hover,
                    selectedColor === color.id && 'ring-2 ring-inset ring-white/50',
                    i > 0 && 'border-l border-zinc-600'
                  )}
                />
              ))}
            </div>
            <textarea
              ref={todoInputRef}
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              onFocus={handleTodoInputFocus}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  e.stopPropagation();
                  if (newTodo.trim()) handleSubmit(e as unknown as React.FormEvent);
                }
              }}
              placeholder="Add a task…"
              autoComplete="off"
              rows={1}
              enterKeyHint="done"
              className="flex-1 min-w-0 px-4 py-3 bg-transparent border-0 text-zinc-100 placeholder:text-zinc-500 text-[16px] md:text-[15px] focus:outline-none focus:ring-0 resize-none overflow-hidden align-top"
              style={{ minHeight: 48 }}
            />
          </div>
          <div className="flex flex-wrap gap-2 items-end min-w-0 w-full text-sm">
            <div className="relative shrink-0 w-[5.5rem] flex flex-col gap-1" ref={calendarRef}>
              <span className="section-label mb-0" id="add-task-date-label">Date</span>
              <button
                type="button"
                onClick={() => setCalendarOpen((o) => !o)}
                aria-label={dueDate ? `Due: ${formatDueDate(dueDate)}. Click to change` : 'Add due date (optional)'}
                title={dueDate ? formatDueDate(dueDate) : 'Pick a date (optional)'}
                className={cn(
                  'flex items-center justify-center min-h-[44px] h-11 md:h-9 w-full px-2 rounded-md border transition-colors duration-200',
                  dueDate
                    ? 'border-amber-500/50 bg-amber-500/10 text-amber-400'
                    : 'border-zinc-700 bg-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600'
                )}
              >
                <Calendar className="w-4 h-4 shrink-0" />
                {dueDate && <span className="text-xs font-medium truncate ml-1" title={formatDueDate(dueDate)}>{formatDueDate(dueDate)}</span>}
              </button>
              {calendarOpen && (
                <div className="absolute left-0 top-full mt-1 z-20 flex flex-col gap-2">
                  <div className="datepicker-dark bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl p-2">
                    <DatePicker
                      selected={dueDate ? new Date(dueDate) : null}
                      onChange={handleDateChange}
                      inline
                      showMonthDropdown
                      showYearDropdown
                      dropdownMode="select"
                      dateFormat="MMM d, yyyy"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleClearDate}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-md bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-zinc-200 text-xs"
                  >
                    <X className="w-3 h-3" />
                    Clear date
                  </button>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0 flex flex-col gap-1">
              <span className="section-label mb-0" id="add-task-category-label">Category</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                aria-labelledby="add-task-category-label"
                className="w-full min-h-[44px] h-11 md:h-9 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-zinc-200 text-sm transition-colors duration-200 hover:border-zinc-600"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.label}</option>
                ))}
              </select>
            </div>
            {backendUrl && (
              <div className="flex-1 min-w-0 flex flex-col gap-1">
                <span className="section-label mb-0" id="add-task-note-label">Add to note</span>
                <select
                  value={selectedNoteId ?? ''}
                  onChange={(e) => setSelectedNoteId(e.target.value ? e.target.value : null)}
                  aria-labelledby="add-task-note-label"
                  title="Add this task to a note (only notes with active tasks)"
                  className="w-full min-h-[44px] h-11 md:h-9 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-zinc-200 text-sm transition-colors duration-200 hover:border-zinc-600"
                >
                  <option value="">Other tasks</option>
                  {notesWithActiveTasks.map((note) => (
                    <option key={note.id} value={note.id}>{note.title}</option>
                  ))}
                </select>
              </div>
            )}
            <button
              type="submit"
              disabled={addLoading}
              aria-label="Add task"
              className="shrink-0 min-h-[44px] h-11 md:h-9 px-4 py-2 bg-amber-500 text-zinc-950 rounded-md hover:bg-amber-600 active:scale-[0.98] transition-all duration-200 font-medium flex items-center justify-center gap-1.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
              {addLoading ? 'Adding…' : 'Add'}
            </button>
          </div>
        </div>
      </form>

      {/* Filter pills – wrap so all categories are visible */}
      <div
        className="flex flex-wrap gap-2 mb-4 min-w-0 max-w-full"
        role="group"
        aria-label="Filter tasks by category"
      >
        <button
          onClick={() => setFilterCategory(null)}
          aria-pressed={filterCategory === null}
          aria-label="Show all active tasks"
          className={cn(
            'min-h-[40px] px-3.5 py-2 rounded-full text-[11px] font-semibold uppercase tracking-wider transition-colors duration-200',
            filterCategory === null
              ? 'bg-zinc-600 text-zinc-100'
              : 'bg-zinc-800/80 text-zinc-500 hover:bg-zinc-700 hover:text-zinc-300'
          )}
        >
          All
        </button>
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const count = todos.filter((t) => t.category === cat.id && !t.completed).length;
          return (
            <button
              key={cat.id}
              onClick={() => setFilterCategory(cat.id)}
              aria-pressed={filterCategory === cat.id}
              aria-label={`Filter by ${cat.label}${count > 0 ? `, ${count} active` : ''}`}
              className={cn(
                'min-h-[40px] px-3.5 py-2 rounded-full text-[11px] font-semibold uppercase tracking-wider transition-colors duration-200 flex items-center gap-1.5',
                filterCategory === cat.id
                  ? 'bg-zinc-600 text-zinc-100'
                  : 'bg-zinc-800/80 text-zinc-500 hover:bg-zinc-700 hover:text-zinc-300'
              )}
            >
              <Icon className="w-3 h-3" aria-hidden />
              {cat.label}
              {count > 0 && <span className="ml-0.5 opacity-80">{count}</span>}
            </button>
          );
        })}
        <button
          onClick={() => setFilterCategory(FILTER_DONE_ID)}
          aria-pressed={filterCategory === FILTER_DONE_ID}
          aria-label="Show completed tasks"
          className={cn(
            'min-h-[40px] px-3.5 py-2 rounded-full text-[11px] font-semibold uppercase tracking-wider transition-colors duration-200 flex items-center gap-1.5',
            filterCategory === FILTER_DONE_ID
              ? 'bg-zinc-600 text-zinc-100'
              : 'bg-zinc-800/80 text-zinc-500 hover:bg-zinc-700 hover:text-zinc-300'
          )}
        >
          <CheckCircle2 className="w-3 h-3" aria-hidden />
          Done
          {todos.filter((t) => t.completed).length > 0 && (
            <span className="ml-0.5 opacity-80">{todos.filter((t) => t.completed).length}</span>
          )}
        </button>
        {groupsByNote.length > 0 && (
          <button
            type="button"
            onClick={() => {
              const allCollapsed = groupsByNote.every(([key]) => collapsedNoteIds.has(key));
              if (allCollapsed) {
                setCollapsedNoteIds(new Set());
              } else {
                setCollapsedNoteIds(new Set(groupsByNote.map(([key]) => key)));
              }
            }}
            aria-label={groupsByNote.every(([k]) => collapsedNoteIds.has(k)) ? 'Expand all notes' : 'Collapse all notes'}
            title={groupsByNote.every(([k]) => collapsedNoteIds.has(k)) ? 'Expand all notes' : 'Collapse all notes'}
            className="min-h-[40px] px-3.5 py-2 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-zinc-800/80 text-zinc-500 hover:bg-zinc-700 hover:text-zinc-300 transition-colors duration-200 flex items-center gap-1.5"
          >
            {groupsByNote.every(([k]) => collapsedNoteIds.has(k)) ? (
              <ChevronDown className="w-3 h-3" aria-hidden />
            ) : (
              <ChevronUp className="w-3 h-3" aria-hidden />
            )}
            {groupsByNote.every(([k]) => collapsedNoteIds.has(k)) ? 'Expand all' : 'Collapse all'}
          </button>
        )}
      </div>

      {/* Section label + list */}
      <p className="section-label">{sectionTitle}</p>
      <div className="space-y-1.5">
        {sortedTodos.length === 0 ? (
          <div className="empty-state">
            <CheckCircle2 className="empty-state__icon" aria-hidden />
            {filterCategory === FILTER_DONE_ID ? (
              <>
                <p className="empty-state__title">No completed tasks yet</p>
                <p className="empty-state__sub">Checked tasks will show up here</p>
              </>
            ) : (
              <>
                <p className="empty-state__title">Your list is clear</p>
                <p className="empty-state__sub">Add a task above to get started</p>
              </>
            )}
          </div>
        ) : (
          groupsByNote.map(([noteKey, { title: noteTitle, todos: groupTodos }]) => {
            const isCollapsed = collapsedNoteIds.has(noteKey);
            return (
              <div key={noteKey} className="rounded-xl border border-zinc-700/50 bg-zinc-800/40 overflow-hidden">
                <div className="flex items-center min-w-0">
                  <button
                    type="button"
                    onClick={() => toggleNoteGroup(noteKey)}
                    className="flex-1 min-w-0 flex items-center gap-2.5 px-3.5 py-2.5 text-left text-zinc-300 rounded-t-xl"
                    aria-expanded={!isCollapsed}
                  >
                    {isCollapsed ? (
                      <ChevronRight className="w-4 h-4 shrink-0 text-zinc-500" aria-hidden />
                    ) : (
                      <ChevronDown className="w-4 h-4 shrink-0 text-zinc-500" aria-hidden />
                    )}
                    <BookOpen className="w-4 h-4 shrink-0 text-zinc-500" aria-hidden />
                    <span className="font-medium text-sm truncate">{noteTitle}</span>
                    <span className="ml-1 text-xs text-zinc-500 shrink-0">({groupTodos.length})</span>
                  </button>
                  <span className="flex items-center gap-1 shrink-0 px-1" aria-label="Tasks per priority">
                    {(['red', 'yellow', 'cyan'] as const).map((color) => {
                      const count = groupTodos.filter((t) => t.color === color).length;
                      if (count === 0) return null;
                      const lightness = count === 1 ? 'mid' : 'full';
                      const colorClasses = {
                        red: { mid: 'bg-red-400 text-white', full: 'bg-red-500 text-white' },
                        yellow: { mid: 'bg-yellow-400 text-white', full: 'bg-yellow-500 text-white' },
                        cyan: { mid: 'bg-cyan-400 text-white', full: 'bg-cyan-500 text-white' },
                      };
                      return (
                        <span
                          key={color}
                          className={cn(
                            'flex items-center justify-center min-w-[1.25rem] h-5 px-1 rounded text-[10px] font-medium',
                            colorClasses[color][lightness]
                          )}
                          title={`${color}: ${count}`}
                        >
                          {count}
                        </span>
                      );
                    })}
                  </span>
                  <span className="shrink-0 w-10 min-w-[2.5rem] flex items-center justify-center">
                    {backendUrl && noteKey !== '_no_note' ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteNoteSection(noteKey);
                        }}
                        disabled={deletingNoteId === noteKey}
                        aria-label={`Delete note "${noteTitle}" and all ${groupTodos.length} tasks`}
                        className="p-2 -m-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors disabled:opacity-50 flex items-center justify-center"
                      >
                        {deletingNoteId === noteKey ? (
                          <span className="text-xs">…</span>
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    ) : null}
                  </span>
                </div>
                {!isCollapsed && (
                  <div className="space-y-1 px-2 pb-2 pt-0">
                    {groupTodos.map((todo) => {
                      const category = CATEGORIES.find((c) => c.id === todo.category);
                      const Icon = category?.icon;
                      return (
                        <div
                          key={todo.id}
                          className={cn(
                            'task-card flex items-center gap-2 group',
                            todo.completed && 'task-card--completed'
                          )}
                        >
                          <div className="relative flex-shrink-0" ref={openPriorityTodoId === todo.id ? priorityPopoverRef : undefined}>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenPriorityTodoId((prev) => (prev === todo.id ? null : todo.id));
                              }}
                              aria-label="Change priority"
                              title="Change priority"
                              className={cn(
                                'w-1 min-w-[4px] self-stretch min-h-[1.25rem] rounded-full flex-shrink-0 cursor-pointer transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-1 focus:ring-offset-zinc-800',
                                colorConfig[todo.color]
                              )}
                            />
                            {openPriorityTodoId === todo.id && (
                              <div
                                className="absolute left-0 top-full mt-1 z-30 flex gap-1.5 p-2 rounded-lg bg-zinc-800 border border-zinc-600 shadow-xl"
                                role="listbox"
                                aria-label="Priority colors"
                              >
                                {COLORS.map((c) => (
                                  <button
                                    key={c.id}
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handlePriorityChange(todo, c.id);
                                    }}
                                    aria-label={c.label}
                                    title={c.label}
                                    className={cn(
                                      'w-6 h-6 rounded-full transition-all hover:scale-110',
                                      c.color,
                                      c.hover,
                                      todo.color === c.id && 'ring-2 ring-inset ring-white/50'
                                    )}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                          <button
                            onClick={async () => {
                              const nextCompleted = !todo.completed;
                              const id = todo.id;
                              if (!nextCompleted) {
                                const existing = completedTimeoutsRef.current.get(id);
                                if (existing) {
                                  clearTimeout(existing);
                                  completedTimeoutsRef.current.delete(id);
                                }
                                setJustCompletedIds((prev) => {
                                  const next = new Set(prev);
                                  next.delete(id);
                                  return next;
                                });
                              }
                              if (!backendUrl) {
                                updateTodo({ ...todo, completed: nextCompleted });
                                if (nextCompleted) {
                                  showToast('Task completed');
                                  setJustCompletedIds((prev) => new Set(prev).add(id));
                                  const t = setTimeout(() => {
                                    setJustCompletedIds((prev) => {
                                      const next = new Set(prev);
                                      next.delete(id);
                                      return next;
                                    });
                                    completedTimeoutsRef.current.delete(id);
                                  }, 1000);
                                  completedTimeoutsRef.current.set(id, t);
                                }
                                return;
                              }
                              try {
                                const updated = await backendApi.updateTodo(id, { completed: nextCompleted });
                                updateTodo(updated);
                                if (nextCompleted) {
                                  showToast('Task completed');
                                  setJustCompletedIds((prev) => new Set(prev).add(id));
                                  const t = setTimeout(() => {
                                    setJustCompletedIds((prev) => {
                                      const next = new Set(prev);
                                      next.delete(id);
                                      return next;
                                    });
                                    completedTimeoutsRef.current.delete(id);
                                  }, 1000);
                                  completedTimeoutsRef.current.set(id, t);
                                }
                              } catch {
                                setSyncError('Failed to update');
                              }
                            }}
                            className="flex-shrink-0 min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 flex items-center justify-center -my-1 md:my-0"
                            aria-label={todo.completed ? 'Mark incomplete' : 'Mark complete'}
                            aria-pressed={todo.completed}
                          >
                            {todo.completed ? (
                              <CheckCircle2 className="w-4 h-4 text-amber-500" />
                            ) : (
                              <Circle className="w-4 h-4 text-zinc-500 group-hover:text-amber-500" />
                            )}
                          </button>
                          <span
                            className={cn(
                              'flex-1 text-[15px] md:text-sm font-medium leading-snug transition-all min-w-0',
                              todo.completed ? 'line-through text-zinc-500' : 'text-zinc-100'
                            )}
                          >
                            {todo.text}
                          </span>
                          {todo.dueDate != null && (
                            <span className="shrink-0 flex items-center gap-1 text-xs text-zinc-500" title={formatDueDate(todo.dueDate)}>
                              <Calendar className="w-3 h-3" />
                              {formatDueDate(todo.dueDate)}
                            </span>
                          )}
                          {Icon && (
                            <div className="flex items-center gap-1 text-zinc-500 text-xs">
                              <Icon className="w-3 h-3" />
                            </div>
                          )}
                          <button
                            onClick={async () => {
                              if (!backendUrl) {
                                removeTodo(todo.id);
                                showToast('Task removed');
                                return;
                              }
                              try {
                                await backendApi.deleteTodo(todo.id);
                                removeTodo(todo.id);
                                showToast('Task removed');
                              } catch {
                                setSyncError('Failed to delete');
                              }
                            }}
                            aria-label="Delete task"
                            className="flex-shrink-0 min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 flex items-center justify-center p-2 md:p-1 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all"
                          >
                            <Trash2 className="w-4 h-4 md:w-3.5 md:h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Stats – subtle footer */}
      {todos.length > 0 && (
        <div className="mt-5 pt-4 border-t border-zinc-800/60 flex items-center justify-center gap-4 text-[11px] uppercase tracking-wider text-zinc-500">
          <span>{activeTodos} active</span>
          <span>{todos.filter((t) => t.completed).length} done</span>
          <span>{todos.length} total</span>
        </div>
      )}

      {/* Toast feedback */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="toast-enter fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-lg bg-zinc-800 border border-zinc-600 text-zinc-100 text-sm font-medium shadow-lg"
        >
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default TodoList;
