# 📝 Noted — TODO & Notes App

A beautiful, simple, and powerful note-taking and TODO management app designed to keep your mind clean and organized.

**Routes:** `/` — minimal landing (SEO, what we are); `/app` — the app (notes + tasks). On native (iOS/Android), the app opens directly at `/app`.

## ✨ Features

- **📋 TODO List**
  - Create tasks with priority levels (Low, Medium, High)
  - Mark tasks as complete
  - Automatic priority sorting
  - Task statistics

- **📔 Notes**
  - Create and edit rich notes
  - Title and content formatting
  - Timestamp tracking
  - Quick search and organization

- **💾 Auto-Save**
  - All data saved locally in your browser
  - No backend required
  - Data persists across sessions

- **🎨 Beautiful UI**
  - Modern, clean design
  - Responsive layout
  - Intuitive user experience

## 🛠️ Tech Stack

### Core Technologies
- **Vite** - Next-generation frontend tooling for blazing fast development
- **React 19** - Latest React with modern hooks and features
- **TypeScript** - Type safety and better developer experience
- **Tailwind CSS 4** - Utility-first CSS framework for rapid UI development
- **Capacitor** - Hybrid native runtime: same codebase runs in **browser**, **Android**, and **iOS**

### State Management & Storage
- **Zustand** - Lightweight state management (simpler than Redux!)
- **LocalStorage** - Browser-based persistence

### Why These Technologies?

1. **Vite** 
   - ⚡ Lightning-fast hot module replacement (HMR)
   - 🚀 Instant server start
   - 📦 Optimized production builds
   - Better than Create React App in every way

2. **React + TypeScript**
   - Most popular framework with huge ecosystem
   - TypeScript catches bugs before runtime
   - Easy to find help and documentation

3. **Tailwind CSS**
   - Build beautiful UIs without writing custom CSS
   - Highly customizable
   - Great developer experience
   - No CSS file management needed

4. **Zustand**
   - Super simple API (no boilerplate like Redux)
   - Built-in persistence middleware
   - Only ~1KB in size
   - Perfect for small to medium apps

5. **LocalStorage**
   - No backend complexity to start
   - Works offline by default
   - Your data stays on your device
   - Can easily migrate to a backend later

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation

```bash
# Navigate to the project folder
cd my-notepad

# Install dependencies (already done!)
npm install

# Start the development server (already running!)
npm run dev
```

### Development Server
The app is now running at: **http://localhost:5173/**

### Tests

Unit tests use [Vitest](https://vitest.dev/) and [React Testing Library](https://testing-library.com/react). Capacitor and backend are mocked so tests run without native or API dependencies.

```bash
cd my-notepad
npm run test          # run once
npm run test:watch    # watch mode
npm run test:coverage # coverage report
```

Tests cover: `cn` util, Zustand store, `TodoList` (add, toggle, filter, delete), `NotesList` (textarea, Process with AI, stats), `Landing` (content and link), and `App` (tabs, header).

### Feature (E2E) tests

[Playwright](https://playwright.dev/) runs end-to-end tests in a real browser. They use the **demo app** at `/app` (no backend required).

```bash
# Start the dev server in one terminal, then in another:
cd my-notepad
npm run test:e2e        # run all E2E (Chromium, Firefox, WebKit)
npm run test:e2e:ui    # run with Playwright UI

# Or let Playwright start the server (ensure port 5173 is free):
npm run test:e2e

# Run against an already-running dev server:
PLAYWRIGHT_TEST_BASE_URL=http://localhost:5173 npm run test:e2e
```

**E2E coverage:** Landing (heading, link to app, pricing, log in), App Tasks (add task, empty submit, filter All/Done, complete task, delete task, priority buttons), App Notes (switch tab, textarea, Process with AI disabled when empty / enabled with content, AI insights).

### Build for Production

```bash
npm run build
```

The production-ready files will be in the `dist` folder.

### Preview Production Build

```bash
npm run preview
```

### Run as hybrid app (Android / iOS)

The app is a **hybrid application**: one codebase for web and native.

- **Browser:** `npm run dev` or `npm run build` + `npm run preview`
- **Android:** Build the web app, sync to native, then open in Android Studio:
  ```bash
  npm run build:mobile
  npm run cap:android
  ```
- **iOS:** Same flow, then open in Xcode (macOS only, requires Xcode and CocoaPods):
  ```bash
  npm run build:mobile
  npm run cap:ios
  ```

**Scripts:**
- `npm run build:mobile` — Builds the web app and copies it into the native projects (`dist` → `android` / `ios`).
- `npm run cap:sync` — Copies web assets and config into native projects (run after changes to `capacitor.config.ts` or plugins).
- `npm run cap:android` — Opens the Android project in Android Studio.
- `npm run cap:ios` — Opens the iOS project in Xcode.

**Requirements:**
- **Android:** [Android Studio](https://developer.android.com/studio) and Android SDK.
- **iOS:** macOS, [Xcode](https://developer.apple.com/xcode/), and [CocoaPods](https://cocoapods.org/) (`sudo gem install cocoapods`).

## 📂 Project Structure

```
my-notepad/
├── src/
│   ├── components/          # React components
│   │   ├── TodoList.tsx    # TODO list component
│   │   └── NotesList.tsx   # Notes component
│   ├── store/               # State management
│   │   └── useStore.ts     # Zustand store with todos & notes
│   ├── test/                # Test setup (Vitest + jsdom)
│   ├── App.tsx             # Main app component
│   ├── index.css           # Global styles (Tailwind)
│   └── main.tsx            # App entry point
├── public/                 # Static assets
├── android/                 # Capacitor Android native project
├── ios/                     # Capacitor iOS native project
├── capacitor.config.ts     # Capacitor config (app id, name, web dir)
├── tailwind.config.js      # Tailwind configuration
├── postcss.config.js       # PostCSS configuration
├── vite.config.ts          # Vite configuration
└── package.json            # Dependencies
```

## 🎯 Usage

### TODO List
1. Enter your task in the input field
2. Select priority level (Low, Medium, High)
3. Click "Add" to create the task
4. Check tasks to mark them complete
5. Click "Delete" to remove tasks

### Notes
1. Click "Create New Note" button
2. Enter a title and content
3. Click "Save Note" to store it
4. Edit or delete notes as needed

## 🔮 Future Enhancements

- Categories/Tags for better organization
- Search functionality
- Export to PDF/Markdown
- Cloud sync (optional backend)
- Dark mode
- Keyboard shortcuts
- Drag & drop reordering

## 📝 License

This is a personal project. Feel free to use and modify as you wish!

## 🙌 Created With

Made with ❤️ for keeping things simple and organized.

**Vibe coding. Piece by piece until having... a working software :)**
