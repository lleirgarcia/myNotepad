# 📝 My Notepad - TODO & Notes App

A beautiful, simple, and powerful note-taking and TODO management app designed to keep your mind clean and organized.

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

### Build for Production

```bash
npm run build
```

The production-ready files will be in the `dist` folder.

### Preview Production Build

```bash
npm run preview
```

## 📂 Project Structure

```
my-notepad/
├── src/
│   ├── components/          # React components
│   │   ├── TodoList.tsx    # TODO list component
│   │   └── NotesList.tsx   # Notes component
│   ├── store/              # State management
│   │   └── useStore.ts     # Zustand store with todos & notes
│   ├── App.tsx             # Main app component
│   ├── index.css           # Global styles (Tailwind)
│   └── main.tsx            # App entry point
├── public/                 # Static assets
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
- Mobile app version
- Dark mode
- Keyboard shortcuts
- Drag & drop reordering

## 📝 License

This is a personal project. Feel free to use and modify as you wish!

## 🙌 Created With

Made with ❤️ for keeping things simple and organized.

**Vibe coding. Piece by piece until having... a working software :)**
