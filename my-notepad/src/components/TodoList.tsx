import { useState, useRef, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Plus, Trash2, Circle, CheckCircle2, Briefcase, Heart, Users, Home, Dumbbell, Lightbulb, Calendar, X } from 'lucide-react';
import { useStore } from '../store/useStore';
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

const TodoList = () => {
  const [newTodo, setNewTodo] = useState('');
  const [selectedColor, setSelectedColor] = useState<'red' | 'yellow' | 'cyan'>('cyan');
  const [selectedCategory, setSelectedCategory] = useState('work');
  const [dueDate, setDueDate] = useState<number | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const { todos, addTodo, toggleTodo, deleteTodo } = useStore();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (calendarRef.current && !calendarRef.current.contains(e.target as Node)) {
        setCalendarOpen(false);
      }
    }
    if (calendarOpen) document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [calendarOpen]);

  const handleDateChange = (date: Date | null) => {
    setDueDate(date ? date.getTime() : null);
    if (date) setCalendarOpen(false);
  };

  const handleClearDate = () => {
    setDueDate(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTodo.trim()) {
      addTodo(newTodo, selectedColor, selectedCategory, dueDate);
      setNewTodo('');
      setSelectedColor('cyan');
      setDueDate(null);
    }
  };

  const filteredTodos = filterCategory 
    ? todos.filter(todo => todo.category === filterCategory)
    : todos;

  const sortedTodos = [...filteredTodos].sort((a, b) => b.createdAt - a.createdAt);

  const colorConfig = {
    red: 'bg-red-500',
    yellow: 'bg-yellow-500',
    cyan: 'bg-cyan-500',
  };

  const activeTodos = todos.filter(t => !t.completed).length;

  return (
    <div>
      {/* Add Todo Form - Single Line: calendar → input → category → priority → Add */}
      <form
        onSubmit={handleSubmit}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && newTodo.trim()) {
            e.preventDefault();
            handleSubmit(e);
          }
        }}
        className="mb-4"
      >
        <div className="flex flex-wrap gap-2 items-center min-w-0">
          {/* Calendar (optional, first) */}
          <div className="relative shrink-0" ref={calendarRef}>
            <button
              type="button"
              onClick={() => setCalendarOpen((o) => !o)}
              aria-label={dueDate ? `Due: ${formatDueDate(dueDate)}. Click to change` : 'Add due date (optional)'}
              title={dueDate ? formatDueDate(dueDate) : 'Pick a date (optional)'}
              className={cn(
                'flex items-center gap-1.5 h-9 px-2.5 rounded-md border transition-colors',
                dueDate
                  ? 'border-blue-500/50 bg-blue-500/10 text-blue-400'
                  : 'border-slate-700 bg-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-600'
              )}
            >
              <Calendar className="w-4 h-4" />
              {dueDate && <span className="text-xs font-medium max-w-[4rem] truncate">{formatDueDate(dueDate)}</span>}
            </button>
            {calendarOpen && (
              <div className="absolute left-0 top-full mt-1 z-20 flex flex-col gap-2">
                <div className="datepicker-dark bg-slate-800 border border-slate-700 rounded-lg shadow-xl p-2">
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
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-md bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200 text-xs"
                >
                  <X className="w-3 h-3" />
                  Clear date
                </button>
              </div>
            )}
          </div>
          {/* Text input */}
          <input
            type="text"
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            placeholder="What needs to be done?"
            className="flex-1 min-w-0 px-3 py-2 bg-slate-950 border border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-100 placeholder:text-slate-600 text-sm"
          />
          {/* Category (second) */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            aria-label="Category"
            className="shrink-0 px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.label}</option>
            ))}
          </select>
          {/* Priority: rectangle with divided color buttons (last) */}
          <div className="shrink-0 flex items-stretch border border-slate-700 rounded-md overflow-hidden bg-slate-800">
            {COLORS.map((color, i) => (
              <button
                key={color.id}
                type="button"
                onClick={() => setSelectedColor(color.id)}
                aria-label={color.label}
                title={color.label}
                className={cn(
                  'flex-1 min-w-[2rem] h-9 transition-all',
                  color.color,
                  color.hover,
                  selectedColor === color.id && 'ring-2 ring-inset ring-white/50',
                  i > 0 && 'border-l border-slate-600'
                )}
              />
            ))}
          </div>
          {/* Add button */}
          <button
            type="submit"
            aria-label="Add task"
            className="shrink-0 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium flex items-center gap-1.5 text-sm"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </div>
      </form>

      {/* Category Filter */}
      <div className="flex gap-2 mb-4 flex-wrap" role="group" aria-label="Filter tasks by category">
        <button
          onClick={() => setFilterCategory(null)}
          aria-pressed={filterCategory === null}
          aria-label="Show all tasks"
          className={cn(
            'px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
            filterCategory === null
              ? 'bg-blue-600 text-white'
              : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
          )}
        >
          All
        </button>
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const count = todos.filter(t => t.category === cat.id && !t.completed).length;
          return (
            <button
              key={cat.id}
              onClick={() => setFilterCategory(cat.id)}
              aria-pressed={filterCategory === cat.id}
              aria-label={`Filter by ${cat.label}${count > 0 ? `, ${count} active` : ''}`}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5',
                filterCategory === cat.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              )}
            >
              <Icon className="w-3 h-3" />
              {cat.label}
              {count > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-slate-950/50 rounded text-[10px]">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Todos List - Compact */}
      <div className="space-y-1.5">
        {sortedTodos.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle2 className="w-10 h-10 mx-auto text-slate-700 mb-2" />
            <p className="text-slate-400 text-sm">No todos yet</p>
            <p className="text-slate-500 text-xs mt-1">Add your first task above</p>
          </div>
        ) : (
          sortedTodos.map((todo) => {
            const category = CATEGORIES.find(c => c.id === todo.category);
            const Icon = category?.icon;
            
            return (
              <div
                key={todo.id}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 bg-slate-800/40 border border-slate-700/50 rounded-md transition-all hover:bg-slate-800/60 group',
                  todo.completed && 'opacity-50'
                )}
              >
                {/* Color Indicator */}
                <div className={cn('w-1 h-6 rounded-full flex-shrink-0', colorConfig[todo.color])} />
                
                {/* Checkbox */}
                <button
                  onClick={() => toggleTodo(todo.id)}
                  className="flex-shrink-0"
                  aria-label={todo.completed ? 'Mark incomplete' : 'Mark complete'}
                  aria-pressed={todo.completed}
                >
                  {todo.completed ? (
                    <CheckCircle2 className="w-4 h-4 text-blue-500" />
                  ) : (
                    <Circle className="w-4 h-4 text-slate-500 group-hover:text-blue-500" />
                  )}
                </button>

                {/* Text */}
                <span
                  className={cn(
                    'flex-1 text-sm transition-all',
                    todo.completed
                      ? 'line-through text-slate-500'
                      : 'text-slate-200'
                  )}
                >
                  {todo.text}
                </span>

                {/* Due date (optional) */}
                {todo.dueDate != null && (
                  <span className="shrink-0 flex items-center gap-1 text-xs text-slate-500" title={formatDueDate(todo.dueDate)}>
                    <Calendar className="w-3 h-3" />
                    {formatDueDate(todo.dueDate)}
                  </span>
                )}

                {/* Category Icon */}
                {Icon && (
                  <div className="flex items-center gap-1 text-slate-500 text-xs">
                    <Icon className="w-3 h-3" />
                  </div>
                )}

                {/* Delete Button */}
                <button
                  onClick={() => deleteTodo(todo.id)}
                  aria-label="Delete task"
                  className="flex-shrink-0 p-1 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Stats - Compact */}
      {todos.length > 0 && (
        <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>{activeTodos} active</span>
          <span>{todos.filter((t) => t.completed).length} completed</span>
          <span>{todos.length} total</span>
        </div>
      )}
    </div>
  );
};

export default TodoList;
