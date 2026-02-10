import { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Plus, Trash2, Circle, CheckCircle2, Briefcase, Heart, Users, Home, Dumbbell, Lightbulb, Calendar, X, ChevronDown, ChevronRight, ChevronUp, BookOpen, Send, Star, Coffee, Plane, ShoppingCart, Music, GraduationCap, Laptop, Mail, Camera, Car, UtensilsCrossed, Palette, Target, Trophy, Baby, Dog, Flower2, Gamepad2, Wallet, Building2, Leaf, Mountain, Sun, Moon, GripVertical } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { useStore, type Todo } from '../store/useStore';
import * as backendApi from '../lib/backend-api';
import type { Area } from '../lib/backend-api';
import { cn } from '../lib/utils';
import { useIsDemo } from '../contexts/DemoContext';

function formatDueDate(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: d.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined });
}

const AREA_ICON_MAP: Record<string, LucideIcon> = {
  briefcase: Briefcase,
  heart: Heart,
  users: Users,
  home: Home,
  dumbbell: Dumbbell,
  lightbulb: Lightbulb,
  star: Star,
  coffee: Coffee,
  'book-open': BookOpen,
  plane: Plane,
  'shopping-cart': ShoppingCart,
  music: Music,
  'graduation-cap': GraduationCap,
  laptop: Laptop,
  mail: Mail,
  camera: Camera,
  car: Car,
  'utensils-crossed': UtensilsCrossed,
  palette: Palette,
  target: Target,
  trophy: Trophy,
  baby: Baby,
  dog: Dog,
  flower2: Flower2,
  gamepad2: Gamepad2,
  wallet: Wallet,
  building2: Building2,
  leaf: Leaf,
  mountain: Mountain,
  sun: Sun,
  moon: Moon,
};

const AREA_ICON_OPTIONS: { id: string; label: string }[] = [
  { id: 'briefcase', label: 'Work' },
  { id: 'home', label: 'Home' },
  { id: 'lightbulb', label: 'Ideas' },
  { id: 'heart', label: 'Health' },
  { id: 'users', label: 'Friends' },
  { id: 'dumbbell', label: 'Fitness' },
  { id: 'star', label: 'Star' },
  { id: 'coffee', label: 'Coffee' },
  { id: 'book-open', label: 'Reading' },
  { id: 'plane', label: 'Travel' },
  { id: 'shopping-cart', label: 'Shopping' },
  { id: 'music', label: 'Music' },
  { id: 'graduation-cap', label: 'Learning' },
  { id: 'laptop', label: 'Tech' },
  { id: 'mail', label: 'Mail' },
  { id: 'camera', label: 'Photos' },
  { id: 'car', label: 'Car' },
  { id: 'utensils-crossed', label: 'Food' },
  { id: 'palette', label: 'Creative' },
  { id: 'target', label: 'Goals' },
  { id: 'trophy', label: 'Achievements' },
  { id: 'baby', label: 'Family' },
  { id: 'dog', label: 'Pets' },
  { id: 'flower2', label: 'Nature' },
  { id: 'gamepad2', label: 'Gaming' },
  { id: 'wallet', label: 'Finance' },
  { id: 'building2', label: 'Office' },
  { id: 'leaf', label: 'Eco' },
  { id: 'mountain', label: 'Outdoor' },
  { id: 'sun', label: 'Day' },
  { id: 'moon', label: 'Night' },
];

