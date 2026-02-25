import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
  unlinkSync,
  renameSync
} from 'fs'
import { join, dirname } from 'path'
import { randomUUID } from 'crypto'

// ── Folder tree ──────────────────────────────────────────────────────────────

export function getFolderTree(rootPath) {
  if (!existsSync(rootPath)) {
    mkdirSync(rootPath, { recursive: true })
  }

  const folders = []
  try {
    const entries = readdirSync(rootPath, { withFileTypes: true })
    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith('.json')) {
        const folderPath = join(rootPath, entry.name)
        const name = entry.name.slice(0, -5) // strip .json
        let noteCount = 0
        try {
          const data = JSON.parse(readFileSync(folderPath, 'utf-8'))
          noteCount = Array.isArray(data.notes) ? data.notes.length : 0
        } catch {
          // skip malformed files
        }
        folders.push({ name, path: folderPath, noteCount })
      }
    }
  } catch {
    // ignore permission errors
  }

  folders.sort((a, b) => a.name.localeCompare(b.name))
  return folders
}

// ── Internal helpers ─────────────────────────────────────────────────────────

function readNotes(folderPath) {
  try {
    const data = JSON.parse(readFileSync(folderPath, 'utf-8'))
    return Array.isArray(data.notes) ? data.notes : []
  } catch {
    return []
  }
}

function writeNotes(folderPath, notes) {
  writeFileSync(folderPath, JSON.stringify({ notes }, null, 2), 'utf-8')
}

// ── Notes ────────────────────────────────────────────────────────────────────

export function getNotesInFolder(folderPath) {
  if (!existsSync(folderPath)) return []
  const notes = readNotes(folderPath)
  return notes
    .map((n) => ({ ...n, folderPath }))
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
}

export function getNote(folderPath, noteId) {
  const notes = readNotes(folderPath)
  const note = notes.find((n) => n.id === noteId)
  if (!note) return null
  return { ...note, folderPath }
}

export function createNote({ folderPath, title, content = '', status = 'open' }) {
  const notes = readNotes(folderPath)
  const id = randomUUID()
  const now = new Date().toISOString()
  const note = {
    id,
    title: title || 'Untitled',
    content,
    status,
    createdAt: now,
    updatedAt: now
  }
  notes.push(note)
  writeNotes(folderPath, notes)
  return { ...note, folderPath }
}

export function updateNote({ folderPath, noteId, title, content, status }) {
  const notes = readNotes(folderPath)
  const idx = notes.findIndex((n) => n.id === noteId)
  if (idx === -1) throw new Error(`Note ${noteId} not found in ${folderPath}`)
  notes[idx] = {
    ...notes[idx],
    ...(title !== undefined && { title }),
    ...(content !== undefined && { content }),
    ...(status !== undefined && { status }),
    updatedAt: new Date().toISOString()
  }
  writeNotes(folderPath, notes)
  return { ...notes[idx], folderPath }
}

export function deleteNote({ folderPath, noteId }) {
  const notes = readNotes(folderPath)
  writeNotes(folderPath, notes.filter((n) => n.id !== noteId))
}

// ── Folders ──────────────────────────────────────────────────────────────────

export function createFolder({ parentPath, name }) {
  const folderPath = join(parentPath, `${name}.json`)
  writeFileSync(folderPath, JSON.stringify({ notes: [] }, null, 2), 'utf-8')
  return { path: folderPath, name }
}

export function renameFolder({ folderPath, newName }) {
  const newPath = join(dirname(folderPath), `${newName}.json`)
  renameSync(folderPath, newPath)
  return { newPath }
}

export function deleteFolder(folderPath) {
  unlinkSync(folderPath)
}
