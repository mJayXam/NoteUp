# NoteUp

A fast, offline-first desktop note-taking app for Windows. Notes are stored as plain **JSON files** on your local filesystem — no cloud, no database, no account required.

Built with **Electron + React + Vite**.

---

## Features

- **Filesystem-based storage** — every note is a `.json` file in a folder you choose
- **Real folder hierarchy** — subfolders on disk become categories in the sidebar
- **Three-panel layout** — folder tree · note list · markdown editor
- **Markdown support** — write in Markdown, toggle to live preview
- **Status tracking** — tag notes as `Open`, `In Progress`, or `Done`
- **Status filter** — filter the note list by status with one click
- **Auto-save** — changes are saved automatically as you type (700 ms debounce)
- **Floating note windows** — double-click a note to open it in a compact standalone window
- **Always-on-top pin** — pin any floating window to keep it above other applications
- **Live cross-window sync** — edits in a floating window update the main editor instantly
- **Configurable root folder** — point the app at any folder on your machine
- **100 % offline** — nothing leaves your computer

---

## Tech Stack

| Layer | Technology |
|---|---|
| Desktop shell | [Electron](https://www.electronjs.org/) 28 |
| UI framework | [React](https://react.dev/) 18 + [Vite](https://vitejs.dev/) 5 |
| Scaffold | [electron-vite](https://electron-vite.org/) |
| Markdown renderer | [react-markdown](https://github.com/remarkjs/react-markdown) 9 |
| Storage | Node.js `fs` module (plain JSON files) |

---

## Prerequisites

- [Node.js](https://nodejs.org/) 18 or later
- [Git](https://git-scm.com/)
- Windows 10 / 11

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/your-username/noteup.git
cd noteup
```

### 2. Install dependencies

```bash
npm install
```

### 3. Download the Electron binary

> This step is only needed once after a fresh `npm install`.

```bash
node node_modules/electron/install.js
```

### 4. Start the app in development mode

```bash
npm run dev
```

The app window opens automatically. On first launch you will be prompted to **choose a root folder** where your notes will be stored (e.g. `C:\Users\you\Documents\Notes`).

---

## Usage

### Folder tree (left panel)

| Action | How |
|---|---|
| Select a folder | Click on it |
| Create a top-level folder | Click **+ New Folder** in the sidebar header |
| Create a subfolder | Right-click any folder → **New Subfolder** |
| Rename a folder | Right-click → **Rename** |
| Delete a folder | Right-click → **Delete Folder** (deletes all notes inside) |

### Note list (middle panel)

| Action | How |
|---|---|
| Create a note | Click **+** in the note list header |
| Open a note | Click on it |
| Open in floating window | Double-click on it |
| Delete a note | Hover the note card → click **×** |
| Filter by status | Click a filter pill: **All · Open · In Progress · Done** |

Notes are sorted by last-modified date (newest first).

Each filter pill shows the count of notes in that status. The header displays `filtered / total` when a filter is active and resets automatically when you switch folders.

### Note editor (right panel)

- **Title** — edit inline at the top
- **Status** — use the dropdown to set `Open`, `In Progress`, or `Done`
- **Edit / Preview** — toggle between the Markdown textarea and the rendered preview
- **Auto-save** — no save button needed; changes are written to disk automatically

### Floating note windows

Double-clicking a note opens it in a compact standalone window (520 × 620 px). Each note can only have one floating window — double-clicking again focuses the existing window instead of opening a duplicate.

| Control | Description |
|---|---|
| **Edit / Preview** toggle | Switch between Markdown input and rendered preview |
| **Pin button** (📌) | Toggle always-on-top — the window stays above all other applications |
| **Auto-save** | Same 700 ms debounce as the main editor |

Changes made in a floating window are reflected in the main editor and note list in real time.

### Settings

Click the **settings icon** (⚙) in the top-left corner to change the root notes folder at any time.

---

## Note file format

Each note is saved as `<uuid>.json` inside the selected folder:

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "My Note",
  "content": "# Hello\n\nThis is **Markdown**.",
  "status": "open",
  "createdAt": "2024-06-01T10:00:00.000Z",
  "updatedAt": "2024-06-01T10:05:00.000Z"
}
```

The folder structure on disk mirrors the sidebar exactly:

```
Documents/Notes/
├── Work/
│   ├── 550e8400-....json   ← "Project kickoff"
│   └── Meeting notes/
│       └── a1b2c3d4-....json
└── Personal/
    └── f7e6d5c4-....json   ← "Reading list"
```

---

## Project Structure

```
noteup/
├── electron.vite.config.mjs   Vite + Electron build config
├── package.json
└── src/
    ├── main/                  Electron main process (Node.js)
    │   ├── index.js           Window creation & IPC handler registration
    │   ├── fileSystem.js      Note / folder CRUD via Node fs
    │   └── settings.js        JSON-based app settings store
    ├── preload/
    │   └── index.js           contextBridge → exposes window.api to renderer
    └── renderer/              React application
        ├── index.html
        └── src/
            ├── App.jsx        Root component, state management
            ├── components/
            │   ├── Sidebar.jsx          Folder tree with context menus
            │   ├── NoteList.jsx         Note cards with status badges and filter bar
            │   ├── NoteEditor.jsx       Markdown editor + preview
            │   ├── FloatingNoteView.jsx Standalone note window (edit + pin)
            │   └── Settings.jsx         Root folder configuration
            └── styles/
                └── index.css            Dark theme (CSS custom properties)
```

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the app in development mode with hot reload |
| `npm run build` | Build for production (output in `out/`) |
| `npm run preview` | Preview the production build |
| `npm run package` | Build + create Windows installer `.exe` (requires Developer Mode) |
| `npm run package:portable` | Build + create portable `.exe` folder (no Developer Mode needed) |

---

## IPC API

The renderer communicates with the main process through `window.api`:

```js
window.api.fs.getFolderTree(rootPath)         // → folder tree object
window.api.fs.getNotes(folderPath)            // → note list (without content)
window.api.fs.getNote(filePath)              // → full note with content
window.api.fs.createNote({ folderPath, title, content, status })
window.api.fs.updateNote({ filePath, title, content, status })
window.api.fs.deleteNote(filePath)
window.api.fs.createFolder({ parentPath, name })
window.api.fs.renameFolder({ folderPath, newName })
window.api.fs.deleteFolder(folderPath)

window.api.settings.get(key)
window.api.settings.set(key, value)

window.api.dialog.openFolder()               // → selected path or null

window.api.floatingWindow.open(filePath)     // open or focus floating window
window.api.floatingWindow.setAlwaysOnTop(bool)
window.api.floatingWindow.noteSaved(filePath)

window.api.onNoteUpdated(callback)           // → returns cleanup function
```

---

## License

[MIT](./LICENSE) © 2026 [mJayXam](https://github.com/mJayXam)