const FALLBACK_AREAS: Area[] = [
  { id: 'work', name: 'Work', icon: 'briefcase', isDefault: true, createdAt: 0 },
  { id: 'personal', name: 'Personal stuff', icon: 'home', isDefault: true, createdAt: 0 },
  { id: 'ideas', name: 'Ideas / thoughts', icon: 'lightbulb', isDefault: true, createdAt: 0 },
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


const TodoList = () => {
  const isDemo = useIsDemo();
  const backendUrl = isDemo ? '' : (import.meta.env.VITE_BACKEND_URL?.trim() || '');
  const [newTodo, setNewTodo] = useState('');
  const [selectedColor, setSelectedColor] = useState<'red' | 'yellow' | 'cyan'>('cyan');
  const [areas, setAreas] = useState<Area[]>([]);
  const [selectedAreaId, setSelectedAreaId] = useState<string>(FALLBACK_AREAS[0]?.id ?? '');
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [dueDate, setDueDate] = useState<number | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [filterAreaId, setFilterAreaId] = useState<string | null>(null);
  const [newAreaInputVisible, setNewAreaInputVisible] = useState(false);
  const [newAreaName, setNewAreaName] = useState('');
  const [newAreaIcon, setNewAreaIcon] = useState<string>('lightbulb');
  const newAreaInputRef = useRef<HTMLInputElement>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [addLoading, setAddLoading] = useState(false);
  const [justCompletedIds, setJustCompletedIds] = useState<Set<string>>(new Set());
  const [collapsedNoteIds, setCollapsedNoteIds] = useState<Set<string>>(new Set());
  const completedTimeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const calendarRef = useRef<HTMLDivElement>(null);
  const todoInputRef = useRef<HTMLTextAreaElement>(null);
  const [areaToDeleteId, setAreaToDeleteId] = useState<string | null>(null);
  const [deletingArea, setDeletingArea] = useState(false);
  const [noteOrderIds, setNoteOrderIds] = useState<string[]>([]);
  const [draggedNoteId, setDraggedNoteId] = useState<string | null>(null);
  const [dragOverNoteId, setDragOverNoteId] = useState<string | null>(null);
  const { todos, addTodo, updateTodo, removeTodo, removeTodosByNoteId, setTodos } = useStore();
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null);
  const [openPriorityTodoId, setOpenPriorityTodoId] = useState<string | null>(null);
  const priorityPopoverRef = useRef<HTMLDivElement>(null);
  const [openCategoryTodoId, setOpenCategoryTodoId] = useState<string | null>(null);
  const categoryPopoverRef = useRef<HTMLDivElement>(null);
  const [editingTodoId, setEditingTodoId] = useState<string | null>(null);
  const [editingTodoText, setEditingTodoText] = useState('');
  const editInputRef = useRef<HTMLTextAreaElement>(null);
  const [toast, setToast] = useState<{ message: string } | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const displayAreas = backendUrl ? areas : FALLBACK_AREAS;

  useEffect(() => {
    if (!backendUrl) {
      setAreas(FALLBACK_AREAS);
      if (!selectedAreaId || !FALLBACK_AREAS.some((a) => a.id === selectedAreaId)) {
        setSelectedAreaId(FALLBACK_AREAS[0]?.id ?? '');
      }
      return;
    }
    let cancelled = false;
    backendApi
      .fetchAreas()
      .then((list) => {
        if (!cancelled) {
          const areasToUse = list.length > 0 ? list : FALLBACK_AREAS;
          setAreas(areasToUse);
          if (areasToUse.length > 0 && (!selectedAreaId || !areasToUse.some((a) => a.id === selectedAreaId))) {
            setSelectedAreaId(areasToUse[0].id);
          }
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAreas(FALLBACK_AREAS);
          if (!selectedAreaId || !FALLBACK_AREAS.some((a) => a.id === selectedAreaId)) {
            setSelectedAreaId(FALLBACK_AREAS[0]?.id ?? '');
          }
        }
      });
    return () => {
      cancelled = true;
    };
  }, [backendUrl]);

  useEffect(() => {
    if (newAreaInputVisible) newAreaInputRef.current?.focus();
  }, [newAreaInputVisible]);

  useEffect(() => {
    if (!backendUrl) return;
    backendApi.fetchNotes().then((notes) => {
      setNoteOrderIds(notes.map((n) => n.id));
    }).catch(() => {});
  }, [backendUrl]);

  useEffect(() => {
    if (!backendUrl) return;
    const noteIdsInTodos = [...new Set(todos.map((t) => t.noteId).filter(Boolean))] as string[];
    const hasNewNote = noteIdsInTodos.some((id) => !noteOrderIds.includes(id));
    if (hasNewNote) {
      backendApi.fetchNotes().then((notes) => {
        setNoteOrderIds(notes.map((n) => n.id));
      }).catch(() => {});
    }
  }, [backendUrl, todos, noteOrderIds]);

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

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (categoryPopoverRef.current && !categoryPopoverRef.current.contains(e.target as Node)) {
        setOpenCategoryTodoId(null);
      }
    }
    if (openCategoryTodoId) document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [openCategoryTodoId]);

  useEffect(() => {
    if (editingTodoId) {
      editInputRef.current?.focus();
      editInputRef.current?.select();
    }
  }, [editingTodoId]);

  // Auto-grow edit textarea up to 3 lines
  useEffect(() => {
    const el = editInputRef.current;
    if (!el || editingTodoId === null) return;
    el.style.height = 'auto';
    const maxHeight = 3 * 1.5 * 16; // ~3 lines (1.5rem line-height)
    el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`;
  }, [editingTodoText, editingTodoId]);

  const handleSaveEdit = async (todo: Todo) => {
    const trimmed = editingTodoText.trim();
    if (trimmed === '' || trimmed === todo.text) {
      setEditingTodoId(null);
      setEditingTodoText('');
      return;
    }
    if (!backendUrl) {
      updateTodo({ ...todo, text: trimmed });
      setEditingTodoId(null);
      setEditingTodoText('');
      showToast('Task updated');
      return;
    }
    try {
      const updated = await backendApi.updateTodo(todo.id, { text: trimmed });
      updateTodo(updated);
      setEditingTodoId(null);
      setEditingTodoText('');
      showToast('Task updated');
    } catch {
      setSyncError('Failed to update task');
    }
  };

  const handleAreaChange = async (todo: Todo, areaId: string) => {
    if (todo.areaId === areaId || (todo.category === areaId && !todo.areaId)) {
      setOpenCategoryTodoId(null);
      return;
    }
    if (!backendUrl) {
      const area = displayAreas.find((a) => a.id === areaId);
      updateTodo({ ...todo, category: area?.name ?? areaId, areaId: areaId || null });
      setOpenCategoryTodoId(null);
      showToast('Area updated');
      return;
    }
    try {
      const updated = await backendApi.updateTodo(todo.id, { areaId });
      updateTodo(updated);
      setOpenCategoryTodoId(null);
      showToast('Area updated');
    } catch {
      setSyncError('Failed to update area');
    }
  };

  const MAX_AREAS = 6;
  const canAddArea = displayAreas.length < MAX_AREAS;

  const handleConfirmDeleteArea = async () => {
    if (!areaToDeleteId || !backendUrl) {
      setAreaToDeleteId(null);
      return;
    }
    setDeletingArea(true);
    setSyncError(null);
    try {
      await backendApi.deleteArea(areaToDeleteId);
      const list = await backendApi.fetchAreas();
      setAreas(list);
      const updatedTodos = await backendApi.fetchTodos();
      setTodos(updatedTodos);
      if (filterAreaId === areaToDeleteId) setFilterAreaId(null);
      if (selectedAreaId === areaToDeleteId && list.length > 0) setSelectedAreaId(list[0].id);
      setAreaToDeleteId(null);
      showToast('Area deleted');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete area';
      setSyncError(message);
      setAreaToDeleteId(null);
      // Refetch areas and todos so the list matches the server
      backendApi.fetchAreas().then(setAreas).catch(() => {});
      backendApi.fetchTodos().then(setTodos).catch(() => {});
    } finally {
      setDeletingArea(false);
    }
  };

  const handleCreateArea = async () => {
    const name = newAreaName.trim();
    if (!name || !backendUrl) return;
    if (!canAddArea) {
      setSyncError(`Maximum ${MAX_AREAS} areas allowed`);
      return;
    }
    try {
      const area = await backendApi.createArea({ name, icon: newAreaIcon });
      setAreas((prev) => [...prev, area]);
      setSelectedAreaId(area.id);
      setNewAreaName('');
      setNewAreaIcon('lightbulb');
      setNewAreaInputVisible(false);
      // Refetch todos so the list stays in sync with the server (tasks in new areas show without refresh)
      const updatedTodos = await backendApi.fetchTodos();
      setTodos(updatedTodos);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create area';
      setSyncError(msg);
    }
  };

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
        const now = Date.now();
        const area = displayAreas.find((a) => a.id === selectedAreaId);
        const localTodo = {
          id: crypto.randomUUID(),
          text: newTodo.trim(),
          completed: false,
          color: selectedColor,
          category: area?.name ?? selectedAreaId,
          areaId: selectedAreaId || null,
          areaName: area?.name ?? null,
          areaIcon: area?.icon ?? null,
          dueDate: dueDate ?? null,
          createdAt: now,
          updatedAt: now,
        };
        addTodo(localTodo);
      } else {
        const todo = await backendApi.createTodo({
          text: newTodo.trim(),
          color: selectedColor,
          areaId: selectedAreaId || null,
          dueDate,
          noteId: selectedNoteId ?? null,
        });
        addTodo(todo);
        // Refetch todos so the list shows with correct areaId/areaName (avoids needing refresh)
        const updatedTodos = await backendApi.fetchTodos();
        setTodos(updatedTodos);
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
    filterAreaId === FILTER_DONE_ID
      ? todos.filter((t) => t.completed)
      : filterAreaId
        ? todos.filter((t) => !t.completed && (t.areaId === filterAreaId || t.category === filterAreaId))
        : todos.filter((t) => !t.completed);

  const sortedTodos =
    filterAreaId === FILTER_DONE_ID
      ? [...filteredTodos].sort((a, b) => b.createdAt - a.createdAt)
      : [...filteredTodos].sort((a, b) => {
          const aJustCompleted = justCompletedIds.has(a.id);
          const bJustCompleted = justCompletedIds.has(b.id);
          const aDone = a.completed && !aJustCompleted;
          const bDone = b.completed && !bJustCompleted;
          if (aDone !== bDone) return aDone ? 1 : -1;
          return b.createdAt - a.createdAt;
        });

  const groupsByNote = useMemo(() => {
    const map = new Map<string, { title: string; todos: typeof sortedTodos }>();
    for (const todo of sortedTodos) {
      const key = todo.noteId ?? '_no_note';
      const title = todo.noteId ? (todo.noteTitle || 'Note') : 'Other tasks';
      if (!map.has(key)) map.set(key, { title, todos: [] });
      map.get(key)!.todos.push(todo);
    }
    for (const group of map.values()) {
      group.todos.sort((a, b) => {
        // Keep the synthetic "original note" holder as the first item in the group
        const aIsOriginal = Boolean(a.noteContent);
        const bIsOriginal = Boolean(b.noteContent);
        if (aIsOriginal && !bIsOriginal) return -1;
        if (!aIsOriginal && bIsOriginal) return 1;

        // 1) Inside each note group, sort by due date when present (earlier first)
        const aHasDate = typeof a.dueDate === 'number' && Number.isFinite(a.dueDate);
        const bHasDate = typeof b.dueDate === 'number' && Number.isFinite(b.dueDate);
        if (aHasDate && bHasDate && a.dueDate !== b.dueDate) {
          return (a.dueDate as number) - (b.dueDate as number);
        }
        if (aHasDate !== bHasDate) {
          // Tasks with a date come before those without a date
          return aHasDate ? -1 : 1;
        }

        // 2) Then by priority color (red > yellow > cyan)
        const pa = COLOR_PRIORITY_ORDER[a.color];
        const pb = COLOR_PRIORITY_ORDER[b.color];
        if (pa !== pb) return pa - pb;

        // 3) Finally, newest created first as a stable fallback
        return b.createdAt - a.createdAt;
      });
    }
    const entries = Array.from(map.entries());
    entries.sort(([a], [b]) => {
      if (a === '_no_note') return 1;
      if (b === '_no_note') return -1;
      const i = noteOrderIds.indexOf(a);
      const j = noteOrderIds.indexOf(b);
      if (i === -1 && j === -1) return 0;
      if (i === -1) return 1;
      if (j === -1) return -1;
      return i - j;
    });
    return entries;
  }, [sortedTodos, noteOrderIds]);

  const handleNoteDragStart = (e: React.DragEvent, noteId: string) => {
    e.dataTransfer.setData('text/plain', noteId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedNoteId(noteId);
  };

  const handleNoteDragEnd = () => {
    setDraggedNoteId(null);
    setDragOverNoteId(null);
  };

  const handleNoteDragOver = (e: React.DragEvent, noteId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (noteId !== '_no_note' && noteId !== draggedNoteId) setDragOverNoteId(noteId);
  };

  const handleNoteDragLeave = () => {
    setDragOverNoteId(null);
  };

  const handleNoteDrop = async (e: React.DragEvent, targetNoteId: string) => {
    e.preventDefault();
    setDragOverNoteId(null);
    const draggedId = e.dataTransfer.getData('text/plain');
    if (!draggedId || draggedId === targetNoteId || targetNoteId === '_no_note') {
      setDraggedNoteId(null);
      return;
    }
    const next = noteOrderIds.filter((id) => id !== draggedId);
    const targetIdx = next.indexOf(targetNoteId);
    if (targetIdx === -1) {
      setDraggedNoteId(null);
      return;
    }
    next.splice(targetIdx, 0, draggedId);
    setNoteOrderIds(next);
    setDraggedNoteId(null);
    setSyncError(null);
    try {
      await backendApi.reorderNotes(next);
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : 'Failed to reorder');
      setNoteOrderIds(noteOrderIds);
    }
  };

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
      setNoteOrderIds((prev) => prev.filter((id) => id !== noteId));
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
    filterAreaId === FILTER_DONE_ID
      ? 'Completed'
      : filterAreaId
        ? displayAreas.find((a) => a.id === filterAreaId)?.name ?? 'Tasks'
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
                  'flex items-center justify-center h-12 min-h-[3rem] w-full px-2 rounded-md border transition-colors duration-200',
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
              <span className="section-label mb-0" id="add-task-area-label">Area</span>
              <select
                value={selectedAreaId}
                onChange={(e) => setSelectedAreaId(e.target.value)}
                aria-labelledby="add-task-area-label"
                className="w-full h-12 min-h-[3rem] px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-md text-zinc-200 text-base transition-colors duration-200 hover:border-zinc-600"
              >
                {displayAreas.map((area) => (
                  <option key={area.id} value={area.id}>{area.name}</option>
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
                  className="w-full h-12 min-h-[3rem] px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-md text-zinc-200 text-base transition-colors duration-200 hover:border-zinc-600"
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
              className="shrink-0 h-12 min-h-[3rem] px-3 py-2 bg-amber-500 text-zinc-950 rounded-md hover:bg-amber-600 active:scale-[0.98] transition-all duration-200 font-medium flex items-center justify-center gap-1.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
              {addLoading ? 'Adding…' : 'Add'}
            </button>
          </div>
        </div>
      </form>

      {/* Separator between add-todo form and filter areas */}
      <div className="my-3 border-t border-slate-700/60" aria-hidden />

      {/* Filter pills – wrap so all categories are visible */}
      <div
        className="flex flex-wrap gap-2 mb-4 min-w-0 max-w-full"
        role="group"
        aria-label="Filter tasks by category"
      >
        <button
          onClick={() => setFilterAreaId(null)}
          aria-pressed={filterAreaId === null}
          aria-label="Show all active tasks"
          className={cn(
            'min-h-[44px] px-3.5 py-2 rounded-full text-[11px] font-semibold uppercase tracking-wider transition-colors duration-200',
            filterAreaId === null
              ? 'bg-zinc-600 text-zinc-100'
              : 'bg-zinc-800/80 text-zinc-500 hover:bg-zinc-700 hover:text-zinc-300'
          )}
        >
          All
        </button>
        {displayAreas.map((area) => {
          const Icon = AREA_ICON_MAP[area.icon] ?? Lightbulb;
          const count = todos.filter((t) => !t.completed && (t.areaId === area.id || t.category === area.id || t.areaName === area.name)).length;
          const canDelete = backendUrl && !(area.isDefault ?? true);
          return (
            <div key={area.id} className="relative inline-flex">
              <button
                onClick={() => setFilterAreaId(area.id)}
                aria-pressed={filterAreaId === area.id}
                aria-label={`Filter by ${area.name}${count > 0 ? `, ${count} active` : ''}`}
                className={cn(
                  'min-h-[44px] pl-3.5 pr-8 py-2 rounded-full text-[11px] font-semibold uppercase tracking-wider transition-colors duration-200 flex items-center gap-1.5',
                  filterAreaId === area.id
                    ? 'bg-zinc-600 text-zinc-100'
                    : 'bg-zinc-800/80 text-zinc-500 hover:bg-zinc-700 hover:text-zinc-300'
                )}
              >
                <Icon className="w-3 h-3" aria-hidden />
                {area.name}
                {count > 0 && <span className="ml-0.5 opacity-80">{count}</span>}
              </button>
              {canDelete && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setAreaToDeleteId(area.id);
                  }}
                  aria-label={`Delete area ${area.name}`}
                  className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 rounded-full text-zinc-400 hover:text-zinc-100 hover:bg-zinc-600 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        })}
        {backendUrl && (
          <>
            {newAreaInputVisible ? (
              <>
                <div className="flex items-center gap-1.5 shrink-0 min-h-[44px]">
                  <input
                    ref={newAreaInputRef}
                    type="text"
                    value={newAreaName}
                    onChange={(e) => setNewAreaName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleCreateArea();
                      }
                      if (e.key === 'Escape') {
                        setNewAreaInputVisible(false);
                        setNewAreaName('');
                        setNewAreaIcon('lightbulb');
                      }
                    }}
                    placeholder="New area name…"
                    className="min-h-[36px] px-3 py-1.5 rounded-full text-[11px] font-medium bg-zinc-800 border border-zinc-600 text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 w-40 shrink-0"
                    aria-label="New area name"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setNewAreaInputVisible(false);
                      setNewAreaName('');
                      setNewAreaIcon('lightbulb');
                    }}
                    aria-label="Cancel new area"
                    className="p-2 rounded-full text-zinc-500 hover:text-zinc-300 shrink-0"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="w-full basis-full shrink-0 h-0" aria-hidden />
                <div className="flex flex-col gap-2 w-full basis-full min-w-0">
                  <div className="flex flex-wrap gap-1" role="group" aria-label="Choose icon for new area">
                    {AREA_ICON_OPTIONS.map((opt) => {
                      const IconComponent = AREA_ICON_MAP[opt.id] ?? Lightbulb;
                      const selected = newAreaIcon === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setNewAreaIcon(opt.id)}
                          aria-label={opt.label}
                          title={opt.label}
                          className={cn(
                            'p-2 rounded-lg transition-colors',
                            selected
                              ? 'bg-amber-500/30 text-amber-400 ring-1 ring-amber-500/50'
                              : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700'
                          )}
                        >
                          <IconComponent className="w-4 h-4" />
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCreateArea}
                      disabled={!newAreaName.trim()}
                      className="min-h-[44px] px-3 py-2 rounded-lg text-[11px] font-semibold bg-amber-500 text-zinc-950 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Create area
                    </button>
                  </div>
                </div>
              </>
            ) : canAddArea ? (
              <button
                type="button"
                onClick={() => {
                  setNewAreaIcon('lightbulb');
                  setNewAreaInputVisible(true);
                }}
                aria-label="Create new area"
                className="min-h-[44px] px-3.5 py-2 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-zinc-800/80 text-zinc-500 hover:bg-zinc-700 hover:text-zinc-300 transition-colors duration-200 flex items-center gap-1.5"
              >
                <Plus className="w-3 h-3" aria-hidden />
                new area
              </button>
            ) : null}
          </>
        )}
        <button
          onClick={() => setFilterAreaId(FILTER_DONE_ID)}
          aria-pressed={filterAreaId === FILTER_DONE_ID}
          aria-label="Show completed tasks"
          className={cn(
            'min-h-[44px] px-3.5 py-2 rounded-full text-[11px] font-semibold uppercase tracking-wider transition-colors duration-200 flex items-center gap-1.5',
            filterAreaId === FILTER_DONE_ID
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
            className="min-h-[44px] px-3.5 py-2 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-zinc-800/80 text-zinc-500 hover:bg-zinc-700 hover:text-zinc-300 transition-colors duration-200 flex items-center gap-1.5"
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
            {filterAreaId === FILTER_DONE_ID ? (
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
            const canDrag = backendUrl && noteKey !== '_no_note';
            const isDragging = draggedNoteId === noteKey;
            const isDragOver = dragOverNoteId === noteKey;
            return (
              <div
                key={noteKey}
                className={cn(
                  'rounded-xl border border-zinc-700/50 bg-zinc-800/40 overflow-visible transition-colors',
                  isDragging && 'opacity-60',
                  isDragOver && 'ring-2 ring-amber-500/60 ring-inset'
                )}
                onDragOver={canDrag ? (e) => handleNoteDragOver(e, noteKey) : undefined}
                onDragLeave={canDrag ? handleNoteDragLeave : undefined}
                onDrop={canDrag ? (e) => handleNoteDrop(e, noteKey) : undefined}
                onDragEnd={canDrag ? handleNoteDragEnd : undefined}
              >
                <div className="flex items-center min-w-0">
                  {canDrag && (
                    <span
                      draggable
                      onDragStart={(e) => handleNoteDragStart(e, noteKey)}
                      className="shrink-0 pl-2 pr-1 py-2 cursor-grab active:cursor-grabbing text-zinc-500 hover:text-zinc-300 touch-none"
                      aria-label="Drag to reorder note"
                      title="Drag to reorder"
                    >
                      <GripVertical className="w-4 h-4" />
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => toggleNoteGroup(noteKey)}
                    className={cn(
                      'flex-1 min-w-0 flex items-center gap-2.5 py-2.5 pr-3.5 text-left text-zinc-300 rounded-t-xl',
                      canDrag ? 'pl-2' : 'pl-3.5'
                    )}
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
                    {noteKey !== '_no_note' && groupTodos[0]?.noteContent && (
                      <div
                        className="rounded-lg border border-zinc-600/60 bg-zinc-800/60 px-3 py-2.5 text-sm text-zinc-300"
                        role="article"
                        aria-label="Original note"
                      >
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                          Original note
                        </p>
                        <p className="whitespace-pre-wrap break-words leading-relaxed">
                          {groupTodos[0].noteContent}
                        </p>
                      </div>
                    )}
                    {groupTodos.map((todo) => {
                      const area = displayAreas.find((a) => a.id === todo.areaId || a.id === todo.category || a.name === todo.areaName);
                      const iconName = area?.icon ?? todo.areaIcon ?? 'lightbulb';
                      const Icon = AREA_ICON_MAP[iconName] ?? Lightbulb;
                      const areaLabel = todo.areaName ?? todo.category ?? area?.name ?? 'Area';
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
                                className="absolute left-0 top-full mt-1 z-50 flex gap-1.5 p-2 rounded-lg bg-zinc-800 border border-zinc-600 shadow-xl"
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
                          {editingTodoId === todo.id ? (
                            <div className="flex-1 flex items-end gap-2 min-w-0">
                              <textarea
                                ref={editInputRef}
                                value={editingTodoText}
                                onChange={(e) => setEditingTodoText(e.target.value)}
                                onBlur={() => handleSaveEdit(todo)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSaveEdit(todo);
                                  }
                                  if (e.key === 'Escape') {
                                    setEditingTodoId(null);
                                    setEditingTodoText('');
                                  }
                                }}
                                rows={1}
                                className="edit-task-input flex-1 min-w-0 min-h-[2.25rem] max-h-[4.5rem] resize-none overflow-y-auto px-2 py-1.5 text-[15px] md:text-sm font-medium leading-snug bg-zinc-800 border border-zinc-600 rounded-md text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50"
                                aria-label="Edit task"
                              />
                              <button
                                type="button"
                                onClick={() => handleSaveEdit(todo)}
                                aria-label="Update task"
                                title="Update"
                                className="shrink-0 flex items-center justify-center w-9 h-9 min-h-9 min-w-9 rounded-md bg-zinc-700 text-zinc-400 hover:bg-zinc-600 hover:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 focus:ring-offset-zinc-800 transition-colors"
                              >
                                <Send className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingTodoId(todo.id);
                                setEditingTodoText(todo.text);
                              }}
                              className={cn(
                                'flex-1 text-left text-[15px] md:text-sm font-medium leading-snug transition-all min-w-0 py-1 -my-1 rounded hover:bg-zinc-700/40',
                                todo.completed ? 'line-through text-zinc-500' : 'text-zinc-100'
                              )}
                            >
                              {todo.text}
                            </button>
                          )}
                          {todo.dueDate != null && (
                            <span className="shrink-0 flex items-center gap-1 text-xs text-zinc-500" title={formatDueDate(todo.dueDate)}>
                              <Calendar className="w-3 h-3" />
                              {formatDueDate(todo.dueDate)}
                            </span>
                          )}
                          <div className="relative shrink-0" ref={openCategoryTodoId === todo.id ? categoryPopoverRef : undefined}>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenCategoryTodoId((prev) => (prev === todo.id ? null : todo.id));
                              }}
                              aria-label="Change area"
                              title={areaLabel}
                              className="flex items-center justify-center p-2 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700/50 transition-colors"
                            >
                              {Icon ? <Icon className="w-4 h-4" /> : null}
                            </button>
                            {openCategoryTodoId === todo.id && (
                              <div
                                className="absolute right-0 top-full mt-1 z-30 flex gap-1 p-2 rounded-lg bg-zinc-800 border border-zinc-600 shadow-xl"
                                role="listbox"
                                aria-label="Area"
                              >
                                {displayAreas.map((areaItem) => {
                                  const CatIcon = AREA_ICON_MAP[areaItem.icon] ?? Lightbulb;
                                  const isSelected = todo.areaId === areaItem.id || (todo.category === areaItem.id && !todo.areaId) || todo.areaName === areaItem.name;
                                  return (
                                    <button
                                      key={areaItem.id}
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleAreaChange(todo, areaItem.id);
                                      }}
                                      aria-label={areaItem.name}
                                      title={areaItem.name}
                                      className={cn(
                                        'p-2 rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700 transition-colors',
                                        isSelected && 'text-amber-500 bg-zinc-700/50'
                                      )}
                                    >
                                      <CatIcon className="w-4 h-4" />
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
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

      {/* Confirm delete area modal */}
      {areaToDeleteId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 safe-area-padding"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-area-title"
        >
          <div className="bg-zinc-800 border border-zinc-600 rounded-xl shadow-xl max-w-sm w-full p-5 max-h-[85vh] overflow-y-auto">
            <h2 id="delete-area-title" className="text-sm font-semibold text-zinc-100 mb-3">
              Delete area
            </h2>
            <p className="text-sm text-zinc-300 mb-4">
              Los todos existentes de esta area no se eliminaran, se pondran por defecto a &quot;personal stuff&quot;, estas de acuerdo?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setAreaToDeleteId(null)}
                disabled={deletingArea}
                className="min-h-[44px] px-4 py-2 rounded-lg text-sm font-medium text-zinc-300 hover:text-zinc-100 bg-zinc-700 hover:bg-zinc-600 transition-colors disabled:opacity-50"
              >
                No
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteArea}
                disabled={deletingArea}
                className="min-h-[44px] px-4 py-2 rounded-lg text-sm font-medium text-zinc-950 bg-amber-500 hover:bg-amber-400 transition-colors disabled:opacity-50"
              >
                {deletingArea ? '…' : 'Sí'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast feedback – portaled so it centers in the viewport */}
      {toast &&
        createPortal(
          <div
            role="status"
            aria-live="polite"
            className="fixed inset-x-0 bottom-0 flex justify-center items-end z-[100] pointer-events-none px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
          >
            <span className="toast-enter inline-block px-4 py-2.5 rounded-lg bg-zinc-800 border border-zinc-600 text-zinc-100 text-sm font-medium shadow-lg text-center">
              {toast.message}
            </span>
          </div>,
          document.body
        )}
    </div>
  );
};

export default TodoList;
