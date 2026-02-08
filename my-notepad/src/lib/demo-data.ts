import type { Todo } from '../store/useStore';

const DEMO_NOTE_1_ID = 'demo-note-1';
const DEMO_NOTE_1_TITLE = 'Project Alpha – Ideas and next steps';
const DEMO_NOTE_1_CONTENT = `This note captures the main ideas and action items for Project Alpha.

Context: We want to launch a small productivity tool in Q1. The team has discussed features and we need to prioritise.

Key decisions:
- Focus on mobile-first (iOS and Android) with a simple web version.
- Use a single shared backend; no offline-first for v1.
- Beta by end of February.

Open questions:
- Pricing model: freemium vs one-time purchase?
- Do we need dark mode in the first release?

Next steps:
- Create Figma mockups for the main flows.
- Set up the repo and CI.
- Draft the privacy policy and terms.
- Schedule weekly sync with design.`;

const DEMO_NOTE_2_ID = 'demo-note-2';
const DEMO_NOTE_2_TITLE = 'Personal goals and habits 2026';
const DEMO_NOTE_2_CONTENT = `Personal goals and habits I want to keep track of this year.

Health:
- Run or walk at least 3 times per week.
- Cut down sugar; no soft drinks on weekdays.
- Sleep before 23:00 on work nights.

Learning:
- Finish the React + TypeScript course.
- Read one non-fiction book per month.
- Practice piano 20 minutes daily.

Work:
- Ship the side project by March.
- Improve delegation; say no to scope creep.
- One 1:1 per week with each team member.

Reminders:
- Renew passport in June.
- Book dentist and annual check-up.
- Review subscriptions and cancel unused ones.`;

const now = Date.now();
const ts = (offset: number) => now - offset;

let demoIdCounter = 0;
function makeTodo(overrides: Partial<Todo> & { text: string }): Todo {
  demoIdCounter += 1;
  const id = `demo-todo-${demoIdCounter}`;
  return {
    completed: false,
    color: 'cyan',
    category: 'Personal stuff',
    areaId: null,
    areaName: 'Personal stuff',
    areaIcon: 'home',
    dueDate: null,
    noteId: null,
    noteTitle: null,
    noteContent: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
    id,
  };
}

export function getDemoTodos(): Todo[] {
  demoIdCounter = 0;
  return [
    makeTodo({
      text: 'Create Figma mockups for main flows',
      color: 'red',
      noteId: DEMO_NOTE_1_ID,
      noteTitle: DEMO_NOTE_1_TITLE,
      noteContent: DEMO_NOTE_1_CONTENT,
      createdAt: ts(80000),
      updatedAt: ts(80000),
    }),
    makeTodo({
      text: 'Set up repo and CI',
      color: 'yellow',
      noteId: DEMO_NOTE_1_ID,
      noteTitle: DEMO_NOTE_1_TITLE,
      createdAt: ts(70000),
      updatedAt: ts(70000),
    }),
    makeTodo({
      text: 'Draft privacy policy and terms',
      color: 'cyan',
      noteId: DEMO_NOTE_1_ID,
      noteTitle: DEMO_NOTE_1_TITLE,
      createdAt: ts(60000),
      updatedAt: ts(60000),
    }),
    makeTodo({
      text: 'Schedule weekly sync with design',
      color: 'cyan',
      noteId: DEMO_NOTE_1_ID,
      noteTitle: DEMO_NOTE_1_TITLE,
      createdAt: ts(50000),
      updatedAt: ts(50000),
    }),
    makeTodo({
      text: 'Run or walk 3x per week',
      color: 'red',
      noteId: DEMO_NOTE_2_ID,
      noteTitle: DEMO_NOTE_2_TITLE,
      noteContent: DEMO_NOTE_2_CONTENT,
      createdAt: ts(90000),
      updatedAt: ts(90000),
    }),
    makeTodo({
      text: 'Finish React + TypeScript course',
      color: 'yellow',
      noteId: DEMO_NOTE_2_ID,
      noteTitle: DEMO_NOTE_2_TITLE,
      createdAt: ts(85000),
      updatedAt: ts(85000),
    }),
    makeTodo({
      text: 'Read one non-fiction book per month',
      color: 'cyan',
      noteId: DEMO_NOTE_2_ID,
      noteTitle: DEMO_NOTE_2_TITLE,
      createdAt: ts(75000),
      updatedAt: ts(75000),
    }),
    makeTodo({
      text: 'Renew passport in June',
      color: 'yellow',
      noteId: DEMO_NOTE_2_ID,
      noteTitle: DEMO_NOTE_2_TITLE,
      createdAt: ts(65000),
      updatedAt: ts(65000),
    }),
    makeTodo({
      text: 'Buy groceries',
      color: 'cyan',
      createdAt: ts(40000),
      updatedAt: ts(40000),
    }),
    makeTodo({
      text: 'Call mum',
      color: 'cyan',
      createdAt: ts(30000),
      updatedAt: ts(30000),
    }),
    makeTodo({
      text: 'Review monthly budget',
      color: 'yellow',
      completed: true,
      createdAt: ts(20000),
      updatedAt: ts(10000),
    }),
  ];
}

export function getDemoWhiteboard(): string {
  return `Welcome to the demo.\n\nThis is the Notes area. You can type here and later use "Process with AI" to turn a note into tasks (when the backend is configured).\n\nIn this demo, the Tasks tab shows example todos and two big notes (Project Alpha and Personal goals 2026). All data is stored only in the browser; nothing is sent to a server. Refresh the page to reset to this state.`;
}
